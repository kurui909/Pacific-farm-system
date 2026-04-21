// src/components/modals/BlockAnalysisModal.jsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Package, TrendingUp, Droplet, Users, Egg, Wheat, Skull, 
  ChevronDown, Download, Calendar, Filter 
} from 'lucide-react';
import { format } from 'date-fns';

// Helper to format numbers
const formatNumber = (num) => (num || 0).toLocaleString();
const formatPercent = (num) => ((num || 0).toFixed(1)) + '%';
const formatDate = (date) => date ? format(new Date(date), 'yyyy-MM-dd') : '';

// Compact MetricCard – mobile‑friendly, scrolls horizontally
const MetricCard = ({ title, value, unit, icon: Icon, color }) => (
  <div className={`rounded-xl bg-gradient-to-br ${color} p-3 shadow-sm flex-shrink-0 w-32 sm:w-auto`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">{title}</p>
        <p className="text-base sm:text-lg font-bold mt-0.5">{value.toLocaleString()}</p>
        {unit && <p className="text-[10px] opacity-60">{unit}</p>}
      </div>
      <Icon size={16} className="opacity-70" />
    </div>
  </div>
);

// Pen list component (collapsible on mobile)
const PenList = ({ pens }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayPens = isExpanded ? pens : pens.slice(0, 3);
  
  if (pens.length === 0) return <span className="text-xs text-gray-400">No pens</span>;
  
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1">
        {displayPens.map(pen => (
          <span key={pen.id} className="inline-block bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5 text-xs">
            {pen.name}
          </span>
        ))}
      </div>
      {pens.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-500 mt-1 hover:underline"
        >
          {isExpanded ? 'Show less' : `+${pens.length - 3} more`}
        </button>
      )}
    </div>
  );
};

export default function BlockAnalysisModal({ isOpen, onClose, blocks, pens, productionRecords }) {
  // Date range state
  const [dateRange, setDateRange] = useState({
    start: formatDate(new Date()),
    end: formatDate(new Date()),
  });
  const [customRange, setCustomRange] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'eggs', 'birds', 'feed'

  // Filter records by selected date range
  const filteredRecords = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return productionRecords;
    return productionRecords.filter(record => {
      const recordDate = formatDate(record.date);
      return recordDate >= dateRange.start && recordDate <= dateRange.end;
    });
  }, [productionRecords, dateRange]);

  // Compute block data based on filtered records
  const blocksWithData = useMemo(() => {
    return blocks.map(block => {
      const blockPens = pens.filter(p => p.block_id === block.id);
      const blockRecords = blockPens.flatMap(pen => 
        filteredRecords.filter(r => r.pen_id === pen.id)
      );
      
      // Sum of closing stock (birds) for the period (use latest per pen? better to sum closing stock of each record)
      // For total birds in the period, we sum the closing stock of all records in the date range.
      const totalBirds = blockRecords.reduce((sum, r) => sum + (r.closing_stock || 0), 0);
      const totalEggs = blockRecords.reduce((sum, r) => sum + (r.total_eggs || 0), 0);
      const totalFeed = blockRecords.reduce((sum, r) => sum + (r.feed_kg || 0), 0);
      const totalMortality = blockRecords.reduce((sum, r) => sum + (r.mortality || 0), 0);
      const avgHd = blockRecords.length ? blockRecords.reduce((sum, r) => sum + (r.hd_percentage || 0), 0) / blockRecords.length : 0;
      
      return {
        ...block,
        totalBirds,
        totalEggs,
        totalFeed,
        totalMortality,
        avgHd,
        penCount: blockPens.length,
        recordCount: blockRecords.length,
        penList: blockPens.map(p => ({ id: p.id, name: p.name })),
      };
    }).filter(b => b.penCount > 0);
  }, [blocks, pens, filteredRecords]);

  // Sort blocks
  const sortedBlocks = useMemo(() => {
    const sorted = [...blocksWithData];
    switch (sortBy) {
      case 'eggs':
        sorted.sort((a, b) => b.totalEggs - a.totalEggs);
        break;
      case 'birds':
        sorted.sort((a, b) => b.totalBirds - a.totalBirds);
        break;
      case 'feed':
        sorted.sort((a, b) => b.totalFeed - a.totalFeed);
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [blocksWithData, sortBy]);

  // Export to CSV
  const handleExport = () => {
    if (sortedBlocks.length === 0) return;
    
    const headers = ['Block', 'Total Birds', 'Total Eggs', 'Feed (kg)', 'Mortality', 'Avg HD%', 'Pens', 'Records'];
    const rows = sortedBlocks.map(block => [
      block.name,
      block.totalBirds,
      block.totalEggs,
      block.totalFeed,
      block.totalMortality,
      block.avgHd.toFixed(1),
      block.penList.map(p => p.name).join('; '),
      block.recordCount,
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `block_analysis_${dateRange.start}_to_${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reset to today
  const setToday = () => {
    const today = formatDate(new Date());
    setDateRange({ start: today, end: today });
    setCustomRange(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header with date controls */}
          <div className="sticky top-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Block Analysis</h3>
              <p className="text-xs text-gray-500">Aggregated metrics by block for selected period</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Date range selector */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={setToday}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${!customRange ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setCustomRange(true)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${customRange ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  <Calendar size={12} className="inline mr-1" /> Range
                </button>
              </div>
              
              {customRange && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                  />
                  <span className="text-xs">—</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                  />
                </div>
              )}
              
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-3 pr-7 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="eggs">Sort by Eggs</option>
                  <option value="birds">Sort by Birds</option>
                  <option value="feed">Sort by Feed</option>
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              
              {/* Export button */}
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Download size={14} /> CSV
              </button>
              
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {sortedBlocks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="mx-auto h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">No data for selected period.</p>
                <p className="text-xs mt-1">Try changing the date range.</p>
              </div>
            ) : (
              sortedBlocks.map(block => (
                <div key={block.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Package size={18} className="text-blue-500" />
                      <h4 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">{block.name}</h4>
                      <span className="text-xs text-gray-500">({block.penCount} pens)</span>
                    </div>
                    <span className="text-xs text-gray-500">{block.recordCount} records</span>
                  </div>
                  
                  {/* Metrics – horizontally scrollable on mobile */}
                  <div className="overflow-x-auto pb-2 -mx-1 px-1">
                    <div className="flex gap-3 min-w-max md:grid md:grid-cols-5 md:gap-4">
                      <MetricCard
                        title="Total Birds"
                        value={block.totalBirds}
                        unit="birds"
                        icon={Users}
                        color="from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700"
                      />
                      <MetricCard
                        title="Total Eggs"
                        value={block.totalEggs}
                        unit="eggs"
                        icon={Egg}
                        color="from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 text-amber-700"
                      />
                      <MetricCard
                        title="Feed (kg)"
                        value={block.totalFeed}
                        unit="kg"
                        icon={Wheat}
                        color="from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 text-green-700"
                      />
                      <MetricCard
                        title="Mortality"
                        value={block.totalMortality}
                        unit="birds"
                        icon={Skull}
                        color="from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 text-red-700"
                      />
                      <MetricCard
                        title="Avg HD%"
                        value={block.avgHd.toFixed(1)}
                        unit="%"
                        icon={TrendingUp}
                        color="from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-700"
                      />
                    </div>
                  </div>
                  
                  {/* Pen names list */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 mb-2">Pens in this block</p>
                    <PenList pens={block.penList} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}