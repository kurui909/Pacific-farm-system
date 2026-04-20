// src/pages/admin/Users.jsx
import { useState, useEffect, useMemo, useTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../../services/api';
import {
  UserPlus, Edit2, Trash2, CheckCircle, XCircle, Search, Filter, X,
  ChevronLeft, ChevronRight, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown,
  Download, CheckSquare, Square, ToggleLeft, ToggleRight, RefreshCw,
  Crown, Briefcase, ClipboardList, Egg, Wheat, Users as UsersIcon, AlertCircle,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import UserFormModal from '../../components/modals/UserFormModal';
import { useDebounce } from '../../hooks/useDebounce';
import { toast } from 'react-hot-toast';

// Tooltip helper (simple inline version – can also import from common)
const Tooltip = ({ children, text }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
      {text}
    </div>
  </div>
);

// Role badge configuration with icons
const roleConfig = {
  admin: { icon: Crown, label: 'Admin', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  manager: { icon: Briefcase, label: 'Manager', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  supervisor: { icon: ClipboardList, label: 'Supervisor', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300' },
  egg_keeper: { icon: Egg, label: 'Egg Keeper', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  feed_keeper: { icon: Wheat, label: 'Feed Keeper', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  customer: { icon: UsersIcon, label: 'Customer', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};

const getRoleBadge = (role) => roleConfig[role] || roleConfig.customer;
const formatRole = (role) => roleConfig[role]?.label || role.charAt(0).toUpperCase() + role.slice(1);

// Skeleton loaders
const TableSkeleton = () => (
  <div className="overflow-x-auto rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
    <div className="animate-pulse">
      <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-t-3xl" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded mr-4" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-48" />
          </div>
          <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full mx-4" />
          <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl ml-4" />
        </div>
      ))}
    </div>
  </div>
);

const CardSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="animate-pulse rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
        <div className="flex justify-between"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" /><div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" /></div>
        <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="mt-4 space-y-3">
          <div className="flex justify-between"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" /></div>
          <div className="flex justify-between"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" /></div>
        </div>
        <div className="mt-5 flex gap-2"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-2xl w-16" /><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-2xl w-16" /></div>
      </div>
    ))}
  </div>
);

// Custom hook for filtering, sorting, pagination with URL sync
const useUserTable = (users) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [sortField, setSortField] = useState(searchParams.get('sort') || 'full_name');
  const [sortDirection, setSortDirection] = useState(searchParams.get('order') || 'asc');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const pageSize = 10;

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (sortField !== 'full_name') params.set('sort', sortField);
    if (sortDirection !== 'asc') params.set('order', sortDirection);
    if (currentPage !== 1) params.set('page', String(currentPage));
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, roleFilter, statusFilter, sortField, sortDirection, currentPage, setSearchParams]);

  useEffect(() => setCurrentPage(1), [debouncedSearch, roleFilter, statusFilter, sortField, sortDirection]);

  const filtered = useMemo(() => users.filter(user => {
    const matchesSearch = !debouncedSearch || user.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || user.email?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || (statusFilter === 'active' && user.is_active) || (statusFilter === 'inactive' && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  }), [users, debouncedSearch, roleFilter, statusFilter]);

  const sorted = useMemo(() => {
    const sortedData = [...filtered];
    sortedData.sort((a, b) => {
      let aVal = a[sortField], bVal = b[sortField];
      if (['full_name', 'email'].includes(sortField)) { aVal = aVal?.toLowerCase() || ''; bVal = bVal?.toLowerCase() || ''; }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sortedData;
  }, [filtered, sortField, sortDirection]);

  const totalFiltered = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field) => {
    if (sortField === field) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const clearFilters = () => {
    setSearchTerm(''); setRoleFilter(''); setStatusFilter('');
    setSortField('full_name'); setSortDirection('asc'); setCurrentPage(1);
  };

  return { paginatedUsers: paginated, totalFiltered, totalPages, currentPage, setCurrentPage,
    searchTerm, setSearchTerm, roleFilter, setRoleFilter, statusFilter, setStatusFilter,
    hasActiveFilters: !!(searchTerm || roleFilter || statusFilter), clearFilters, sortField, sortDirection, handleSort };
};

export default function Users() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('userViewMode') || 'table');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAllMode, setSelectAllMode] = useState('page'); // 'page' or 'all'
  const [, startTransition] = useTransition();
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState(null);
  const [showSelectAllBanner, setShowSelectAllBanner] = useState(false);

  useEffect(() => { localStorage.setItem('userViewMode', viewMode); }, [viewMode]);

  const { data: users = [], isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['users'], queryFn: authService.getAllUsers, staleTime: 5 * 60 * 1000,
  });

  const { paginatedUsers, totalFiltered, totalPages, currentPage, setCurrentPage,
    searchTerm, setSearchTerm, roleFilter, setRoleFilter, statusFilter, setStatusFilter,
    hasActiveFilters, clearFilters, sortField, sortDirection, handleSort } = useUserTable(users);

  // Mutations with optimistic updates
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => authService.toggleUserStatus(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries(['users']);
      const previousUsers = queryClient.getQueryData(['users']);
      queryClient.setQueryData(['users'], old => old?.map(u => u.id === id ? { ...u, is_active: isActive } : u));
      return { previousUsers };
    },
    onError: (_, __, context) => { queryClient.setQueryData(['users'], context.previousUsers); toast.error('Failed to update status'); },
    onSuccess: (_, { isActive }) => toast.success(`User ${isActive ? 'activated' : 'deactivated'}`),
    onSettled: () => queryClient.invalidateQueries(['users']),
  });

  const deleteMutation = useMutation({
    mutationFn: authService.deleteUser,
    onMutate: async (id) => {
      await queryClient.cancelQueries(['users']);
      const previousUsers = queryClient.getQueryData(['users']);
      queryClient.setQueryData(['users'], old => old?.filter(u => u.id !== id));
      return { previousUsers };
    },
    onError: (_, __, context) => { queryClient.setQueryData(['users'], context.previousUsers); toast.error('Failed to delete user'); },
    onSuccess: () => toast.success('User deleted successfully'),
    onSettled: () => queryClient.invalidateQueries(['users']),
  });

  // Bulk action helpers
  const getSelectedUsersForAction = () => {
    if (selectAllMode === 'all') {
      const allFilteredIds = users.filter(u => {
        const matchesSearch = !searchTerm || u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !roleFilter || u.role === roleFilter;
        const matchesStatus = !statusFilter || (statusFilter === 'active' && u.is_active) || (statusFilter === 'inactive' && !u.is_active);
        return matchesSearch && matchesRole && matchesStatus;
      }).map(u => u.id);
      if (allFilteredIds.length > 100) { toast.error('Too many users selected for bulk action. Please refine filters.'); return []; }
      return allFilteredIds;
    }
    return Array.from(selectedIds);
  };

  const executeBulkAction = async (action) => {
    const targetIds = getSelectedUsersForAction();
    const eligibleIds = targetIds.filter((id) => users.find((u) => u.id === id)?.role !== 'admin');
    const skippedCount = targetIds.length - eligibleIds.length;

    if (eligibleIds.length === 0) {
      toast.error('No eligible users selected. Admin accounts cannot be activated or deactivated.');
      return;
    }
    if (skippedCount > 0) {
      toast.info(`${skippedCount} admin account(s) were skipped.`);
    }

    startTransition(async () => {
      try {
        for (const id of eligibleIds) {
          if (action === 'activate') await toggleMutation.mutateAsync({ id, isActive: true });
          if (action === 'deactivate') await toggleMutation.mutateAsync({ id, isActive: false });
          if (action === 'delete') await deleteMutation.mutateAsync(id);
        }
        setSelectedIds(new Set());
        setSelectAllMode('page');
        setShowSelectAllBanner(false);
        toast.success(`${eligibleIds.length} user(s) ${action === 'activate' ? 'activated' : action === 'deactivate' ? 'deactivated' : 'deleted'}`);
      } catch {
        toast.error(`Bulk ${action} failed for some users`);
      }
    });
  };

  const confirmBulkAction = (action) => {
    if (getSelectedUsersForAction().length === 0) { toast.error('No users selected'); return; }
    setPendingBulkAction(action); setBulkConfirmOpen(true);
  };

  const exportToCSV = () => {
    const dataToExport = selectAllMode === 'all' ? users.filter(u => {
      const matchesSearch = !searchTerm || u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatus = !statusFilter || (statusFilter === 'active' && u.is_active) || (statusFilter === 'inactive' && !u.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    }) : paginatedUsers;
    const headers = ['Full Name', 'Email', 'Role', 'Status', 'Farm Name'];
    const rows = dataToExport.map(u => [u.full_name, u.email, formatRole(u.role), u.is_active ? 'Active' : 'Inactive', u.farm_name || '']);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `users_${new Date().toISOString()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${dataToExport.length} users`);
  };

  // Smart select all: if all on current page selected, offer to select all filtered
  const toggleSelectAll = () => {
    if (selectAllMode === 'all') {
      setSelectedIds(new Set()); setSelectAllMode('page'); setShowSelectAllBanner(false);
    } else if (selectedIds.size === paginatedUsers.length && paginatedUsers.length > 0) {
      setShowSelectAllBanner(true);
    } else {
      setSelectedIds(new Set(paginatedUsers.map(u => u.id))); setSelectAllMode('page');
    }
  };

  const selectAllFiltered = () => {
    setSelectAllMode('all');
    setShowSelectAllBanner(false);
    toast.success(`All ${totalFiltered} filtered users selected`);
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
    if (selectAllMode === 'all') setSelectAllMode('page');
    if (showSelectAllBanner) setShowSelectAllBanner(false);
  };

  const SortIcon = ({ field }) => sortField !== field ? <ArrowUpDown size={14} className="ml-1 opacity-50" /> : (sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />);
  const StatusToggle = ({ user }) => {
    const isAdmin = user.role === 'admin';

    return (
      <button
        type="button"
        onClick={() => !isAdmin && toggleMutation.mutate({ id: user.id, isActive: !user.is_active })}
        disabled={toggleMutation.isPending || isAdmin}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isAdmin ? 'cursor-not-allowed opacity-60 border border-slate-200 dark:border-slate-700' : ''
        }`}
      >
        {user.is_active ? (
          <>
            <ToggleRight size={18} className={isAdmin ? 'text-slate-400' : 'text-green-600 dark:text-green-400'} />
            <span className={isAdmin ? 'text-slate-500 dark:text-slate-400' : 'text-green-700 dark:text-green-300'}>
              {isAdmin ? 'Admin (fixed active)' : 'Active'}
            </span>
          </>
        ) : (
          <>
            <ToggleLeft size={18} className="text-red-600 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">Inactive</span>
          </>
        )}
      </button>
    );
  };

  if (error) return (
    <div className="p-6 text-center"><AlertCircle className="mx-auto mb-4 text-red-400" size={48} /><h3 className="text-lg font-semibold">Failed to load users</h3><button onClick={() => refetch()} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><RefreshCw size={16} /> Retry</button></div>
  );

  const totalSelected = selectAllMode === 'all' ? totalFiltered : selectedIds.size;
  const isAllSelectedOnPage = selectedIds.size === paginatedUsers.length && paginatedUsers.length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <PageHeader title="Users" subtitle="Manage access for farm team members and operators" actions={
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip text="Refresh list">
            <button onClick={() => refetch()} disabled={isRefetching} className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"><RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} /></button>
          </Tooltip>
          <Tooltip text={viewMode === 'table' ? 'Switch to card view' : 'Switch to table view'}>
            <button onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')} className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">{viewMode === 'table' ? <LayoutGrid size={18} /> : <List size={18} />}{viewMode === 'table' ? 'Card View' : 'Table View'}</button>
          </Tooltip>
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"><UserPlus size={18} />Add User</button>
        </div>
      } />

      {/* Filter Bar */}
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search by name or email" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-2xl border border-gray-300 bg-gray-50 px-10 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" /></div>
            <div className="relative w-full sm:w-auto"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full rounded-2xl border border-gray-300 bg-white px-10 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"><option value="">All Roles</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="supervisor">Supervisor</option><option value="egg_keeper">Egg Keeper</option><option value="feed_keeper">Feed Keeper</option><option value="customer">Customer</option></select></div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
            <button onClick={clearFilters} disabled={!hasActiveFilters} className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"><X size={16} /> Clear</button>
            <Tooltip text="Export visible users to CSV">
              <button onClick={exportToCSV} className="inline-flex items-center justify-center rounded-2xl bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-500"><Download size={16} /> Export</button>
            </Tooltip>
          </div>
        </div>
        {hasActiveFilters && <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {searchTerm && <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">Search: {searchTerm}<button onClick={() => setSearchTerm('')}><X size={14} /></button></span>}
          {roleFilter && <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-200">Role: {formatRole(roleFilter)}<button onClick={() => setRoleFilter('')}><X size={14} /></button></span>}
          {statusFilter && <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200">Status: {statusFilter === 'active' ? 'Active' : 'Inactive'}<button onClick={() => setStatusFilter('')}><X size={14} /></button></span>}
        </div>}
      </div>

      {/* Select All Banner (appears when all on current page are selected) */}
      <AnimatePresence>
        {showSelectAllBanner && !selectAllMode === 'all' && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center justify-between gap-3 rounded-2xl bg-indigo-50 p-3 dark:bg-indigo-900/30">
            <span className="text-sm text-indigo-800 dark:text-indigo-200">All {paginatedUsers.length} users on this page are selected.</span>
            <div className="flex gap-2">
              <button onClick={selectAllFiltered} className="text-sm font-medium text-indigo-700 hover:underline dark:text-indigo-300">Select all {totalFiltered} filtered users</button>
              <button onClick={() => setShowSelectAllBanner(false)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      <AnimatePresence>{totalSelected > 0 && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blue-50 p-3 dark:bg-blue-900/30">
        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{totalSelected} user{totalSelected !== 1 ? 's' : ''} selected{selectAllMode === 'all' && <span className="ml-2 text-xs">(all filtered)</span>}</span>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => confirmBulkAction('activate')} className="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"><CheckCircle size={14} /> Activate</button>
          <button onClick={() => confirmBulkAction('deactivate')} className="inline-flex items-center gap-1 rounded-full bg-yellow-600 px-3 py-1 text-xs text-white hover:bg-yellow-700"><XCircle size={14} /> Deactivate</button>
          <button onClick={() => confirmBulkAction('delete')} className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"><Trash2 size={14} /> Delete</button>
          <button onClick={() => { setSelectedIds(new Set()); setSelectAllMode('page'); setShowSelectAllBanner(false); }} className="inline-flex items-center gap-1 rounded-full bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-700"><X size={14} /> Cancel</button>
        </div>
      </motion.div>}</AnimatePresence>

      {/* Main Content */}
      {isLoading ? (viewMode === 'table' ? <TableSkeleton /> : <CardSkeleton />) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="px-4 py-3 text-left"><button onClick={toggleSelectAll} className="flex items-center gap-2 text-gray-600 dark:text-gray-300" aria-label="Select all">{selectAllMode === 'all' ? <CheckSquare size={18} className="text-blue-600" /> : isAllSelectedOnPage ? <CheckSquare size={18} /> : <Square size={18} />}</button></th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300"><button onClick={() => handleSort('full_name')} className="inline-flex items-center gap-1">Name <SortIcon field="full_name" /></button></th>
            <th className="hidden px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 sm:table-cell"><button onClick={() => handleSort('email')} className="inline-flex items-center gap-1">Email <SortIcon field="email" /></button></th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {paginatedUsers.length === 0 ? <tr><td colSpan="6" className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">No users found</td></tr> : paginatedUsers.map(user => {
                const { icon: RoleIcon, className: roleClassName } = getRoleBadge(user.role);
                return <motion.tr key={user.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <td className="px-4 py-4"><button onClick={() => toggleSelect(user.id)} className="text-gray-500" aria-label={`Select ${user.full_name}`}>{selectedIds.has(user.id) ? <CheckSquare size={18} /> : <Square size={18} />}</button></td>
                  <td className="px-4 py-4"><div className="font-medium text-gray-900 dark:text-gray-100">{user.full_name}</div><div className="mt-1 block sm:hidden text-sm text-gray-500 dark:text-gray-400">{user.email}</div></td>
                  <td className="hidden px-4 py-4 text-sm text-gray-600 dark:text-gray-300 sm:table-cell">{user.email}</td>
                  <td className="px-4 py-4 text-sm"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${roleClassName}`}><RoleIcon size={12} />{formatRole(user.role)}</span></td>
                  <td className="px-4 py-4 text-sm"><StatusToggle user={user} /></td>
                  <td className="px-4 py-4 text-right"><div className="flex justify-end gap-2"><Tooltip text="Edit user"><button onClick={() => { setEditing(user); setFormOpen(true); }} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"><Edit2 size={16} /></button></Tooltip><Tooltip text="Delete user"><button onClick={() => setDeletingId(user.id)} className="rounded-xl border border-transparent bg-red-50 px-3 py-2 text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"><Trash2 size={16} /></button></Tooltip></div></td>
                </motion.tr>;
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginatedUsers.length === 0 ? <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900">No users found</div> : paginatedUsers.map(user => {
            const { icon: RoleIcon, className: roleClassName } = getRoleBadge(user.role);
            return <motion.div key={user.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.full_name}</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user.email}</p></div><button onClick={() => toggleSelect(user.id)} className="text-gray-500 dark:text-gray-300" aria-label={`Select ${user.full_name}`}>{selectedIds.has(user.id) ? <CheckSquare size={20} /> : <Square size={20} />}</button></div>
              <div className="mt-4 space-y-3 text-sm"><div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800"><span className="text-gray-500">Role</span><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${roleClassName}`}><RoleIcon size={12} />{formatRole(user.role)}</span></div><div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800"><span className="text-gray-500">Status</span><StatusToggle user={user} /></div></div>
              <div className="mt-5 flex flex-wrap gap-2"><Tooltip text="Edit user"><button onClick={() => { setEditing(user); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"><Edit2 size={16} /> Edit</button></Tooltip><Tooltip text="Delete user"><button onClick={() => setDeletingId(user.id)} className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"><Trash2 size={16} /> Delete</button></Tooltip></div>
            </motion.div>;
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && <div className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 sm:flex-row sm:items-center sm:justify-between">
        <div>Showing {paginatedUsers.length} of {totalFiltered} users{selectAllMode === 'all' && <span className="ml-2 text-xs text-blue-600">(all filtered selected)</span>}</div>
        <div className="flex items-center justify-center gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm transition disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"><ChevronLeft size={18} /></button><span className="min-w-[120px] text-center">Page {currentPage} of {totalPages}</span><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm transition disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"><ChevronRight size={18} /></button></div>
      </div>}

      {!isLoading && paginatedUsers.length > 0 && <div className="text-center text-xs text-gray-400 dark:text-gray-500"><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">A</kbd> to select all on page</div>}

      <UserFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} initialData={editing} />
      <ConfirmDialog isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={() => deleteMutation.mutate(deletingId)} title="Delete User" message="Are you sure you want to delete this user? This action cannot be undone." confirmText="Delete" isDestructive />
      <ConfirmDialog isOpen={bulkConfirmOpen} onClose={() => setBulkConfirmOpen(false)} onConfirm={() => { executeBulkAction(pendingBulkAction); setBulkConfirmOpen(false); }} title={`Bulk ${pendingBulkAction === 'activate' ? 'Activate' : pendingBulkAction === 'deactivate' ? 'Deactivate' : 'Delete'} Users`} message={`Are you sure you want to ${pendingBulkAction} ${totalSelected} user(s)? This action cannot be undone.`} confirmText={pendingBulkAction === 'activate' ? 'Activate' : pendingBulkAction === 'deactivate' ? 'Deactivate' : 'Delete'} isDestructive={pendingBulkAction === 'delete'} />
    </div>
  );
}