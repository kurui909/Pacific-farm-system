// src/components/production/BlockGroupView.jsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const formatNumber = (num) => (num || 0).toLocaleString();
const formatPercent = (num) => ((num || 0).toFixed(1)) + '%';
const formatRatio = (num) => ((num || 0).toFixed(2));
const formatDate = (date) => date ? format(new Date(date), 'MMM dd, yyyy') : '—';

// Single Pen Card inside a block
const PenProductionCard = ({ pen, records, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalEggs = records.reduce((sum, r) => sum + (r.total_eggs || 0), 0);
  const totalFeed = records.reduce((sum, r) => sum + (r.feed_kg || 0), 0);
  const totalMortality = records.reduce((sum, r) => sum + (r.mortality || 0), 0);
  const avgHd = records.length ? records.reduce((sum, r) => sum + (r.hd_percentage || 0), 0) / records.length : 0;
  const avgEr = records.length ? records.reduce((sum, r) => sum + (r.er_ratio || 0), 0) / records.length : 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-3 text-left bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex justify-between items-center">
        <div><span className="font-medium text-gray-900 dark:text-white">{pen.name}</span><span className="ml-2 text-xs text-gray-500">({records.length} records)</span></div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-600 dark:text-gray-400">{formatNumber(totalEggs)} eggs</span>
          <span className="text-gray-600 dark:text-gray-400">{formatPercent(avgHd)} HD</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-right">Eggs</th><th className="px-3 py-2 text-right">Feed (kg)</th><th className="px-3 py-2 text-right">Mortality</th><th className="px-3 py-2 text-right">HD%</th><th className="px-3 py-2 text-right">E/R</th><th className="px-3 py-2 text-right">Staff</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {sortedRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(record.date)}</td>
                      <td className="px-3 py-2 text-right">{formatNumber(record.total_eggs)}</td>
                      <td className="px-3 py-2 text-right">{record.feed_kg?.toFixed(1) || '0.0'}</td>
                      <td className="px-3 py-2 text-right">{record.mortality || 0}</td>
                      <td className="px-3 py-2 text-right">{formatPercent(record.hd_percentage)}</td>
                      <td className="px-3 py-2 text-right">{formatRatio(record.er_ratio)}</td>
                      <td className="px-3 py-2 text-right">{record.staff_name || '—'}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => onEdit(record)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                          <button onClick={() => onDelete(record.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Block Summary Card
const BlockSummaryCard = ({ block, pens, recordsByPen, onEditRecord, onDeleteRecord }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const blockPens = pens.filter(p => p.block_id === block.id);
  const blockRecords = blockPens.flatMap(pen => recordsByPen[pen.id] || []);
  const totalBirds = blockPens.reduce((sum, p) => sum + (p.current_birds || p.initial_birds || 0), 0);
  const totalEggs = blockRecords.reduce((sum, r) => sum + (r.total_eggs || 0), 0);
  const totalFeed = blockRecords.reduce((sum, r) => sum + (r.feed_kg || 0), 0);
  const totalMortality = blockRecords.reduce((sum, r) => sum + (r.mortality || 0), 0);
  const avgHd = blockRecords.length ? blockRecords.reduce((sum, r) => sum + (r.hd_percentage || 0), 0) / blockRecords.length : 0;
  const avgEr = blockRecords.length ? blockRecords.reduce((sum, r) => sum + (r.er_ratio || 0), 0) / blockRecords.length : 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{block.name}</h3>
              <span className="text-sm text-gray-500">({blockPens.length} pens, {formatNumber(totalBirds)} birds)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 text-sm">
              <div><p className="text-xs text-gray-500">Total Eggs</p><p className="font-semibold">{formatNumber(totalEggs)}</p></div>
              <div><p className="text-xs text-gray-500">Feed (kg)</p><p className="font-semibold">{formatNumber(totalFeed)} kg</p></div>
              <div><p className="text-xs text-gray-500">Mortality</p><p className="font-semibold text-red-600">{formatNumber(totalMortality)}</p></div>
              <div><p className="text-xs text-gray-500">Avg HD%</p><p className="font-semibold">{formatPercent(avgHd)}</p></div>
              <div><p className="text-xs text-gray-500">Avg E/R</p><p className="font-semibold">{formatRatio(avgEr)}</p></div>
            </div>
          </div>
          <div className="text-gray-400">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-4 space-y-3">
              {blockPens.map(pen => {
                const penRecords = recordsByPen[pen.id] || [];
                if (penRecords.length === 0) return <div key={pen.id} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">🐔 {pen.name} – No production records</div>;
                return <PenProductionCard key={pen.id} pen={pen} records={penRecords} onEdit={onEditRecord} onDelete={onDeleteRecord} />;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Ungrouped Pens Section
const UngroupedPensSection = ({ pens, recordsByPen, onEditRecord, onDeleteRecord }) => {
  const ungroupedPens = pens.filter(p => !p.block_id && (recordsByPen[p.id]?.length > 0));
  if (ungroupedPens.length === 0) return null;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      <div className="p-5 bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-bold text-gray-900 dark:text-white">Ungrouped Pens</h3></div>
      <div className="p-4 space-y-3">{ungroupedPens.map(pen => <PenProductionCard key={pen.id} pen={pen} records={recordsByPen[pen.id]} onEdit={onEditRecord} onDelete={onDeleteRecord} />)}</div>
    </div>
  );
};

export default function BlockGroupView({ records, pens, blocks, onEditRecord, onDeleteRecord }) {
  const recordsByPen = useMemo(() => {
    const map = {};
    records.forEach(record => { if (!map[record.pen_id]) map[record.pen_id] = []; map[record.pen_id].push(record); });
    return map;
  }, [records]);
  const blocksWithRecords = blocks.filter(block => {
    const blockPenIds = pens.filter(p => p.block_id === block.id).map(p => p.id);
    return blockPenIds.some(pid => recordsByPen[pid]?.length > 0);
  });
  return (
    <div className="space-y-4">
      {blocksWithRecords.map(block => <BlockSummaryCard key={block.id} block={block} pens={pens} recordsByPen={recordsByPen} onEditRecord={onEditRecord} onDeleteRecord={onDeleteRecord} />)}
      <UngroupedPensSection pens={pens} recordsByPen={recordsByPen} onEditRecord={onEditRecord} onDeleteRecord={onDeleteRecord} />
    </div>
  );
}