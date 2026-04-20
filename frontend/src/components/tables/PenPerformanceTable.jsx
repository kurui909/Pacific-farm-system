import { formatNumber, formatDate } from '../../utils/formatters';

export default function PenPerformanceTable({ performance = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="h-12 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!performance.length) {
    return (
      <div className="rounded-3xl border bg-white p-6 text-center text-gray-500 dark:bg-gray-900 dark:text-gray-400">
        No performance data available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Pen
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              H/D%
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              E/R
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Eggs
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Mortality
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {performance.map((row) => (
            <tr key={row.id ?? `${row.pen}-${row.metric}`}>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{row.pen || 'Unknown'}</td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {(row.hd_percentage ?? row.hd ?? 0).toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {(row.er_ratio ?? row.er ?? 0).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {formatNumber(row.eggs ?? row.eggs_count ?? 0)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {(row.mortality ?? 0).toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                {formatDate(row.updated_at || row.last_updated || row.recorded_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}