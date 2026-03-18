import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Car, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';
import { RJButton, RJInput, RJLabel } from '@/components/ui';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('Login response:', result);

      if (result.success) {
        login(result.data.user, result.data.token);
        toast.success(`Welcome back, ${result.data.user.firstName}!`);
        navigate('/');
      } else {
        toast.error(result.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Unable to connect to server. Make sure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-2">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                <Car className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">ParkMate</span>
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div className="space-y-4">
              <RJInput
                label="Email address"
                type="email"
                placeholder="you@company.com"
                leftAddon={<Mail className="h-5 w-5" />}
                error={errors.email?.message}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />

              <RJInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftAddon={<Lock className="h-5 w-5" />}
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                }
                error={errors.password?.message}
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                Forgot password?
              </Link>
            </div>

            <RJButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            >
              Sign in
            </RJButton>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Demo Credentials</span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Admin Account:</p>
                <p className="text-sm text-blue-600">admin@kilocar.com / admin123</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">User Account:</p>
                <p className="text-sm text-green-600">user@example.com / user123</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="flex items-center justify-center h-full px-12">
          <div className="text-center text-white">
            <h3 className="text-4xl font-bold mb-4">
              Smart Parking Management
            </h3>
            <p className="text-lg text-primary-100 mb-8">
              Book parking spots, manage vehicles, and track your parking history all in one place.
            </p>
            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-primary-200">Parking Lots</div>
              </div>
              <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-primary-200">Daily Bookings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
