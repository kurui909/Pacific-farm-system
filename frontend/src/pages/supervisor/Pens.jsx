// src/pages/supervisor/Pens.jsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, RotateCcw, Layers, Download, Grid3x3, List, Search, X,
  AlertTriangle, TrendingUp, Users, Percent, FolderTree
} from 'lucide-react';
import toast from 'react-hot-toast';
import PenTable from '../../components/tables/PenTable';
import PenForm from '../../components/forms/PenForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import MortalityLogModal from '../../components/modals/MortalityLogModal';
import EnvironmentalModal from '../../components/modals/EnvironmentalModal';
import BlockManagementModal from '../../components/modals/BlockManagementModal';
import { penService, reportsService, blockService } from '../../services/api';
import { formatNumber } from '../../utils/formatters';

// Compact stat card
const StatCard = ({ icon: Icon, title, value, unit, color = 'blue' }) => {
  const colorMap = {
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 text-blue-700 dark:text-blue-300',
    green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 text-green-700 dark:text-green-300',
    amber: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 text-amber-700 dark:text-amber-300',
    purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 text-purple-700 dark:text-purple-300',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl bg-gradient-to-br ${colorMap[color]} p-3 shadow-sm border border-current/10`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide opacity-70">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{formatNumber(value)}</p>
          {unit && <p className="text-[10px] opacity-60">{unit}</p>}
        </div>
        <Icon className="h-5 w-5 opacity-60" />
      </div>
    </motion.div>
  );
};

// Skeleton loader (compact)
const PensSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />)}
    </div>
    <div className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
    <div className="flex gap-2">
      <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="ml-auto h-9 w-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
    <div className="h-80 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-900/20">
    <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-red-600" />
    <h3 className="font-semibold text-red-900 dark:text-red-300">Failed to load pens</h3>
    <p className="mb-3 text-sm text-red-700">{error?.message}</p>
    <button onClick={onRetry} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700">
      <RotateCcw size={14} className="inline mr-1" /> Retry
    </button>
  </div>
);

export default function Pens() {
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPen, setEditingPen] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('penViewMode') || 'table');
  const [showMortalityModal, setShowMortalityModal] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [selectedPenId, setSelectedPenId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [housingFilter, setHousingFilter] = useState('all');
  const [blockFilter, setBlockFilter] = useState('all');

  const [realTimeEnv, setRealTimeEnv] = useState({});
  const [latestProduction, setLatestProduction] = useState({});

  const { data: pens, isLoading, error, refetch } = useQuery({
    queryKey: ['pens-summary'],
    queryFn: penService.getSummary,
    refetchInterval: 30000,
  });

  const { data: blocks = [], refetch: refetchBlocks } = useQuery({
    queryKey: ['blocks'],
    queryFn: blockService.getAll,
  });

  const { data: fullPenData, isLoading: isPenLoading } = useQuery({
    queryKey: ['pen-detail', editingPen?.id],
    queryFn: () => editingPen?.id ? penService.getById(editingPen.id) : null,
    enabled: !!editingPen?.id && isFormOpen,
    staleTime: 1000,
  });

  // Real‑time env polling
  useEffect(() => {
    if (!pens) return;
    const fetchEnv = async () => {
      const envData = {}, prodData = {};
      for (const pen of pens) {
        try {
          const res = await penService.getEnvironment(pen.id);
          envData[pen.id] = res;
          prodData[pen.id] = res;
        } catch (err) { console.warn(err); }
      }
      setRealTimeEnv(envData);
      setLatestProduction(prodData);
    };
    fetchEnv();
    const interval = setInterval(fetchEnv, 60000);
    return () => clearInterval(interval);
  }, [pens]);

  // Critical alerts
  useEffect(() => {
    if (!pens) return;
    const critical = pens.filter(p => {
      const env = realTimeEnv[p.id];
      return env?.temperature > 35 || env?.ammonia > 30;
    });
    if (critical.length) toast.error(`⚠️ Alert: ${critical.map(p => p.name).join(', ')}`);
  }, [realTimeEnv, pens]);

  const filteredPens = useMemo(() => {
    if (!pens) return [];
    return pens.filter(pen => {
      if (searchTerm && !pen.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (statusFilter !== 'all' && pen.status !== statusFilter) return false;
      if (housingFilter !== 'all' && pen.housing_system !== housingFilter) return false;
      if (blockFilter !== 'all' && pen.block_id !== parseInt(blockFilter)) return false;
      return true;
    });
  }, [pens, searchTerm, statusFilter, housingFilter, blockFilter]);

  const stats = useMemo(() => {
    if (!pens) return { totalPens: 0, totalBirds: 0, avgOccupancy: 0, avgDensity: 0 };
    const getBirds = (pen) => latestProduction[pen.id]?.closing_stock ?? pen.current_birds ?? pen.initial_birds ?? 0;
    const totalBirds = pens.reduce((s, p) => s + getBirds(p), 0);
    const totalCapacity = pens.reduce((s, p) => s + (p.capacity || 0), 0);
    const avgOccupancy = totalCapacity ? Math.round((totalBirds / totalCapacity) * 100) : 0;
    const totalArea = pens.reduce((s, p) => s + (p.floor_area_sq_m || 0), 0);
    const avgDensity = totalArea ? (totalBirds / totalArea).toFixed(1) : 0;
    return { totalPens: pens.length, totalBirds, avgOccupancy, avgDensity };
  }, [pens, latestProduction]);

  // Mutations
  const createPen = useMutation({
    mutationFn: penService.create,
    onSuccess: () => { queryClient.invalidateQueries(['pens-summary']); setIsFormOpen(false); toast.success('Pen created'); },
    onError: err => toast.error(err.message),
  });
  const updatePen = useMutation({
    mutationFn: ({ id, data }) => penService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['pens-summary']); setIsFormOpen(false); setEditingPen(null); toast.success('Pen updated'); },
    onError: err => toast.error(err.message),
  });
  const deletePen = useMutation({
    mutationFn: penService.delete,
    onSuccess: () => { queryClient.invalidateQueries(['pens-summary']); setDeletingId(null); toast.success('Pen deleted'); },
    onError: err => toast.error(err.message),
  });
  const recordMortality = useMutation({
    mutationFn: ({ penId, data }) => penService.recordMortality(penId, data),
    onSuccess: () => { queryClient.invalidateQueries(['pens-summary']); setShowMortalityModal(false); toast.success('Mortality recorded'); },
    onError: err => toast.error(err.message),
  });

  // Block handlers
  const handleBlockCreated = async (name) => { await blockService.create({ name }); refetchBlocks(); queryClient.invalidateQueries(['pens-summary']); };
  const handleBlockUpdated = async (id, name) => { await blockService.update(id, { name }); refetchBlocks(); };
  const handleBlockDeleted = async (id) => { await blockService.delete(id); refetchBlocks(); queryClient.invalidateQueries(['pens-summary']); };
  const handleAssignPens = async (blockId, penIds) => { await blockService.assignPens(blockId, penIds); queryClient.invalidateQueries(['pens-summary']); refetchBlocks(); };
  const handleRemovePen = async (penId) => { await penService.update(penId, { block_id: null }); queryClient.invalidateQueries(['pens-summary']); refetchBlocks(); };

  const handleAddPen = () => { setEditingPen(null); setIsFormOpen(true); };
  const handleEditPen = (pen) => { setEditingPen(pen); setIsFormOpen(true); };
  const handleSavePen = (data) => editingPen ? updatePen.mutate({ id: editingPen.id, data }) : createPen.mutate(data);
  const handleDeletePen = (id) => { if (window.confirm('Delete this pen?')) deletePen.mutate(id); };
  const handleLogMortality = (penId) => { setSelectedPenId(penId); setShowMortalityModal(true); };
  const handleViewEnvironment = (penId) => { setSelectedPenId(penId); setShowEnvModal(true); };
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await reportsService.generateCSV({ penIds: pens?.map(p => p.id) });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pens-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported');
    } catch (err) { toast.error(err.message); } finally { setIsExporting(false); }
  };
  const clearFilters = () => { setSearchTerm(''); setStatusFilter('all'); setHousingFilter('all'); setBlockFilter('all'); };
  const hasFilters = searchTerm || statusFilter !== 'all' || housingFilter !== 'all' || blockFilter !== 'all';

  if (isLoading) return <PensSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 space-y-4">
        {/* Header with compact buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pens</h1>
            <p className="text-xs text-gray-500">Manage & monitor all pens</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBlockModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              <FolderTree size={16} /> Blocks
            </button>
            <button
              onClick={handleAddPen}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus size={16} /> Add Pen
            </button>
          </div>
        </div>

        {/* Stats row – compact 4 columns */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Layers} title="Total Pens" value={stats.totalPens} color="blue" />
          <StatCard icon={Users} title="Total Birds" value={stats.totalBirds} unit="birds" color="green" />
          <StatCard icon={Percent} title="Avg Occupancy" value={stats.avgOccupancy} unit="%" color="amber" />
          <StatCard icon={TrendingUp} title="Avg Density" value={stats.avgDensity} unit="birds/m²" color="purple" />
        </div>

        {/* Filter bar – compact */}
        <div className="rounded-lg border border-gray-200 bg-white/80 p-2 dark:border-gray-700 dark:bg-gray-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search pens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 w-full rounded border border-gray-300 bg-white pl-7 pr-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 rounded border border-gray-300 bg-white px-2 text-sm dark:border-gray-600 dark:bg-gray-900">
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={housingFilter} onChange={(e) => setHousingFilter(e.target.value)} className="h-8 rounded border border-gray-300 bg-white px-2 text-sm dark:border-gray-600 dark:bg-gray-900">
              <option value="all">All housing</option>
              <option value="deep_litter">Deep Litter</option>
              <option value="cage">Cage</option>
            </select>
            <select value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)} className="h-8 rounded border border-gray-300 bg-white px-2 text-sm dark:border-gray-600 dark:bg-gray-900">
              <option value="all">All blocks</option>
              {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-0.5 text-xs text-gray-500">
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1">
            <button onClick={() => refetch()} className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium shadow-sm hover:bg-gray-50">
              <RotateCcw size={12} className="inline mr-1" /> Refresh
            </button>
            <button onClick={handleExport} disabled={isExporting} className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium shadow-sm">
              <Download size={12} className="inline mr-1" /> Export
            </button>
          </div>
          <div className="flex rounded-lg border border-gray-300 bg-white p-0.5">
            <button onClick={() => { setViewMode('table'); localStorage.setItem('penViewMode', 'table'); }} className={`rounded px-2 py-1 text-xs ${viewMode === 'table' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}><List size={14} /></button>
            <button onClick={() => { setViewMode('cards'); localStorage.setItem('penViewMode', 'cards'); }} className={`rounded px-2 py-1 text-xs ${viewMode === 'cards' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}><Grid3x3 size={14} /></button>
          </div>
        </div>

        {/* Pen table / cards */}
        <div className="rounded-lg bg-white/80 shadow-sm dark:bg-gray-800/80">
          <PenTable
            pens={filteredPens}
            viewMode={viewMode}
            latestProduction={latestProduction}
            realTimeEnv={realTimeEnv}
            blocks={blocks}
            onEdit={handleEditPen}
            onDelete={handleDeletePen}
            onLogMortality={handleLogMortality}
            onViewEnvironment={handleViewEnvironment}
            isLoading={createPen.isPending || updatePen.isPending}
          />
        </div>

        {/* Modals */}
        <AnimatePresence>
          {isFormOpen && (
            <PenForm
              initialData={fullPenData || editingPen}
              onSave={handleSavePen}
              onClose={() => { setIsFormOpen(false); setEditingPen(null); }}
              isLoading={createPen.isPending || updatePen.isPending}
              isLoadingData={editingPen?.id && isPenLoading}
            />
          )}
          {showMortalityModal && (
            <MortalityLogModal
              pen={pens?.find(p => p.id === selectedPenId)}
              onClose={() => setShowMortalityModal(false)}
              onSubmit={(data) => recordMortality.mutate({ penId: selectedPenId, data })}
              isLoading={recordMortality.isPending}
            />
          )}
          {showEnvModal && (
            <EnvironmentalModal
              pen={pens?.find(p => p.id === selectedPenId)}
              envData={realTimeEnv[selectedPenId]}
              onClose={() => setShowEnvModal(false)}
            />
          )}
          {deletingId && (
            <ConfirmDialog
              title="Delete Pen"
              message="Are you sure? This cannot be undone."
              onConfirm={() => deletePen.mutate(deletingId)}
              onCancel={() => setDeletingId(null)}
              isLoading={deletePen.isPending}
            />
          )}
          {showBlockModal && (
            <BlockManagementModal
              blocks={blocks}
              pens={pens || []}
              onCreateBlock={handleBlockCreated}
              onUpdateBlock={handleBlockUpdated}
              onDeleteBlock={handleBlockDeleted}
              onAssignPensToBlock={handleAssignPens}
              onRemovePenFromBlock={handleRemovePen}
              onClose={() => setShowBlockModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}