// src/pages/supervisor/Production.jsx
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Download, FileText, FileSpreadsheet, RefreshCw,
  Calendar, Filter, X, Layers, Table2, Grid3x3, TrendingUp, Package,
  Droplet, AlertCircle, Users, EggIcon, Wheat, Skull
} from 'lucide-react';
import { penService, productionService, reportsService, blockService } from '../../services/api';
import ProductionForm from '../../components/forms/ProductionForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import BlockModal from '../../components/modals/BlockModal';
import ProductionTable from '../../components/production/ProductionTable';
import BlockGroupView from '../../components/production/BlockGroupView';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

// ---------- Helper Functions ----------
const formatNumber = (num) => (num || 0).toLocaleString();
const formatPercent = (num) => ((num || 0).toFixed(1)) + '%';
const formatRatio = (num) => ((num || 0).toFixed(2));

// ---------- Top Metrics Cards Component ----------
const MetricsCards = ({ records, pens }) => {
  // Calculate totals from the filtered records
  const totalEggs = records.reduce((sum, r) => sum + (r.total_eggs || 0), 0);
  const totalFeed = records.reduce((sum, r) => sum + (r.feed_kg || 0), 0);
  const totalMortality = records.reduce((sum, r) => sum + (r.mortality || 0), 0);
  const avgHd = records.length ? records.reduce((sum, r) => sum + (r.hd_percentage || 0), 0) / records.length : 0;
  const avgEr = records.length ? records.reduce((sum, r) => sum + (r.er_ratio || 0), 0) / records.length : 0;
  
  // Total birds across all pens (or filtered pens?)
  const totalBirds = pens.reduce((sum, p) => sum + (p.current_birds || p.initial_birds || 0), 0);

  const cards = [
    { label: 'Total Eggs', value: formatNumber(totalEggs), icon: EggIcon, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Feed Consumed', value: `${formatNumber(totalFeed)} kg`, icon: Wheat, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Mortality', value: formatNumber(totalMortality), icon: Skull, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Avg HD%', value: formatPercent(avgHd), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Avg E/R', value: formatRatio(avgEr), icon: Droplet, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Total Birds', value: formatNumber(totalBirds), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border border-gray-200 dark:border-gray-700 ${card.bg} p-4 shadow-sm`}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">{card.label}</p>
            <card.icon size={18} className={card.color} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

// ---------- Loading Skeleton ----------
const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
    </div>
    <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
    <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
  </div>
);

// ---------- Main Component ----------
export default function Production() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'blocks'
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  
  // Filters
  const [dateRange, setDateRange] = useState({
    start: searchParams.get('startDate') || '',
    end: searchParams.get('endDate') || '',
  });
  const [selectedBlock, setSelectedBlock] = useState(searchParams.get('block') || 'all');
  const [selectedPen, setSelectedPen] = useState(searchParams.get('pen') || 'all');

  // Data queries
  const { data: pens = [], isLoading: pensLoading } = useQuery({
    queryKey: ['pens-summary'],
    queryFn: penService.getSummary,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks'],
    queryFn: blockService.getAll,
  });

  const { data: allRecords = [], isLoading: recordsLoading, refetch } = useQuery({
    queryKey: ['allProduction'],
    queryFn: () => productionService.getAll({}),
  });

  // Filter records
  const filteredRecords = useMemo(() => {
    let filtered = allRecords;
    
    // Filter by pen (if a specific pen is selected)
    if (selectedPen !== 'all') {
      filtered = filtered.filter(r => String(r.pen_id) === String(selectedPen));
    } 
    // Otherwise filter by block (if a block is selected)
    else if (selectedBlock !== 'all') {
      const blockPenIds = pens.filter(p => String(p.block_id) === String(selectedBlock)).map(p => p.id);
      filtered = filtered.filter(r => blockPenIds.includes(r.pen_id));
    }
    
    // Date range
    if (dateRange.start) filtered = filtered.filter(r => new Date(r.date) >= new Date(dateRange.start));
    if (dateRange.end) filtered = filtered.filter(r => new Date(r.date) <= new Date(dateRange.end));
    
    return filtered;
  }, [allRecords, selectedPen, selectedBlock, dateRange.start, dateRange.end, pens]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: productionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['allProduction']);
      setIsFormOpen(false);
      setEditingRecord(null);
      toast.success('Production recorded');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to record production'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['allProduction']);
      setIsFormOpen(false);
      setEditingRecord(null);
      toast.success('Production updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update production'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['allProduction']);
      setDeletingId(null);
      toast.success('Record deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete record'),
  });

  // Handlers
  const handleSubmit = (formData) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleDeleteRecord = (id) => setDeletingId(id);

  const clearFilters = () => {
    setSelectedPen('all');
    setSelectedBlock('all');
    setDateRange({ start: '', end: '' });
    setSearchParams({});
  };

  const hasActiveFilters = selectedPen !== 'all' || selectedBlock !== 'all' || dateRange.start || dateRange.end;

  // Export
  const handleExport = async () => {
    if (!filteredRecords.length) {
      toast.error('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      const params = {
        report_type: 'production',
        start_date: dateRange.start || undefined,
        end_date: dateRange.end || undefined,
        pen_id: selectedPen !== 'all' ? selectedPen : undefined,
        block_id: selectedBlock !== 'all' ? selectedBlock : undefined,
        format: exportFormat,
      };
      const response = exportFormat === 'pdf'
        ? await reportsService.generatePDF(params)
        : await reportsService.generateCSV(params);
      const blob = new Blob([response.data], { type: exportFormat === 'pdf' ? 'application/pdf' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `production_${exportFormat}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported as ${exportFormat.toUpperCase()}`);
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = pensLoading || recordsLoading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production Records</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track daily egg production, feed, mortality, and efficiency metrics
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsBlockModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <Layers size={16} /> Blocks
          </button>
          <button
            onClick={() => { setEditingRecord(null); setIsFormOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={16} /> Add Record
          </button>
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <button
              onClick={() => setExportFormat('csv')}
              className={`px-3 py-2 text-sm rounded-l-lg ${exportFormat === 'csv' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''}`}
            >
              <FileSpreadsheet size={16} />
            </button>
            <button
              onClick={() => setExportFormat('pdf')}
              className={`px-3 py-2 text-sm rounded-r-lg ${exportFormat === 'pdf' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''}`}
            >
              <FileText size={16} />
            </button>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <Download size={16} /> Export
          </button>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            <RefreshCw size={16} className={recordsLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {!isLoading && <MetricsCards records={filteredRecords} pens={pens} />}

      {/* Filters & View Toggle */}
      <div className="rounded-xl border border-gray-200 bg-white/80 p-4 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Block</label>
            <select
              value={selectedBlock}
              onChange={(e) => { setSelectedBlock(e.target.value); setSelectedPen('all'); }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            >
              <option value="all">All Blocks</option>
              {blocks.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}
              <option value="ungrouped">Ungrouped Pens</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Or by Pen</label>
            <select
              value={selectedPen}
              onChange={(e) => { setSelectedPen(e.target.value); setSelectedBlock('all'); }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            >
              <option value="all">All Pens</option>
              {pens.map(pen => <option key={pen.id} value={pen.id}>{pen.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 mt-2">
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
        
        {/* View Toggle */}
        <div className="flex justify-end border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'table' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <Table2 size={14} /> Table View
            </button>
            <button
              onClick={() => setViewMode('blocks')}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'blocks' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <Grid3x3 size={14} /> Blocks & Pens
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-600 dark:bg-gray-800/30">
          <Package className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No production records</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Adjust your filters or create a new record using the "Add Record" button.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <ProductionTable
          records={filteredRecords}
          pens={pens}
          onEdit={handleEditRecord}
          onDelete={handleDeleteRecord}
        />
      ) : (
        <BlockGroupView
          records={filteredRecords}
          pens={pens}
          blocks={blocks}
          onEditRecord={handleEditRecord}
          onDeleteRecord={handleDeleteRecord}
        />
      )}

      {/* Modals */}
      <ProductionForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingRecord(null); }}
        onSubmit={handleSubmit}
        initialData={editingRecord}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        pens={pens}
      />

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deleteMutation.mutate(deletingId)}
        title="Delete Production Record"
        message="This action cannot be undone. Are you sure you want to delete this record?"
        confirmText="Delete"
        isDestructive
      />

      <BlockModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
      />
    </div>
  );
}