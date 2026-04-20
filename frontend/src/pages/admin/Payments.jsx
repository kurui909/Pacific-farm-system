// src/pages/admin/Payments.jsx
import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  useId,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import {
  CreditCard,
  Smartphone,
  Globe,
  CheckCircle,
  Users,
  Loader2,
  Calendar,
} from 'lucide-react';

import { paymentsService } from '../../services/api';
import { formatApiError } from '../../utils/formatters';

// ----------------------------------------------------------------------
// Constants (static, never recreated)
// ----------------------------------------------------------------------
const paymentMethods = [
  {
    id: 'card',
    name: 'Credit / Debit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, Amex',
    color: 'bg-blue-500',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: Globe,
    description: 'Secure online payments',
    color: 'bg-indigo-500',
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    icon: Smartphone,
    description: 'Mobile money (Kenya)',
    color: 'bg-green-500',
  },
  {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    icon: Smartphone,
    description: 'MTN MoMo',
    color: 'bg-yellow-500',
  },
];

const plans = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    price: 0,
    period: '30 days',
    features: [
      'Full access',
      'Unlimited production entries',
      'Basic reports',
      'Single user',
    ],
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    period: 'month',
    features: [
      'Everything in Free',
      'Advanced analytics',
      '5 supervisor accounts',
      'Email support',
    ],
    popular: true,
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 79,
    period: 'month',
    features: [
      'Everything in Basic',
      'Unlimited supervisors',
      'Priority support',
      'API access',
      'Team collaboration',
    ],
    popular: false,
  },
  {
    id: 'group',
    name: 'Group / Cooperative',
    price: 149,
    period: 'month',
    features: [
      'Multiple farms',
      'Centralized dashboard',
      'Bulk data export',
      'Dedicated account manager',
    ],
    popular: false,
  },
];

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function Payments() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // --- State ---
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(plans[0]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortRef = useRef(null);

  // --- Derived values (memoized) ---
  const isSubscribed = useMemo(() => subscription?.is_active, [subscription]);
  const trialAvailable = useMemo(
    () => !isSubscribed && subscription?.trial_available !== false,
    [isSubscribed, subscription]
  );
  const currentPlan = useMemo(
    () => (subscription?.plan ? plans.find((plan) => plan.id === subscription.plan) : null),
    [subscription]
  );

  // --- API fetch with abort support ---
  const fetchSubscription = useCallback(async (silent = false) => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) setLoading(true);
    try {
      const data = await paymentsService.getSubscriptionStatus({ signal: controller.signal });
      setSubscription(data);
      return data;
    } catch (error) {
      if (error.name !== 'AbortError' && !silent) {
        toast.error('Unable to load subscription status.');
      }
      return null;
    } finally {
      if (!controller.signal.aborted && !silent) setLoading(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  // --- Redirect if already subscribed ---
  useEffect(() => {
    if (!loading && isSubscribed) {
      navigate('/dashboard', { replace: true });
    }
  }, [isSubscribed, loading, navigate]);

  // --- Handle return from external payment gateways ---
  useEffect(() => {
    const success = searchParams.get('payment_success') === 'true';
    const sessionId = searchParams.get('session_id');
    if (success || sessionId) {
      toast.loading('Verifying payment...', { id: 'payment-verify' });
      fetchSubscription(true).then((fresh) => {
        if (fresh?.is_active) {
          toast.success('Subscription activated!', { id: 'payment-verify' });
          navigate('/payments', { replace: true });
        } else {
          toast.error('Payment verification failed. Please contact support.', { id: 'payment-verify' });
        }
      });
    }
  }, [searchParams, fetchSubscription, navigate]);

  // --- Initial load ---
  useEffect(() => {
    fetchSubscription();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchSubscription]);

  // --- Free trial handler (with polling for active status) ---
  const handleFreeTrial = useCallback(async () => {
    if (!trialAvailable) {
      toast.error('Free trial is not available.');
      return;
    }
    setIsProcessing(true);
    try {
      await paymentsService.startFreeTrial();
      // Poll until subscription becomes active (max 5 attempts, 500ms interval)
      let fresh = await fetchSubscription(true);
      let retries = 0;
      while (!fresh?.is_active && retries < 5) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        fresh = await fetchSubscription(true);
        retries++;
      }
      if (fresh?.is_active) {
        toast.success('Free trial activated! Redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      } else {
        toast.error('Trial started but not active yet. Please refresh the page.');
      }
    } catch (error) {
      toast.error(formatApiError(error, 'Could not start free trial.'));
    } finally {
      setIsProcessing(false);
    }
  }, [trialAvailable, fetchSubscription, navigate]);

  // --- Plan selection ---
  const handlePlanSelection = useCallback(
    (plan) => {
      if (plan.id === 'free_trial') {
        handleFreeTrial();
        return;
      }
      setSelectedPlan(plan);
      setShowBillingForm(true);
    },
    [handleFreeTrial]
  );

  // --- Checkout submission ---
  const handleCheckout = useCallback(
    async (event) => {
      event.preventDefault();
      setIsProcessing(true);
      try {
        const payload = {
          plan_id: selectedPlan.id,
          payment_method: selectedPaymentMethod,
        };
        const response = await paymentsService.createCheckout(payload);
        const redirectUrl =
          response.url || response.redirect_url || response.checkout_url || response.session?.url;

        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
        toast.success('Checkout session created. Please complete payment.');
        setShowBillingForm(false);
        await fetchSubscription();
      } catch (error) {
        toast.error(formatApiError(error, 'Unable to create checkout session.'));
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedPlan, selectedPaymentMethod, fetchSubscription]
  );

  // --- Skeleton loader ---
  if (loading) {
    return <PaymentsSkeleton />;
  }

  // --- Main render ---
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            Subscription & Payments
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your plan, billing, and subscription access in one place.
          </p>
        </div>
      </div>

      {/* Active subscription banner */}
      {isSubscribed && currentPlan && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  Active Subscription
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  You are on the <strong>{currentPlan.name}</strong> plan.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-secondary px-5"
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                onClick={() => fetchSubscription()}
                className="btn-primary px-5"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Free trial banner */}
      {!isSubscribed && trialAvailable && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Start your 30-day free trial
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                No credit card required. You can upgrade anytime.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFreeTrial}
            disabled={isProcessing}
            className="btn-primary whitespace-nowrap"
          >
            {isProcessing && <Loader2 className="animate-spin mr-2" size={16} />}
            Start Free Trial
          </button>
        </div>
      )}

      {/* Plans grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Choose Your Plan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-3xl border p-5 transition-all duration-200 ${
                  plan.popular ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="rounded-full bg-blue-500 text-white px-3 py-1 text-xs inline-flex mb-4">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/{plan.period}</span>
                </div>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle size={14} className="text-green-500 mt-1" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handlePlanSelection(plan)}
                  disabled={
                    isCurrentPlan ||
                    (plan.id === 'free_trial' && !trialAvailable) ||
                    isProcessing
                  }
                  className={`mt-6 w-full rounded-xl px-4 py-3 font-medium transition-colors ${
                    isCurrentPlan
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCurrentPlan
                    ? 'Current Plan'
                    : plan.id === 'free_trial'
                    ? 'Start Trial'
                    : 'Subscribe'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Group / Cooperative banner */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-purple-600 dark:text-purple-400" size={20} />
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                Group / Cooperative Plans
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Need support for more than one farm? Talk to our sales team for custom pricing and onboarding.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-purple-700 dark:text-purple-300 font-medium text-sm hover:text-purple-800 dark:hover:text-purple-100"
          >
            Contact Sales →
          </button>
        </div>
      </div>

      {/* Billing Modal */}
      {showBillingForm && (
        <BillingModal
          plan={selectedPlan}
          paymentMethods={paymentMethods}
          selectedMethod={selectedPaymentMethod}
          onMethodChange={setSelectedPaymentMethod}
          onClose={() => setShowBillingForm(false)}
          onSubmit={handleCheckout}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Billing Modal Component (modernized with accessibility)
// ----------------------------------------------------------------------
function BillingModal({
  plan,
  paymentMethods,
  selectedMethod,
  onMethodChange,
  onClose,
  onSubmit,
  isProcessing,
}) {
  const phoneInputId = useId();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl">
        <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Complete Payment - {plan.name} Plan
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ${plan.price}/{plan.period}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6 p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Payment Method
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedMethod === method.id}
                    onChange={() => onMethodChange(method.id)}
                    className="sr-only"
                  />
                  <div className={`rounded-full p-2 text-white ${method.color}`}>
                    <method.icon size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{method.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{method.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {(selectedMethod === 'mpesa' || selectedMethod === 'mtn_momo') && (
            <div>
              <label htmlFor={phoneInputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                id={phoneInputId}
                type="tel"
                placeholder="e.g. +254712345678"
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100"
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                You will receive a payment prompt on your phone.
              </p>
            </div>
          )}

          <div className="rounded-3xl bg-gray-50 dark:bg-gray-950 p-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Plan</span>
              <span>{plan.name}</span>
            </div>
            <div className="mt-3 flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Billing</span>
              <span>{plan.period}</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-gray-200 dark:border-gray-800 pt-4 font-semibold text-gray-900 dark:text-gray-100">
              <span>Total</span>
              <span>${plan.price}</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary rounded-2xl px-5 py-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary rounded-2xl px-5 py-3"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 inline-block animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Skeleton Component (unchanged)
// ----------------------------------------------------------------------
function PaymentsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="h-9 w-1/2 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
      <div className="h-28 rounded-3xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-3xl bg-gray-100 p-5 shadow-sm animate-pulse dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  );
}