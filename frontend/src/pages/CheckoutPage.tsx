import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, AlertCircle, CreditCard } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

interface BookingPaymentStatus {
  bookingId: string;
  paymentStatus: string;
  paymentId?: string;
  transactionId?: string;
  totalAmount: number;
  currency: string;
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<BookingPaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const bookingId = searchParams.get('bookingId');
  const paymentStatusFromUrl = searchParams.get('status');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error('Please login to view booking');
      navigate('/login');
      return;
    }

    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    // Check if status is provided in URL (from RinggitPay redirect)
    if (paymentStatusFromUrl) {
      if (paymentStatusFromUrl === 'completed') {
        setPaymentStatus({
          bookingId: bookingId,
          paymentStatus: 'completed',
          totalAmount: 0,
          currency: 'MYR',
        });
        toast.success('Payment completed successfully!');
      } else if (paymentStatusFromUrl === 'failed') {
        setError('Payment failed. Please try again.');
      } else if (paymentStatusFromUrl === 'pending') {
        setPaymentStatus({
          bookingId: bookingId,
          paymentStatus: 'pending',
          totalAmount: 0,
          currency: 'MYR',
        });
        toast.info('Payment is pending. Please wait...');
      }
      setLoading(false);
      return;
    }

    checkPaymentStatus();
  }, [bookingId, token, isAuthenticated, paymentStatusFromUrl]);

  const checkPaymentStatus = async () => {
    if (!token || !bookingId) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bookings/${bookingId}/payment-status`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPaymentStatus(result.data);
        
        // If payment is completed, show success
        if (result.data.paymentStatus === 'completed') {
          toast.success('Payment completed successfully!');
        }
      } else {
        setError(result.message || 'Failed to get payment status');
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      setError('Failed to check payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!token || !bookingId) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/bookings/${bookingId}/pay`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success && result.data.checkoutUrl) {
        // Redirect to payment gateway
        window.location.href = result.data.checkoutUrl;
      } else {
        toast.error(result.message || 'Failed to initiate payment');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
      toast.error('Failed to initiate payment');
      setLoading(false);
    }
  };

  const handleViewBooking = () => {
    if (bookingId) {
      navigate(`/bookings/${bookingId}`);
    } else {
      navigate('/my-bookings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600 mb-4" />
        <p className="text-gray-600">Checking payment status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/my-bookings')}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          View My Bookings
        </button>
      </div>
    );
  }

  const isPaid = paymentStatus?.paymentStatus === 'completed';
  const isPending = paymentStatus?.paymentStatus === 'pending';
  const isFailed = paymentStatus?.paymentStatus === 'failed';

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isPaid ? 'bg-green-100' : isPending ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            {isPaid ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : isPending ? (
              <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isPaid ? 'Payment Successful!' : isPending ? 'Payment Pending' : 'Payment Failed'}
          </h1>
        </div>

        {/* Payment Details */}
        {paymentStatus && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID</span>
                <span className="font-medium text-gray-900">{paymentStatus.bookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium text-gray-900">
                  {paymentStatus.currency} {paymentStatus.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className={`font-medium ${
                  isPaid ? 'text-green-600' : isPending ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {paymentStatus.paymentStatus.charAt(0).toUpperCase() + paymentStatus.paymentStatus.slice(1)}
                </span>
              </div>
              {paymentStatus.paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID</span>
                  <span className="font-medium text-gray-900 text-sm">{paymentStatus.paymentId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isPaid ? (
            <button
              onClick={handleViewBooking}
              className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              View Booking Details
            </button>
          ) : isPending ? (
            <>
              <button
                onClick={checkPaymentStatus}
                className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Check Payment Status Again
              </button>
              <p className="text-sm text-gray-500 text-center">
                If you completed the payment, please wait a moment and click the button above.
              </p>
            </>
          ) : (
            <>
              <button
                onClick={handleRetryPayment}
                className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Try Payment Again
              </button>
              <button
                onClick={handleViewBooking}
                className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                View Booking Details
              </button>
            </>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 text-gray-600 hover:text-gray-900"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
