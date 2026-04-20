// src/pages/shared/Profile.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Save, Loader2, Edit3, Shield, CheckCircle, AlertCircle } from 'lucide-react';

// Helper Components
const SkeletonField = () => (
  <div className="animate-pulse space-y-2">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
  </div>
);

const Tooltip = ({ children, text }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
      {text}
    </div>
  </div>
);

export default function Profile() {
  const { user, setUser, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      contact: user?.contact || '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const updated = await authService.updateProfile(data);
      setUser(updated);
      reset(data);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    reset({
      full_name: user?.full_name || '',
      email: user?.email || '',
      contact: user?.contact || '',
    });
    setIsEditing(false);
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
        <div className="text-center sm:text-left">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden p-5 sm:p-7">
          <div className="space-y-5">
            <SkeletonField />
            <SkeletonField />
            <SkeletonField />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      {/* Header with gradient */}
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
          Profile
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-2">
          Manage your personal information and account details
        </p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="p-5 sm:p-7">
          {/* Section header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <User size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  Personal Information
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update your profile details
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit3 size={16} />
                Edit Profile
              </button>
            )}
          </div>

          {!isEditing ? (
            // Display mode
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <User size={18} className="text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{user?.full_name || '—'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <Mail size={18} className="text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{user?.email || '—'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Number
                  </label>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <Phone size={18} className="text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{user?.contact || 'Not provided'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <Shield size={18} className="text-gray-400" />
                    <span className="capitalize text-gray-900 dark:text-white">{user?.role || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Edit mode form
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    {...register('full_name', { required: 'Full name is required' })}
                    className={`w-full rounded-xl border ${
                      errors.full_name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-gray-50 dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition`}
                    placeholder="John Doe"
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.full_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/,
                          message: 'Invalid email address',
                        },
                      })}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                        errors.email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition`}
                      placeholder="user@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...register('contact')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex justify-center rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <Tooltip text={!isDirty ? 'No changes to save' : 'Save your changes'}>
                  <button
                    type="submit"
                    disabled={isSubmitting || !isDirty}
                    className="inline-flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save Changes
                  </button>
                </Tooltip>
              </div>
            </form>
          )}
        </div>
      </motion.div>

      {/* Optional: Additional sections like account security hint */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Account Security</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Need to change your password? Visit the <button onClick={() => window.location.href = '/settings'} className="underline font-semibold">Security Settings</button> page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}