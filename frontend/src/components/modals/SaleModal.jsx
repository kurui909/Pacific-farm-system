import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { currencies } from '../../utils/currencies';
import { formatCurrency } from '../../utils/formatters';
import { ShoppingCart, X, Loader2 } from 'lucide-react';

export default function SaleModal({ isOpen, onClose, onSubmit, isSubmitting, saleType }) {
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

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Record {saleType === 'trays' ? 'Tray' : 'Egg'} Sale
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Update inventory after a sale.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Customer Name</label>
            <input
              {...register('customer_name', { required: 'Customer name is required' })}
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 ${
                errors.customer_name ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
              } dark:border-slate-700 dark:bg-slate-900 dark:text-white`}
              placeholder="John Doe"
            />
            {errors.customer_name && <p className="mt-2 text-sm text-red-600">{errors.customer_name.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</label>
              <input
                type="number"
                {...register('trays', { required: 'Quantity is required', min: { value: 1, message: 'Enter at least 1' } })}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 ${
                  errors.trays ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                } dark:border-slate-700 dark:bg-slate-900 dark:text-white`}
              />
              {errors.trays && <p className="mt-2 text-sm text-red-600">{errors.trays.message}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Price per Tray</label>
              <input
                type="number"
                step="0.01"
                {...register('price_per_tray', { required: 'Price is required', min: { value: 0.01, message: 'Price must be positive' } })}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 ${
                  errors.price_per_tray ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                } dark:border-slate-700 dark:bg-slate-900 dark:text-white`}
              />
              {errors.price_per_tray && <p className="mt-2 text-sm text-red-600">{errors.price_per_tray.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Currency</label>
            <select
              {...register('currency')}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {currencies.map((currencyOption) => (
                <option key={currencyOption.code} value={currencyOption.code}>
                  {currencyOption.code} — {currencyOption.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Sale Date</label>
            <input
              type="date"
              {...register('sale_date', { required: 'Sale date is required' })}
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 ${
                errors.sale_date ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
              } dark:border-slate-700 dark:bg-slate-900 dark:text-white`}
            />
            {errors.sale_date && <p className="mt-2 text-sm text-red-600">{errors.sale_date.message}</p>}
          </div>

          <div className="rounded-3xl bg-slate-50 p-4 text-sm dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span>Total</span>
              <span className="font-semibold text-slate-900 dark:text-white">
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