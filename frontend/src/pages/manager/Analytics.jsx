import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  analyticsService,
  dashboardService,
  penService,
  eggsService,
  traysService,
  feedService,
  paymentsService,
} from '../../services/api';
import PenPerformanceTable from '../../components/tables/PenPerformanceTable';
import PenComparisonChart from '../../components/charts/PenComparisonChart';
import PageHeader from '../../components/common/PageHeader';
import {
  Activity,
  Scale,
  Calendar,
  RefreshCw,
  AlertCircle,
  BarChart3,
  LineChart,
  Filter,
  Package,
  Layers,
  DollarSign,
} from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

export default function Analytics() {
  const [dateRange, setDateRange] = useState('month');
  const [chartMetric, setChartMetric] = useState('both');
  const [chartType, setChartType] = useState('bar');
  const [selectedPen, setSelectedPen] = useState('all');

  const { data: pens, isLoading: pensLoading } = useQuery({
    queryKey: ['pens'],
    queryFn: penService.getAll,
  });

  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: dashboardService.getMetrics,
  });

  const {
    data: performance,
    isLoading: perfLoading,
    error: perfError,
    refetch: refetchPerf,
  } = useQuery({
    queryKey: ['pen-performance'],
    queryFn: analyticsService.getPenPerformance,
  });

  const {
    data: trends,
    isLoading: trendsLoading,
    error: trendsError,
    refetch: refetchTrends,
  } = useQuery({
    queryKey: ['trends', dateRange, selectedPen],
    queryFn: () =>
      analyticsService.getTrends({
        period: dateRange,
        pen_id: selectedPen !== 'all' ? selectedPen : undefined,
      }),
  });

  const { data: eggsInventory } = useQuery({
    queryKey: ['eggs-inventory'],
    queryFn: eggsService.getInventory,
  });

  const { data: feedInventory } = useQuery({
    queryKey: ['feed-inventory'],
    queryFn: feedService.getInventory,
  });

  const { data: traysInventory } = useQuery({
    queryKey: ['trays-inventory'],
    queryFn: traysService.getInventory,
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: paymentsService.getAllPayments,
  });

  const isLoading = dashboardLoading || perfLoading || trendsLoading;
  const hasError = dashboardError || perfError || trendsError;

  const summary = useMemo(() => {
    if (!performance?.length) return null;
    const avgHD =
      performance.reduce((sum, row) => sum + (row.hd_percentage ?? row.hd ?? 0), 0) /
      performance.length;
    const avgER =
      performance.reduce((sum, row) => sum + (row.er_ratio ?? row.er ?? 0), 0) /
      performance.length;
    const totalEggs =
      performance.reduce((sum, row) => sum + (row.eggs ?? row.eggs_count ?? 0), 0) || 0;
    const avgMortality =
      performance.reduce((sum, row) => sum + (row.mortality ?? 0), 0) / performance.length;
    return { avgHD, avgER, totalEggs, avgMortality };
  }, [performance]);

  const eggsStock = Array.isArray(eggsInventory)
    ? eggsInventory.reduce((sum, item) => sum + (item.closing_stock ?? 0), 0)
    : eggsInventory?.closing_stock ?? dashboard?.total_eggs ?? 0;
  const feedStock =
    feedInventory?.reduce((sum, item) => sum + (item.closing_stock ?? 0), 0) ?? 0;
  const trayStock = Array.isArray(traysInventory)
    ? traysInventory.reduce((sum, item) => sum + (item.closing_stock ?? 0), 0)
    : traysInventory?.closing_stock ?? 0;
  const totalPens = pens?.length ?? dashboard?.total_pens ?? 0;
  const totalFarms = dashboard?.total_farms ?? 0;
  const paymentCount = payments?.length ?? 0;

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics & Insights" />
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <AlertCircle className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
            Failed to load analytics
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Unable to fetch analytics data. Please try again.
          </p>
          <button
            onClick={() => {
              refetchDashboard();
              refetchPerf();
              refetchTrends();
            }}
            className="btn-primary inline-flex items-center justify-center"
          >
            <RefreshCw size={16} className="mr-2" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Insights"
        subtitle="Combined analytics across production, inventory, pens, and finance"
        actions={
          <button
            onClick={() => {
              refetchDashboard();
              refetchPerf();
              refetchTrends();
            }}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Layers size={20} />} label="Active Pens" value={formatNumber(totalPens)} />
        <StatCard icon={<Package size={20} />} label="Egg Inventory" value={`${formatNumber(eggsStock)} kg`} />
        <StatCard icon={<Package size={20} />} label="Feed Inventory" value={`${formatNumber(feedStock)} kg`} />
        <StatCard icon={<DollarSign size={20} />} label="Payments Logged" value={formatNumber(paymentCount)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Pen Performance Ranking
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Review average hatch/draw and egg ratios for each pen.
              </p>
            </div>
            <div className="p-4">
              <PenPerformanceTable performance={performance || []} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Trend Comparison
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Compare performance across pens over time.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                  </select>

                  <select
                    value={selectedPen}
                    onChange={(e) => setSelectedPen(e.target.value)}
                    className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All Pens</option>
                    {pens?.map((pen) => (
                      <option key={pen.id} value={pen.id}>
                        {pen.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <TrendToggleButton
                  active={chartMetric === 'both'}
                  onClick={() => setChartMetric('both')}
                  label="Both"
                />
                <TrendToggleButton
                  active={chartMetric === 'hd'}
                  onClick={() => setChartMetric('hd')}
                  label="H/D%"
                />
                <TrendToggleButton
                  active={chartMetric === 'er'}
                  onClick={() => setChartMetric('er')}
                  label="E/R"
                />
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                <TrendToggleButton
                  active={chartType === 'bar'}
                  onClick={() => setChartType('bar')}
                  icon={<BarChart3 size={16} />}
                />
                <TrendToggleButton
                  active={chartType === 'line'}
                  onClick={() => setChartType('line')}
                  icon={<LineChart size={16} />}
                />
              </div>

              <div className="h-[380px]">
                <PenComparisonChart
                  data={trends || []}
                  metric={chartMetric}
                  chartType={chartType}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="text-blue-500" size={20} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">System Summary</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Module insights</h3>
              </div>
            </div>
            <div className="grid gap-3">
              <MiniCard icon={<Package size={18} />} label="Tray Inventory" value={`${formatNumber(trayStock)} kg`} />
              <MiniCard icon={<Package size={18} />} label="Feed Inventory" value={`${formatNumber(feedStock)} kg`} />
              <MiniCard icon={<DollarSign size={18} />} label="Payment Records" value={formatNumber(paymentCount)} />
              <MiniCard icon={<Layers size={18} />} label="Farms" value={formatNumber(totalFarms)} />
            </div>
          </div>

          {summary && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="text-green-500" size={20} />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Performance summary</p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pen averages</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatInline label="Avg H/D%" value={`${summary.avgHD.toFixed(1)}%`} />
                <StatInline label="Avg E/R" value={summary.avgER.toFixed(2)} />
                <StatInline label="Total Eggs" value={formatNumber(summary.totalEggs)} />
                <StatInline label="Avg Mortality" value={`${summary.avgMortality.toFixed(1)}%`} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{
            icon.name
          }</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{label}</h3>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TrendToggleButton({ active, onClick, label, icon }) {
  return (
    <button
      type="button"
      className={`flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 ${
        active ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      {icon && <div>{icon}</div>}
      {label}
    </button>
  );
}

function MiniCard({ icon, label, value }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 flex items-center gap-3">
      <div className="rounded-2xl bg-blue-50 p-3 dark:bg-blue-900/20">{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function StatInline({ label, value }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics & Insights" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="h-28 rounded-3xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="h-96 rounded-3xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-96 rounded-3xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-72 rounded-3xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-44 rounded-3xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
      </div>
    </div>
  );
}