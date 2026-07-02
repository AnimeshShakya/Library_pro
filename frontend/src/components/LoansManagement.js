import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, ArrowUUpLeft } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LoansManagement = () => {
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    book_id: '',
    customer_id: '',
    due_date: '',
  });

  useEffect(() => {
    fetchLoans();
    fetchBooks();
    fetchCustomers();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await axios.get(`${API}/loans`, { withCredentials: true });
      setLoans(response.data);
    } catch (error) {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${API}/books`, { withCredentials: true });
      setBooks(response.data);
    } catch (error) {
      console.error('Failed to load books');
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/customers`, { withCredentials: true });
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to load customers');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/loans`, formData, { withCredentials: true });
      toast.success('Loan created successfully');
      setShowModal(false);
      setFormData({ book_id: '', customer_id: '', due_date: '' });
      fetchLoans();
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create loan');
    }
  };

  const handleReturn = async (loanId) => {
    if (!window.confirm('Mark this book as returned?')) return;
    try {
      await axios.post(`${API}/loans/return`, { loan_id: loanId }, { withCredentials: true });
      toast.success('Book returned successfully');
      fetchLoans();
      fetchBooks();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to return book');
    }
  };

  return (
    <div data-testid="loans-management">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A]">
          Loans
        </h2>
        <button
          onClick={() => setShowModal(true)}
          data-testid="create-loan-button"
          className="flex items-center gap-2 px-6 py-3 bg-[#0055FF] text-white neo-brutal-btn"
        >
          <Plus size={20} weight="bold" />
          Issue Book
        </button>
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
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Book</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Issue Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Due Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Late Fee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan, index) => {
                const isLate = loan.status === 'active' && new Date() > new Date(loan.due_date);
                return (
                  <tr
                    key={loan.id}
                    data-testid={`loan-row-${loan.id}`}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-[#F4F4F5]'}
                  >
                    <td className="px-6 py-4 font-semibold text-[#0A0A0A]">{loan.book_title}</td>
                    <td className="px-6 py-4 font-medium text-[#52525B]">{loan.customer_name}</td>
                    <td className="px-6 py-4 font-medium text-[#52525B]">
                      {format(new Date(loan.issue_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-[#52525B]">
                      {format(new Date(loan.due_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4 font-bold text-[#0A0A0A]">${loan.late_fee.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {loan.status === 'active' && (
                        <button
                          onClick={() => handleReturn(loan.id)}
                          data-testid={`return-loan-${loan.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-[#00E676] text-[#0A0A0A] border-2 border-[#0A0A0A] font-semibold text-xs uppercase"
                        >
                          <ArrowUUpLeft size={16} weight="bold" />
                          Return
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-8 max-w-md w-full" data-testid="loan-modal">
            <h3 className="text-2xl font-bold font-outfit mb-6 text-[#0A0A0A]">Issue Book</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                  Book
                </label>
                <select
                  data-testid="loan-book-select"
                  value={formData.book_id}
                  onChange={(e) => setFormData({ ...formData, book_id: e.target.value })}
                  className="w-full px-4 py-3 neo-brutal-input font-medium"
                  required
                >
                  <option value="">Select a book</option>
                  {books
                    .filter((book) => book.available_quantity > 0)
                    .map((book) => (
                      <option key={book.id} value={book.id}>
                        {book.title} (Available: {book.available_quantity})
                      </option>
                    ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                  Customer
                </label>
                <select
                  data-testid="loan-customer-select"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full px-4 py-3 neo-brutal-input font-medium"
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                  Due Date
                </label>
                <input
                  type="date"
                  data-testid="loan-due-date-input"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-3 neo-brutal-input font-medium"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  data-testid="loan-submit-button"
                  className="flex-1 py-3 bg-[#0055FF] text-white neo-brutal-btn"
                >
                  Issue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ book_id: '', customer_id: '', due_date: '' });
                  }}
                  data-testid="loan-cancel-button"
                  className="flex-1 py-3 bg-[#F4F4F5] text-[#0A0A0A] neo-brutal-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansManagement;
