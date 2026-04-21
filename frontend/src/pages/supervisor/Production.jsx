// src/pages/supervisor/Production.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  RotateCcw,
  Layers,
  Download,
  FileText,
  FileSpreadsheet,
  Grid3x3,
  List,
  Search,
  Filter,
  X,
  TrendingUp,
  Users,
  Egg,
  Wheat,
  Skull,
  Droplet,
  AlertCircle,
  Package,
  RefreshCw,
  Table2
} from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import ProductionForm from '../../components/forms/ProductionForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import BlockAnalysisModal from './components/BlockAnalysisModal';
import { ViewProductionModal } from './components/ViewProductionModal';
import ProductionTable from './components/ProductionTable';
import BlockGroupView from './components/BlockGroupView';

// Services
import { penService, productionService, reportsService, blockService } from '../../services/api';

const Production = () => {
  const queryClient = useQueryClient();

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBlockAnalysisOpen, setIsBlockAnalysisOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('productionViewMode') || 'table');
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedPen, setSelectedPen] = useState('all');

  // Real-time data
  // const [realTimeStats, setRealTimeStats] = useState({});

  // Queries
  const { data: pens = [], isLoading: pensLoading } = useQuery({
    queryKey: ['pens-summary'],
    queryFn: async () => {
      const response = await penService.getSummary();
      return Array.isArray(response) ? response : [];
    },
    refetchInterval: 30000,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks'],
    queryFn: async () => {
      const response = await blockService.getAll();
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: allRecords = [], isLoading: recordsLoading, error: recordsError, refetch } = useQuery({
    queryKey: ['allProduction'],
    queryFn: async () => {
      const response = await productionService.getAll({});
      return Array.isArray(response) ? response : [];
    },
    refetchInterval: 60000,
  });

  // Filtered records
  const filteredRecords = useMemo(() => {
    let filtered = allRecords;
    if (selectedPen !== 'all') {
      filtered = filtered.filter(r => String(r.pen_id) === String(selectedPen));
    }
    if (dateRange.start) {
      filtered = filtered.filter(r => new Date(r.date) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(r => new Date(r.date) <= new Date(dateRange.end));
    }
    if (searchInput) {
      const lower = searchInput.toLowerCase();
      filtered = filtered.filter(r =>
        (r.pen_name || r.pen?.name || '').toLowerCase().includes(lower) ||
        (r.staff_name || '').toLowerCase().includes(lower)
      );
    }
    return filtered;
  }, [allRecords, selectedPen, dateRange, searchInput]);

  // Statistics
  const stats = useMemo(() => {
    const totalEggs = filteredRecords.reduce((sum, r) => sum + (r.total_eggs || 0), 0);
    const totalFeed = filteredRecords.reduce((sum, r) => sum + (r.feed_kg || 0), 0);
    const totalMortality = filteredRecords.reduce((sum, r) => sum + (r.mortality || 0), 0);
    const avgHd = filteredRecords.length ? filteredRecords.reduce((sum, r) => sum + (r.hd_percentage || 0), 0) / filteredRecords.length : 0;
    const avgEr = filteredRecords.length ? filteredRecords.reduce((sum, r) => sum + (r.er_ratio || 0), 0) / filteredRecords.length : 0;
    const totalBirds = pens.reduce((sum, p) => sum + (p.current_birds || p.initial_birds || 0), 0);

    return { totalEggs, totalFeed, totalMortality, avgHd, avgEr, totalBirds };
  }, [filteredRecords, pens]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: productionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProduction'] });
      setIsFormOpen(false);
      setEditingRecord(null);
      toast.success('✅ Production recorded successfully!');
    },
    onError: (error) => toast.error(`❌ Failed to record production: ${error.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProduction'] });
      setIsFormOpen(false);
      setEditingRecord(null);
      toast.success('✅ Production updated successfully!');
    },
    onError: (error) => toast.error(`❌ Failed to update production: ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: productionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allProduction'] });
      setDeletingId(null);
      toast.success('✅ Record deleted successfully!');
    },
    onError: (error) => toast.error(`❌ Failed to delete record: ${error.message}`),
  });

  // Handlers
  const handleSubmit = (formData) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => setDeletingId(id);
  const handleView = (record) => setViewingRecord(record);

  const clearFilters = () => {
    setSearchInput('');
    setSelectedPen('all');
    setDateRange({ start: '', end: '' });
  };

  const handleRefresh = () => {
    refetch();
    toast.success('🔄 Data refreshed!');
  };

  const handleExport = async () => {
    if (!filteredRecords.length) {
      toast.error('No data to export');
      return;
    }
    setIsExporting(true);
    try {
      const params = {
        start_date: dateRange.start || undefined,
        end_date: dateRange.end || undefined,
        pen_id: selectedPen !== 'all' ? selectedPen : undefined,
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
      toast.success(`📁 Exported as ${exportFormat.toUpperCase()}!`);
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'table' ? 'blocks' : 'table';
    setViewMode(newMode);
    localStorage.setItem('productionViewMode', newMode);
  };

  // Components
  const StatCard = ({ icon: Icon, title, value, unit, accentColor = 'bg-blue-500' }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex">
        <div className={`w-1 rounded-l-xl ${accentColor}`} />
        <div className="flex-1 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {title}
              </p>
              <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                {value}
                {unit ? (
                  <span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {unit}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500">
              <Icon size={18} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl animate-pulse">
            <div className="h-8 bg-gray-400 dark:bg-gray-600 rounded mb-4"></div>
            <div className="h-12 bg-gray-400 dark:bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );

  const hasFilters = searchInput || selectedPen !== 'all' || dateRange.start || dateRange.end;
  const isLoading = pensLoading || recordsLoading;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <LoadingSkeleton />
      </div>
    );
  }

  if (recordsError) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto text-center">
        <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Production Records</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{recordsError.message}</p>
        <button
          onClick={() => refetch()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
        >
          <RotateCcw size={18} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">📊 Production Records</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Daily egg production, feed, mortality & efficiency tracking</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsBlockAnalysisOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <Layers size={18} />
              <span className="hidden sm:inline">Blocks</span>
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Record</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard icon={Egg} title="Total Eggs" value={stats.totalEggs.toLocaleString()} accentColor="bg-amber-400" />
          <StatCard icon={Wheat} title="Feed (kg)" value={stats.totalFeed.toLocaleString()} accentColor="bg-emerald-400" />
          <StatCard icon={Skull} title="Mortality" value={stats.totalMortality.toLocaleString()} accentColor="bg-red-400" />
          <StatCard icon={TrendingUp} title="Avg HD%" value={stats.avgHd.toFixed(1)} unit="%" accentColor="bg-sky-400" />
          <StatCard icon={Droplet} title="Avg E/R" value={stats.avgEr.toFixed(2)} accentColor="bg-violet-400" />
          <StatCard icon={Users} title="Total Birds" value={stats.totalBirds.toLocaleString()} accentColor="bg-indigo-400" />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 min-w-0 w-full lg:w-auto">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="🔍 Search by pen name or staff..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <select
                value={selectedPen}
                onChange={(e) => setSelectedPen(e.target.value)}
                className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">🏠 All Pens</option>
                {pens.map(pen => (
                  <option key={pen.id} value={pen.id}>🏠 {pen.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="End Date"
              />
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-red-200 dark:bg-red-900/20 hover:bg-red-300 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <X size={18} />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            📋 Showing <span className="font-bold text-gray-900 dark:text-white">{filteredRecords.length}</span> of <span className="font-bold text-gray-900 dark:text-white">{allRecords.length}</span> records
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
              <button
                onClick={() => setExportFormat('csv')}
                className={`px-3 py-2 text-sm rounded-l-lg transition-colors ${exportFormat === 'csv' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <FileSpreadsheet size={16} />
              </button>
              <button
                onClick={() => setExportFormat('pdf')}
                className={`px-3 py-2 text-sm rounded-r-lg transition-colors ${exportFormat === 'pdf' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <FileText size={16} />
              </button>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <Download size={18} className={isExporting ? 'animate-pulse' : ''} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleRefresh}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
              disabled={isLoading}
            >
              <RotateCcw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={toggleViewMode}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              {viewMode === 'table' ? <Grid3x3 size={18} /> : <List size={18} />}
              <span className="hidden sm:inline">{viewMode === 'table' ? 'Blocks' : 'Table'}</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No production records found</p>
            <p className="text-sm mt-2">Try adjusting your filters or add a new record</p>
          </div>
        ) : viewMode === 'table' ? (
          <ProductionTable
            records={filteredRecords}
            pens={pens}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <BlockGroupView
            records={filteredRecords}
            pens={pens}
            blocks={blocks}
            onViewRecord={handleView}
            onEditRecord={handleEdit}
            onDeleteRecord={handleDelete}
          />
        )}

        {/* Modals */}
        <AnimatePresence>
          {isFormOpen && (
            <ProductionForm
              isOpen={isFormOpen}
              onClose={() => {
                setIsFormOpen(false);
                setEditingRecord(null);
              }}
              onSubmit={handleSubmit}
              initialData={editingRecord}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
              pens={pens}
            />
          )}

          {deletingId && (
            <ConfirmDialog
              title="Delete Production Record"
              message="Are you sure you want to delete this production record? This action cannot be undone."
              onConfirm={() => deleteMutation.mutate(deletingId)}
              onCancel={() => setDeletingId(null)}
              isLoading={deleteMutation.isPending}
              confirmText="Delete"
              confirmColor="red"
            />
          )}

          {isBlockAnalysisOpen && (
            <BlockAnalysisModal
              isOpen={isBlockAnalysisOpen}
              onClose={() => setIsBlockAnalysisOpen(false)}
              blocks={blocks}
              pens={pens}
              productionRecords={allRecords}
            />
          )}

          {viewingRecord && (
            <ViewProductionModal
              record={viewingRecord}
              onClose={() => setViewingRecord(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Production;