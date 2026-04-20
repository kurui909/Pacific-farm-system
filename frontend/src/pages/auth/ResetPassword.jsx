// src/pages/auth/ResetPassword.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Lock, Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';

const getErrorMessage = (error, fallback = 'Failed to reset password') => {
  const detail = error?.response?.data?.detail;
  if (!detail) return error?.message || fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail))
    return detail.map((item) => (typeof item === 'string' ? item : item?.msg || JSON.stringify(item))).join(' ');
  return detail?.msg || JSON.stringify(detail);
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({ mode: 'onBlur' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const password = watch('new_password');

  const onSubmit = async (data) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await authService.resetPassword(token, data.new_password);
      setIsSuccess(true);
      toast.success('Password reset successfully');
      setTimeout(() => navigate('/login'), 2500);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to reset password'));
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <AlertCircle size={32} className="mx-auto mb-4 text-red-600" />
          <h2 className="text-2xl font-semibold text-slate-900">Invalid reset link</h2>
          <p className="mt-2 text-sm text-slate-600">This reset link is invalid or expired. Request a new password reset below.</p>
          <Link to="/forgot-password" className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <CheckCircle size={32} className="mx-auto mb-4 text-green-600" />
          <h2 className="text-2xl font-semibold text-slate-900">Password reset complete</h2>
          <p className="mt-2 text-sm text-slate-600">Your password has been updated successfully. Redirecting to login...</p>
          <Link to="/login" className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-blue-700">Reset Password</h1>
          <p className="mt-2 text-sm text-slate-600">Enter a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="new_password" className="mb-2 block text-sm font-medium text-slate-700">
              New Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="new_password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('new_password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.new_password && <p className="mt-2 text-sm text-red-600">{errors.new_password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirm_password" className="mb-2 block text-sm font-medium text-slate-700">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="confirm_password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: (value) => value === password || 'Passwords do not match',
                })}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirm_password && <p className="mt-2 text-sm text-red-600">{errors.confirm_password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="inline-block animate-spin" size={18} /> : 'Reset password'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <span>Secure password reset</span>
          <span className="inline-flex items-center gap-1">
            <Shield size={12} /> SSL protected
          </span>
        </div>
      </div>
    </div>
  );
}