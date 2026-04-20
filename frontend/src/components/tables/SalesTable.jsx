import { formatCurrency, formatDate } from '../../utils/formatters';

export default function SalesTable({ sales = [], isLoading, onRefresh, title = 'Sales history', subtitle = 'Recent egg and tray sales' }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((index) => (
            <div key={index} className="h-16 rounded-3xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No sales have been recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                  <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">{formatDate(sale.sale_date)}</td>
                  <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200">{sale.sale_type || sale.type || 'Eggs'}</td>
                  <td className="px-4 py-4 text-right text-sm text-slate-700 dark:text-slate-200">{sale.quantity ?? sale.trays ?? '—'}</td>
                  <td className="px-4 py-4 text-right text-sm text-slate-700 dark:text-slate-200">{formatCurrency(sale.price ?? sale.price_per_tray ?? 0)}</td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(sale.total ?? (sale.quantity ?? sale.trays ?? 0) * (sale.price ?? sale.price_per_tray ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}