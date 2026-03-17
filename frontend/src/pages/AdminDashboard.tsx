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
  ChevronRight,
  Check,
  X,
  Loader2,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';
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

type TabType = 'overview' | 'bookings' | 'lots' | 'policies' | 'organizations' | 'approvals' | 'users';

export default function AdminDashboard() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [topLots, setTopLots] = useState<TopParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Parking Lots State
  const [parkingLots, setParkingLots] = useState<any[]>([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [showLotModal, setShowLotModal] = useState(false);
  const [editingLot, setEditingLot] = useState<any>(null);
  const [lotForm, setLotForm] = useState({
    name: '',
    address: '',
    coordinates: { lat: 3.1427, lng: 101.7032 },
    totalSpots: 50,
    hourlyRate: 5,
    dailyRate: 50,
    monthlyRate: 500,
    amenities: [] as string[],
    requireApproval: false,
    description: '',
    image: '',
  });

  // Refund Policies State
  const [refundPolicies, setRefundPolicies] = useState<any[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    isDefault: false,
    tiers: [
      { name: 'Full Refund', hoursBeforeBooking: 24, refundPercentage: 100, isNonRefundable: false },
      { name: 'Partial Refund', hoursBeforeBooking: 12, refundPercentage: 50, isNonRefundable: false },
      { name: 'No Refund', hoursBeforeBooking: 0, refundPercentage: 0, isNonRefundable: true },
    ],
  });

  // Organizations State
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [orgForm, setOrgForm] = useState({
    name: '',
    code: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: { street: '', city: '', state: '', postalCode: '', country: 'Malaysia' },
    website: '',
  });

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    company: '',
    role: 'user',
  });

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

  const fetchPendingApprovals = async () => {
    try {
      setApprovalsLoading(true);
      const response = await axios.get(
        `${API_URL}/bookings/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setPendingApprovals(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
    } finally {
      setApprovalsLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      const response = await axios.post(
        `${API_URL}/bookings/${bookingId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setPendingApprovals(prev => prev.filter(b => b._id !== bookingId));
      }
    } catch (err) {
      console.error('Error approving booking:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId: string, reason: string) => {
    try {
      setProcessingId(bookingId);
      const response = await axios.post(
        `${API_URL}/bookings/${bookingId}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setPendingApprovals(prev => prev.filter(b => b._id !== bookingId));
      }
    } catch (err) {
      console.error('Error rejecting booking:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Fetch parking lots
  const fetchParkingLots = async () => {
    setLotsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/parking/admin/lots`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setParkingLots(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching parking lots:', err);
    } finally {
      setLotsLoading(false);
    }
  };

  // Create/Update parking lot
  const handleSaveLot = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingLot) {
        await axios.put(`${API_URL}/parking/lots/${editingLot._id}`, lotForm, config);
        toast.success('Parking lot updated successfully');
      } else {
        await axios.post(`${API_URL}/parking/lots`, lotForm, config);
        toast.success('Parking lot created successfully');
      }
      setShowLotModal(false);
      setEditingLot(null);
      setLotForm({
        name: '', address: '', coordinates: { lat: 3.1427, lng: 101.7032 },
        totalSpots: 50, hourlyRate: 5, dailyRate: 50, monthlyRate: 500,
        amenities: [], requireApproval: false, description: '', image: '',
      });
      fetchParkingLots();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save parking lot');
    }
  };

  // Delete parking lot
  const handleDeleteLot = async (lotId: string) => {
    if (!confirm('Are you sure you want to delete this parking lot?')) return;
    try {
      await axios.delete(`${API_URL}/parking/lots/${lotId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Parking lot deleted successfully');
      fetchParkingLots();
    } catch (err) {
      toast.error('Failed to delete parking lot');
    }
  };

  // Fetch refund policies
  const fetchRefundPolicies = async () => {
    setPoliciesLoading(true);
    try {
      const response = await axios.get(`${API_URL}/refund-policies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setRefundPolicies(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching refund policies:', err);
    } finally {
      setPoliciesLoading(false);
    }
  };

  // Create/Update refund policy
  const handleSavePolicy = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingPolicy) {
        await axios.put(`${API_URL}/refund-policies/${editingPolicy._id}`, policyForm, config);
        toast.success('Refund policy updated successfully');
      } else {
        await axios.post(`${API_URL}/refund-policies`, policyForm, config);
        toast.success('Refund policy created successfully');
      }
      setShowPolicyModal(false);
      setEditingPolicy(null);
      setPolicyForm({
        name: '', description: '', isDefault: false,
        tiers: [
          { name: 'Full Refund', hoursBeforeBooking: 24, refundPercentage: 100, isNonRefundable: false },
          { name: 'Partial Refund', hoursBeforeBooking: 12, refundPercentage: 50, isNonRefundable: false },
          { name: 'No Refund', hoursBeforeBooking: 0, refundPercentage: 0, isNonRefundable: true },
        ],
      });
      fetchRefundPolicies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save refund policy');
    }
  };

  // Fetch organizations
  const fetchOrganizations = async () => {
    setOrgsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setOrganizations(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    } finally {
      setOrgsLoading(false);
    }
  };

  // Create/Update organization
  const handleSaveOrg = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingOrg) {
        await axios.put(`${API_URL}/organizations/${editingOrg._id}`, orgForm, config);
        toast.success('Organization updated successfully');
      } else {
        await axios.post(`${API_URL}/organizations`, orgForm, config);
        toast.success('Organization created successfully');
      }
      setShowOrgModal(false);
      setEditingOrg(null);
      setOrgForm({
        name: '', code: '', description: '', contactEmail: '', contactPhone: '',
        address: { street: '', city: '', state: '', postalCode: '', country: 'Malaysia' }, website: '',
      });
      fetchOrganizations();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save organization');
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await axios.get(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Create user (admin only)
  const handleCreateUser = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_URL}/auth/register`, userForm, config);
      toast.success('User created successfully');
      setShowUserModal(false);
      setUserForm({
        firstName: '', lastName: '', email: '', password: '', phone: '', company: '', role: 'user',
      });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  // Fetch pending approvals when tab changes to approvals
  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchPendingApprovals();
    }
  }, [activeTab]);

  // Fetch data for other tabs
  useEffect(() => {
    if (activeTab === 'lots') {
      fetchParkingLots();
    } else if (activeTab === 'policies') {
      fetchRefundPolicies();
    } else if (activeTab === 'organizations') {
      fetchOrganizations();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: BarChart3 },
    { id: 'approvals' as TabType, label: 'Pending Approvals', icon: AlertCircle },
    { id: 'users' as TabType, label: 'Users', icon: Users },
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

      {/* Pending Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Pending Approvals</h2>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {pendingApprovals.length} pending
            </span>
          </div>

          {approvalsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No pending approvals</p>
              <p className="text-gray-400">All bookings have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((booking) => (
                <div key={booking._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{booking.lotId?.name || 'Parking Lot'}</h3>
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
                          Pending Approval
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {booking.lotId?.address}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(booking.date).toLocaleDateString('en-MY')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Car className="w-4 h-4" />
                          {booking.vehicleId?.licensePlate} ({booking.vehicleId?.make} {booking.vehicleId?.model})
                        </span>
                        {booking.spotId && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <MapPin className="w-4 h-4" />
                            Spot: {booking.spotId.spotNumber || booking.spotId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold text-primary-600">RM {booking.totalAmount?.toFixed(2)}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-600">{booking.userId?.firstName} {booking.userId?.lastName}</span>
                        <span className="text-gray-400">({booking.userId?.email})</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(booking._id)}
                        disabled={processingId === booking._id}
                        className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingId === booking._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) handleReject(booking._id, reason);
                        }}
                        disabled={processingId === booking._id}
                        className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Parking Lots</h3>
              <button 
                onClick={() => { setEditingLot(null); setLotForm({
                  name: '', address: '', coordinates: { lat: 3.1427, lng: 101.7032 },
                  totalSpots: 50, hourlyRate: 5, dailyRate: 50, monthlyRate: 500,
                  amenities: [], requireApproval: false, description: '', image: '',
                }); setShowLotModal(true); }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add New Lot
              </button>
            </div>
            {lotsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : parkingLots.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No parking lots found</p>
                <button 
                  onClick={() => setShowLotModal(true)}
                  className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Add your first parking lot
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parkingLots.map((lot) => (
                  <div key={lot._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{lot.name}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${lot.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {lot.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{lot.address}</p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Total Spots:</span>
                        <span className="font-medium">{lot.totalSpots}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available:</span>
                        <span className="font-medium text-green-600">{lot.availableSpots}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate:</span>
                        <span className="font-medium">RM {lot.hourlyRate?.toFixed(2)}/hr</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                      <button 
                        onClick={() => { setEditingLot(lot); setLotForm({
                          name: lot.name, address: lot.address,
                          coordinates: lot.coordinates || { lat: 3.1427, lng: 101.7032 },
                          totalSpots: lot.totalSpots, hourlyRate: lot.hourlyRate,
                          dailyRate: lot.dailyRate, monthlyRate: lot.monthlyRate,
                          amenities: lot.amenities || [], requireApproval: lot.requireApproval || false,
                          description: lot.description || '', image: lot.image || lot.images?.[0] || '',
                        }); setShowLotModal(true); }}
                        className="flex-1 text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteLot(lot._id)}
                        className="flex-1 text-sm text-red-600 hover:text-red-700 flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Parking Lot Modal */}
      {showLotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingLot ? 'Edit Parking Lot' : 'Add New Parking Lot'}
                </h2>
                <button onClick={() => setShowLotModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={lotForm.name}
                    onChange={(e) => setLotForm({ ...lotForm, name: e.target.value })}
                    className="input"
                    placeholder="e.g., KL Central Parking"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={lotForm.address}
                    onChange={(e) => setLotForm({ ...lotForm, address: e.target.value })}
                    className="input"
                    placeholder="e.g., Jalan Sultan, Kuala Lumpur"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={lotForm.coordinates.lat}
                      onChange={(e) => setLotForm({ ...lotForm, coordinates: { ...lotForm.coordinates, lat: parseFloat(e.target.value) } })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={lotForm.coordinates.lng}
                      onChange={(e) => setLotForm({ ...lotForm, coordinates: { ...lotForm.coordinates, lng: parseFloat(e.target.value) } })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Spots</label>
                    <input
                      type="number"
                      min="1"
                      value={lotForm.totalSpots}
                      onChange={(e) => setLotForm({ ...lotForm, totalSpots: parseInt(e.target.value) })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (RM)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={lotForm.hourlyRate}
                      onChange={(e) => setLotForm({ ...lotForm, hourlyRate: parseFloat(e.target.value) })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (RM)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={lotForm.dailyRate}
                      onChange={(e) => setLotForm({ ...lotForm, dailyRate: parseFloat(e.target.value) })}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rate (RM)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={lotForm.monthlyRate}
                    onChange={(e) => setLotForm({ ...lotForm, monthlyRate: parseFloat(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={lotForm.description}
                    onChange={(e) => setLotForm({ ...lotForm, description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Optional description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={lotForm.image}
                    onChange={(e) => setLotForm({ ...lotForm, image: e.target.value })}
                    className="input"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter a URL for the parking lot image</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requireApproval"
                    checked={lotForm.requireApproval}
                    onChange={(e) => setLotForm({ ...lotForm, requireApproval: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <label htmlFor="requireApproval" className="text-sm text-gray-700">
                    Require admin approval for bookings
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowLotModal(false)} 
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveLot}
                    disabled={!lotForm.name || !lotForm.address}
                    className="flex-1 btn-primary"
                  >
                    {editingLot ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Refund Policies</h3>
              <button 
                onClick={() => { setEditingPolicy(null); setPolicyForm({
                  name: '', description: '', isDefault: false,
                  tiers: [
                    { name: 'Full Refund', hoursBeforeBooking: 24, refundPercentage: 100, isNonRefundable: false },
                    { name: 'Partial Refund', hoursBeforeBooking: 12, refundPercentage: 50, isNonRefundable: false },
                    { name: 'No Refund', hoursBeforeBooking: 0, refundPercentage: 0, isNonRefundable: true },
                  ],
                }); setShowPolicyModal(true); }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Policy
              </button>
            </div>
            {policiesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : refundPolicies.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No refund policies found</p>
                <button 
                  onClick={() => setShowPolicyModal(true)}
                  className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Create your first policy
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {refundPolicies.map((policy) => (
                  <div key={policy._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{policy.name}</h4>
                        <p className="text-sm text-gray-500">{policy.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {policy.isDefault && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Default
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${policy.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {policy.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {policy.tiers?.map((tier: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-gray-600">
                          <span>{tier.refundPercentage}% refund</span>
                          <span className="text-gray-900">
                            {tier.isNonRefundable ? 'No refund' : `${tier.hoursBeforeBooking}+ hours before`}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                      <button 
                        onClick={() => { setEditingPolicy(policy); setPolicyForm({
                          name: policy.name, description: policy.description || '',
                          isDefault: policy.isDefault,
                          tiers: policy.tiers || [],
                        }); setShowPolicyModal(true); }}
                        className="flex-1 text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refund Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPolicy ? 'Edit Refund Policy' : 'Create Refund Policy'}
                </h2>
                <button onClick={() => setShowPolicyModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Policy Name</label>
                  <input
                    type="text"
                    value={policyForm.name}
                    onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                    className="input"
                    placeholder="e.g., Standard Refund Policy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={policyForm.description}
                    onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="Optional description..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={policyForm.isDefault}
                    onChange={(e) => setPolicyForm({ ...policyForm, isDefault: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700">
                    Set as default policy
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Refund Tiers</label>
                  {policyForm.tiers.map((tier, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => {
                          const newTiers = [...policyForm.tiers];
                          newTiers[idx].name = e.target.value;
                          setPolicyForm({ ...policyForm, tiers: newTiers });
                        }}
                        className="input text-sm"
                        placeholder="Tier name"
                      />
                      <input
                        type="number"
                        value={tier.hoursBeforeBooking}
                        onChange={(e) => {
                          const newTiers = [...policyForm.tiers];
                          newTiers[idx].hoursBeforeBooking = parseInt(e.target.value);
                          setPolicyForm({ ...policyForm, tiers: newTiers });
                        }}
                        className="input text-sm"
                        placeholder="Hours"
                        min="0"
                      />
                      <input
                        type="number"
                        value={tier.refundPercentage}
                        onChange={(e) => {
                          const newTiers = [...policyForm.tiers];
                          newTiers[idx].refundPercentage = parseInt(e.target.value);
                          setPolicyForm({ ...policyForm, tiers: newTiers });
                        }}
                        className="input text-sm"
                        placeholder="%"
                        min="0"
                        max="100"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowPolicyModal(false)} 
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSavePolicy}
                    disabled={!policyForm.name || policyForm.tiers.length === 0}
                    className="flex-1 btn-primary"
                  >
                    {editingPolicy ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Organizations Tab */}
      {activeTab === 'organizations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Organizations</h3>
              <button 
                onClick={() => { setEditingOrg(null); setOrgForm({
                  name: '', code: '', description: '', contactEmail: '', contactPhone: '',
                  address: { street: '', city: '', state: '', postalCode: '', country: 'Malaysia' }, website: '',
                }); setShowOrgModal(true); }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Organization
              </button>
            </div>
            {orgsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No organizations found</p>
                <button 
                  onClick={() => setShowOrgModal(true)}
                  className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Add your first organization
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div key={org._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{org.name}</h4>
                        <p className="text-sm text-gray-500">{org.code}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${org.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {org.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Plan</p>
                        <p className="font-medium capitalize">{org.subscription?.plan || 'Free'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-medium capitalize">{org.subscription?.status || 'Active'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Contact</p>
                        <p className="font-medium">{org.contactEmail || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                      <button 
                        onClick={() => { setEditingOrg(org); setOrgForm({
                          name: org.name, code: org.code, description: org.description || '',
                          contactEmail: org.contactEmail || '', contactPhone: org.contactPhone || '',
                          address: org.address || { street: '', city: '', state: '', postalCode: '', country: 'Malaysia' },
                          website: org.website || '',
                        }); setShowOrgModal(true); }}
                        className="flex-1 text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Organization Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingOrg ? 'Edit Organization' : 'Add Organization'}
                </h2>
                <button onClick={() => setShowOrgModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                    <input
                      type="text"
                      value={orgForm.name}
                      onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                      className="input"
                      placeholder="e.g., ParkMate Parking"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Code</label>
                    <input
                      type="text"
                      value={orgForm.code}
                      onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value.toUpperCase() })}
                      className="input"
                      placeholder="e.g., KILOCAR"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={orgForm.description}
                    onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="Optional description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={orgForm.contactEmail}
                      onChange={(e) => setOrgForm({ ...orgForm, contactEmail: e.target.value })}
                      className="input"
                      placeholder="contact@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={orgForm.contactPhone}
                      onChange={(e) => setOrgForm({ ...orgForm, contactPhone: e.target.value })}
                      className="input"
                      placeholder="+60 123 456 789"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={orgForm.website}
                    onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                    className="input"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={orgForm.address.street}
                    onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, street: e.target.value } })}
                    className="input"
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={orgForm.address.city}
                      onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, city: e.target.value } })}
                      className="input"
                      placeholder="Kuala Lumpur"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={orgForm.address.state}
                      onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, state: e.target.value } })}
                      className="input"
                      placeholder="Selangor"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={orgForm.address.postalCode}
                      onChange={(e) => setOrgForm({ ...orgForm, address: { ...orgForm.address, postalCode: e.target.value } })}
                      className="input"
                      placeholder="50000"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowOrgModal(false)} 
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveOrg}
                    disabled={!orgForm.name || !orgForm.code || !orgForm.contactEmail}
                    className="flex-1 btn-primary"
                  >
                    {editingOrg ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Users</h3>
              <button 
                onClick={() => { setUserForm({
                  firstName: '', lastName: '', email: '', password: '', phone: '', company: '', role: 'user',
                }); setShowUserModal(true); }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>
            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
                <button 
                  onClick={() => setShowUserModal(true)}
                  className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Add your first user
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Company</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-gray-100">
                        <td className="py-3 px-4">{user.firstName} {user.lastName}</td>
                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{user.company || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={userForm.firstName}
                      onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                      className="input"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={userForm.lastName}
                      onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                      className="input"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="input"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="input"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="input"
                    placeholder="+60 123 456 789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={userForm.company}
                    onChange={(e) => setUserForm({ ...userForm, company: e.target.value })}
                    className="input"
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="input"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowUserModal(false)} 
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateUser}
                    disabled={!userForm.firstName || !userForm.lastName || !userForm.email || !userForm.password}
                    className="flex-1 btn-primary"
                  >
                    Create User
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
