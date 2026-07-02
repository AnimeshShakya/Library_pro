from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import pandas as pd
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "dev-secret-key-change-in-production")

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: datetime

class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    bookshelf_id: str
    quantity: int
    price: float
    description: Optional[str] = None

class BookResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    author: str
    isbn: str
    bookshelf_id: str
    bookshelf_name: Optional[str] = None
    quantity: int
    available_quantity: int
    price: float
    description: Optional[str] = None
    created_at: datetime

class BookshelfCreate(BaseModel):
    name: str
    description: Optional[str] = None

class BookshelfResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: Optional[str] = None
    book_count: int
    created_at: datetime

class LoanCreate(BaseModel):
    book_id: str
    customer_id: str
    due_date: datetime

class LoanReturn(BaseModel):
    loan_id: str

class LoanResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    book_id: str
    book_title: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = None
    issue_date: datetime
    due_date: datetime
    return_date: Optional[datetime] = None
    late_fee: float
    status: str

class ReservationCreate(BaseModel):
    book_id: str

class ReservationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    book_id: str
    book_title: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = None
    created_at: datetime
    status: str

class MembershipCreate(BaseModel):
    customer_id: str
    plan: str
    duration_days: int

class MembershipResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    customer_id: str
    customer_name: Optional[str] = None
    plan: str
    start_date: datetime
    end_date: datetime
    status: str

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: RegisterRequest, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(user_data.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": user_data.name,
        "role": "customer",
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return UserResponse(
        id=user_id,
        email=email,
        name=user_data.name,
        role="customer",
        created_at=user_doc["created_at"]
    )

@api_router.post("/auth/login", response_model=UserResponse)
async def login(credentials: LoginRequest, request: Request, response: Response):
    email = credentials.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return UserResponse(
        id=user_id,
        email=user["email"],
        name=user["name"],
        role=user["role"],
        created_at=user["created_at"]
    )

@api_router.post("/auth/logout")
async def logout(response: Response, current_user: dict = Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["_id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        created_at=current_user["created_at"]
    )

@api_router.post("/bookshelves", response_model=BookshelfResponse)
async def create_bookshelf(shelf: BookshelfCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    shelf_doc = {
        "name": shelf.name,
        "description": shelf.description,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.bookshelves.insert_one(shelf_doc)
    return BookshelfResponse(
        id=str(result.inserted_id),
        name=shelf.name,
        description=shelf.description,
        book_count=0,
        created_at=shelf_doc["created_at"]
    )

@api_router.get("/bookshelves", response_model=List[BookshelfResponse])
async def get_bookshelves():
    shelves = await db.bookshelves.find({}, {"_id": 0, "name": 1, "description": 1, "created_at": 1}).to_list(1000)
    result = []
    for shelf in shelves:
        shelf_obj = await db.bookshelves.find_one({"name": shelf["name"]})
        book_count = await db.books.count_documents({"bookshelf_id": str(shelf_obj["_id"])})
        result.append(BookshelfResponse(
            id=str(shelf_obj["_id"]),
            name=shelf["name"],
            description=shelf.get("description"),
            book_count=book_count,
            created_at=shelf["created_at"]
        ))
    return result

@api_router.post("/books/bulk-import")
async def bulk_import_books(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ['csv', 'xlsx', 'xls']:
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    
    try:
        contents = await file.read()
        
        if file_extension == 'csv':
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        required_columns = ['title', 'author', 'isbn', 'bookshelf_name', 'quantity', 'price']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}. Required: {', '.join(required_columns)}"
            )
        
        df = df.fillna('')
        
        success_count = 0
        error_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                bookshelf = await db.bookshelves.find_one({"name": row['bookshelf_name']})
                if not bookshelf:
                    errors.append(f"Row {index + 2}: Bookshelf '{row['bookshelf_name']}' not found")
                    error_count += 1
                    continue
                
                if not row['title'] or not row['author'] or not row['isbn']:
                    errors.append(f"Row {index + 2}: Missing required fields (title, author, or isbn)")
                    error_count += 1
                    continue
                
                try:
                    quantity = int(row['quantity'])
                    price = float(row['price'])
                except (ValueError, TypeError):
                    errors.append(f"Row {index + 2}: Invalid quantity or price")
                    error_count += 1
                    continue
                
                book_doc = {
                    "title": str(row['title']).strip(),
                    "author": str(row['author']).strip(),
                    "isbn": str(row['isbn']).strip(),
                    "bookshelf_id": str(bookshelf["_id"]),
                    "quantity": quantity,
                    "available_quantity": quantity,
                    "price": price,
                    "description": str(row.get('description', '')).strip() if pd.notna(row.get('description')) else '',
                    "created_at": datetime.now(timezone.utc)
                }
                
                await db.books.insert_one(book_doc)
                success_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
                error_count += 1
        
        return {
            "success": True,
            "total_rows": len(df),
            "success_count": success_count,
            "error_count": error_count,
            "errors": errors[:10]
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="File is empty")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@api_router.get("/books/import-template")
async def get_import_template(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    template_data = {
        "title": ["The Great Gatsby", "1984", "To Kill a Mockingbird"],
        "author": ["F. Scott Fitzgerald", "George Orwell", "Harper Lee"],
        "isbn": ["9780743273565", "9780451524935", "9780061120084"],
        "bookshelf_name": ["Fiction", "Fiction", "Fiction"],
        "quantity": [5, 3, 4],
        "price": [12.99, 14.99, 13.99],
        "description": ["A classic American novel", "Dystopian social science fiction", "Novel about racial injustice"]
    }
    
    df = pd.DataFrame(template_data)
    
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_content = csv_buffer.getvalue()
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=books_import_template.csv"
        }
    )

@api_router.post("/books", response_model=BookResponse)
async def create_book(book: BookCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        bookshelf = await db.bookshelves.find_one({"_id": ObjectId(book.bookshelf_id)})
        if not bookshelf:
            raise HTTPException(status_code=404, detail="Bookshelf not found")
    except:
        raise HTTPException(status_code=404, detail="Invalid bookshelf ID")
    
    book_doc = {
        "title": book.title,
        "author": book.author,
        "isbn": book.isbn,
        "bookshelf_id": book.bookshelf_id,
        "quantity": book.quantity,
        "available_quantity": book.quantity,
        "price": book.price,
        "description": book.description,
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.books.insert_one(book_doc)
    return BookResponse(
        id=str(result.inserted_id),
        title=book.title,
        author=book.author,
        isbn=book.isbn,
        bookshelf_id=book.bookshelf_id,
        bookshelf_name=bookshelf["name"],
        quantity=book.quantity,
        available_quantity=book.quantity,
        price=book.price,
        description=book.description,
        created_at=book_doc["created_at"]
    )

@api_router.get("/books", response_model=List[BookResponse])
async def get_books():
    books = await db.books.find({}, {"_id": 0}).to_list(1000)
    result = []
    for book in books:
        book_obj = await db.books.find_one({"isbn": book["isbn"]})
        bookshelf = await db.bookshelves.find_one({"_id": ObjectId(book["bookshelf_id"])})
        result.append(BookResponse(
            id=str(book_obj["_id"]),
            title=book["title"],
            author=book["author"],
            isbn=book["isbn"],
            bookshelf_id=book["bookshelf_id"],
            bookshelf_name=bookshelf["name"] if bookshelf else None,
            quantity=book["quantity"],
            available_quantity=book["available_quantity"],
            price=book["price"],
            description=book.get("description"),
            created_at=book["created_at"]
        ))
    return result

@api_router.put("/books/{book_id}", response_model=BookResponse)
async def update_book(book_id: str, book_update: BookCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        book = await db.books.find_one({"_id": ObjectId(book_id)})
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        bookshelf = await db.bookshelves.find_one({"_id": ObjectId(book_update.bookshelf_id)})
        if not bookshelf:
            raise HTTPException(status_code=404, detail="Bookshelf not found")
        
        available_diff = book_update.quantity - book["quantity"]
        new_available = book["available_quantity"] + available_diff
        
        update_doc = {
            "title": book_update.title,
            "author": book_update.author,
            "isbn": book_update.isbn,
            "bookshelf_id": book_update.bookshelf_id,
            "quantity": book_update.quantity,
            "available_quantity": max(0, new_available),
            "price": book_update.price,
            "description": book_update.description
        }
        
        await db.books.update_one({"_id": ObjectId(book_id)}, {"$set": update_doc})
        updated_book = await db.books.find_one({"_id": ObjectId(book_id)})
        
        return BookResponse(
            id=str(updated_book["_id"]),
            title=updated_book["title"],
            author=updated_book["author"],
            isbn=updated_book["isbn"],
            bookshelf_id=updated_book["bookshelf_id"],
            bookshelf_name=bookshelf["name"],
            quantity=updated_book["quantity"],
            available_quantity=updated_book["available_quantity"],
            price=updated_book["price"],
            description=updated_book.get("description"),
            created_at=updated_book["created_at"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/books/{book_id}")
async def delete_book(book_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        result = await db.books.delete_one({"_id": ObjectId(book_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Book not found")
        return {"message": "Book deleted successfully"}
    except:
        raise HTTPException(status_code=400, detail="Invalid book ID")

@api_router.post("/loans", response_model=LoanResponse)
async def create_loan(loan: LoanCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        book = await db.books.find_one({"_id": ObjectId(loan.book_id)})
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        if book["available_quantity"] <= 0:
            raise HTTPException(status_code=400, detail="Book not available")
        
        customer = await db.users.find_one({"_id": ObjectId(loan.customer_id)})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        loan_doc = {
            "book_id": loan.book_id,
            "customer_id": loan.customer_id,
            "issue_date": datetime.now(timezone.utc),
            "due_date": loan.due_date,
            "return_date": None,
            "late_fee": 0.0,
            "status": "active"
        }
        result = await db.loans.insert_one(loan_doc)
        
        await db.books.update_one(
            {"_id": ObjectId(loan.book_id)},
            {"$inc": {"available_quantity": -1}}
        )
        
        return LoanResponse(
            id=str(result.inserted_id),
            book_id=loan.book_id,
            book_title=book["title"],
            customer_id=loan.customer_id,
            customer_name=customer["name"],
            issue_date=loan_doc["issue_date"],
            due_date=loan.due_date,
            return_date=None,
            late_fee=0.0,
            status="active"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/loans/return", response_model=LoanResponse)
async def return_loan(return_data: LoanReturn, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        loan = await db.loans.find_one({"_id": ObjectId(return_data.loan_id)})
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        if loan["status"] == "returned":
            raise HTTPException(status_code=400, detail="Book already returned")
        
        return_date = datetime.now(timezone.utc)
        late_fee = 0.0
        
        if return_date > loan["due_date"]:
            days_late = (return_date - loan["due_date"]).days
            late_fee = days_late * 2.0
        
        await db.loans.update_one(
            {"_id": ObjectId(return_data.loan_id)},
            {"$set": {"return_date": return_date, "late_fee": late_fee, "status": "returned"}}
        )
        
        await db.books.update_one(
            {"_id": ObjectId(loan["book_id"])},
            {"$inc": {"available_quantity": 1}}
        )
        
        book = await db.books.find_one({"_id": ObjectId(loan["book_id"])})
        customer = await db.users.find_one({"_id": ObjectId(loan["customer_id"])})
        
        return LoanResponse(
            id=str(loan["_id"]),
            book_id=loan["book_id"],
            book_title=book["title"] if book else None,
            customer_id=loan["customer_id"],
            customer_name=customer["name"] if customer else None,
            issue_date=loan["issue_date"],
            due_date=loan["due_date"],
            return_date=return_date,
            late_fee=late_fee,
            status="returned"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/loans", response_model=List[LoanResponse])
async def get_loans(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        loans = await db.loans.find({}, {"_id": 0}).to_list(1000)
    else:
        loans = await db.loans.find({"customer_id": current_user["_id"]}, {"_id": 0}).to_list(1000)
    
    result = []
    for loan in loans:
        loan_obj = await db.loans.find_one({"book_id": loan["book_id"], "customer_id": loan["customer_id"], "issue_date": loan["issue_date"]})
        book = await db.books.find_one({"_id": ObjectId(loan["book_id"])})
        customer = await db.users.find_one({"_id": ObjectId(loan["customer_id"])})
        result.append(LoanResponse(
            id=str(loan_obj["_id"]),
            book_id=loan["book_id"],
            book_title=book["title"] if book else None,
            customer_id=loan["customer_id"],
            customer_name=customer["name"] if customer else None,
            issue_date=loan["issue_date"],
            due_date=loan["due_date"],
            return_date=loan.get("return_date"),
            late_fee=loan["late_fee"],
            status=loan["status"]
        ))
    return result

@api_router.post("/reservations", response_model=ReservationResponse)
async def create_reservation(reservation: ReservationCreate, current_user: dict = Depends(get_current_user)):
    try:
        book = await db.books.find_one({"_id": ObjectId(reservation.book_id)})
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        existing = await db.reservations.find_one({
            "book_id": reservation.book_id,
            "customer_id": current_user["_id"],
            "status": "pending"
        })
        if existing:
            raise HTTPException(status_code=400, detail="You already have a reservation for this book")
        
        reservation_doc = {
            "book_id": reservation.book_id,
            "customer_id": current_user["_id"],
            "created_at": datetime.now(timezone.utc),
            "status": "pending"
        }
        result = await db.reservations.insert_one(reservation_doc)
        
        return ReservationResponse(
            id=str(result.inserted_id),
            book_id=reservation.book_id,
            book_title=book["title"],
            customer_id=current_user["_id"],
            customer_name=current_user["name"],
            created_at=reservation_doc["created_at"],
            status="pending"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/reservations", response_model=List[ReservationResponse])
async def get_reservations(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        reservations = await db.reservations.find({}, {"_id": 0}).to_list(1000)
    else:
        reservations = await db.reservations.find({"customer_id": current_user["_id"]}, {"_id": 0}).to_list(1000)
    
    result = []
    for res in reservations:
        res_obj = await db.reservations.find_one({"book_id": res["book_id"], "customer_id": res["customer_id"], "created_at": res["created_at"]})
        book = await db.books.find_one({"_id": ObjectId(res["book_id"])})
        customer = await db.users.find_one({"_id": ObjectId(res["customer_id"])})
        result.append(ReservationResponse(
            id=str(res_obj["_id"]),
            book_id=res["book_id"],
            book_title=book["title"] if book else None,
            customer_id=res["customer_id"],
            customer_name=customer["name"] if customer else None,
            created_at=res["created_at"],
            status=res["status"]
        ))
    return result

@api_router.post("/memberships", response_model=MembershipResponse)
async def create_membership(membership: MembershipCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        customer = await db.users.find_one({"_id": ObjectId(membership.customer_id)})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        start_date = datetime.now(timezone.utc)
        end_date = start_date + timedelta(days=membership.duration_days)
        
        membership_doc = {
            "customer_id": membership.customer_id,
            "plan": membership.plan,
            "start_date": start_date,
            "end_date": end_date,
            "status": "active"
        }
        result = await db.memberships.insert_one(membership_doc)
        
        return MembershipResponse(
            id=str(result.inserted_id),
            customer_id=membership.customer_id,
            customer_name=customer["name"],
            plan=membership.plan,
            start_date=start_date,
            end_date=end_date,
            status="active"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/memberships", response_model=List[MembershipResponse])
async def get_memberships(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        memberships = await db.memberships.find({}, {"_id": 0}).to_list(1000)
    else:
        memberships = await db.memberships.find({"customer_id": current_user["_id"]}, {"_id": 0}).to_list(1000)
    
    result = []
    for mem in memberships:
        mem_obj = await db.memberships.find_one({"customer_id": mem["customer_id"], "start_date": mem["start_date"]})
        customer = await db.users.find_one({"_id": ObjectId(mem["customer_id"])})
        
        status = "active" if mem["end_date"] > datetime.now(timezone.utc) else "expired"
        if mem_obj and mem_obj.get("status") != status:
            await db.memberships.update_one({"_id": mem_obj["_id"]}, {"$set": {"status": status}})
        
        result.append(MembershipResponse(
            id=str(mem_obj["_id"]),
            customer_id=mem["customer_id"],
            customer_name=customer["name"] if customer else None,
            plan=mem["plan"],
            start_date=mem["start_date"],
            end_date=mem["end_date"],
            status=status
        ))
    return result

@api_router.get("/customers", response_model=List[UserResponse])
async def get_customers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    customers = await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    result = []
    for customer in customers:
        cust_obj = await db.users.find_one({"email": customer["email"]})
        result.append(UserResponse(
            id=str(cust_obj["_id"]),
            email=customer["email"],
            name=customer["name"],
            role=customer["role"],
            created_at=customer["created_at"]
        ))
    return result

@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_books = await db.books.count_documents({})
    active_loans = await db.loans.count_documents({"status": "active"})
    
    late_loans = 0
    all_active = await db.loans.find({"status": "active"}).to_list(1000)
    for loan in all_active:
        if datetime.now(timezone.utc) > loan["due_date"]:
            late_loans += 1
    
    all_loans = await db.loans.find({"status": "returned"}).to_list(1000)
    total_revenue = sum([loan.get("late_fee", 0) for loan in all_loans])
    
    low_stock_books = await db.books.find({"available_quantity": {"$lte": 2}}).to_list(100)
    low_stock = len(low_stock_books)
    
    return {
        "total_books": total_books,
        "active_loans": active_loans,
        "late_returns": late_loans,
        "monthly_revenue": round(total_revenue, 2),
        "low_stock_count": low_stock
    }

@api_router.get("/analytics/sales")
async def get_sales_analytics(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    loans = await db.loans.find({"status": "returned"}).sort("return_date", 1).to_list(1000)
    
    monthly_data = {}
    for loan in loans:
        if loan.get("return_date"):
            month_key = loan["return_date"].strftime("%Y-%m")
            if month_key not in monthly_data:
                monthly_data[month_key] = {"month": month_key, "revenue": 0, "loans": 0}
            monthly_data[month_key]["revenue"] += loan.get("late_fee", 0)
            monthly_data[month_key]["loans"] += 1
    
    return {"monthly_sales": list(monthly_data.values())}

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@library.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
    
    Path("/app/memory").mkdir(exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Test Customer (create via /api/auth/register)
- Email: customer@test.com
- Password: customer123
- Role: customer

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
""")

@app.on_event("startup")
async def startup_event():
    await seed_admin()
    await db.users.create_index("email", unique=True)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
