// src/components/common/Skeleton.jsx
import { useMemo } from 'react';

/**
 * Skeleton - Responsive loading placeholder
 * Types: 'card', 'list', 'table', 'form', 'metrics'
 */
export default function Skeleton({ type = 'card', count = 1, columns = 3 }) {
  const items = useMemo(() => Array.from({ length: count }), [count]);

  // Card skeleton
  if (type === 'card') {
    const gridCols = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    };
    const colClass = gridCols[columns] || gridCols[3];
    return (
      <div className={`grid gap-4 ${colClass}`}>
        {items.map((_, i) => (
          <div key={i} className="rounded-xl md:rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-8 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List skeleton (vertical items)
  if (type === 'list') {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="h-8 w-16 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Table skeleton (rows with columns)
  if (type === 'table') {
    const columnsCount = columns || 5;
    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              {Array.from({ length: columnsCount }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((_, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: columnsCount }).map((_, colIdx) => (
                  <td key={colIdx} className="px-4 py-3">
                    <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Form skeleton (inputs, selects, etc.)
  if (type === 'form') {
    return (
      <div className="space-y-4">
        {items.map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        ))}
        <div className="h-10 w-32 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  // Metrics cards (stats row)
  if (type === 'metrics') {
    const gridCols = {
      2: 'grid-cols-2',
      3: 'grid-cols-2 sm:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-4',
      5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
    };
    const colClass = gridCols[columns] || gridCols[4];
    return (
      <div className={`grid gap-3 ${colClass}`}>
        {items.map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="mt-2 h-6 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Default fallback (simple card grid)
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((_, i) => (
        <div key={i} className="h-32 rounded-xl md:rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      ))}
    </div>
  );
}