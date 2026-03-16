import { useState, useEffect } from 'react';
import { Search, MapPin, Clock, DollarSign, Zap, Car, Loader2, X, Calendar } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

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
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [endTime, setEndTime] = useState('');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchParkingLots();
    if (token) {
      fetchVehicles();
    }
  }, [token]);

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
    setSelectedVehicle(vehicles[0]?._id || '');
    setSelectedLot(null);
  };

  const handleConfirmBooking = async () => {
    if (!token || !selectedLot || !selectedVehicle || !selectedDate || !selectedTime || !endTime) {
      toast.error('Please fill in all fields');
      return;
    }

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
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Booking created successfully!');
        setShowBookingModal(false);
        clearBookingForm();
        fetchParkingLots(); // Refresh availability
      } else {
        toast.error(result.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
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

      {/* Parking Lots Grid */}
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
      ) : (
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
                <button onClick={() => { setShowBookingModal(false); clearBookingForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
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

                {/* Time Selection */}
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

                {/* Price Estimate */}
                {selectedDate && selectedTime && endTime && (
                  <div className="bg-primary-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Estimated Price:</span>
                      <span className="text-xl font-bold text-primary-700">
                        RM {selectedLot.hourlyRate}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Final price calculated at checkout</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => { setShowBookingModal(false); clearBookingForm(); }} 
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading || vehicles.length === 0 || !selectedDate}
                    className="flex-1 btn-primary"
                  >
                    {bookingLoading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Booking...
                      </span>
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
