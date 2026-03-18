import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, Lock, Save, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';
import axios from 'axios';
import { RJButton, RJInput, RJModal, RJModalHeader, RJModalBody, RJModalFooter } from '@/components/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  role: string;
}

export default function ProfilePage() {
  const { token, user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    role: 'user',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        const userData = response.data.data;
        setProfile({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          company: userData.company || '',
          role: userData.role || 'user',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Use data from auth store if API fails
      if (user) {
        setProfile({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: (user as any).phone || '',
          company: (user as any).company || '',
          role: user.role || 'user',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await axios.put(
        `${API_URL}/auth/profile`,
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          company: profile.company,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success('Profile updated successfully');
        // Update auth store
        if (updateUser && response.data.data) {
          updateUser(response.data.data);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const response = await axios.post(
        `${API_URL}/auth/change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success('Password changed successfully');
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Management</h1>
          <p className="text-gray-500">Manage your account settings</p>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            <p className="text-sm text-gray-500">Update your personal details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="input pl-10"
                placeholder="John"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="input pl-10"
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={profile.email}
                disabled
                className="input pl-10 bg-gray-50 cursor-not-allowed"
                placeholder="john@example.com"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="input pl-10"
                placeholder="+60 123 456 789"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                className="input pl-10"
                placeholder="Acme Inc."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={profile.role}
                disabled
                className="input pl-10 bg-gray-50 cursor-not-allowed capitalize"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <RJButton
            variant="primary"
            onClick={handleSaveProfile}
            loading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </RJButton>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            <p className="text-sm text-gray-500">Manage your password and security settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Password</h3>
              <p className="text-sm text-gray-500">Change your account password</p>
            </div>
            <RJButton
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordModal(true)}
            >
              Change Password
            </RJButton>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <RJModal
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <RJModalBody>
          <div className="space-y-4">
            <RJInput
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="Enter current password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              rightAddon={
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />
            <RJInput
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              rightAddon={
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />
            <RJInput
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            />
          </div>
        </RJModalBody>
        <RJModalFooter>
          <RJButton variant="outline" onClick={() => setShowPasswordModal(false)}>
            Cancel
          </RJButton>
          <RJButton
            variant="primary"
            onClick={handleChangePassword}
            loading={saving}
            disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
          >
            Change Password
          </RJButton>
        </RJModalFooter>
      </RJModal>
    </div>
  );
}
