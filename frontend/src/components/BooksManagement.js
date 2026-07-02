import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash, Barcode, Upload, Download, X } from '@phosphor-icons/react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BooksManagement = () => {
  const [books, setBooks] = useState([]);
  const [bookshelves, setBookshelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    bookshelf_id: '',
    quantity: 1,
    price: 0,
    description: '',
  });

  useEffect(() => {
    fetchBooks();
    fetchBookshelves();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${API}/books`, { withCredentials: true });
      setBooks(response.data);
    } catch (error) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookshelves = async () => {
    try {
      const response = await axios.get(`${API}/bookshelves`, { withCredentials: true });
      setBookshelves(response.data);
    } catch (error) {
      console.error('Failed to load bookshelves');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await axios.put(`${API}/books/${editingBook.id}`, formData, { withCredentials: true });
        toast.success('Book updated successfully');
      } else {
        await axios.post(`${API}/books`, formData, { withCredentials: true });
        toast.success('Book created successfully');
      }
      setShowModal(false);
      setEditingBook(null);
      resetForm();
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save book');
    }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await axios.delete(`${API}/books/${bookId}`, { withCredentials: true });
      toast.success('Book deleted successfully');
      fetchBooks();
    } catch (error) {
      toast.error('Failed to delete book');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      bookshelf_id: '',
      quantity: 1,
      price: 0,
      description: '',
    });
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      bookshelf_id: book.bookshelf_id,
      quantity: book.quantity,
      price: book.price,
      description: book.description || '',
    });
    setShowModal(true);
  };

  const simulateBarcodeScan = () => {
    const mockISBN = `978${Math.floor(Math.random() * 10000000000)}`;
    setFormData({ ...formData, isbn: mockISBN });
    setShowScanner(false);
    toast.success(`Scanned ISBN: ${mockISBN}`);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${API}/books/import-template`, {
        withCredentials: true,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'books_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }
      setUploadFile(file);
      setImportResult(null);
    }
  };

  const handleBulkImport = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await axios.post(`${API}/books/bulk-import`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImportResult(response.data);
      toast.success(`Imported ${response.data.success_count} books successfully`);
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to import books');
      setImportResult({
        success: false,
        error: error.response?.data?.detail || 'Failed to import books',
      });
    } finally {
      setImporting(false);
    }
  };

  const closeBulkImportModal = () => {
    setShowBulkImport(false);
    setUploadFile(null);
    setImportResult(null);
  };


  return (
    <div data-testid="books-management">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A]">
          Books
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkImport(true)}
            data-testid="bulk-import-button"
            className="flex items-center gap-2 px-6 py-3 bg-[#00E676] text-[#0A0A0A] neo-brutal-btn"
          >
            <Upload size={20} weight="bold" />
            Bulk Import
          </button>
          <button
            onClick={() => {
              setEditingBook(null);
              resetForm();
              setShowModal(true);
            }}
            data-testid="create-book-button"
            className="flex items-center gap-2 px-6 py-3 bg-[#0055FF] text-white neo-brutal-btn"
          >
            <Plus size={20} weight="bold" />
            New Book
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block h-12 w-12 animate-spin rounded-sm border-4 border-solid border-[#0A0A0A] border-r-transparent"></div>
        </div>
      ) : (
        <div className="bg-white border-2 border-[#0A0A0A] hard-shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0A0A0A] text-white">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Title</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Author</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">ISBN</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Bookshelf</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book, index) => (
                <tr
                  key={book.id}
                  data-testid={`book-row-${book.id}`}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-[#F4F4F5]'}
                >
                  <td className="px-6 py-4 font-semibold text-[#0A0A0A]">{book.title}</td>
                  <td className="px-6 py-4 font-medium text-[#52525B]">{book.author}</td>
                  <td className="px-6 py-4 font-mono text-sm text-[#52525B]">{book.isbn}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[#FFD600] border-2 border-[#0A0A0A] text-xs font-bold uppercase">
                      {book.bookshelf_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 border-2 border-[#0A0A0A] text-sm font-bold ${
                        book.available_quantity <= 2 ? 'bg-[#FF3B30] text-white' : 'bg-[#00E676] text-[#0A0A0A]'
                      }`}
                    >
                      {book.available_quantity}/{book.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[#0A0A0A]">${book.price}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(book)}
                        data-testid={`edit-book-${book.id}`}
                        className="p-2 bg-[#0055FF] text-white border-2 border-[#0A0A0A] hover:bg-[#0044CC]"
                      >
                        <Pencil size={16} weight="bold" />
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
                        data-testid={`delete-book-${book.id}`}
                        className="p-2 bg-[#FF3B30] text-white border-2 border-[#0A0A0A] hover:bg-[#CC2E26]"
                      >
                        <Trash size={16} weight="bold" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-8 max-w-2xl w-full my-8" data-testid="book-modal">
            <h3 className="text-2xl font-bold font-outfit mb-6 text-[#0A0A0A]">
              {editingBook ? 'Edit Book' : 'Create Book'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                    Title
                  </label>
                  <input
                    type="text"
                    data-testid="book-title-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 neo-brutal-input font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                    Author
                  </label>
                  <input
                    type="text"
                    data-testid="book-author-input"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-4 py-3 neo-brutal-input font-medium"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                  ISBN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    data-testid="book-isbn-input"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="flex-1 px-4 py-3 neo-brutal-input font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    data-testid="scan-barcode-button"
                    className="px-4 py-3 bg-[#FFD600] text-[#0A0A0A] border-2 border-[#0A0A0A] font-semibold flex items-center gap-2"
                  >
                    <Barcode size={20} weight="bold" />
                    Scan
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                  Bookshelf
                </label>
                <select
                  data-testid="book-bookshelf-select"
                  value={formData.bookshelf_id}
                  onChange={(e) => setFormData({ ...formData, bookshelf_id: e.target.value })}
                  className="w-full px-4 py-3 neo-brutal-input font-medium"
                  required
                >
                  <option value="">Select a bookshelf</option>
                  {bookshelves.map((shelf) => (
                    <option key={shelf.id} value={shelf.id}>
                      {shelf.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                    Quantity
                  </label>
                  <input
                    type="number"
                    data-testid="book-quantity-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 neo-brutal-input font-medium"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    data-testid="book-price-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 neo-brutal-input font-medium"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                  Description
                </label>
                <textarea
                  data-testid="book-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 neo-brutal-input font-medium"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  data-testid="book-submit-button"
                  className="flex-1 py-3 bg-[#0055FF] text-white neo-brutal-btn"
                >
                  {editingBook ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBook(null);
                    resetForm();
                  }}
                  data-testid="book-cancel-button"
                  className="flex-1 py-3 bg-[#F4F4F5] text-[#0A0A0A] neo-brutal-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-8 max-w-md w-full" data-testid="scanner-modal">
            <h3 className="text-2xl font-bold font-outfit mb-6 text-[#0A0A0A]">Barcode Scanner</h3>
            <div className="mb-6 p-12 border-4 border-dashed border-[#0A0A0A] flex items-center justify-center">
              <Barcode size={64} weight="bold" color="#0A0A0A" />
            </div>
            <p className="text-center text-sm font-medium text-[#52525B] mb-6">
              Position barcode within the frame
            </p>
            <div className="flex gap-4">
              <button
                onClick={simulateBarcodeScan}
                data-testid="simulate-scan-button"
                className="flex-1 py-3 bg-[#00E676] text-[#0A0A0A] neo-brutal-btn"
              >
                Simulate Scan
              </button>
              <button
                onClick={() => setShowScanner(false)}
                data-testid="close-scanner-button"
                className="flex-1 py-3 bg-[#F4F4F5] text-[#0A0A0A] neo-brutal-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-8 max-w-2xl w-full" data-testid="bulk-import-modal">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold font-outfit text-[#0A0A0A]">Bulk Import Books</h3>
              <button
                onClick={closeBulkImportModal}
                data-testid="close-bulk-import"
                className="p-2 hover:bg-[#F4F4F5] border-2 border-[#0A0A0A]"
              >
                <X size={24} weight="bold" />
              </button>
            </div>

            <div className="mb-6 p-6 bg-[#FFD600] border-2 border-[#0A0A0A]">
              <p className="text-sm font-semibold text-[#0A0A0A] mb-2">
                📋 Required Columns: title, author, isbn, bookshelf_name, quantity, price
              </p>
              <p className="text-sm font-medium text-[#0A0A0A] mb-3">
                Optional: description
              </p>
              <button
                onClick={handleDownloadTemplate}
                data-testid="download-template-button"
                className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] text-white border-2 border-[#0A0A0A] font-semibold text-sm"
              >
                <Download size={16} weight="bold" />
                Download Template CSV
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold uppercase tracking-widest mb-3 text-[#0A0A0A]">
                Upload File (CSV or Excel)
              </label>
              <div className="border-4 border-dashed border-[#0A0A0A] p-8 text-center bg-[#F4F4F5]">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  data-testid="file-input"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload size={48} weight="bold" color="#0A0A0A" className="mb-3" />
                  <p className="text-sm font-semibold text-[#0A0A0A] mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs font-medium text-[#52525B]">
                    CSV, XLSX, or XLS (MAX 10MB)
                  </p>
                </label>
              </div>
              {uploadFile && (
                <div className="mt-4 p-4 bg-white border-2 border-[#0A0A0A]">
                  <p className="text-sm font-semibold text-[#0A0A0A]">
                    Selected: {uploadFile.name}
                  </p>
                  <p className="text-xs font-medium text-[#52525B]">
                    Size: {(uploadFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>

            {importResult && (
              <div
                className={`mb-6 p-6 border-2 border-[#0A0A0A] ${
                  importResult.success ? 'bg-[#00E676]' : 'bg-[#FF3B30]'
                }`}
                data-testid="import-result"
              >
                <h4 className="text-lg font-bold font-outfit mb-3 text-[#0A0A0A]">
                  {importResult.success ? 'Import Results' : 'Import Failed'}
                </h4>
                {importResult.success ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#0A0A0A]">
                      Total Rows: {importResult.total_rows}
                    </p>
                    <p className="text-sm font-semibold text-[#0A0A0A]">
                      ✓ Success: {importResult.success_count}
                    </p>
                    {importResult.error_count > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-[#0A0A0A] mb-2">
                          ✗ Errors: {importResult.error_count}
                        </p>
                        <div className="bg-white border-2 border-[#0A0A0A] p-3 max-h-32 overflow-y-auto">
                          {importResult.errors.map((error) => (
                            <p key={error} className="text-xs font-medium text-[#FF3B30] mb-1">
                              {error}
                            </p>
                          ))}
                          {importResult.error_count > 10 && (
                            <p className="text-xs font-semibold text-[#52525B] mt-2">
                              ... and {importResult.error_count - 10} more errors
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-white">
                    {importResult.error || 'An error occurred during import'}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleBulkImport}
                disabled={!uploadFile || importing}
                data-testid="import-submit-button"
                className="flex-1 py-3 bg-[#0055FF] text-white neo-brutal-btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import Books'}
              </button>
              <button
                onClick={closeBulkImportModal}
                data-testid="bulk-import-cancel-button"
                className="flex-1 py-3 bg-[#F4F4F5] text-[#0A0A0A] neo-brutal-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BooksManagement;
