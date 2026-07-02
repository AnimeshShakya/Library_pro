import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookshelvesManagement = () => {
  const [bookshelves, setBookshelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchBookshelves = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/bookshelves`, { withCredentials: true });
      setBookshelves(response.data);
    } catch (error) {
      toast.error('Failed to load bookshelves');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookshelves();
  }, [fetchBookshelves]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/bookshelves`, formData, { withCredentials: true });
      toast.success('Bookshelf created successfully');
      setShowModal(false);
      setFormData({ name: '', description: '' });
      fetchBookshelves();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create bookshelf');
    }
  };

  return (
    <div data-testid="bookshelves-management">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A]">
          Bookshelves
        </h2>
        <button
          onClick={() => setShowModal(true)}
          data-testid="create-bookshelf-button"
          className="flex items-center gap-2 px-6 py-3 bg-[#0055FF] text-white neo-brutal-btn"
        >
          <Plus size={20} weight="bold" />
          New Bookshelf
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block h-12 w-12 animate-spin rounded-sm border-4 border-solid border-[#0A0A0A] border-r-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookshelves.map((shelf) => (
            <div key={shelf.id} className="neo-brutal-card p-6" data-testid={`bookshelf-${shelf.id}`}>
              <h3 className="text-2xl font-bold font-outfit mb-2 text-[#0A0A0A]">{shelf.name}</h3>
              {shelf.description && (
                <p className="text-sm font-medium text-[#52525B] mb-4">{shelf.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="px-4 py-2 bg-[#FFD600] border-2 border-[#0A0A0A]">
                  <p className="text-2xl font-black font-outfit">{shelf.book_count}</p>
                  <p className="text-xs font-semibold uppercase tracking-widest">Books</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-8 max-w-md w-full" data-testid="bookshelf-modal">
            <h3 className="text-2xl font-bold font-outfit mb-6 text-[#0A0A0A]">Create Bookshelf</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                  Name
                </label>
                <input
                  type="text"
                  data-testid="bookshelf-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 neo-brutal-input font-medium"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                  Description
                </label>
                <textarea
                  data-testid="bookshelf-description-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 neo-brutal-input font-medium"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  data-testid="bookshelf-submit-button"
                  className="flex-1 py-3 bg-[#0055FF] text-white neo-brutal-btn"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ name: '', description: '' });
                  }}
                  data-testid="bookshelf-cancel-button"
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

export default BookshelvesManagement;
