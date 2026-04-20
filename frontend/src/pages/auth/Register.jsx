// src/pages/auth/Register.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Home, Shield } from 'lucide-react';
import { useGoogleAuth as useGoogleAuthOriginal } from '../../hooks/useGoogleAuth';

const getErrorMessage = (error, fallback = 'Registration failed') => {
  const detail = error?.response?.data?.detail;
  if (!detail) return error?.message || fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.msg) return item.msg;
        return JSON.stringify(item);
      })
      .join(' ');
  }
  if (typeof detail === 'object') return detail?.msg || JSON.stringify(detail);
  return String(detail);
};

const useSafeGoogleAuth = (mode) => {
  const hasGoogleConfig = process.env.REACT_APP_GOOGLE_CLIENT_ID &&
    process.env.REACT_APP_GOOGLE_CLIENT_ID !== 'mock-client-id-for-development' &&
    process.env.REACT_APP_GOOGLE_CLIENT_ID !== '';

  const googleAuth = useGoogleAuthOriginal(mode);
  return hasGoogleConfig ? googleAuth : () => toast.error('Google signup is not configured');
};

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({ mode: 'onBlur' });
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const password = watch('password');
  const googleAuth = useSafeGoogleAuth('register');

  const onSubmit = async (data) => {
    if (data.password !== data.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await authService.register(data);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Registration failed'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">🐔 SmartPoultry</h1>
          <p className="text-gray-600 mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="full_name"
                autoComplete="name"
                {...register('full_name', { required: 'Full name is required' })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="John Doe"
                aria-invalid={errors.full_name ? 'true' : 'false'}
              />
            </div>
            {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>}
          </div>

          {/* Farm Name */}
          <div>
            <label htmlFor="farm_name" className="block text-sm font-medium text-gray-700 mb-1">
              Farm Name *
            </label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="farm_name"
                autoComplete="organization"
                {...register('farm_name', { required: 'Farm name is required' })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Sunrise Poultry"
                aria-invalid={errors.farm_name ? 'true' : 'false'}
              />
            </div>
            {errors.farm_name && <p className="text-red-500 text-sm mt-1">{errors.farm_name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', { required: 'Email is required' })}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="you@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
              />
            </div>
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('password', { 
                  required: 'Password is required', 
                  minLength: { value: 6, message: 'At least 6 characters' } 
                })}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                aria-invalid={errors.confirm_password ? 'true' : 'false'}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirm_password && <p className="text-red-500 text-sm mt-1">{errors.confirm_password.message}</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={() => googleAuth()}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <GoogleIcon />
          <span className="text-sm font-medium">Sign up with Google</span>
        </button>

        {/* Sign In Link + Trust Badge */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
              Sign in
            </Link>
          </p>
          <div className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-500">
            <Shield size={12} />
            <span>SSL secured • 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}