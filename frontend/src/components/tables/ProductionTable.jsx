// src/components/tables/ProductionTable.jsx
import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Eye, Edit2, Trash2, Package, TrendingUp, AlertCircle, 
  Calendar, Layers, ChevronDown, ChevronUp, Grid3x3, List 
} from 'lucide-react';

// Helper: group records by date
const groupByDate = (records) => {
  const groups = new Map();
  records.forEach(record => {
    const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        date: record.date,
        total_eggs: 0,
        total_feed: 0,
        total_mortality: 0,
        avg_hd: 0,
        avg_er: 0,
        record_count: 0,
        pens: []
      });
    }
    const group = groups.get(dateKey);
    group.total_eggs += record.total_eggs || 0;
    group.total_feed += record.feed_kg || 0;
    group.total_mortality += record.mortality || 0;
    group.avg_hd += record.hd_percentage || 0;
    group.avg_er += record.er_ratio || 0;
    group.record_count++;
    group.pens.push(record.pen_name || record.pen?.name || 'Unknown');
  });
  // Compute averages
  for (const group of groups.values()) {
    if (group.record_count > 0) {
      group.avg_hd = group.avg_hd / group.record_count;
      group.avg_er = group.avg_er / group.record_count;
    }
    // Unique pens list
    group.pens = [...new Set(group.pens)];
  }
  return Array.from(groups.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Card component for mobile view
const RecordCard = ({ record, onView, onEdit, onDelete, groupMode }) => {
  if (groupMode) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {format(new Date(record.date), 'MMM dd, yyyy')}
            </span>
          </div>
          <span className="text-xs text-gray-500">{record.record_count} records</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Total Eggs</p>
            <p className="font-medium">{record.total_eggs.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Feed (kg)</p>
            <p className="font-medium">{record.total_feed.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Mortality</p>
            <p className="font-medium text-red-600">{record.total_mortality}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Avg HD%</p>
            <p className="font-medium">{record.avg_hd.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Avg E/R</p>
            <p className="font-medium">{record.avg_er.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Pens</p>
            <p className="font-medium text-xs truncate">{record.pens.join(', ')}</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-1 border-t pt-2">
          <button onClick={() => onView?.(record)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
            <Eye size={16} />
          </button>
          <button onClick={() => onEdit?.(record)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete?.(record.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Individual record card
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-green-500" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {record.pen_name || record.pen?.name || 'Unknown'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{format(new Date(record.date), 'MMM dd, yyyy')}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onView?.(record)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
            <Eye size={16} />
          </button>
          <button onClick={() => onEdit?.(record)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete?.(record.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Eggs</p>
          <p className="font-medium">{record.total_eggs?.toLocaleString() || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Feed (kg)</p>
          <p className="font-medium">{record.feed_kg?.toFixed(1) || '0.0'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Mortality</p>
          <p className={`font-medium ${record.mortality > 0 ? 'text-red-600' : ''}`}>{record.mortality || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">HD%</p>
          <p className="font-medium">{record.hd_percentage?.toFixed(1) || '0.0'}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">E/R</p>
          <p className="font-medium">{record.er_ratio?.toFixed(2) || '0.00'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Staff</p>
          <p className="font-medium truncate">{record.staff_name || '—'}</p>
        </div>
      </div>
    </div>
  );
};

// Loading skeleton
const LoadingSkeleton = () => (
  <div className="space-y-3">
    {Array(4).fill(0).map((_, i) => (
      <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
    ))}
  </div>
);

const EmptyState = () => (
  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-600 dark:bg-gray-800/30">
    <Package className="mx-auto mb-3 h-10 w-10 text-gray-400" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No production records</h3>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
      Create your first production entry using the "Add Record" button.
    </p>
  </div>
);

export default function ProductionTable({ records, isLoading, onView, onEdit, onDelete }) {
  const [groupByDateView, setGroupByDateView] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    // Default to table on desktop, card on mobile? We'll let user toggle.
    return localStorage.getItem('productionViewMode') || 'table';
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('productionViewMode', mode);
  };

  if (isLoading) return <LoadingSkeleton />;
  if (!records?.length) return <EmptyState />;

  const groupedRecords = groupByDate(records);
  const displayRecords = groupByDateView ? groupedRecords : records;
  const isGrouped = groupByDateView;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setGroupByDateView(!groupByDateView)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <Calendar size={16} />
            {groupByDateView ? 'Individual Records' : 'Group by Date'}
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-0.5 shadow-sm dark:border-gray-600 dark:bg-gray-800">
          <button
            onClick={() => handleViewModeChange('table')}
            className={`rounded-md px-2 py-1 text-sm ${viewMode === 'table' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            title="Table view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => handleViewModeChange('cards')}
            className={`rounded-md px-2 py-1 text-sm ${viewMode === 'cards' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            title="Card view"
          >
            <Grid3x3 size={16} />
          </button>
        </div>
      </div>

      {/* Card view (mobile & desktop) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayRecords.map((item, idx) => (
            <RecordCard
              key={isGrouped ? idx : item.id}
              record={item}
              groupMode={isGrouped}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Table view (desktop only) */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Date
                </th>
                {!isGrouped && (
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Pen
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">Eggs <Package size={12} /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">Feed (kg) <TrendingUp size={12} /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">Mortality <AlertCircle size={12} /></div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  HD%
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  E/R
                </th>
                {!isGrouped && (
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Staff
                  </th>
                )}
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {displayRecords.map((item, idx) => (
                <tr key={isGrouped ? idx : item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(new Date(item.date), 'MMM dd, yyyy')}
                  </td>
                  {!isGrouped && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.pen_name || item.pen?.name || '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {isGrouped ? item.total_eggs.toLocaleString() : (item.total_eggs?.toLocaleString() || 0)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {isGrouped ? item.total_feed.toFixed(1) : (item.feed_kg?.toFixed(1) || '0.0')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    <span className={item.total_mortality > 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                      {isGrouped ? item.total_mortality : (item.mortality || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {isGrouped ? item.avg_hd.toFixed(1) : (item.hd_percentage?.toFixed(1) || '0.0')}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {isGrouped ? item.avg_er.toFixed(2) : (item.er_ratio?.toFixed(2) || '0.00')}
                  </td>
                  {!isGrouped && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {item.staff_name || '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onView?.(item)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit?.(item)}
                        className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Edit record"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete?.(item.id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}