import { formatNumber } from '../../utils/formatters';

export default function TrayInventoryCards({ inventory = {} }) {
  const cards = [
    { label: 'Total Trays', value: inventory.total_trays, accent: 'bg-amber-100 text-amber-700' },
    { label: 'Available Trays', value: inventory.available_trays, accent: 'bg-emerald-100 text-emerald-700' },
    { label: 'Sold Trays', value: inventory.sold_trays, accent: 'bg-slate-100 text-slate-900' },
    { label: 'Reserved Trays', value: inventory.reserved_trays, accent: 'bg-indigo-100 text-indigo-700' },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
        >
          <div className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${card.accent}`}>
            {card.label}
          </div>
          <p className="mt-5 text-4xl font-semibold text-slate-900 dark:text-white">
            {card.value != null ? formatNumber(card.value) : '—'}
          </p>
        </div>
      ))}
    </div>
  );
}