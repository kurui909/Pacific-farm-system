// src/pages/auth/ForgotPassword.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, Loader2, CheckCircle, Shield } from 'lucide-react';

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ mode: 'onBlur' });

  const onSubmit = async (data) => {
    try {
      await authService.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch (error) {
      toast.error('Unable to send reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl ring-1 ring-slate-200">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900">Forgot Password</h1>
          <p className="mt-2 text-sm text-slate-500">Enter your email and we’ll send a reset link.</p>
        </div>

        {submitted ? (
          <div className="space-y-6">
            <div className="rounded-3xl bg-green-50 p-6 text-center">
              <CheckCircle className="mx-auto mb-4 text-green-600" size={34} />
              <h2 className="text-xl font-semibold text-slate-900">Check your inbox</h2>
              <p className="mt-2 text-sm text-slate-600">
                A password reset link was sent to <strong>{submittedEmail}</strong>.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Didn’t receive the email? Check spam or click resend.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Send Again
              </button>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address',
                    },
                  })}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="inline-block animate-spin" size={18} /> : 'Send reset link'}
            </button>
          </form>
        )}

        <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <span>Secure email delivery</span>
          <span className="inline-flex items-center gap-1">
            <Shield size={12} /> SSL secured
          </span>
        </div>
      </div>
    </div>
  );
}