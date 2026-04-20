// src/components/production/ProductionTable.jsx
import { useState, useMemo } from 'react';
import { Eye, Edit2, Trash2, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { format } from 'date-fns';

const formatNumber = (num) => (num || 0).toLocaleString();
const formatPercent = (num) => ((num || 0).toFixed(1)) + '%';
const formatRatio = (num) => ((num || 0).toFixed(2));

export default function ProductionTable({ records, pens, onEdit, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Create a map of pen_id -> pen name
  const penMap = useMemo(() => {
    const map = {};
    pens.forEach(pen => { map[pen.id] = pen.name; });
    return map;
  }, [pens]);

  // Filter records by search term (pen name or staff)
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const lowerTerm = searchTerm.toLowerCase();
    return records.filter(record => 
      (penMap[record.pen_id] || '').toLowerCase().includes(lowerTerm) ||
      (record.staff_name || '').toLowerCase().includes(lowerTerm)
    );
  }, [records, searchTerm, penMap]);

  // Sort records
  const sortedRecords = useMemo(() => {
    const sorted = [...filteredRecords];
    sorted.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'date':
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case 'pen':
          aVal = penMap[a.pen_id] || '';
          bVal = penMap[b.pen_id] || '';
          break;
        case 'eggs':
          aVal = a.total_eggs || 0;
          bVal = b.total_eggs || 0;
          break;
        case 'feed':
          aVal = a.feed_kg || 0;
          bVal = b.feed_kg || 0;
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
          aVal = a.staff_name || '';
          bVal = b.staff_name || '';
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredRecords, sortField, sortDirection, penMap]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by pen or staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                <div className="flex items-center gap-1">Date <SortIcon field="date" /></div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => handleSort('pen')}>
                <div className="flex items-center gap-1">Pen <SortIcon field="pen" /></div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => handleSort('eggs')}>
                <div className="flex items-center justify-end gap-1">Eggs <SortIcon field="eggs" /></div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => handleSort('feed')}>
                <div className="flex items-center justify-end gap-1">Feed (kg) <SortIcon field="feed" /></div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => handleSort('mortality')}>
                <div className="flex items-center justify-end gap-1">Mortality <SortIcon field="mortality" /></div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => handleSort('hd')}>
                <div className="flex items-center justify-end gap-1">HD% <SortIcon field="hd" /></div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => handleSort('er')}>
                <div className="flex items-center justify-end gap-1">E/R <SortIcon field="er" /></div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer" onClick={() => handleSort('staff')}>
                <div className="flex items-center gap-1">Staff <SortIcon field="staff" /></div>
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {sortedRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {format(new Date(record.date), 'MMM dd, yyyy')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {penMap[record.pen_id] || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300">
                  {formatNumber(record.total_eggs)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300">
                  {record.feed_kg?.toFixed(1) || '0.0'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300">
                  <span className={record.mortality > 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                    {record.mortality || 0}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300">
                  {formatPercent(record.hd_percentage)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300">
                  {formatRatio(record.er_ratio)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {record.staff_name || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onEdit(record)}
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(record.id)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
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
      {sortedRecords.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">No records match your search.</div>
      )}
    </div>
  );
}