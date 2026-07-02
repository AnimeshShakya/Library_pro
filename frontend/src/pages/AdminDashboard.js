import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  BookOpen,
  BookBookmark,
  ArrowsClockwise,
  WarningCircle,
  TrendUp,
  SignOut,
  Books,
  Users,
  ChartBar,
  Bookmark,
  IdentificationCard,
} from '@phosphor-icons/react';
import BooksManagement from '../components/BooksManagement';
import BookshelvesManagement from '../components/BookshelvesManagement';
import LoansManagement from '../components/LoansManagement';
import ReservationsManagement from '../components/ReservationsManagement';
import MembershipsManagement from '../components/MembershipsManagement';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`, {
        withCredentials: true,
      });
      setAnalytics(response.data);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching analytics:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/customer');
    } else {
      fetchAnalytics();
    }
  }, [user, navigate, fetchAnalytics]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartBar },
    { id: 'bookshelves', label: 'Bookshelves', icon: BookBookmark },
    { id: 'books', label: 'Books', icon: Books },
    { id: 'loans', label: 'Loans', icon: ArrowsClockwise },
    { id: 'reservations', label: 'Reservations', icon: Bookmark },
    { id: 'memberships', label: 'Memberships', icon: IdentificationCard },
    { id: 'analytics', label: 'Analytics', icon: TrendUp },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r-2 border-[#0A0A0A] flex flex-col">
        <div className="p-6 border-b-2 border-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0055FF] border-2 border-[#0A0A0A] flex items-center justify-center">
              <BookOpen size={24} weight="bold" color="white" />
            </div>
            <div>
              <h1 className="text-xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A]">
                Library Pro
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#52525B]">Admin</p>
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
          {activeTab === 'dashboard' && (
            <div data-testid="dashboard-view">
              <h2 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A] mb-8">
                Dashboard
              </h2>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="inline-block h-12 w-12 animate-spin rounded-sm border-4 border-solid border-[#0A0A0A] border-r-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="neo-brutal-card p-6 metric-card-blue" data-testid="metric-total-books">
                    <div className="flex items-start justify-between mb-4">
                      <Books size={32} weight="bold" />
                    </div>
                    <p className="text-5xl md:text-6xl font-black font-outfit tracking-tighter mb-2">
                      {analytics?.total_books || 0}
                    </p>
                    <p className="text-sm font-semibold uppercase tracking-widest">Total Books</p>
                  </div>

                  <div className="neo-brutal-card p-6 metric-card-green" data-testid="metric-active-loans">
                    <div className="flex items-start justify-between mb-4">
                      <ArrowsClockwise size={32} weight="bold" />
                    </div>
                    <p className="text-5xl md:text-6xl font-black font-outfit tracking-tighter mb-2">
                      {analytics?.active_loans || 0}
                    </p>
                    <p className="text-sm font-semibold uppercase tracking-widest">Active Loans</p>
                  </div>

                  <div className="neo-brutal-card p-6 metric-card-red" data-testid="metric-late-returns">
                    <div className="flex items-start justify-between mb-4">
                      <WarningCircle size={32} weight="bold" />
                    </div>
                    <p className="text-5xl md:text-6xl font-black font-outfit tracking-tighter mb-2">
                      {analytics?.late_returns || 0}
                    </p>
                    <p className="text-sm font-semibold uppercase tracking-widest">Late Returns</p>
                  </div>

                  <div className="neo-brutal-card p-6 metric-card-yellow" data-testid="metric-revenue">
                    <div className="flex items-start justify-between mb-4">
                      <TrendUp size={32} weight="bold" />
                    </div>
                    <p className="text-5xl md:text-6xl font-black font-outfit tracking-tighter mb-2">
                      ${analytics?.monthly_revenue || 0}
                    </p>
                    <p className="text-sm font-semibold uppercase tracking-widest">Revenue</p>
                  </div>
                </div>
              )}

              {analytics?.low_stock_count > 0 && (
                <div className="bg-[#FFD600] border-2 border-[#0A0A0A] hard-shadow p-6 mb-8" data-testid="low-stock-alert">
                  <div className="flex items-center gap-3">
                    <WarningCircle size={32} weight="bold" color="#0A0A0A" />
                    <div>
                      <p className="text-xl font-bold font-outfit text-[#0A0A0A]">
                        Low Stock Alert!
                      </p>
                      <p className="text-sm font-medium text-[#0A0A0A]">
                        {analytics.low_stock_count} book(s) have low inventory (≤2 copies)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookshelves' && <BookshelvesManagement />}
          {activeTab === 'books' && <BooksManagement />}
          {activeTab === 'loans' && <LoansManagement />}
          {activeTab === 'reservations' && <ReservationsManagement />}
          {activeTab === 'memberships' && <MembershipsManagement />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
