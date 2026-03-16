import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Car, X, Download, RefreshCw, Check, XCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

interface Booking {
  _id: string;
  lotId: {
    _id: string;
    name: string;
    address: string;
  };
  vehicleId: {
    _id: string;
    licensePlate: string;
    make: string;
    model: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
  totalAmount: number;
  currency?: string;
  refundAmount?: number;
  refundStatus?: 'none' | 'pending' | 'processed' | 'failed';
  qrCode?: string;
  createdAt: string;
}

export default function MyBookingsPage() {
  const { token, user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const fetchBookings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      
      if (result.success) {
        setBookings(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    // First, get cancellation eligibility
    try {
      const eligibilityResponse = await fetch(`${API_URL}/bookings/${bookingId}/cancellation-eligibility`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const eligibility = await eligibilityResponse.json();
      
      if (!eligibility.data?.canCancel) {
        toast.error(eligibility.data?.reason || 'This booking cannot be cancelled');
        return;
      }

      // Show confirmation with refund info
      const refundInfo = eligibility.data;
      let confirmMessage = 'Are you sure you want to cancel this booking?';
      
      if (refundInfo.isRefundable && refundInfo.refundAmount > 0) {
        confirmMessage += `\n\nYou will receive a refund of RM ${refundInfo.refundAmount.toFixed(2)} (${refundInfo.refundPercentage}% of booking amount).`;
      } else if (refundInfo.warnings?.length > 0) {
        confirmMessage += `\n\nNote: ${refundInfo.warnings[0]}`;
      } else {
        confirmMessage += '\n\nNo refund will be processed for this cancellation.';
      }

      if (!confirm(confirmMessage)) return;
    } catch (error) {
      console.error('Error checking eligibility:', error);
      // Continue with normal cancel if eligibility check fails
      if (!confirm('Are you sure you want to cancel this booking?')) return;
    }
    
    setCancelling(bookingId);
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      
      if (result.success) {
        const refund = result.data?.refund;
        if (refund?.eligible && refund?.amount > 0) {
          toast.success(`Booking cancelled! Refund of RM ${refund.amount.toFixed(2)} will be processed.`);
        } else {
          toast.success('Booking cancelled successfully');
        }
        fetchBookings();
      } else {
        toast.error(result.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
      checked_in: { bg: 'bg-green-100', text: 'text-green-800', label: 'Checked In' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Completed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return as-is if invalid
      return date.toLocaleDateString('en-MY', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canCancel = (booking: Booking) => {
    // Can't cancel if already cancelled, completed, or checked in
    if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'checked_in') {
      return false;
    }
    // Allow cancel for pending/confirmed bookings
    return booking.status === 'pending' || booking.status === 'confirmed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <button onClick={fetchBookings} className="btn-secondary flex items-center space-x-2">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No bookings yet</p>
          <p className="text-gray-400">Start by booking a parking spot!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="card hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Booking Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(booking.status)}
                    {booking.refundStatus && booking.refundStatus !== 'none' && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.refundStatus === 'processed' ? 'bg-green-100 text-green-800' :
                        booking.refundStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Refund: {booking.refundStatus}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg text-gray-900">
                    {booking.lotId?.name || 'Parking Lot'}
                  </h3>
                  
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{booking.lotId?.address || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="w-4 h-4" />
                      <span>{booking.vehicleId?.licensePlate || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(booking.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">RM {booking.totalAmount?.toFixed(2) || '0.00'}</p>
                    {booking.refundAmount && booking.refundAmount > 0 && (
                      <p className="text-sm text-green-600">
                        Refund: RM {booking.refundAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="btn-secondary text-sm py-1.5"
                    >
                      View Details
                    </button>
                    {canCancel(booking) && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        disabled={cancelling === booking._id}
                        className="btn-danger text-sm py-1.5 flex items-center gap-1"
                      >
                        {cancelling === booking._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  {getStatusBadge(selectedBooking.status)}
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">{selectedBooking.lotId?.name}</h3>
                  <p className="text-sm text-gray-500">{selectedBooking.lotId?.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(selectedBooking.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium">{selectedBooking.vehicleId?.make} {selectedBooking.vehicleId?.model}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.vehicleId?.licensePlate}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-bold">RM {selectedBooking.totalAmount?.toFixed(2)}</span>
                  </div>
                  {selectedBooking.refundAmount && selectedBooking.refundAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Refund Amount</span>
                      <span>RM {selectedBooking.refundAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {selectedBooking.qrCode && (
                  <div className="border-t pt-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">QR Code for Entry</p>
                    <img 
                      src={selectedBooking.qrCode} 
                      alt="QR Code" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
