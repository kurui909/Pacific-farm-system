// src/components/common/FilterBadge.jsx
import { X } from 'lucide-react';

export const FilterBadge = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs md:text-sm rounded-full">
    <span className="max-w-[150px] sm:max-w-none truncate">{label}</span>
    <button
      onClick={onRemove}
      className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
      aria-label={`Remove filter: ${label}`}
    >
      <X size={14} className="flex-shrink-0" />
    </button>
  </span>
);