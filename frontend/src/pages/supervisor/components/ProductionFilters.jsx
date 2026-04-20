// src/pages/Production/components/ProductionFilters.jsx
import { useState } from 'react';
import { Search, Sliders, ChevronDown, X } from 'lucide-react';
import { FilterBadge } from '../../../components/common/FilterBadge';

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
  const [showFilters, setShowFilters] = useState(false);

  const applyDatePreset = (preset) => {
    const today = new Date();
    let start = new Date(),
      end = new Date();
    if (preset === 'today') {
      start = today;
      end = today;
    } else if (preset === 'yesterday') {
      start.setDate(today.getDate() - 1);
      end = start;
    } else if (preset === 'last7days') {
      start.setDate(today.getDate() - 7);
      end = today;
    } else if (preset === 'thisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = today;
    }
    setDateRange({ start: formatDate(start), end: formatDate(end) });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-4 md:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by staff or pen..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 transition"
          >
            <Sliders size={16} /> Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-blue-500 text-white rounded-full px-1.5 text-xs">{activeFilterCount}</span>
            )}
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {hasActiveFilters && (
            <button onClick={onClearFilters} className="flex items-center gap-1 px-4 py-2.5 text-red-600 bg-red-50 rounded-xl hover:bg-red-100">
              <X size={16} /> Clear
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="pt-4 border-t dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">Pen</label>
              <select
                value={selectedPen}
                onChange={(e) => setSelectedPen(e.target.value)}
                className="w-full border dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700"
              >
                <option value="all">All Pens</option>
                {pens.map((pen) => (
                  <option key={pen.id} value={pen.id}>{pen.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="flex-1 border dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="flex-1 border dark:border-gray-600 rounded-xl px-3 py-2 bg-white dark:bg-gray-700"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {['today', 'yesterday', 'last7days', 'thisMonth'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyDatePreset(preset)}
                    className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700"
                  >
                    {preset === 'today' ? 'Today' : preset === 'yesterday' ? 'Yesterday' : preset === 'last7days' ? 'Last 7 days' : 'This month'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {searchInput && <FilterBadge label={`Search: "${searchInput}"`} onRemove={() => setSearchInput('')} />}
          {selectedPen !== 'all' && (
            <FilterBadge
              label={`Pen: ${pens.find((p) => p.id === selectedPen)?.name || selectedPen}`}
              onRemove={() => setSelectedPen('all')}
            />
          )}
          {(dateRange.start || dateRange.end) && (
            <FilterBadge
              label={`Date: ${dateRange.start || 'any'} → ${dateRange.end || 'any'}`}
              onRemove={() => setDateRange({ start: '', end: '' })}
            />
          )}
        </div>
      )}
    </div>
  );
};