import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, IdentificationCard } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MembershipsManagement = () => {
  const [memberships, setMemberships] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    plan: 'monthly',
    duration_days: 30,
  });

  useEffect(() => {
    fetchMemberships();
    fetchCustomers();
  }, []);

  const fetchMemberships = async () => {
    try {
      const response = await axios.get(`${API}/memberships`, { withCredentials: true });
      setMemberships(response.data);
    } catch (error) {
      toast.error('Failed to load memberships');
    } finally {
      setLoading(false);
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
      await axios.post(`${API}/memberships`, formData, { withCredentials: true });
      toast.success('Membership created successfully');
      setShowModal(false);
      setFormData({ customer_id: '', plan: 'monthly', duration_days: 30 });
      fetchMemberships();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create membership');
    }
  };

  const handlePlanChange = (plan) => {
    const durations = {
      monthly: 30,
      quarterly: 90,
      yearly: 365,
    };
    setFormData({ ...formData, plan, duration_days: durations[plan] });
  };

  return (
    <div data-testid="memberships-management">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A]">
          Memberships
        </h2>
        <button
          onClick={() => setShowModal(true)}
          data-testid="create-membership-button"
          className="flex items-center gap-2 px-6 py-3 bg-[#0055FF] text-white neo-brutal-btn"
        >
          <Plus size={20} weight="bold" />
          New Membership
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block h-12 w-12 animate-spin rounded-sm border-4 border-solid border-[#0A0A0A] border-r-transparent"></div>
        </div>
      ) : memberships.length === 0 ? (
        <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-12 text-center">
          <IdentificationCard size={48} weight="bold" color="#52525B" className="mx-auto mb-4" />
          <p className="text-xl font-semibold text-[#52525B]">No memberships yet</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-[#0A0A0A] hard-shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0A0A0A] text-white">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Start Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">End Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((membership, index) => (
                <tr
                  key={membership.id}
                  data-testid={`membership-row-${membership.id}`}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-[#F4F4F5]'}
                >
                  <td className="px-6 py-4 font-semibold text-[#0A0A0A]">{membership.customer_name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[#FFD600] border-2 border-[#0A0A0A] text-xs font-bold uppercase">
                      {membership.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#52525B]">
                    {format(new Date(membership.start_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 font-medium text-[#52525B]">
                    {format(new Date(membership.end_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 border-2 border-[#0A0A0A] text-xs font-bold uppercase ${
                        membership.status === 'active'
                          ? 'bg-[#00E676] text-[#0A0A0A]'
                          : 'bg-[#FF3B30] text-white'
                      }`}
                    >
                      {membership.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-8 max-w-md w-full" data-testid="membership-modal">
            <h3 className="text-2xl font-bold font-outfit mb-6 text-[#0A0A0A]">Create Membership</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold uppercase tracking-widest mb-2 text-[#0A0A0A]">
                  Customer
                </label>
                <select
                  data-testid="membership-customer-select"
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
                  Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['monthly', 'quarterly', 'yearly'].map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      data-testid={`plan-${plan}`}
                      onClick={() => handlePlanChange(plan)}
                      className={`py-3 border-2 border-[#0A0A0A] font-semibold text-xs uppercase ${
                        formData.plan === plan
                          ? 'bg-[#0055FF] text-white'
                          : 'bg-white text-[#0A0A0A] hover:bg-[#F4F4F5]'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  data-testid="membership-submit-button"
                  className="flex-1 py-3 bg-[#0055FF] text-white neo-brutal-btn"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ customer_id: '', plan: 'monthly', duration_days: 30 });
                  }}
                  data-testid="membership-cancel-button"
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

export default MembershipsManagement;
