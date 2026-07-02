import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Bookmark } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReservationsManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/reservations`, { withCredentials: true });
      setReservations(response.data);
    } catch (error) {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return (
    <div data-testid="reservations-management">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl md:text-5xl font-black font-outfit uppercase tracking-tighter text-[#0A0A0A]">
          Reservations
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block h-12 w-12 animate-spin rounded-sm border-4 border-solid border-[#0A0A0A] border-r-transparent"></div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white border-2 border-[#0A0A0A] hard-shadow p-12 text-center">
          <Bookmark size={48} weight="bold" color="#52525B" className="mx-auto mb-4" />
          <p className="text-xl font-semibold text-[#52525B]">No reservations yet</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-[#0A0A0A] hard-shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0A0A0A] text-white">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Book</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Reserved On</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation, index) => (
                <tr
                  key={reservation.id}
                  data-testid={`reservation-row-${reservation.id}`}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-[#F4F4F5]'}
                >
                  <td className="px-6 py-4 font-semibold text-[#0A0A0A]">{reservation.book_title}</td>
                  <td className="px-6 py-4 font-medium text-[#52525B]">{reservation.customer_name}</td>
                  <td className="px-6 py-4 font-medium text-[#52525B]">
                    {format(new Date(reservation.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[#FFD600] border-2 border-[#0A0A0A] text-xs font-bold uppercase">
                      {reservation.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReservationsManagement;
