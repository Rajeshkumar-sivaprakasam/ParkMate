import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, User, Phone, Building2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';
import axios from 'axios';
import { RJButton, RJInput } from '@/components/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        company: formData.company,
      });

      if (response.data.success) {
        toast.success('Account created successfully!');
        login(response.data.data.user, response.data.data.token);
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <Car className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">ParkMate</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create an account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <RJInput
                label="First Name"
                placeholder="John"
                leftAddon={<User className="w-5 h-5" />}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <RJInput
                label="Last Name"
                placeholder="Doe"
                leftAddon={<User className="w-5 h-5" />}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            <RJInput
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              leftAddon={<Mail className="w-5 h-5" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <RJInput
              label="Phone Number"
              type="tel"
              placeholder="+60 123 456 789"
              leftAddon={<Phone className="w-5 h-5" />}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <RJInput
              label="Company (Optional)"
              placeholder="Acme Inc."
              leftAddon={<Building2 className="w-5 h-5" />}
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />

            <RJInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftAddon={<Lock className="w-5 h-5" />}
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />

            <RJInput
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftAddon={<Lock className="w-5 h-5" />}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 text-primary-600 rounded mt-0.5"
                required
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </a>
              </label>
            </div>

            <RJButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Create Account
            </RJButton>
          </form>
        </div>
      </div>
    </div>
  );
}
