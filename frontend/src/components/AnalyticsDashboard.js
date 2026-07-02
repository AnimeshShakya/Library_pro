import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendUp } from '@phosphor-icons/react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnalyticsDashboard = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesAnalytics = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/analytics/sales`, { withCredentials: true });
      setSalesData(response.data.monthly_sales);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesAnalytics();
  }, [fetchSalesAnalytics]);

  return (
    <div data-testid="analytics-dashboard">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A]">
          Analytics
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block h-12 w-12 animate-spin rounded-sm border-4 border-solid border-[#0A0A0A] border-r-transparent"></div>
        </div>
      ) : salesData.length === 0 ? (
        <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-12 text-center">
          <TrendUp size={48} weight="bold" color="#52525B" className="mx-auto mb-4" />
          <p className="text-xl font-semibold text-[#52525B]">No data available yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-8">
            <h3 className="text-2xl font-bold font-outfit mb-6 text-[#0A0A0A]">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0A0A0A" strokeWidth={1} />
                <XAxis
                  dataKey="month"
                  stroke="#0A0A0A"
                  style={{ fontWeight: 600, fontSize: '12px', fontFamily: 'IBM Plex Sans' }}
                />
                <YAxis
                  stroke="#0A0A0A"
                  style={{ fontWeight: 600, fontSize: '12px', fontFamily: 'IBM Plex Sans' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #0A0A0A',
                    borderRadius: '0',
                    fontWeight: 600,
                    fontFamily: 'IBM Plex Sans',
                  }}
                />
                <Bar dataKey="revenue" fill="#0055FF" stroke="#0A0A0A" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-8">
            <h3 className="text-2xl font-bold font-outfit mb-6 text-[#0A0A0A]">Monthly Loans</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0A0A0A" strokeWidth={1} />
                <XAxis
                  dataKey="month"
                  stroke="#0A0A0A"
                  style={{ fontWeight: 600, fontSize: '12px', fontFamily: 'IBM Plex Sans' }}
                />
                <YAxis
                  stroke="#0A0A0A"
                  style={{ fontWeight: 600, fontSize: '12px', fontFamily: 'IBM Plex Sans' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #0A0A0A',
                    borderRadius: '0',
                    fontWeight: 600,
                    fontFamily: 'IBM Plex Sans',
                  }}
                />
                <Bar dataKey="loans" fill="#FF007F" stroke="#0A0A0A" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
