// src/components/tables/ProductionTable.jsx
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Eye, Edit2, Trash2, Package, TrendingUp, AlertCircle, 
  Calendar, Layers, Search, ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';

// Helper: group records by date (includes broody & culls)
const groupByDate = (records) => {
  const groups = new Map();
  records.forEach(record => {
    const dateKey = format(new Date(record.date), 'yyyy-MM-dd');
    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        date: record.date,
        total_eggs: 0,
        total_feed: 0,
        total_broody: 0,
        total_culls: 0,
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
    group.total_broody += record.broody_hen || 0;
    group.total_culls += record.culls || 0;
    group.total_mortality += record.mortality || 0;
    group.avg_hd += record.hd_percentage || 0;
    group.avg_er += record.er_ratio || 0;
    group.record_count++;
    group.pens.push(record.pen_name || record.pen?.name || 'Unknown');
  });
  for (const group of groups.values()) {
    if (group.record_count > 0) {
      group.avg_hd = group.avg_hd / group.record_count;
      group.avg_er = group.avg_er / group.record_count;
    }
    group.pens = [...new Set(group.pens)];
  }
  return Array.from(groups.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Card component for mobile view (includes broody & culls)
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
          <div><p className="text-xs text-gray-500">Eggs</p><p className="font-medium">{record.total_eggs.toLocaleString()}</p></div>
          <div><p className="text-xs text-gray-500">Feed (kg)</p><p className="font-medium">{record.total_feed.toFixed(1)}</p></div>
          <div><p className="text-xs text-gray-500">Broody</p><p className="font-medium">{record.total_broody}</p></div>
          <div><p className="text-xs text-gray-500">Culls</p><p className="font-medium">{record.total_culls}</p></div>
          <div><p className="text-xs text-gray-500">Mortality</p><p className="font-medium text-red-600">{record.total_mortality}</p></div>
          <div><p className="text-xs text-gray-500">Avg HD%</p><p className="font-medium">{record.avg_hd.toFixed(1)}%</p></div>
          <div><p className="text-xs text-gray-500">Avg E/R</p><p className="font-medium">{record.avg_er.toFixed(2)}</p></div>
          <div><p className="text-xs text-gray-500">Pens</p><p className="font-medium text-xs truncate">{record.pens.join(', ')}</p></div>
        </div>
        <div className="mt-3 flex justify-end gap-1 border-t pt-2">
          <button onClick={() => onView?.(record)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={16} /></button>
          <button onClick={() => onEdit?.(record)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"><Edit2 size={16} /></button>
          <button onClick={() => onDelete?.(record.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
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
          <button onClick={() => onView?.(record)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={16} /></button>
          <button onClick={() => onEdit?.(record)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"><Edit2 size={16} /></button>
          <button onClick={() => onDelete?.(record.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
        <div><p className="text-xs text-gray-500">Eggs</p><p className="font-medium">{record.total_eggs?.toLocaleString() || 0}</p></div>
        <div><p className="text-xs text-gray-500">Feed (kg)</p><p className="font-medium">{record.feed_kg?.toFixed(1) || '0.0'}</p></div>
        <div><p className="text-xs text-gray-500">Broody</p><p className="font-medium">{record.broody_hen || 0}</p></div>
        <div><p className="text-xs text-gray-500">Culls</p><p className="font-medium">{record.culls || 0}</p></div>
        <div><p className="text-xs text-gray-500">Mortality</p><p className={`font-medium ${record.mortality > 0 ? 'text-red-600' : ''}`}>{record.mortality || 0}</p></div>
        <div><p className="text-xs text-gray-500">HD%</p><p className="font-medium">{record.hd_percentage?.toFixed(1) || '0.0'}%</p></div>
        <div><p className="text-xs text-gray-500">E/R</p><p className="font-medium">{record.er_ratio?.toFixed(2) || '0.00'}</p></div>
        <div><p className="text-xs text-gray-500">Staff</p><p className="font-medium truncate">{record.staff_name || '—'}</p></div>
      </div>
    </div>
  );
};

// Pagination component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// Sortable Header Component
const SortableHeader = ({ label, sortKey, currentSort, onSort, icon: Icon }) => (
  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => onSort(sortKey)}>
    <div className="flex items-center gap-1">
      {Icon && <Icon size={12} />}
      {label}
      <ArrowUpDown size={12} className="opacity-50" />
      {currentSort.key === sortKey && (
        <span className="ml-1">{currentSort.direction === 'asc' ? '↑' : '↓'}</span>
      )}
    </div>
  </th>
);

// Loading skeleton
const LoadingSkeleton = () => (
  <div className="space-y-3">
    {Array(6).fill(0).map((_, i) => (
      <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  // Filter records (only for individual view)
  const filteredRecords = useMemo(() => {
    if (!records || groupByDateView) return records;
    if (!searchTerm) return records;
    const lower = searchTerm.toLowerCase();
    return records.filter(r => 
      (r.pen_name || r.pen?.name || '').toLowerCase().includes(lower) ||
      (r.staff_name || '').toLowerCase().includes(lower)
    );
  }, [records, searchTerm, groupByDateView]);

  // Sort records (individual view only)
  const sortedRecords = useMemo(() => {
    if (groupByDateView) return records;
    if (!filteredRecords) return [];
    const sorted = [...filteredRecords];
    sorted.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'date':
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case 'pen':
          aVal = (a.pen_name || a.pen?.name || '').toLowerCase();
          bVal = (b.pen_name || b.pen?.name || '').toLowerCase();
          break;
        case 'eggs':
          aVal = a.total_eggs || 0;
          bVal = b.total_eggs || 0;
          break;
        case 'feed':
          aVal = a.feed_kg || 0;
          bVal = b.feed_kg || 0;
          break;
        case 'broody':
          aVal = a.broody_hen || 0;
          bVal = b.broody_hen || 0;
          break;
        case 'culls':
          aVal = a.culls || 0;
          bVal = b.culls || 0;
          break;
        case 'mortality':
          aVal = a.mortality || 0;
          bVal = b.mortality || 0;
          break;
        case 'hd':
          aVal = a.hd_percentage || 0;
          bVal = b.hd_percentage || 0;
          break;
        case 'er':
          aVal = a.er_ratio || 0;
          bVal = b.er_ratio || 0;
          break;
        case 'staff':
          aVal = (a.staff_name || '').toLowerCase();
          bVal = (b.staff_name || '').toLowerCase();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredRecords, sortConfig, groupByDateView]);

  // Paginate individual records
  const paginatedRecords = useMemo(() => {
    if (groupByDateView) return sortedRecords;
    const start = (currentPage - 1) * rowsPerPage;
    return sortedRecords.slice(start, start + rowsPerPage);
  }, [sortedRecords, currentPage, groupByDateView]);

  const totalPages = useMemo(() => {
    if (groupByDateView) return 1;
    return Math.ceil((sortedRecords?.length || 0) / rowsPerPage);
  }, [sortedRecords, groupByDateView]);

  const requestSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const groupedRecords = groupByDate(records || []);
  const displayRecords = groupByDateView ? groupedRecords : paginatedRecords;
  const isGrouped = groupByDateView;

  if (isLoading) return <LoadingSkeleton />;
  if (!records?.length) return <EmptyState />;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setGroupByDateView(!groupByDateView);
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <Calendar size={16} />
            {groupByDateView ? 'Individual Records' : 'Group by Date'}
          </button>
          {!groupByDateView && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search pen or staff..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 w-64"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table view (only view – no card view for simplicity but can be added) */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <SortableHeader label="Date" sortKey="date" currentSort={sortConfig} onSort={requestSort} />
              {!isGrouped && <SortableHeader label="Pen" sortKey="pen" currentSort={sortConfig} onSort={requestSort} />}
              <SortableHeader label="Eggs" sortKey="eggs" currentSort={sortConfig} onSort={requestSort} icon={Package} />
              <SortableHeader label="Feed (kg)" sortKey="feed" currentSort={sortConfig} onSort={requestSort} icon={TrendingUp} />
              <SortableHeader label="Broody" sortKey="broody" currentSort={sortConfig} onSort={requestSort} />
              <SortableHeader label="Culls" sortKey="culls" currentSort={sortConfig} onSort={requestSort} />
              <SortableHeader label="Mortality" sortKey="mortality" currentSort={sortConfig} onSort={requestSort} icon={AlertCircle} />
              <SortableHeader label="HD%" sortKey="hd" currentSort={sortConfig} onSort={requestSort} />
              <SortableHeader label="E/R" sortKey="er" currentSort={sortConfig} onSort={requestSort} />
              {!isGrouped && <SortableHeader label="Staff" sortKey="staff" currentSort={sortConfig} onSort={requestSort} />}
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
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
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">
                  {isGrouped ? item.total_eggs.toLocaleString() : (item.total_eggs?.toLocaleString() || 0)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">
                  {isGrouped ? item.total_feed.toFixed(1) : (item.feed_kg?.toFixed(1) || '0.0')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">
                  {isGrouped ? item.total_broody : (item.broody_hen || 0)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">
                  {isGrouped ? item.total_culls : (item.culls || 0)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">
                  <span className={isGrouped ? (item.total_mortality > 0 ? 'text-red-600 font-medium' : '') : (item.mortality > 0 ? 'text-red-600 font-medium' : '')}>
                    {isGrouped ? item.total_mortality : (item.mortality || 0)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">
                  {isGrouped ? item.avg_hd.toFixed(1) : (item.hd_percentage?.toFixed(1) || '0.0')}%
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 text-right">
                  {isGrouped ? item.avg_er.toFixed(2) : (item.er_ratio?.toFixed(2) || '0.00')}
                </td>
                {!isGrouped && (
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {item.staff_name || '—'}
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onView?.(item)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" title="View details">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => onEdit?.(item)} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100" title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete?.(item.id)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination (only for individual view) */}
      {!groupByDateView && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}