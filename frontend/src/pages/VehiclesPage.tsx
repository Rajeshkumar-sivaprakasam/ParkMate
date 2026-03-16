import { useState, useEffect } from 'react';
import { Plus, Car, Trash2, Edit2, Loader2, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

interface Vehicle {
  _id: string;
  licensePlate: string;
  make: string;
  model: string;
  color?: string;
  year?: number;
  isDefault: boolean;
}

export default function VehiclesPage() {
  const { token } = useAuthStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    licensePlate: '',
    make: '',
    model: '',
    color: '',
    year: '',
    isDefault: false,
  });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchVehicles();
  }, [token]);

  const fetchVehicles = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      
      if (result.success) {
        setVehicles(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    try {
      const url = editingVehicle 
        ? `${API_URL}/vehicles/${editingVehicle._id}`
        : `${API_URL}/vehicles`;
      
      const method = editingVehicle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          year: formData.year ? parseInt(formData.year) : undefined,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(editingVehicle ? 'Vehicle updated' : 'Vehicle added');
        fetchVehicles();
        resetForm();
      } else {
        toast.error(result.message || 'Failed to save vehicle');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error('Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    
    try {
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success('Vehicle deleted');
        fetchVehicles();
      } else {
        toast.error(result.message || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error('Failed to delete vehicle');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      licensePlate: vehicle.licensePlate,
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color || '',
      year: vehicle.year?.toString() || '',
      isDefault: vehicle.isDefault,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
    setFormData({
      licensePlate: '',
      make: '',
      model: '',
      color: '',
      year: '',
      isDefault: false,
    });
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
        <h1 className="text-2xl font-bold text-gray-900">My Vehicles</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="card text-center py-12">
          <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No vehicles added yet</p>
          <p className="text-gray-400">Add your vehicle to start booking parking</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <div key={vehicle._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Car className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{vehicle.licensePlate}</h3>
                    <p className="text-sm text-gray-500">
                      {vehicle.make} {vehicle.model}
                    </p>
                  </div>
                </div>
                {vehicle.isDefault && (
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                    Default
                  </span>
                )}
              </div>
              
              {(vehicle.color || vehicle.year) && (
                <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                  {vehicle.color && <p>Color: {vehicle.color}</p>}
                  {vehicle.year && <p>Year: {vehicle.year}</p>}
                </div>
              )}
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="flex-1 btn-secondary flex items-center justify-center space-x-1 py-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(vehicle._id)}
                  className="btn-danger py-2 px-3"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Vehicle Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plate Number *
                  </label>
                  <input
                    type="text"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                    className="input"
                    placeholder="ABC 1234"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Make *
                    </label>
                    <input
                      type="text"
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      className="input"
                      placeholder="Toyota"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model *
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="input"
                      placeholder="Camry"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="input"
                      placeholder="Silver"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="input"
                      placeholder="2024"
                      min="1900"
                      max="2030"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isDefault" className="ml-2 text-sm text-gray-600">
                    Set as default vehicle
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 btn-primary">
                    {saving ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </span>
                    ) : (
                      editingVehicle ? 'Update Vehicle' : 'Add Vehicle'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
