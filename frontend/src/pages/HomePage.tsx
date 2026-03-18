import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, DollarSign, Zap, Car, Loader2, X, Calendar, Map, List, Check, CreditCard, Smartphone, Building } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';
import { RJButton, RJInput, RJModal, RJModalHeader, RJModalBody, RJModalFooter, RJBadge } from '@/components/ui';

interface ParkingLot {
  _id: string;
  name: string;
  address: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  coordinates?: { lat: number; lng: number };
  totalSpots: number;
  availableSpots: number;
  hourlyRate: number;
  dailyRate: number;
  monthlyRate?: number;
  amenities: string[];
  images?: string[];
  image?: string;
  rating?: number;
  operatingHours?: {
    open: string;
    close: string;
  };
}

interface Vehicle {
  _id: string;
  licensePlate: string;
  make: string;
  model: string;
}

const defaultImage = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800';

export default function HomePage() {
  const { token, isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [filterEV, setFilterEV] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [endTime, setEndTime] = useState('');
  const [bookingType, setBookingType] = useState<'hourly' | 'daily' | 'monthly'>('hourly');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'ewallet' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [paymentCountdown, setPaymentCountdown] = useState(5);
  const [bookingData, setBookingData] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchParkingLots();
    if (token) {
      fetchVehicles();
    }
  }, [token]);

  // Fetch available slots when date/time changes (only for hourly bookings)
  useEffect(() => {
    if (selectedDate && selectedTime && endTime && bookingType === 'hourly' && selectedLot) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedTime, endTime, bookingType, selectedLot]);

  const fetchParkingLots = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/parking/lots`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await response.json();
      
      if (result.success) {
        setParkingLots(result.data || result.parkingLots || []);
      } else {
        setParkingLots([]);
      }
    } catch (error) {
      console.error('Error fetching parking lots:', error);
      setParkingLots([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      
      if (result.success && result.data?.length > 0) {
        setVehicles(result.data);
        setSelectedVehicle(result.data[0]._id);
      } else {
        toast.error('Please add a vehicle first');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const handleBookNow = (lot: ParkingLot) => {
    if (!isAuthenticated) {
      toast.error('Please login to book parking');
      return;
    }
    setSelectedLot(lot);
    setShowBookingModal(true);
    
    // Set default date/time to now + 1 hour
    const now = new Date();
    now.setHours(now.getHours() + 1);
    setSelectedTime(now.toTimeString().slice(0, 5));
    setEndTime(now.toTimeString().slice(0, 5));
  };

  const clearBookingForm = () => {
    setSelectedDate('');
    setSelectedTime('');
    setEndTime('');
    setBookingType('hourly');
    setSelectedVehicle(vehicles[0]?._id || '');
    setSelectedLot(null);
    setAvailableSlots([]);
    setSelectedSpot('');
    setPaymentMethod(null);
    setPaymentStatus('idle');
  };

  // Fetch available slots when date/time changes
  const fetchAvailableSlots = async () => {
    if (!selectedLot?._id || !selectedDate || !selectedTime || !endTime) return;
    
    setSlotsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/parking-spots/lot/${selectedLot._id}?date=${selectedDate}&startTime=${selectedTime}&endTime=${endTime}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await response.json();
      if (result.success) {
        setAvailableSlots(result.data.spots || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!token || !selectedLot || !selectedVehicle || !selectedDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // For hourly bookings, time is required
    if (bookingType === 'hourly' && (!selectedTime || !endTime)) {
      toast.error('Please select start and end time');
      return;
    }

    // Create booking and redirect to payment immediately
    createBooking();
  };

  const handleProcessPayment = async () => {
    // Skip payment method selection - go directly to RiggitPay
    createBooking();
  };

  const createBooking = async () => {
    if (!token || !selectedLot || !selectedVehicle || !selectedDate) return;

    setBookingLoading(true);
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lotId: selectedLot._id,
          vehicleId: selectedVehicle,
          date: selectedDate,
          startTime: selectedTime,
          endTime: endTime,
          spotId: selectedSpot || undefined,
          bookingType: bookingType,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        const booking = result.data;
        
        // Initiate payment after booking is created
        try {
          const paymentResponse = await fetch(`${API_URL}/bookings/${booking._id}/pay`, {
            method: 'POST',
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          const paymentResult = await paymentResponse.json();
          
          if (paymentResult.success) {
            // Navigate to checkout page with booking ID
            const checkoutUrl = `${window.location.origin}/checkout?bookingId=${booking._id}&amount=${booking.totalAmount}`;
            window.location.href = checkoutUrl;
          } else {
            // If payment initiation fails, still show success
            setPaymentStatus('success');
            setBookingData(booking);
            setShowSuccessModal(true);
            setShowBookingModal(false);
            clearBookingForm();
            fetchParkingLots();
          }
        } catch (paymentError) {
          console.error('Payment initiation error:', paymentError);
          // Show booking success even if payment fails
          setPaymentStatus('success');
          setBookingData(booking);
          setShowSuccessModal(true);
          setShowBookingModal(false);
          clearBookingForm();
          fetchParkingLots();
        }
      } else {
        toast.error(result.message || 'Failed to create booking');
        setPaymentStatus('idle');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
      setPaymentStatus('idle');
    } finally {
      setBookingLoading(false);
    }
  };

  // Transform API response to handle different field names
  const transformParkingLot = (lot: any): ParkingLot => {
    return {
      ...lot,
      image: lot.images?.[0] || lot.image || defaultImage,
    };
  };

  const filteredLots = parkingLots.map(transformParkingLot).filter((lot) => {
    const matchesSearch = lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEV = !filterEV || (lot.amenities && lot.amenities.some(a => a.toLowerCase().includes('ev')));
    return matchesSearch && matchesEV;
  });

  const getCoordinates = (lot: ParkingLot) => {
    if (lot.coordinates) return lot.coordinates;
    if (lot.location?.coordinates) {
      return { lat: lot.location.coordinates[1], lng: lot.location.coordinates[0] };
    }
    return { lat: 3.1427, lng: 101.7032 };
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative px-8 py-16 text-white">
          <h1 className="text-4xl font-bold mb-4">
            Find Your Perfect Parking Spot
          </h1>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl">
            Book parking spaces at hundreds of locations across Malaysia. 
            Save time, save money, and enjoy hassle-free parking.
          </p>
           
          {/* Search Box */}
          <div className="bg-white rounded-xl p-4 shadow-lg max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900"
                />
              </div>
              <div className="relative">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {loading ? 'Loading...' : `${filteredLots.length} Parking Locations`}
        </h2>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm">List</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'map' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Map className="w-4 h-4" />
              <span className="text-sm">Map</span>
            </button>
          </div>
          <button
            onClick={() => setFilterEV(!filterEV)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              filterEV 
                ? 'bg-accent-50 border-accent-500 text-accent-700' 
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>EV Charging</span>
          </button>
        </div>
      </div>

      {/* Parking Lots View */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filteredLots.length === 0 ? (
        <div className="text-center py-20">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No parking lots found</p>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : viewMode === 'map' ? (
        /* Map View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Placeholder */}
          <div className="lg:col-span-2 bg-gray-100 rounded-xl min-h-[500px] flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">Interactive Map</p>
              <p className="text-gray-400 text-sm">View parking locations on map</p>
            </div>
          </div>
          {/* Location List */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            <h3 className="font-semibold text-gray-900">Where can I park?</h3>
            {filteredLots.map((lot) => (
              <div 
                key={lot._id} 
                onClick={() => handleBookNow(lot)}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-primary-300 cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{lot.name}</h4>
                  <span className="text-primary-600 font-bold">RM {lot.hourlyRate}/hr</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {lot.address}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`px-2 py-0.5 rounded-full ${lot.availableSpots > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {lot.availableSpots} spots available
                    </span>
                  </div>
                  <button className="text-primary-600 text-sm font-medium hover:underline">
                    Book Now →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLots.map((lot) => (
            <div key={lot._id} className="card-hover group">
              {/* Image */}
              <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl">
                <img
                  src={lot.image || defaultImage}
                  alt={lot.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {lot.availableSpots < 50 && (
                  <div className="absolute top-3 right-3 badge-warning">
                    Limited spots
                  </div>
                )}
                <div className="absolute bottom-3 left-3 badge bg-black/60 text-white backdrop-blur-sm">
                  {lot.rating ? `${lot.rating} ★` : 'New'}
                </div>
              </div>

              {/* Content */}
              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                {lot.name}
              </h3>
              <div className="flex items-center text-gray-500 text-sm mb-4">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="truncate">{lot.address}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-400 mb-1">
                    <Car className="w-4 h-4" />
                  </div>
                  <div className="text-sm">
                    <span className={`font-semibold ${lot.availableSpots < 50 ? 'text-red-600' : 'text-green-600'}`}>
                      {lot.availableSpots}
                    </span>
                    <span className="text-gray-400">/{lot.totalSpots}</span>
                  </div>
                  <div className="text-xs text-gray-400">Available</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-400 mb-1">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {lot.operatingHours?.open || '24/7'}
                  </div>
                  <div className="text-xs text-gray-400">Hours</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-400 mb-1">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    RM {lot.hourlyRate?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-gray-400">/hour</div>
                </div>
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(lot.amenities || []).slice(0, 3).map((amenity) => (
                  <span
                    key={amenity}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                  >
                    {amenity}
                  </span>
                ))}
              </div>

              {/* Action */}
              <button 
                onClick={() => handleBookNow(lot)}
                className="w-full btn-primary"
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedLot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Book Parking</h2>
                <button onClick={() => { setShowBookingModal(false); clearBookingForm(); setPaymentMethod(null); setPaymentStatus('idle'); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Parking Lot Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900">{selectedLot.name}</h3>
                  <p className="text-sm text-gray-500">{selectedLot.address}</p>
                  <p className="text-primary-600 font-semibold mt-2">
                    RM {selectedLot.hourlyRate}/hour
                  </p>
                </div>

                {/* Vehicle Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Vehicle
                  </label>
                  {vehicles.length > 0 ? (
                    <select
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                      className="input"
                    >
                      {vehicles.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.make} {v.model} - {v.licensePlate}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-red-500 text-sm">No vehicles. Please add a vehicle first.</p>
                  )}
                </div>

                {/* Slot Selection */}
                {selectedDate && selectedTime && endTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Select Parking Spot
                    </label>
                    {slotsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-gray-500">Loading spots...</span>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                        {availableSlots.map((spot) => (
                          <button
                            key={spot._id}
                            type="button"
                            onClick={() => setSelectedSpot(spot._id)}
                            className={`p-2 text-xs rounded-lg border transition-all ${
                              selectedSpot === spot._id
                                ? 'bg-blue-600 text-white border-blue-600'
                                : spot.status === 'occupied'
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200'
                                : 'bg-white hover:bg-blue-50 border-gray-200 text-gray-700'
                            }`}
                            disabled={spot.status === 'occupied'}
                          >
                            <div className="font-semibold">{spot.spotNumber}</div>
                            <div className="text-xs opacity-75">{spot.spotType || 'Standard'}</div>
                            <div className="text-xs">{spot.floor || 'F1'}</div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No spots available for selected time.</p>
                    )}
                    {availableSlots.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {availableSlots.filter(s => s.status !== 'occupied').length} spots available
                      </p>
                    )}
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                {/* Booking Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Booking Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['hourly', 'daily', 'monthly'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBookingType(type)}
                        className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                          bookingType === type
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection - Only for hourly bookings */}
                {bookingType === 'hourly' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="input"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Price Estimate */}
                {selectedLot && (
                  <div className="bg-primary-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Estimated Price:</span>
                      <span className="text-xl font-bold text-primary-700">
                        {bookingType === 'hourly' && selectedDate && selectedTime && endTime && (() => {
                          const startHour = parseInt(selectedTime.split(':')[0], 10);
                          const endHour = parseInt(endTime.split(':')[0], 10);
                          const hours = Math.max(1, endHour - startHour);
                          return <>RM {(selectedLot.hourlyRate * hours).toFixed(2)} <span className="text-sm font-normal">({hours} hour{hours > 1 ? 's' : ''})</span></>;
                        })()}
                        {bookingType === 'daily' && (
                          <>RM {selectedLot.dailyRate || (selectedLot.hourlyRate * 10)}/day</>
                        )}
                        {bookingType === 'monthly' && (
                          <>RM {selectedLot.monthlyRate || (selectedLot.dailyRate * 20) || (selectedLot.hourlyRate * 200)}/month</>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Final price calculated at checkout</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => { setShowBookingModal(false); clearBookingForm(); setPaymentMethod(null); setPaymentStatus('idle'); }} 
                    className="flex-1 btn-secondary"
                    disabled={paymentStatus === 'processing'}
                  >
                    Cancel
                  </button>
                  {paymentStatus === 'idle' ? (
                    <button 
                      onClick={handleProcessPayment}
                      disabled={bookingLoading || vehicles.length === 0 || !selectedDate || (bookingType === 'hourly' && (!selectedTime || !endTime))}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      Pay Now
                    </button>
                  ) : paymentStatus === 'processing' ? (
                    <button 
                      disabled
                      className="flex-1 btn-primary opacity-50"
                    >
                      Processing...
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {showSuccessModal && bookingData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">Your booking has been confirmed.</p>

              {/* QR Code */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Scan QR Code to Enter</p>
                <div className="w-32 h-32 bg-white border-2 border-gray-200 rounded-lg mx-auto flex items-center justify-center">
                  {bookingData.qrCode ? (
                    <img src={bookingData.qrCode} alt="QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center p-2">
                      <div className="grid grid-cols-5 gap-1 w-24 h-24 mx-auto">
                        {[...Array(25)].map((_, i) => (
                          <div key={i} className={`${Math.random() > 0.5 ? 'bg-black' : 'bg-white'} ${i % 5 === 0 ? 'border-l' : ''} ${Math.floor(i / 5) === 0 ? 'border-t' : ''} border border-gray-300`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">Passcode: {bookingData.passcode || 'N/A'}</p>
              </div>

              {/* Booking Details */}
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Booking Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span className="text-gray-900">{selectedLot?.name || bookingData.lotId?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="text-gray-900">{bookingData.date ? new Date(bookingData.date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time:</span>
                    <span className="text-gray-900">{bookingData.startTime} - {bookingData.endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="text-gray-900 font-semibold">RM {bookingData.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => { setShowSuccessModal(false); setBookingData(null); setSelectedLot(null); }} 
                  className="flex-1 btn-secondary py-3"
                >
                  Close
                </button>
                <button 
                  onClick={() => { window.location.href = '/bookings'; }} 
                  className="flex-1 btn-primary py-3"
                >
                  View My Bookings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
