// src/pages/Production/components/ProductionHeader.jsx
import { Plus, ClipboardList, Download, RefreshCw, LayoutGrid, List } from 'lucide-react';

export const ProductionHeader = ({
  onDailyEntry,
  onBlockReport,
  onExport,
  isExporting,
  exportFormat,
  setExportFormat,
  viewMode,
  setViewMode,
  onRefresh,
  isRefreshing,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Production Records</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track and manage daily production entries</p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={onDailyEntry} className="btn-primary flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-transform hover:scale-105">
        <Plus size={18} /> <span className="hidden sm:inline">Daily Entry</span>
      </button>
      <button onClick={onBlockReport} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition">
        <ClipboardList size={18} /> <span className="hidden sm:inline">Per Block</span>
      </button>

      {/* Export dropdown */}
      <div className="relative group">
        <button onClick={onExport} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl shadow-sm hover:shadow disabled:opacity-50">
          {isExporting ? <div className="h-4 w-4 border-2 border-t-blue-600 rounded-full animate-spin" /> : <Download size={18} />}
          <span>Export {exportFormat.toUpperCase()}</span>
        </button>
        <div className="absolute right-0 mt-2 w-28 bg-white rounded-xl shadow-lg border hidden group-hover:block z-10">
          <button onClick={() => setExportFormat('pdf')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-t-xl">PDF</button>
          <button onClick={() => setExportFormat('csv')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-b-xl">CSV</button>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
          <List size={18} />
        </button>
        <button onClick={() => setViewMode('cards')} className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
          <LayoutGrid size={18} />
        </button>
      </div>

      <button onClick={onRefresh} disabled={isRefreshing} className="p-2 rounded-xl bg-white shadow-sm hover:shadow hover:rotate-180 transition-all">
        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
      </button>
    </div>
  </div>
);