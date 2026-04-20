// src/components/common/FilterBadge.jsx
import { X } from 'lucide-react';

export const FilterBadge = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full">
    {label}
    <button onClick={onRemove} className="hover:bg-blue-200 rounded-full p-0.5">
      <X size={14} />
    </button>
  </span>
);