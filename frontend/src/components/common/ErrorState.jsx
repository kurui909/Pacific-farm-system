// src/components/common/ErrorState.jsx
import { AlertCircle } from 'lucide-react';

export default function ErrorState({ 
  title = 'Something went wrong', 
  description = 'Please try again later.',
  icon: Icon = AlertCircle,
  onRetry,
  retryText = 'Retry',
}) {
  return (
    <div className="rounded-xl md:rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 p-5 md:p-8 text-center">
      <div className="flex justify-center mb-3">
        <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
          <Icon size={24} className="text-red-600 dark:text-red-400" />
        </div>
      </div>
      <h3 className="text-base md:text-lg font-semibold text-red-700 dark:text-red-400">{title}</h3>
      <p className="mt-1 text-xs md:text-sm text-red-600 dark:text-red-300">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
        >
          {retryText}
        </button>
      )}
    </div>
  );
}