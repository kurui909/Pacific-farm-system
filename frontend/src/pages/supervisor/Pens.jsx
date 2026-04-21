import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  RotateCcw,
  Layers,
  Download,
  Grid3x3,
  List,
  Search,
  Filter,
  X,
  Thermometer,
  Users,
  TrendingUp,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Eye,
  Edit,
  Trash2,
  Wind,
  AlertCircle,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import PenTable from '../../components/tables/PenTable';
import PenForm from '../../components/forms/PenForm';
import ConfirmDialog from '../../components/modals/confirmDialog';
import MortalityLogModal from '../../components/modals/MortalityLogModal';
import EnvironmentalModal from '../../components/modals/EnvironmentalModal';
import BlockManagementModal from '../../components/modals/BlockManagementModal';

// Services - CORRECT IMPORT
import { penService, reportsService, blockService, productionService } from '../../services/api';

const Pens = () => {
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPen, setEditingPen] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('penViewMode') || 'table');
  const [showMortalityModal, setShowMortalityModal] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [selectedPen, setSelectedPen] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [housingFilter, setHousingFilter] = useState('');
  const [blockFilter, setBlockFilter] = useState('');

  // Real-time data
  const [realTimeEnv, setRealTimeEnv] = useState([]);

  const queryClient = useQueryClient();

  // Queries
  const { data: pensData = { pens: [] }, isLoading: pensLoading, error: pensError, refetch: refetchPens } = useQuery({
    queryKey: ['pens-summary'],
    queryFn: async () => {
      const response = await penService.getSummary();
      return { pens: Array.isArray(response) ? response : [] };
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['blocks'],
    queryFn: async () => {
      const response = await blockService.getAll();
      return Array.isArray(response) ? response : [];
    },
    refetchInterval: 60000,
  });

  const { data: latestProduction = [] } = useQuery({
    queryKey: ['latest-stock'],
    queryFn: async () => {
      const response = await productionService.getAll();
      return Array.isArray(response) ? response : [];
    },
    refetchInterval: 60000,
  });

  // Environment polling - gets REAL surrounding temperature data
  useEffect(() => {
    const pollEnvironment = async () => {
      if (!pensData?.pens || pensData.pens.length === 0) return;

      try {
        const envPromises = pensData.pens.map(pen =>
          penService.getEnvironmentData(pen.id)
            .then(data => ({ ...data, pen_id: pen.id, pen_name: pen.name }))
            .catch(err => ({ pen_id: pen.id, pen_name: pen.name, error: true }))
        );

        const envResults = await Promise.all(envPromises);
        const validEnv = envResults.filter(env => !env.error);
        setRealTimeEnv(validEnv);

        // Critical alerts for surrounding temperature
        validEnv.forEach(env => {
          if (env.temperature > 35) {
            toast.error(`🔥 CRITICAL: ${env.pen_name} temperature is ${env.temperature}°C - Immediate cooling needed!`, {
              duration: 5000,
              icon: '🌡️',
            });
          } else if (env.temperature > 30) {
            toast.error(`⚠️ WARNING: ${env.pen_name} temperature is ${env.temperature}°C - Monitor closely`, {
              duration: 4000,
            });
          }

          if (env.ammonia > 30) {
            toast.error(`💨 CRITICAL: ${env.pen_name} ammonia at ${env.ammonia} ppm - Improve ventilation!`, {
              duration: 5000,
            });
          }
        });
      } catch (error) {
        console.error('Environment polling failed:', error);
      }
    };

    pollEnvironment();
    const interval = setInterval(pollEnvironment, 60000);
    return () => clearInterval(interval);
  }, [pensData?.pens]);

  // Filtered pens
  const filteredPens = useMemo(() => {
    if (!pensData?.pens || !Array.isArray(pensData.pens)) return [];

    return pensData.pens.filter(pen => {
      const matchesSearch = (pen.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (pen.housing_system || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || pen.status === statusFilter;
      const matchesHousing = !housingFilter || pen.housing_system === housingFilter;
      const matchesBlock = !blockFilter || pen.block_id === blockFilter;

      return matchesSearch && matchesStatus && matchesHousing && matchesBlock;
    });
  }, [pensData, searchTerm, statusFilter, housingFilter, blockFilter]);

  // Statistics
  const stats = useMemo(() => {
    if (!filteredPens.length) return { totalPens: 0, totalBirds: 0, avgOccupancy: 0, avgDensity: 0 };

    const totalPens = filteredPens.length;
    const totalCapacity = filteredPens.reduce((sum, pen) => sum + (pen.capacity || 0), 0);
    const totalArea = filteredPens.reduce((sum, pen) => sum + (pen.floor_area_sq_m || 0), 0);

    // Get LATEST bird count from production
    const stockMap = {};
    if (Array.isArray(latestProduction)) {
      latestProduction.forEach(item => {
        stockMap[item.pen_id] = item.current_birds || 0;
      });
    }

    const totalBirds = filteredPens.reduce((sum, pen) => sum + (stockMap[pen.id] || 0), 0);
    const avgOccupancy = totalCapacity > 0 ? ((totalBirds / totalCapacity) * 100).toFixed(1) : 0;
    const avgDensity = totalArea > 0 ? (totalBirds / totalArea).toFixed(2) : 0;

    return { totalPens, totalBirds, avgOccupancy, avgDensity };
  }, [filteredPens, latestProduction]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: penService.createPen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pens-summary'] });
      setIsFormOpen(false);
      toast.success('✅ Pen created successfully!');
    },
    onError: (error) => toast.error(`❌ Failed to create pen: ${error.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => penService.updatePen(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pens-summary'] });
      setIsFormOpen(false);
      setEditingPen(null);
      toast.success('✅ Pen updated successfully!');
    },
    onError: (error) => toast.error(`❌ Failed to update pen: ${error.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: penService.deletePen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pens-summary'] });
      setDeletingId(null);
      toast.success('✅ Pen deleted successfully!');
    },
    onError: (error) => toast.error(`❌ Failed to delete pen: ${error.message}`),
  });

  const mortalityMutation = useMutation({
    mutationFn: ({ penId, data }) => productionService.recordMortality(penId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-stock'] });
      setShowMortalityModal(false);
      setSelectedPen(null);
      toast.success('📊 Mortality recorded successfully!');
    },
    onError: (error) => toast.error(`❌ Failed to record mortality: ${error.message}`),
  });

  // Handlers
  const handleEdit = (pen) => {
    setEditingPen(pen);
    setIsFormOpen(true);
  };

  const handleDelete = (pen) => {
    setDeletingId(pen.id);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  const handleLogMortality = (pen) => {
    setSelectedPen(pen);
    setShowMortalityModal(true);
  };

  const handleViewEnvironment = (pen) => {
    setSelectedPen(pen);
    setShowEnvModal(true);
  };

  const handleSubmitPen = (data) => {
    if (editingPen) {
      updateMutation.mutate({ id: editingPen.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSubmitMortality = (data) => {
    mortalityMutation.mutate({ penId: selectedPen.id, data });
  };

  const handleRefresh = () => {
    refetchPens();
    queryClient.invalidateQueries({ queryKey: ['latest-stock'] });
    toast.success('🔄 Data refreshed!');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await reportsService.exportPens(filteredPens);
      toast.success('📁 Export completed!');
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setHousingFilter('');
    setBlockFilter('');
  };

  const hasFilters = searchTerm || statusFilter || housingFilter || blockFilter;

  const toggleViewMode = () => {
    const newMode = viewMode === 'table' ? 'cards' : 'table';
    setViewMode(newMode);
    localStorage.setItem('penViewMode', newMode);
  };

  // StatCard Component
  const StatCard = ({ icon: Icon, title, value, unit, color }) => {
    const colorClasses = {
      blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
      green: 'bg-gradient-to-br from-green-500 to-green-600',
      amber: 'bg-gradient-to-br from-amber-500 to-amber-600',
      purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
      red: 'bg-gradient-to-br from-red-500 to-red-600',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {title}
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {value || 0}
              </p>
              {unit && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {unit}
                </p>
              )}
            </div>
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]} text-white`}>
            <Icon size={16} />
          </div>
        </div>
      </motion.div>
    );
  };

  const PensSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 p-6 rounded-2xl animate-pulse">
            <div className="h-8 bg-gray-400 dark:bg-gray-600 rounded mb-4"></div>
            <div className="h-12 bg-gray-400 dark:bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (pensLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <PensSkeleton />
      </div>
    );
  }

  if (pensError) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto text-center">
        <AlertTriangle size={64} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Pens</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{pensError.message}</p>
        <button
          onClick={() => refetchPens()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">🏠 Pen Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Monitor and manage your poultry housing units</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setShowBlockModal(true)}
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
              <span className="hidden sm:inline">Add Pen</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={MapPin} title="Total Pens" value={stats.totalPens} unit="" color="blue" />
          <StatCard icon={Users} title="Total Birds" value={stats.totalBirds} unit="heads" color="green" />
          <StatCard icon={TrendingUp} title="Avg Occupancy" value={stats.avgOccupancy} unit="%" color="amber" />
          <StatCard icon={Wind} title="Avg Density" value={stats.avgDensity} unit="/m²" color="purple" />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 min-w-0 w-full lg:w-auto">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="🔍 Search pen name or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">📊 All Status</option>
                <option value="active">✅ Active</option>
                <option value="inactive">⏸️ Inactive</option>
                <option value="maintenance">🔧 Maintenance</option>
              </select>
              <select
                value={housingFilter}
                onChange={(e) => setHousingFilter(e.target.value)}
                className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">🏠 All Housing</option>
                <option value="Deep Litter">🌾 Deep Litter</option>
                <option value="Cage">📦 Cage</option>
              </select>
              <select
                value={blockFilter}
                onChange={(e) => setBlockFilter(e.target.value)}
                className="flex-1 min-w-[120px] px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">📍 All Blocks</option>
                {blocks.map(block => (
                  <option key={block.id} value={block.id}>📍 {block.name}</option>
                ))}
              </select>
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
            📋 Showing <span className="font-bold text-gray-900 dark:text-white">{filteredPens.length}</span> of <span className="font-bold text-gray-900 dark:text-white">{pensData?.pens?.length || 0}</span> pens
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={handleRefresh}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
              disabled={pensLoading}
            >
              <RotateCcw size={18} className={pensLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              <Download size={18} className={isExporting ? 'animate-pulse' : ''} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={toggleViewMode}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              {viewMode === 'table' ? <Grid3x3 size={18} /> : <List size={18} />}
              <span className="hidden sm:inline">{viewMode === 'table' ? 'Cards' : 'Table'}</span>
            </button>
          </div>
        </div>

        {/* Pen Table */}
        <PenTable
          pens={filteredPens}
          viewMode={viewMode}
          latestProduction={latestProduction}
          realTimeEnv={realTimeEnv}
          blocks={blocks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onLogMortality={handleLogMortality}
          onViewEnvironment={handleViewEnvironment}
          isLoading={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
        />

        {/* Modals */}
        <AnimatePresence>
          {isFormOpen && (
            <PenForm
              pen={editingPen}
              blocks={blocks}
              onSubmit={handleSubmitPen}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingPen(null);
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          )}

          {deletingId && (
            <ConfirmDialog
              title="Delete Pen"
              message="Are you sure you want to delete this pen? This action cannot be undone."
              onConfirm={handleConfirmDelete}
              onCancel={() => setDeletingId(null)}
              isLoading={deleteMutation.isPending}
            />
          )}

          {showMortalityModal && selectedPen && (
            <MortalityLogModal
              pen={selectedPen}
              onSubmit={handleSubmitMortality}
              onCancel={() => {
                setShowMortalityModal(false);
                setSelectedPen(null);
              }}
              isLoading={mortalityMutation.isPending}
            />
          )}

          {showEnvModal && selectedPen && (
            <EnvironmentalModal
              pen={selectedPen}
              environmentData={realTimeEnv.find(env => env.pen_id === selectedPen.id)}
              onClose={() => {
                setShowEnvModal(false);
                setSelectedPen(null);
              }}
            />
          )}

          {showBlockModal && (
            <BlockManagementModal
              blocks={blocks}
              pens={pensData?.pens || []}
              onClose={() => setShowBlockModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Pens;