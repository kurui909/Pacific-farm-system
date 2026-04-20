import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Mail,
  User,
  Lock,
  Shield,
} from 'lucide-react';
import { authService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function UserFormModal({ isOpen, onClose, initialData }) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: '',
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setFocus,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm({
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role: 'supervisor',
    },
    mode: 'onChange',
  });

  const watchPassword = watch('password', '');

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(watchPassword));
  }, [watchPassword]);

  useEffect(() => {
    if (!isOpen) return;

    reset(
      initialData
        ? {
            full_name: initialData.full_name || '',
            email: initialData.email || '',
            role: initialData.role || 'supervisor',
            password: '',
          }
        : {
            full_name: '',
            email: '',
            password: '',
            role: 'supervisor',
          }
    );

    setTimeout(() => setFocus('full_name'), 100);
  }, [isOpen, initialData, reset, setFocus]);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      farm_name: currentUser?.farm?.name || currentUser?.farm_name || 'Default Farm',
    };

    if (initialData && !payload.password) {
      delete payload.password;
    }

    try {
      if (initialData) {
        await authService.updateUser(initialData.id, payload);
        toast.success('User updated successfully');
      } else {
        await authService.createUser(payload);
        toast.success('User created successfully');
      }

      queryClient.invalidateQueries(['users']);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save user'));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSubmitting ? undefined : onClose}
          />

          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {initialData ? 'Edit User' : 'Create New User'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Add user details and assign the correct role.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('full_name', { required: 'Full name is required' })}
                    className={`w-full rounded-2xl border px-3 py-3 pl-10 text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${
                      errors.full_name
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.full_name && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={14} />
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                    className={`w-full rounded-2xl border px-3 py-3 pl-10 text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={14} />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password {initialData ? '(leave blank to keep current)' : <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('password', {
                      ...(initialData ? {} : { required: 'Password is required' }),
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full rounded-2xl border px-3 py-3 pl-10 pr-10 text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${
                      errors.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    }`}
                    placeholder="Enter a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={14} />
                    {errors.password.message}
                  </p>
                )}
                {watchPassword ? (
                  <div className="mt-3 rounded-2xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Strength: {passwordStrength.label}
                      </span>
                      <span className={`text-sm font-semibold ${passwordStrength.color}`}>
                        {passwordStrength.score}/4
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Role <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    {...register('role', { required: 'Role is required' })}
                    className={`w-full appearance-none rounded-2xl border px-3 py-3 pl-10 pr-8 text-sm text-slate-900 transition focus:outline-none focus:ring-2 ${
                      errors.role
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                    }`}
                  >
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="egg_keeper">🥚 Eggstore</option>
                    <option value="feed_keeper">🌾 Feedstore</option>
                    <option value="customer">👤 Customer</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    ▼
                  </div>
                </div>
                {errors.role && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={14} />
                    {errors.role.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid || (initialData && !isDirty && !watchPassword)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : initialData ? (
                    'Save Changes'
                  ) : (
                    'Create User'
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function getPasswordStrength(password) {
  const score = Math.min(
    4,
    [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length
  );

  if (!password) {
    return { score: 0, label: 'Empty', color: 'text-slate-400' };
  }

  if (score <= 1) {
    return { score, label: 'Weak', color: 'text-red-500' };
  }
  if (score === 2) {
    return { score, label: 'Fair', color: 'text-amber-500' };
  }
  if (score === 3) {
    return { score, label: 'Good', color: 'text-blue-500' };
  }
  return { score, label: 'Strong', color: 'text-emerald-500' };
}

function getErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error.response?.data?.detail) return error.response.data.detail;
  if (error.message) return error.message;
  return fallback;
}