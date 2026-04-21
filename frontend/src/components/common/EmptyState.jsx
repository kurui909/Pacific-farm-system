// src/components/common/EmptyState.jsx
import { Package } from 'lucide-react';

export default function EmptyState({ 
  title = 'No data available', 
  description = 'There is nothing to display right now.',
  icon: Icon = Package,
  actionText,
  onAction,
}) {
  return (
    <div className="rounded-xl md:rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-5 md:p-8 text-center">
      <div className="flex justify-center mb-3">
        <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-2">
          <Icon size={24} className="text-gray-500 dark:text-gray-400" />
        </div>
      </div>
      <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}