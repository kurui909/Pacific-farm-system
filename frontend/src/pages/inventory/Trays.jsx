import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { traysService } from '../../services/api';
import { currencies } from '../../utils/currencies';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import { toast } from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import {
  ShoppingCart,
  
  AlertCircle,
  RefreshCw,
  Package,
  TrendingUp,
  TrendingDown,
  X,
  Loader2,
} from 'lucide-react';

export default function Trays() {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: inventory,
    isLoading: invLoading,
    error: invError,
    refetch: refetchInventory,
  } = useQuery({
    queryKey: ['tray-inventory'],
    queryFn: traysService.getInventory,
  });

  const {
    data: sales = [],
    isLoading: salesLoading,
    error: salesError,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ['tray-sales'],
    queryFn: () => traysService.getSales({ limit: 100 }),
  });

  const saleMutation = useMutation({
    mutationFn: traysService.recordSale,
    onSuccess: () => {
      queryClient.invalidateQueries(['tray-inventory']);
      queryClient.invalidateQueries(['tray-sales']);
      setIsSaleModalOpen(false);
      toast.success('Sale recorded successfully');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || 'Failed to record sale');
    },
  });

  const inventoryMutation = useMutation({
    mutationFn: traysService.updateInventory,
    onSuccess: () => {
      queryClient.invalidateQueries(['tray-inventory']);
      setIsInventoryModalOpen(false);
      toast.success('Inventory updated');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || 'Failed to update inventory');
    },
  });

  const current = inventory || {
    opening_stock: 0,
    received: 0,
    sold: 0,
    closing_stock: 0,
  };

  if (invLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tray Inventory & Sales"
          actions={
            <div className="flex gap-2">
              <button className="btn-secondary opacity-50 cursor-not-allowed" disabled>
                Update Stock
              </button>
              <button className="btn-primary opacity-50 cursor-not-allowed" disabled>
                <ShoppingCart size={18} className="mr-2" /> Record Sale
              </button>
            </div>
          }
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (invError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tray Inventory & Sales" />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Failed to load inventory</h3>
          <p className="text-gray-500 mb-4">Unable to fetch tray inventory data.</p>
          <button onClick={() => refetchInventory()} className="btn-primary">
            <RefreshCw size={16} className="mr-2" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tray Inventory & Sales"
        subtitle={`Closing stock: ${formatNumber(current.closing_stock)} trays`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setIsInventoryModalOpen(true)} className="btn-secondary">
              Update Stock
            </button>
            <button onClick={() => setIsSaleModalOpen(true)} className="btn-primary">
              <ShoppingCart size={18} className="mr-2" /> Record Sale
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Opening Stock"
          value={current.opening_stock}
          icon={<Package size={20} className="text-blue-600" />}
        />
        <StatCard
          label="Received"
          value={current.received}
          prefix="+"
          valueClass="text-green-600"
          icon={<TrendingUp size={20} className="text-green-600" />}
        />
        <StatCard
          label="Sold"
          value={current.sold}
          prefix="-"
          valueClass="text-red-600"
          icon={<TrendingDown size={20} className="text-red-600" />}
        />
        <StatCard
          label="Closing Stock"
          value={current.closing_stock}
          icon={<Package size={20} className="text-indigo-600" />}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Recent Sales</h2>
          {sales.length > 0 && <span className="text-sm text-gray-500">{sales.length} transactions</span>}
        </div>
        <div className="overflow-x-auto">
          {salesLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/5" />
                  <div className="h-4 bg-gray-200 rounded w-1/5" />
                  <div className="h-4 bg-gray-200 rounded w-1/5" />
                  <div className="h-4 bg-gray-200 rounded w-1/5" />
                  <div className="h-4 bg-gray-200 rounded w-1/5" />
                </div>
              ))}
            </div>
          ) : salesError ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-gray-500 mb-2">Failed to load sales</p>
              <button onClick={() => refetchSales()} className="text-blue-600 text-sm">
                Retry
              </button>
            </div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-gray-500">No sales recorded yet</p>
              <button onClick={() => setIsSaleModalOpen(true)} className="mt-3 text-blue-600 text-sm font-medium">
                Record your first sale →
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trays</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price/Tray</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => {
                  const currencyObj = currencies.find((c) => c.code === sale.currency);
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(sale.sale_date)}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{sale.customer_name}</td>
                      <td className="px-4 py-3 text-right text-sm">{sale.trays}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        {currencyObj?.symbol || sale.currency} {sale.price_per_tray.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        {currencyObj?.symbol || sale.currency} {sale.total_price.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSubmit={saleMutation.mutate}
        isSubmitting={saleMutation.isPending}
      />
      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        onSubmit={inventoryMutation.mutate}
        initialData={inventory}
        isSubmitting={inventoryMutation.isPending}
      />
    </div>
  );
}

function StatCard({ label, value, prefix = '', valueClass = 'text-gray-800', icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold ${valueClass}`}>
            {prefix}
            {formatNumber(value)}
          </p>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
    </div>
  );
}

function SaleModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customer_name: '',
      trays: '',
      price_per_tray: '',
      currency: 'USD',
      sale_date: new Date().toISOString().split('T')[0],
    },
  });

  const trays = Number(watch('trays')) || 0;
  const pricePerTray = Number(watch('price_per_tray')) || 0;
  const currency = watch('currency');
  const total = trays * pricePerTray;
  const selectedCurrency = currencies.find((c) => c.code === currency) || { symbol: '$' };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Record Tray Sale</h3>
              <p className="text-sm text-slate-500">Log the sale and update stock.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Customer Name *</label>
            <input
              {...register('customer_name', { required: 'Customer name is required' })}
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 ${
                errors.customer_name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
              }`}
              placeholder="e.g. John Doe"
            />
            {errors.customer_name && <p className="mt-2 text-xs text-red-600">{errors.customer_name.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Quantity *</label>
              <input
                type="number"
                {...register('trays', {
                  required: 'Quantity is required',
                  min: { value: 1, message: 'Must be at least 1' },
                })}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 ${
                  errors.trays ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {errors.trays && <p className="mt-2 text-xs text-red-600">{errors.trays.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Price per Tray *</label>
              <input
                type="number"
                step="0.01"
                {...register('price_per_tray', {
                  required: 'Price is required',
                  min: { value: 0.01, message: 'Must be greater than 0' },
                })}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 ${
                  errors.price_per_tray
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {errors.price_per_tray && <p className="mt-2 text-xs text-red-600">{errors.price_per_tray.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Currency</label>
              <select
                {...register('currency')}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {currencies.map((currencyOption) => (
                  <option key={currencyOption.code} value={currencyOption.code}>
                    {currencyOption.code} — {currencyOption.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Sale Date *</label>
              <input
                type="date"
                {...register('sale_date', { required: 'Sale date is required' })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {errors.sale_date && <p className="mt-2 text-xs text-red-600">{errors.sale_date.message}</p>}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Total</span>
              <span className="font-semibold text-slate-900">
                {selectedCurrency.symbol} {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary px-5">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary px-5">
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" /> Recording...
                </>
              ) : (
                'Record Sale'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InventoryModal({ isOpen, onClose, onSubmit, initialData, isSubmitting }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      opening_stock: initialData?.closing_stock || 0,
      received: 0,
      sold: 0,
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Update Tray Inventory</h3>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Opening Stock</label>
            <input
              type="number"
              {...register('opening_stock')}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Received</label>
            <input
              type="number"
              {...register('received')}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Sold</label>
            <input
              type="number"
              {...register('sold')}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-2 text-xs text-slate-500">Manual inventory adjustment only.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary px-5">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary px-5">
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" /> Updating...
                </>
              ) : (
                'Update Inventory'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}