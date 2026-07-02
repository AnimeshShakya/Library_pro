import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  BookOpen,
  SignOut,
  Books,
  ArrowsClockwise,
  Bookmark,
  IdentificationCard,
  Plus,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomerPortal = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [myLoans, setMyLoans] = useState([]);
  const [myReservations, setMyReservations] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [booksRes, loansRes, reservationsRes, membershipsRes] = await Promise.all([
        axios.get(`${API}/books`, { withCredentials: true }).catch(err => ({ data: [] })),
        axios.get(`${API}/loans`, { withCredentials: true }).catch(err => ({ data: [] })),
        axios.get(`${API}/reservations`, { withCredentials: true }).catch(err => ({ data: [] })),
        axios.get(`${API}/memberships`, { withCredentials: true }).catch(err => ({ data: [] })),
      ]);
      setBooks(booksRes.data || []);
      setMyLoans(loansRes.data || []);
      setMyReservations(reservationsRes.data || []);
      setMyMemberships(membershipsRes.data || []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching data:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user === false) {
      navigate('/login');
    } else if (user && user.role === 'admin') {
      navigate('/admin');
    } else if (user && user.role === 'customer') {
      fetchData();
    }
  }, [user, navigate, fetchData]);

  const handleReserve = async (bookId) => {
    try {
      await axios.post(`${API}/reservations`, { book_id: bookId }, { withCredentials: true });
      toast.success('Book reserved successfully!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reserve book');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'books', label: 'Browse Books', icon: Books },
    { id: 'loans', label: 'My Loans', icon: ArrowsClockwise },
    { id: 'reservations', label: 'My Reservations', icon: Bookmark },
    { id: 'memberships', label: 'My Memberships', icon: IdentificationCard },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r-2 border-[#0A0A0A] flex flex-col">
        <div className="p-6 border-b-2 border-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FF007F] border-2 border-[#0A0A0A] flex items-center justify-center">
              <BookOpen size={24} weight="bold" color="white" />
            </div>
            <div>
              <h1 className="text-xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A]">
                Library Pro
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#52525B]">Customer</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 mb-2 font-semibold text-sm uppercase tracking-widest sidebar-link ${
                  activeTab === item.id ? 'active' : ''
                }`}
              >
                <Icon size={20} weight="bold" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t-2 border-[#0A0A0A]">
          <div className="mb-4 p-3 bg-[#F4F4F5] border-2 border-[#0A0A0A]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#52525B] mb-1">Logged in as</p>
            <p className="text-sm font-bold text-[#0A0A0A]">{user?.name}</p>
            <p className="text-xs text-[#52525B] break-all">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FF3B30] text-white neo-brutal-btn"
          >
            <SignOut size={20} weight="bold" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'books' && (
            <div data-testid="books-view">
              <h2 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A] mb-8">
                Browse Books
              </h2>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="inline-block h-12 w-12 animate-spin rounded-sm border-4 border-solid border-[#0A0A0A] border-r-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {books.map((book) => (
                    <div key={book.id} className="neo-brutal-card p-6" data-testid={`book-card-${book.id}`}>
                      <div className="mb-4">
                        <span className="px-3 py-1 bg-[#FFD600] border-2 border-[#0A0A0A] text-xs font-bold uppercase">
                          {book.bookshelf_name}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold font-outfit mb-2 text-[#0A0A0A]">{book.title}</h3>
                      <p className="text-sm font-semibold text-[#52525B] mb-2">by {book.author}</p>
                      <p className="text-xs font-mono text-[#52525B] mb-4">ISBN: {book.isbn}</p>
                      {book.description && (
                        <p className="text-sm font-medium text-[#52525B] mb-4 line-clamp-3">{book.description}</p>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-2xl font-black font-outfit text-[#0A0A0A]">${book.price}</p>
                        </div>
                        <div>
                          <span
                            className={`px-3 py-1 border-2 border-[#0A0A0A] text-xs font-bold ${
                              book.available_quantity > 0
                                ? 'bg-[#00E676] text-[#0A0A0A]'
                                : 'bg-[#FF3B30] text-white'
                            }`}
                          >
                            {book.available_quantity > 0 ? 'Available' : 'Out of Stock'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleReserve(book.id)}
                        data-testid={`reserve-book-${book.id}`}
                        disabled={book.available_quantity === 0}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#0055FF] text-white neo-brutal-btn disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Bookmark size={20} weight="bold" />
                        Reserve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'loans' && (
            <div data-testid="loans-view">
              <h2 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A] mb-8">
                My Loans
              </h2>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="inline-block h-12 w-12 animate-spin rounded-sm border-4 border-solid border-[#0A0A0A] border-r-transparent"></div>
                </div>
              ) : myLoans.length === 0 ? (
                <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-12 text-center">
                  <ArrowsClockwise size={48} weight="bold" color="#52525B" className="mx-auto mb-4" />
                  <p className="text-xl font-semibold text-[#52525B]">No active loans</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myLoans.map((loan) => {
                    const isLate = loan.status === 'active' && new Date() > new Date(loan.due_date);
                    return (
                      <div key={loan.id} className="neo-brutal-card p-6" data-testid={`loan-card-${loan.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold font-outfit mb-2 text-[#0A0A0A]">{loan.book_title}</h3>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-[#52525B]">
                                <span className="font-semibold">Issued:</span>{' '}
                                {format(new Date(loan.issue_date), 'MMM dd, yyyy')}
                              </p>
                              <p className="text-sm font-medium text-[#52525B]">
                                <span className="font-semibold">Due:</span>{' '}
                                {format(new Date(loan.due_date), 'MMM dd, yyyy')}
                              </p>
                              {loan.late_fee > 0 && (
                                <p className="text-sm font-bold text-[#FF3B30]">
                                  Late Fee: ${loan.late_fee.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 border-2 border-[#0A0A0A] text-xs font-bold uppercase ${
                              loan.status === 'returned'
                                ? 'bg-[#00E676] text-[#0A0A0A]'
                                : isLate
                                ? 'bg-[#FF3B30] text-white'
                                : 'bg-[#FFD600] text-[#0A0A0A]'
                            }`}
                          >
                            {loan.status === 'returned' ? 'Returned' : isLate ? 'Late' : 'Active'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reservations' && (
            <div data-testid="reservations-view">
              <h2 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A] mb-8">
                My Reservations
              </h2>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="inline-block h-12 w-12 animate-spin rounded-sm border-4 border-solid border-[#0A0A0A] border-r-transparent"></div>
                </div>
              ) : myReservations.length === 0 ? (
                <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-12 text-center">
                  <Bookmark size={48} weight="bold" color="#52525B" className="mx-auto mb-4" />
                  <p className="text-xl font-semibold text-[#52525B]">No reservations yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReservations.map((reservation) => (
                    <div key={reservation.id} className="neo-brutal-card p-6" data-testid={`reservation-card-${reservation.id}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold font-outfit mb-2 text-[#0A0A0A]">
                            {reservation.book_title}
                          </h3>
                          <p className="text-sm font-medium text-[#52525B]">
                            Reserved on: {format(new Date(reservation.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-[#FFD600] border-2 border-[#0A0A0A] text-xs font-bold uppercase">
                          {reservation.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'memberships' && (
            <div data-testid="memberships-view">
              <h2 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A] mb-8">
                My Memberships
              </h2>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="inline-block h-12 w-12 animate-spin rounded-sm border-4 border-solid border-[#0A0A0A] border-r-transparent"></div>
                </div>
              ) : myMemberships.length === 0 ? (
                <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-12 text-center">
                  <IdentificationCard size={48} weight="bold" color="#52525B" className="mx-auto mb-4" />
                  <p className="text-xl font-semibold text-[#52525B]">No active memberships</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myMemberships.map((membership) => (
                    <div key={membership.id} className="neo-brutal-card p-6" data-testid={`membership-card-${membership.id}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold font-outfit mb-2 text-[#0A0A0A] uppercase">
                            {membership.plan} Plan
                          </h3>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-[#52525B]">
                              <span className="font-semibold">Start:</span>{' '}
                              {format(new Date(membership.start_date), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-sm font-medium text-[#52525B]">
                              <span className="font-semibold">End:</span>{' '}
                              {format(new Date(membership.end_date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 border-2 border-[#0A0A0A] text-xs font-bold uppercase ${
                            membership.status === 'active'
                              ? 'bg-[#00E676] text-[#0A0A0A]'
                              : 'bg-[#FF3B30] text-white'
                          }`}
                        >
                          {membership.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
