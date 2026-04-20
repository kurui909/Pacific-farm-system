import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Bell,
  ShieldAlert,
  Sparkles,
  XCircle,
  CheckCircle2,
  Clock3,
} from 'lucide-react';

const initialAlerts = [
  {
    id: 1,
    title: 'Water level low in pen 3',
    description: 'Automatic reminder: check the water tanks and refill as needed.',
    variant: 'warning',
    timestamp: 'Just now',
    read: false,
  },
  {
    id: 2,
    title: 'New shipment of feed available',
    description: 'Feed delivery arrives today at 10:30am. Confirm storage space.',
    variant: 'info',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: 3,
    title: 'Subscription plan expiring soon',
    description: 'Your plan will expire in 5 days. Renew now to avoid downtime.',
    variant: 'danger',
    timestamp: 'Yesterday',
    read: true,
  },
];

const variantStyles = {
  info: 'border-blue-200/70 bg-blue-50 text-blue-700 dark:border-blue-800/70 dark:bg-blue-950 dark:text-blue-200',
  warning: 'border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950 dark:text-amber-200',
  danger: 'border-rose-200/70 bg-rose-50 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950 dark:text-rose-200',
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [showResolved, setShowResolved] = useState(false);

  const resolvedCount = alerts.filter((alert) => alert.read).length;
  const unreadCount = alerts.length - resolvedCount;

  const visibleAlerts = useMemo(
    () =>
      showResolved ? alerts : alerts.filter((alert) => !alert.read),
    [alerts, showResolved]
  );

  const handleMarkRead = (id) => {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    );
    toast.success('Alert marked read');
  };

  const handleDismissResolved = () => {
    setAlerts((current) => current.filter((alert) => !alert.read));
    toast.success('Resolved alerts dismissed');
  };

  const handleViewHistory = () => {
    toast('Viewing alert history is not yet implemented.', {
      icon: '📜',
    });
  };

  const handleSecuritySettings = () => {
    toast('Open security settings from the dashboard menu.', {
      icon: '🔒',
    });
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-black/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20">
              <Bell size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Alerts
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Review the latest system notifications and resolve issues quickly.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSecuritySettings}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            <ShieldAlert size={16} />
            Security Settings
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-black/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Active Alerts
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                  {visibleAlerts.length} alert
                  {visibleAlerts.length === 1 ? '' : 's'} shown
                </h2>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Sparkles size={16} />
                {unreadCount} unread
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {visibleAlerts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300/70 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                No alerts to display. Try toggling the resolved view.
              </div>
            ) : (
              visibleAlerts.map((alert) => (
                <article
                  key={alert.id}
                  className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${variantStyles[alert.variant]}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 size={18} />
                        <span>{alert.read ? 'Resolved' : 'Pending'}</span>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {alert.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {alert.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <span className="rounded-full border border-slate-300/80 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                        {alert.timestamp}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleMarkRead(alert.id)}
                        disabled={alert.read}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {alert.read ? 'Already read' : 'Mark read'}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-black/20">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Tips
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-700/70 dark:bg-slate-900">
                Keep priority alerts visible and clear completed issues at the end of the day.
              </li>
              <li className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-700/70 dark:bg-slate-900">
                Confirm feed and water alerts first, then log any manual interventions.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40 dark:border-slate-700/80 dark:bg-slate-950 dark:shadow-black/20">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Quick actions
            </p>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => setShowResolved(false)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Show active alerts
              </button>
              <button
                type="button"
                onClick={() => setShowResolved(true)}
                className="rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Show resolved alerts
              </button>
              <button
                type="button"
                onClick={handleDismissResolved}
                disabled={resolvedCount === 0}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Dismiss all resolved alerts
              </button>
              <button
                type="button"
                onClick={handleViewHistory}
                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                View alert history
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}