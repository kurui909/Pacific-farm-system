import { formatNumber } from '../../utils/formatters';

const tiles = [
  {
    key: 'today_eggs',
    title: 'Eggs Today',
    subtitle: 'Today’s production',
    accent: 'from-sky-100 to-sky-50',
    emoji: '🥚',
  },
  {
    key: 'expected_eggs',
    title: 'Expected Eggs',
    subtitle: 'Daily target',
    accent: 'from-emerald-100 to-emerald-50',
    emoji: '🎯',
  },
  {
    key: 'production_rate',
    title: 'Production Rate',
    subtitle: 'Eggs per hour',
    accent: 'from-violet-100 to-violet-50',
    emoji: '⚡',
  },
];

export default function ProductionSummary({ summary = {} }) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {tiles.map((tile) => (
        <div
          key={tile.key}
          className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${tile.accent} p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{tile.title}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">
                {summary[tile.key] != null ? formatNumber(summary[tile.key]) : '—'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 px-4 py-2 text-xl">{tile.emoji}</div>
          </div>
          <p className="mt-4 text-sm text-slate-500">{tile.subtitle}</p>
        </div>
      ))}
    </div>
  );
}