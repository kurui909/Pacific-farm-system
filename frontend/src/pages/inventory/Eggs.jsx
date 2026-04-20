import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';

import PageHeader from '../../components/common/PageHeader';
import TabButton from '../../components/common/TabButton';
import ProductionSummary from '../../components/dashboard/ProductionSummary';
import EggInventoryCards from '../../components/inventory/EggInventoryCards';
import TrayInventoryCards from '../../components/inventory/TrayInventoryCards';
import SalesTable from '../../components/tables/SalesTable';
import EggAdjustModal from '../../components/modals/EggAdjustModal';
import TrayAdjustModal from '../../components/modals/TrayAdjustModal';
import SaleModal from '../../components/modals/SaleModal';

import { formatDate } from '../../utils/formatters';
import { productionService, eggsService, traysService } from '../../services/api';

export default function Eggs() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('eggs');
  const [isEggAdjustOpen, setIsEggAdjustOpen] = useState(false);
  const [isTrayAdjustOpen, setIsTrayAdjustOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleType, setSaleType] = useState('eggs');

  const { data: productionSummary, isLoading: prodLoading } = useQuery({
    queryKey: ['production-summary-today'],
    queryFn: () => productionService.getSummary({ date_range: 'today' }),
  });

  const { data: eggInventory = {}, isLoading: eggLoading, refetch: refetchEggs } = useQuery({
    queryKey: ['egg-inventory'],
    queryFn: eggsService.getInventory,
  });

  const { data: trayInventory = {}, isLoading: trayLoading, refetch: refetchTrays } = useQuery({
    queryKey: ['tray-inventory'],
    queryFn: traysService.getInventory,
  });

  const { data: sales = [], isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['all-sales'],
    queryFn: async () => {
      const [eggSales, traySales] = await Promise.all([
        eggsService.getSales(),
        traysService.getSales(),
      ]);
      return [...eggSales, ...traySales].sort(
        (a, b) => new Date(b.sale_date) - new Date(a.sale_date)
      );
    },
  });

  const eggAdjustMutation = useMutation({
    mutationFn: eggsService.adjustInventory,
    onSuccess: async () => {
      await queryClient.invalidateQueries(['egg-inventory']);
      setIsEggAdjustOpen(false);
      toast.success('Egg inventory updated');
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Update failed'),
  });

  const trayAdjustMutation = useMutation({
    mutationFn: traysService.adjustInventory,
    onSuccess: async () => {
      await queryClient.invalidateQueries(['tray-inventory']);
      setIsTrayAdjustOpen(false);
      toast.success('Tray inventory updated');
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Update failed'),
  });

  const saleMutation = useMutation({
    mutationFn: (data) =>
      data.sale_type === 'eggs' ? eggsService.recordSale(data) : traysService.recordSale(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries(['all-sales']);
      await queryClient.invalidateQueries(['egg-inventory']);
      await queryClient.invalidateQueries(['tray-inventory']);
      setIsSaleModalOpen(false);
      toast.success('Sale recorded');
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Sale failed'),
  });

  const isLoading = prodLoading || eggLoading || trayLoading;

  const tabData = useMemo(
    () => ({
      eggs: {
        label: 'Egg Inventory',
        icon: '🥚',
        subtitle: `Last egg update: ${formatDate(eggInventory?.date)}`,
      },
      trays: {
        label: 'Tray Inventory',
        icon: '📦',
        subtitle: `Last tray update: ${formatDate(trayInventory?.date)}`,
      },
    }),
    [eggInventory?.date, trayInventory?.date]
  );

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSaleType(tab === 'eggs' ? 'eggs' : 'trays');
  }, []);

  if (isLoading) return <EggsSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eggs & Trays Inventory"
        subtitle={tabData[activeTab]?.subtitle || 'Manage your egg and tray stock'}
        actions={
          <div className="flex flex-wrap gap-2">
            {activeTab === 'eggs' ? (
              <>
                <button
                  onClick={() => setIsEggAdjustOpen(true)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Adjust Eggs
                </button>
                <button
                  onClick={() => {
                    setSaleType('eggs');
                    setIsSaleModalOpen(true);
                  }}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  Sell Eggs
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsTrayAdjustOpen(true)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Adjust Trays
                </button>
                <button
                  onClick={() => {
                    setSaleType('trays');
                    setIsSaleModalOpen(true);
                  }}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  Sell Trays
                </button>
              </>
            )}
          </div>
        }
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <nav className="flex gap-3">
          {['eggs', 'trays'].map((tab) => (
            <TabButton
              key={tab}
              active={activeTab === tab}
              onClick={() => handleTabChange(tab)}
              icon={tabData[tab].icon}
              label={tabData[tab].label}
            />
          ))}
        </nav>
      </div>

      {activeTab === 'eggs' ? (
        <div className="space-y-6 animate-fade-in">
          <ProductionSummary summary={productionSummary} />
          <EggInventoryCards inventory={eggInventory} />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <TrayInventoryCards inventory={trayInventory} />
        </div>
      )}

      <SalesTable
        sales={sales}
        isLoading={salesLoading}
        onRefresh={refetchSales}
        title="Recent Sales"
        subtitle="Egg and tray sales history in one place"
      />

      <EggAdjustModal
        isOpen={isEggAdjustOpen}
        onClose={() => setIsEggAdjustOpen(false)}
        onSubmit={eggAdjustMutation.mutate}
        initialData={eggInventory}
        isSubmitting={eggAdjustMutation.isPending}
      />

      <TrayAdjustModal
        isOpen={isTrayAdjustOpen}
        onClose={() => setIsTrayAdjustOpen(false)}
        onSubmit={trayAdjustMutation.mutate}
        initialData={trayInventory}
        isSubmitting={trayAdjustMutation.isPending}
      />

      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSubmit={saleMutation.mutate}
        isSubmitting={saleMutation.isPending}
        saleType={saleType}
      />
    </div>
  );
}

function EggsSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeader title="Eggs & Trays Inventory" subtitle="Loading inventory…" />
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(2)].map((item) => (
          <div
            key={item}
            className="rounded-3xl border border-slate-200 bg-slate-100 p-6 shadow-sm animate-pulse dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-6 w-1/3 rounded-full bg-slate-200 dark:bg-slate-800 mb-5" />
            <div className="space-y-4">
              {[...Array(4)].map((row) => (
                <div
                  key={row}
                  className="h-12 rounded-2xl bg-slate-200 dark:bg-slate-800"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}