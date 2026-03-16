import { useState, useEffect } from 'react';
import { 
  Car, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown,
  MapPin,
  AlertCircle,
  RefreshCw,
  Settings,
  BarChart3,
  CreditCard,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DashboardStats {
  totalLots: number;
  totalSpots: number;
  availableSpots: number;
  todayBookings: number;
  todayRevenue: number;
  activeUsers: number;
  occupancyRate: number;
  pendingRefunds: number;
  monthlyRevenue: number;
  monthlyBookings: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

interface TopParkingLot {
  lotId: string;
  lotName: string;
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
}

type TabType = 'overview' | 'bookings' | 'lots' | 'policies' | 'organizations';

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topLots, setTopLots] = useState<TopParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [statsRes, revenueRes, topLotsRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/dashboard`, config),
        axios.get(`${API_URL}/analytics/revenue?days=30`, config),
        axios.get(`${API_URL}/analytics/top-lots?limit=5`, config),
      ]);

      setStats(statsRes.data.data);
      setRevenueData(revenueRes.data.data);
      setTopLots(topLotsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'bookings' as TabType, label: 'Bookings', icon: Calendar },
    { id: 'lots' as TabType, label: 'Parking Lots', icon: MapPin },
    { id: 'policies' as TabType, label: 'Refund Policies', icon: CreditCard },
    { id: 'organizations' as TabType, label: 'Organizations', icon: Building2 },
  ];

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue,
    color 
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ElementType; 
    trend?: 'up' | 'down';
    trendValue?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && trendValue && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage your parking operations</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Today's Bookings"
              value={stats?.todayBookings || 0}
              icon={Calendar}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              title="Today's Revenue"
              value={`RM ${(stats?.todayRevenue || 0).toFixed(2)}`}
              icon={DollarSign}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              title="Active Users"
              value={stats?.activeUsers || 0}
              icon={Users}
              color="bg-purple-100 text-purple-600"
            />
            <StatCard
              title="Occupancy Rate"
              value={`${(stats?.occupancyRate || 0).toFixed(1)}%`}
              icon={Car}
              color="bg-orange-100 text-orange-600"
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Parking Lots"
              value={stats?.totalLots || 0}
              icon={MapPin}
              color="bg-cyan-100 text-cyan-600"
            />
            <StatCard
              title="Available Spots"
              value={stats?.availableSpots || 0}
              icon={Car}
              color="bg-teal-100 text-teal-600"
            />
            <StatCard
              title="Pending Refunds"
              value={stats?.pendingRefunds || 0}
              icon={CreditCard}
              color="bg-red-100 text-red-600"
            />
          </div>

          {/* Monthly Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Revenue (Last 30 Days)</h3>
              <div className="h-48 flex items-end space-x-2">
                {revenueData.slice(-14).map((day, index) => {
                  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
                  const height = (day.revenue / maxRevenue) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-primary-500 rounded-t hover:bg-primary-600 transition-colors"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`RM ${day.revenue.toFixed(2)}`}
                      ></div>
                      <span className="text-xs text-gray-400 mt-1">
                        {new Date(day.date).getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Parking Lots */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Top Performing Lots</h3>
              <div className="space-y-4">
                {topLots.map((lot, index) => (
                  <div key={lot.lotId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{lot.lotName}</p>
                        <p className="text-sm text-gray-500">{lot.totalBookings} bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">RM {lot.totalRevenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{lot.occupancyRate}% occupancy</p>
                    </div>
                  </div>
                ))}
                {topLots.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 mb-1">This Month's Performance</p>
                <p className="text-3xl font-bold">RM {(stats?.monthlyRevenue || 0).toFixed(2)}</p>
                <p className="text-primary-100 mt-1">{stats?.monthlyBookings || 0} bookings</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Bookings</h3>
            <button className="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Booking ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Parking Lot</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-mono text-sm">#BK001</td>
                  <td className="py-3 px-4">John Doe</td>
                  <td className="py-3 px-4">KL Central Parking</td>
                  <td className="py-3 px-4">2024-01-15</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Confirmed
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">RM 25.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parking Lots Tab */}
      {activeTab === 'lots' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Parking Lots</h3>
            <button className="btn-primary">
              Add New Lot
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Kuala Lumpur Central', spots: 500, available: 127, rate: 5.00 },
              { name: 'Bukit Bintang Mall', spots: 800, available: 45, rate: 4.00 },
              { name: 'Cyberjaya Tech Park', spots: 300, available: 180, rate: 3.00 },
            ].map((lot, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{lot.name}</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Spots:</span>
                    <span className="font-medium">{lot.spots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-medium text-green-600">{lot.available}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span className="font-medium">RM {lot.rate.toFixed(2)}/hr</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                  <button className="flex-1 text-sm text-primary-600 hover:text-primary-700">Edit</button>
                  <button className="flex-1 text-sm text-gray-600 hover:text-gray-700">View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refund Policies Tab */}
      {activeTab === 'policies' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Refund Policies</h3>
            <button className="btn-primary">
              Create Policy
            </button>
          </div>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">Standard Refund Policy</h4>
                  <p className="text-sm text-gray-500">Default policy for all bookings</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Default
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">100% refund</span>
                  <span className="text-gray-900">More than 24 hours before</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">50% refund</span>
                  <span className="text-gray-900">12-24 hours before</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No refund</span>
                  <span className="text-gray-900">Less than 12 hours before</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Organizations Tab */}
      {activeTab === 'organizations' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Organizations</h3>
            <button className="btn-primary">
              Add Organization
            </button>
          </div>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Kilo Car Parking</h4>
                  <p className="text-sm text-gray-500">KILOCAR</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Plan</p>
                  <p className="font-medium">Enterprise</p>
                </div>
                <div>
                  <p className="text-gray-500">Users</p>
                  <p className="font-medium">50/100</p>
                </div>
                <div>
                  <p className="text-gray-500">Lots</p>
                  <p className="font-medium">5/10</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
