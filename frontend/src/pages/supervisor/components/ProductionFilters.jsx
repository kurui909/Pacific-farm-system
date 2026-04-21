// src/pages/supervisor/components/ProductionFilters.jsx
import { Search, X } from 'lucide-react';

const formatDate = (date) => date?.toISOString().split('T')[0];

export const ProductionFilters = ({
  searchInput,
  setSearchInput,
  selectedPen,
  setSelectedPen,
  dateRange,
  setDateRange,
  pens,
  activeFilterCount,
  hasActiveFilters,
  onClearFilters,
}) => {
  const applyDatePreset = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    switch (preset) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end = start;
        break;
      case 'last7days':
        start.setDate(today.getDate() - 7);
        end = today;
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }
    setDateRange({ start: formatDate(start), end: formatDate(end) });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 space-y-3">
      {/* Filter row - wraps on small screens */}
      <div className="flex flex-wrap gap-2 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Search</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Pen or staff..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Pen dropdown */}
        <div className="min-w-[130px]">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Pen</label>
          <select
            value={selectedPen}
            onChange={(e) => setSelectedPen(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">All Pens</option>
            {pens.map((pen) => (
              <option key={pen.id} value={pen.id}>
                {pen.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date range from */}
        <div className="min-w-[120px]">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">From</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>

        {/* Date range to */}
        <div className="min-w-[120px]">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">To</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
            className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          />
        </div>

        {/* Quick date presets - horizontal scroll on mobile */}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quick range</label>
          <div className="flex flex-wrap gap-1">
            {['today', 'yesterday', 'last7days', 'thisMonth', 'lastMonth'].map((preset) => (
              <button
                key={preset}
                onClick={() => applyDatePreset(preset)}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition whitespace-nowrap"
              >
                {preset === 'today' && 'Today'}
                {preset === 'yesterday' && 'Yesterday'}
                {preset === 'last7days' && 'Last 7d'}
                {preset === 'thisMonth' && 'This month'}
                {preset === 'lastMonth' && 'Last month'}
              </button>
            ))}
          </div>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/30 transition"
            >
              <X size={14} /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Active filter badges (optional but helpful) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
          {searchInput && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Search: "{searchInput}"
              <button onClick={() => setSearchInput('')} className="hover:text-blue-900">×</button>
            </span>
          )}
          {selectedPen !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Pen: {pens.find(p => p.id === Number(selectedPen))?.name || selectedPen}
              <button onClick={() => setSelectedPen('all')} className="hover:text-blue-900">×</button>
            </span>
          )}
          {(dateRange.start || dateRange.end) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Date: {dateRange.start || 'any'} → {dateRange.end || 'any'}
              <button onClick={() => setDateRange({ start: '', end: '' })} className="hover:text-blue-900">×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};