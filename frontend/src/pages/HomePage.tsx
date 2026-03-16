import { useState } from 'react';
import { Search, MapPin, Clock, DollarSign, Zap, Car, Filter } from 'lucide-react';

// Mock parking lots data
const mockParkingLots = [
  {
    id: '1',
    name: 'Kuala Lumpur Central Parking',
    address: 'Jalan Sultan Ismail, Kuala Lumpur',
    coordinates: { lat: 3.1427, lng: 101.7032 },
    totalSpots: 500,
    availableSpots: 127,
    hourlyRate: 5.00,
    dailyRate: 40.00,
    amenities: ['CCTV', 'Security', 'EV Charging', 'Accessible'],
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800',
    rating: 4.5,
  },
  {
    id: '2',
    name: 'Bukit Bintang Mall Parking',
    address: 'Jalan Bukit Bintang, Kuala Lumpur',
    coordinates: { lat: 3.1466, lng: 101.7113 },
    totalSpots: 800,
    availableSpots: 45,
    hourlyRate: 4.00,
    dailyRate: 35.00,
    amenities: ['CCTV', 'Security', 'Car Wash'],
    image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800',
    rating: 4.2,
  },
  {
    id: '3',
    name: 'Cyberjaya Tech Park',
    address: '63000 Cyberjaya, Selangor',
    coordinates: { lat: 2.9213, lng: 101.6559 },
    totalSpots: 300,
    availableSpots: 180,
    hourlyRate: 3.00,
    dailyRate: 25.00,
    amenities: ['CCTV', 'Security', 'EV Charging', 'Shade'],
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800',
    rating: 4.7,
  },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [filterEV, setFilterEV] = useState(false);

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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div className="relative">
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Nearby Parking</h2>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockParkingLots.map((lot) => (
          <div key={lot.id} className="card-hover group">
            {/* Image */}
            <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl">
              <img
                src={lot.image}
                alt={lot.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {lot.availableSpots < 50 && (
                <div className="absolute top-3 right-3 badge-warning">
                  Limited spots
                </div>
              )}
              <div className="absolute bottom-3 left-3 badge bg-black/60 text-white backdrop-blur-sm">
                {lot.rating} ★
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
                  24/7
                </div>
                <div className="text-xs text-gray-400">Hours</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center text-gray-400 mb-1">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  RM {lot.hourlyRate.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">/hour</div>
              </div>
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-2 mb-4">
              {lot.amenities.slice(0, 3).map((amenity) => (
                <span
                  key={amenity}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                >
                  {amenity}
                </span>
              ))}
            </div>

            {/* Action */}
            <button className="w-full btn-primary">
              Book Now
            </button>
          </div>
        ))}
      </div>

      {/* Features Section */}
      <div className="bg-gray-100 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Why Choose Kilo Car?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Easy Booking</h3>
            <p className="text-gray-600">
              Find and book parking spots in seconds with our intuitive interface
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-accent-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">EV Charging</h3>
            <p className="text-gray-600">
              Find EV charging spots and get real-time availability updates
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Best Rates</h3>
            <p className="text-gray-600">
              Compare prices across multiple locations and save on parking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
