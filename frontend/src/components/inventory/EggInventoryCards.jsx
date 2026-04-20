import { formatNumber } from '../../utils/formatters';

const stats = [
  { key: 'today_eggs', title: 'Eggs Today', label: 'Today’s production', color: 'from-sky-100 to-sky-50', icon: '🥚' },
  { key: 'expected_eggs', title: 'Expected Eggs', label: 'Target for today', color: 'from-emerald-100 to-emerald-50', icon: '📈' },
  { key: 'production_rate', title: 'Production Rate', label: 'Average per hour', color: 'from-violet-100 to-violet-50', icon: '⚡' },
];

export default function ProductionSummary({ summary = {} }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.key} className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${stat.color} p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
                {summary[stat.key] != null ? formatNumber(summary[stat.key]) : '—'}
              </p>
            </div>
            <span className="text-2xl">{stat.icon}</span>
          </div>
          <p className="mt-4 text-sm text-slate-500">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

export function EggInventoryCards({ inventory = {} }) {
  const cards = [
    { label: 'Total Eggs', value: inventory.total_eggs, accent: 'bg-sky-100 text-sky-700' },
    { label: 'Available Eggs', value: inventory.available_eggs, accent: 'bg-emerald-100 text-emerald-700' },
    { label: 'Sold Eggs', value: inventory.sold_eggs, accent: 'bg-violet-100 text-violet-700' },
    { label: 'Broken Eggs', value: inventory.broken_eggs, accent: 'bg-rose-100 text-rose-700' },
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