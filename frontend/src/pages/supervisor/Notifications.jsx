// src/pages/supervisor/Notifications.jsx
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { authService, notificationService } from '../../services/api';
import { toast } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  Mail,
  Send,
  Sparkles,
  Check,
  Clock3,
  UserPlus,
  X,
} from 'lucide-react';

const formatDateLabel = (iso) => {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

const formatTimeLabel = (iso) => {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const groupNotificationsByDate = (notifications) => {
  return notifications.reduce((groups, notification) => {
    const label = formatDateLabel(notification.created_at);
    groups[label] = groups[label] || [];
    groups[label].push(notification);
    return groups;
  }, {});
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getAll,
    staleTime: 15 * 1000,
  });

  const canSendNotifications = user?.role === 'admin' || user?.role === 'manager';

  // ✅ FIXED: useQuery now uses object syntax
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: authService.getAllUsers,
    enabled: canSendNotifications,
  });

  const sendMutation = useMutation({
    mutationFn: (payload) => notificationService.create(payload),
    onSuccess: () => {
      toast.success('Notification sent');
      setMessage('');
      setRecipient('all');
      // ✅ FIXED: invalidateQueries uses object syntax
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Failed to send notification'),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['notifications'], (old) =>
        old?.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
      // ✅ FIXED: invalidateQueries uses object syntax
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], (old) =>
        old?.map((item) => ({ ...item, read: true }))
      );
    },
  });

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const visibleNotifications = useMemo(
    () =>
      showUnreadOnly
        ? notifications.filter((notification) => !notification.read)
        : notifications,
    [notifications, showUnreadOnly]
  );

  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(visibleNotifications),
    [visibleNotifications]
  );

  const handleSend = async (event) => {
    event.preventDefault();
    if (!message.trim()) {
      toast.error('Notification message is required');
      return;
    }

    const payload = {
      message: message.trim(),
      broadcast: recipient === 'all',
      user_id: recipient === 'all' ? undefined : Number(recipient),
    };

    await sendMutation.mutateAsync(payload);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">
              Notifications
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
              Inbox
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              View your personal updates, action items and system messages.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <Bell className="h-4 w-4 text-sky-500" />
              {unreadCount} unread
            </div>

            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={unreadCount === 0 || markAllReadMutation.isLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark all read
            </button>
          </div>
        </div>
      </div>

      {canSendNotifications ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Send a notification
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Broadcast to all users or message an individual user directly.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <span className="font-semibold">{users.length}</span> users in your farm
            </div>
          </div>

          <form onSubmit={handleSend} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1.8fr_1fr]">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                placeholder="Write your notification message..."
                className="min-h-[120px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-400 dark:focus:bg-slate-950"
              />

              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Recipient
                </label>
                <select
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="all">All users</option>
                  {users.map((userOption) => (
                    <option key={userOption.id} value={userOption.id}>
                      {userOption.full_name} ({userOption.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Notifications are delivered to each recipient’s personal inbox.
              </p>
              <button
                type="submit"
                disabled={sendMutation.isLoading}
                className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sendMutation.isLoading ? 'Sending...' : 'Send notification'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Your messages</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {showUnreadOnly
                ? 'Showing unread notifications only'
                : 'All notifications are shown in chronological order.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUnreadOnly((current) => !current)}
            className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <Mail className="h-4 w-4" />
            {showUnreadOnly ? 'Show all' : 'Show unread'}
          </button>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="animate-pulse rounded-3xl bg-slate-100 p-5 dark:bg-slate-800" />
              ))}
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-sky-500" />
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                No notifications yet
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Your inbox is clear. New system messages will appear here.
              </p>
            </div>
          ) : (
            Object.entries(groupedNotifications).map(([group, items]) => (
              <div key={group} className="mb-6">
                <div className="mb-4 rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {group}
                </div>
                <div className="space-y-3">
                  {items.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-3xl border px-5 py-4 shadow-sm transition ${
                        notification.read
                          ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
                          : 'border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {notification.read ? 'Read' : 'Unread'}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {formatTimeLabel(notification.created_at)}
                            </span>
                          </div>
                          <p className="text-sm leading-6 text-slate-800 dark:text-slate-100">
                            {notification.message}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => markReadMutation.mutate(notification.id)}
                          disabled={notification.read || markReadMutation.isLoading}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          <Check className="h-4 w-4" />
                          {notification.read ? 'Read' : 'Mark read'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}