// src/pages/Dashboard.jsx
import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService, alertsService, productionService } from '../../services/api';
import {
  Egg,
  Users,
  Wheat,
  Activity,
  TrendingUp,
  Scale,
  CalendarDays,
  Bell,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Plus,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

const formatCompact = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num?.toString() || '0';
};

const safeDivide = (numerator, denominator) => {
  if (!denominator || denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(1));
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState('week');

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['dashboard', 'metrics', dateRange],
    queryFn: () => dashboardService.getMetrics(dateRange),
    staleTime: 30_000,
  });

  const { data: alerts = [], refetch: refetchAlerts } = useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: alertsService.getActive,
    staleTime: 60_000,
  });

  const { data: trendData = [] } = useQuery({
    queryKey: ['dashboard', 'trend', dateRange],
    queryFn: () => dashboardService.getTrendData(dateRange),
    staleTime: 60_000,
  });

  const { data: penPerformance = [] } = useQuery({
    queryKey: ['dashboard', 'penPerformance'],
    queryFn: dashboardService.getPenPerformance,
    staleTime: 120_000,
  });

  const handleRefresh = async () => {
    await Promise.all([refetchMetrics(), refetchAlerts()]);
    toast.success('Dashboard updated');
  };

  const topPens = useMemo(
    () => [...penPerformance].sort((a, b) => b.score - a.score).slice(0, 3),
    [penPerformance]
  );

  const averagePenScore = useMemo(() => {
    if (!penPerformance.length) return 0;
    return (
      penPerformance.reduce((sum, pen) => sum + (pen.score || 0), 0) / penPerformance.length
    ).toFixed(1);
  }, [penPerformance]);

  const cards = [
    { label: 'Total Eggs', value: metrics?.total_eggs || 0, icon: Egg, color: 'blue', formatter: (v) => v.toLocaleString() },
    { label: 'Chickens', value: metrics?.total_chickens || 0, icon: Users, color: 'emerald', formatter: (v) => v.toLocaleString() },
    { label: 'Feed (kg)', value: metrics?.feed_consumed || 0, icon: Wheat, color: 'amber', formatter: (v) => v.toFixed(1) },
    { label: 'Mortality', value: metrics?.mortality_rate || 0, icon: Activity, color: 'rose', formatter: (v) => `${v.toFixed(1)}%` },
    { label: 'HD %', value: metrics?.hd_percentage || 0, icon: TrendingUp, color: 'violet', formatter: (v) => `${v.toFixed(1)}%` },
    { label: 'E/R Ratio', value: metrics?.er_ratio || 0, icon: Scale, color: 'indigo', formatter: (v) => v.toFixed(2) },
  ];

  const extraCards = [
    { label: 'Active Alerts', value: alerts.length, icon: Bell, color: 'rose', formatter: (v) => `${v}` },
    {
      label: 'Eggs / Chicken',
      value: safeDivide(metrics?.total_eggs || 0, metrics?.total_chickens || 1),
      icon: Users,
      color: 'emerald',
      formatter: (v) => `${v}`,
    },
    {
      label: 'Feed Efficiency',
      value: safeDivide(metrics?.total_eggs || 0, metrics?.feed_consumed || 1),
      icon: Wheat,
      color: 'amber',
      formatter: (v) => `${v}`,
    },
  ];

  const colorStyles = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
    violet: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800',
    indigo: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800',
  };

  const iconColorStyles = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    violet: 'text-violet-600 dark:text-violet-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Farm Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Real‑time overview of production, health, and efficiency
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {DATE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleRefresh}
              className="rounded-2xl bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {metricsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`relative overflow-hidden rounded-2xl border ${colorStyles[card.color]} p-4 shadow-sm backdrop-blur-sm transition-all hover:scale-[1.02]`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {card.label}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                          {card.formatter(card.value)}
                        </p>
                      </div>
                      <div className={`rounded-full p-2 ${colorStyles[card.color]} bg-opacity-40`}>
                        <Icon size={20} className={iconColorStyles[card.color]} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {extraCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className={`rounded-2xl border ${colorStyles[card.color]} p-4 shadow-sm backdrop-blur-sm transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {card.label}
                        </p>
                        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                          {card.formatter(card.value)}
                        </p>
                      </div>
                      <div className={`rounded-xl p-3 ${colorStyles[card.color]} bg-opacity-40`}>
                        <Icon size={22} className={iconColorStyles[card.color]} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Production & Feed Trend
                </h2>
                <div className="text-xs text-slate-500">
                  {DATE_RANGES.find((r) => r.value === dateRange)?.label}
                </div>
              </div>
              <div className="h-[280px] sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="eggs" fill="#3b82f6" name="Eggs" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="feed" fill="#f59e0b" name="Feed (kg)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Production Summary
                </h3>
                <span className="text-xs text-slate-500">Snapshot</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Today Eggs</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                    {metrics?.today_eggs || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Today Feed</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                    {metrics?.today_feed || 0} kg
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Pen Score</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                    {averagePenScore}
                  </p>
                </div>
              </div>
            </div>

            {alerts.length > 0 && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 dark:border-rose-800 dark:bg-rose-950/20">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  <h3 className="font-semibold text-rose-800 dark:text-rose-300">Active Alerts</h3>
                </div>
                <div className="space-y-2">
                  {alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 h-2 w-2 rounded-full bg-rose-500" />
                      <span className="text-rose-700 dark:text-rose-300">{alert.message}</span>
                    </div>
                  ))}
                  {alerts.length > 3 && (
                    <button className="mt-2 text-xs font-medium text-rose-600 hover:underline">
                      + {alerts.length - 3} more alerts
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">🏆 Top Performing Pens</h2>
              <div className="space-y-3">
                {topPens.map((pen, idx) => (
                  <div key={pen.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-400">#{idx + 1}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{pen.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">{pen.hd_percentage}% HD</span>
                      <span className="text-xs text-slate-500">Score {pen.score}</span>
                    </div>
                  </div>
                ))}
                {penPerformance.length === 0 && (
                  <p className="text-sm text-slate-500">No pen data available</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-950/80">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 rounded-xl bg-blue-50 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300">
                  <Plus size={16} /> Record Eggs
                </button>
                <button className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Wheat size={16} /> Add Feed
                </button>
                <button className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300">
                  <Users size={16} /> Manage Pens
                </button>
                <button className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
                  <Bell size={16} /> View All
                </button>
              </div>
            </div>

            {metrics && (
              <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white shadow-lg">
                <p className="text-sm font-medium opacity-90">Today's Summary</p>
                <div className="mt-2 flex flex-col gap-3 text-2xl font-bold sm:flex-row sm:justify-between">
                  <div>
                    <span className="text-3xl">{metrics.today_eggs || 0}</span>
                    <span className="ml-1 text-sm font-normal">eggs</span>
                  </div>
                  <div>
                    <span className="text-3xl">{metrics.today_feed || 0}</span>
                    <span className="ml-1 text-sm font-normal">kg feed</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-1">
                    {metrics.change_eggs > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {Math.abs(metrics.change_eggs || 0)}% vs yesterday
                  </span>
                  <ChevronRight size={16} className="opacity-70" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}