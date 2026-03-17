import { useState, useEffect } from 'react';
import { anomalyApi, Anomaly, AnomalyStats } from '../api';
import { useAuthStore } from '../stores/authStore';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle,
  Eye,
  Filter,
  RefreshCw,
  AlertOctagon,
  Clock,
  User
} from 'lucide-react';

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  investigating: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  false_positive: 'bg-gray-100 text-gray-500',
};

const typeLabels: Record<string, string> = {
  failed_login: 'Failed Login',
  multiple_login: 'Multiple Login',
  rapid_booking: 'Rapid Booking',
  unusual_booking_pattern: 'Unusual Booking',
  suspicious_location: 'Suspicious Location',
  payment_anomaly: 'Payment Anomaly',
  high_value_booking: 'High Value Booking',
  repeated_cancellation: 'Repeated Cancellation',
  account_takeover: 'Account Takeover',
  ip_mismatch: 'IP Mismatch',
};

export default function AnomalyDashboard() {
  const { user } = useAuthStore();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [stats, setStats] = useState<AnomalyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [resolving, setResolving] = useState(false);

  // Check if user is admin
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadAnomalies();
    loadStats();
  }, [page, filterSeverity, filterStatus]);

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      
      const response = await anomalyApi.getAnomalies(params);
      setAnomalies(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Failed to load anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await anomalyApi.getAnomalyStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleResolve = async () => {
    if (!selectedAnomaly || !resolutionText.trim()) return;
    
    setResolving(true);
    try {
      await anomalyApi.resolveAnomaly(selectedAnomaly._id, resolutionText);
      setSelectedAnomaly(null);
      setResolutionText('');
      loadAnomalies();
      loadStats();
    } catch (error) {
      console.error('Failed to resolve anomaly:', error);
    } finally {
      setResolving(false);
    }
  };

  const handleMarkFalsePositive = async () => {
    if (!selectedAnomaly || !resolutionText.trim()) return;
    
    setResolving(true);
    try {
      await anomalyApi.markAsFalsePositive(selectedAnomaly._id, resolutionText);
      setSelectedAnomaly(null);
      setResolutionText('');
      loadAnomalies();
      loadStats();
    } catch (error) {
      console.error('Failed to mark as false positive:', error);
    } finally {
      setResolving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Anomaly Detection</h1>
        </div>
        <button
          onClick={() => { loadAnomalies(); loadStats(); }}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Anomalies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticalCount}</p>
              </div>
              <AlertOctagon className="w-8 h-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Severity</p>
                <p className="text-2xl font-bold text-orange-600">{stats.bySeverity.high || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : anomalies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p>No anomalies found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detected</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {anomalies.map((anomaly) => (
                  <tr key={anomaly._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[anomaly.severity]}`}>
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeLabels[anomaly.type] || anomaly.type}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {anomaly.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[anomaly.status]}`}>
                        {anomaly.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(anomaly.detectedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedAnomaly(anomaly)}
                        className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Anomaly Details</h2>
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${severityColors[selectedAnomaly.severity]}`}>
                    {selectedAnomaly.severity.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[selectedAnomaly.status]}`}>
                    {selectedAnomaly.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-gray-900">{typeLabels[selectedAnomaly.type] || selectedAnomaly.type}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-900">{selectedAnomaly.description}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Details</label>
                  <div className="mt-1 bg-gray-50 rounded-lg p-3 text-sm">
                    {selectedAnomaly.details.ipAddress && (
                      <p><span className="font-medium">IP:</span> {selectedAnomaly.details.ipAddress}</p>
                    )}
                    {selectedAnomaly.details.actualValue && (
                      <p><span className="font-medium">Value:</span> {selectedAnomaly.details.actualValue}</p>
                    )}
                    {selectedAnomaly.details.threshold && (
                      <p><span className="font-medium">Threshold:</span> {selectedAnomaly.details.threshold}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Detected At</label>
                  <p className="text-gray-900">{formatDate(selectedAnomaly.detectedAt)}</p>
                </div>
                
                {selectedAnomaly.status === 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Notes</label>
                    <textarea
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="Enter resolution notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                    
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={handleResolve}
                        disabled={!resolutionText.trim() || resolving}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Resolve</span>
                      </button>
                      <button
                        onClick={handleMarkFalsePositive}
                        disabled={!resolutionText.trim() || resolving}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>False Positive</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedAnomaly.status === 'resolved' && selectedAnomaly.resolution && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resolution</label>
                    <p className="text-gray-900">{selectedAnomaly.resolution}</p>
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
