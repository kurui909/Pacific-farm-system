// src/components/forms/ProductionForm.jsx
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast'; // Add this line

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Loader2, Calendar, User, Package, Activity, AlertCircle, HelpCircle, 
  TrendingUp, Droplet, Skull, Egg, Wheat, Users 
} from 'lucide-react';
import { productionService } from '../../services/api';

const Tooltip = ({ text, children }) => (
  <div className="group relative inline-block">
    {children}
    <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap group-hover:block z-50">
      {text}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
    </div>
  </div>
);

const InputField = ({ label, name, register, errors, type = "text", placeholder, tooltip, readOnly = false, step, required, icon: Icon }) => (
  <div>
    <div className="flex items-center gap-1 mb-1">
      {Icon && <Icon size={14} className="text-gray-400" />}
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {tooltip && <Tooltip text={tooltip}><HelpCircle size={14} className="text-gray-400 cursor-help" /></Tooltip>}
    </div>
    <input
      type={type}
      {...register(name, required ? { required: `${label} is required` } : {})}
      placeholder={placeholder}
      readOnly={readOnly}
      step={step}
      className={`w-full rounded-lg border ${errors[name] ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${readOnly ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
    />
    {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name].message}</p>}
  </div>
);

const NumberField = ({ label, name, register, errors, placeholder, tooltip, readOnly = false, required, icon }) => (
  <InputField
    label={label}
    name={name}
    register={register}
    errors={errors}
    type="number"
    placeholder={placeholder}
    tooltip={tooltip}
    readOnly={readOnly}
    required={required}
    step="any"
    icon={icon}
  />
);

export default function ProductionForm({ isOpen, onClose, onSubmit, isSubmitting, initialData, pens }) {
  const [fetchingPrevStock, setFetchingPrevStock] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      pen_id: '',
      age_days: '',
      week_number: '',
      opening_stock: '',
      closing_stock: '',
      feed_kg: '',
      good_eggs: '',
      damaged_eggs: '',
      small_eggs: '',
      double_yolk_eggs: '',
      soft_shell_eggs: '',
      shells: '',
      broody_hen: '',
      culls: '',
      mortality: '',
      staff_name: '',
    },
  });

  const selectedPenId = useWatch({ control, name: 'pen_id' });
  const selectedDate = useWatch({ control, name: 'date' });
  const selectedPen = useMemo(() => pens?.find((p) => String(p.id) === String(selectedPenId)), [pens, selectedPenId]);

  // Watch egg fields for live total
  const good = useWatch({ control, name: 'good_eggs' }) || 0;
  const damaged = useWatch({ control, name: 'damaged_eggs' }) || 0;
  const small = useWatch({ control, name: 'small_eggs' }) || 0;
  const doubleYolk = useWatch({ control, name: 'double_yolk_eggs' }) || 0;
  const softShell = useWatch({ control, name: 'soft_shell_eggs' }) || 0;
  const shells = useWatch({ control, name: 'shells' }) || 0;
  const totalEggs = Number(good) + Number(damaged) + Number(small) + Number(doubleYolk) + Number(softShell) + Number(shells);

  // Auto‑fill age & week number
  useEffect(() => {
    if (!selectedPen?.start_date || !selectedDate) {
      setValue('age_days', '');
      setValue('week_number', '');
      return;
    }
    const introDate = new Date(selectedPen.start_date);
    const currentDate = new Date(selectedDate);
    const diffDays = Math.floor((currentDate - introDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0) {
      setValue('age_days', diffDays);
      setValue('week_number', (diffDays / 7).toFixed(1));
    } else {
      setValue('age_days', '');
      setValue('week_number', '');
    }
  }, [selectedPen, selectedDate, setValue]);

  // Auto‑fetch opening stock from previous day
  useEffect(() => {
    if (initialData || !selectedPenId || !selectedDate) return;
    let active = true;
    const fetchPrev = async () => {
      const prevDate = new Date(selectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
      setFetchingPrevStock(true);
      try {
        if (typeof productionService.getPreviousRecord !== 'function') {
          console.warn('productionService.getPreviousRecord not defined');
          if (active) setValue('opening_stock', '');
          return;
        }
        const prevRecord = await productionService.getPreviousRecord(selectedPenId, prevDate.toISOString().split('T')[0]);
        if (active && prevRecord?.closing_stock != null) setValue('opening_stock', prevRecord.closing_stock);
        else if (active) setValue('opening_stock', '');
      } catch (err) {
        console.warn('Failed to fetch previous record', err);
        if (active) setValue('opening_stock', '');
      } finally {
        if (active) setFetchingPrevStock(false);
      }
    };
    fetchPrev();
    return () => (active = false);
  }, [initialData, selectedPenId, selectedDate, setValue]);

  const handleFormSubmit = (data) => {
    // Convert empty strings to null for numeric fields
    const cleanNumber = (val) => {
      if (val === '' || val === undefined || val === null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    // Prepare payload exactly matching backend ProductionCreate schema
    const payload = {
      pen_id: parseInt(data.pen_id),
      date: data.date,  // YYYY-MM-DD – FastAPI will parse as date
      age_days: cleanNumber(data.age_days),
      week_number: cleanNumber(data.week_number),
      opening_stock: cleanNumber(data.opening_stock),
      closing_stock: cleanNumber(data.closing_stock),
      mortality: cleanNumber(data.mortality) ?? 0,
      feed_kg: cleanNumber(data.feed_kg) ?? 0,
      good_eggs: cleanNumber(good) ?? 0,
      damaged_eggs: cleanNumber(damaged) ?? 0,
      small_eggs: cleanNumber(small) ?? 0,
      double_yolk_eggs: cleanNumber(doubleYolk) ?? 0,
      soft_shell_eggs: cleanNumber(softShell) ?? 0,
      shells: cleanNumber(shells) ?? 0,
      broody_hen: cleanNumber(data.broody_hen) ?? 0,
      culls: cleanNumber(data.culls) ?? 0,
      staff_name: data.staff_name?.trim() || null,
      total_eggs: totalEggs,
    };

    // Validate required fields
    if (!payload.pen_id) {
      toast.error('Please select a pen');
      return;
    }
    if (payload.opening_stock === null || payload.opening_stock === undefined) {
      toast.error('Opening stock is required');
      return;
    }
    if (payload.closing_stock === null || payload.closing_stock === undefined) {
      toast.error('Closing stock is required');
      return;
    }
    if (payload.feed_kg === null || payload.feed_kg === undefined) {
      toast.error('Feed consumed is required');
      return;
    }

    console.log('Submitting payload:', payload);
    onSubmit(payload);
    reset();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {initialData ? 'Edit Production Entry' : 'Daily Production Entry'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Record egg production, feed consumption, and flock health
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
            {/* Basic Information */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <Calendar size={20} className="text-blue-500" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField
                  label="Date"
                  name="date"
                  register={register}
                  errors={errors}
                  type="date"
                  required={true}
                  tooltip="The date of this production record"
                  icon={Calendar}
                />
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Package size={14} className="text-gray-400" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pen *</label>
                    <Tooltip text="Select the pen where this production was recorded"><HelpCircle size={14} className="text-gray-400 cursor-help" /></Tooltip>
                  </div>
                  <select
                    {...register('pen_id', { required: 'Pen is required' })}
                    className={`w-full rounded-lg border ${errors.pen_id ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Select Pen</option>
                    {pens?.map((pen) => <option key={pen.id} value={pen.id}>{pen.name}</option>)}
                  </select>
                  {errors.pen_id && <p className="mt-1 text-xs text-red-500">{errors.pen_id.message}</p>}
                </div>
                <NumberField
                  label="Age (days)"
                  name="age_days"
                  register={register}
                  errors={errors}
                  placeholder="Auto-calculated"
                  readOnly={true}
                  tooltip="Flock age in days (auto from start date)"
                  icon={TrendingUp}
                />
                <NumberField
                  label="Week Number"
                  name="week_number"
                  register={register}
                  errors={errors}
                  placeholder="Auto-calculated"
                  readOnly={true}
                  tooltip="Flock age in weeks"
                  icon={TrendingUp}
                />
              </div>
            </section>

            {/* Stock & Feed */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <Package size={20} className="text-green-500" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Stock & Feed</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <NumberField
                  label="Opening Stock"
                  name="opening_stock"
                  register={register}
                  errors={errors}
                  placeholder="e.g., 5000"
                  required={true}
                  tooltip="Number of birds at the start of the day (auto-filled from previous day's closing stock)"
                  icon={Users}
                />
                <NumberField
                  label="Closing Stock"
                  name="closing_stock"
                  register={register}
                  errors={errors}
                  placeholder="e.g., 4950"
                  required={true}
                  tooltip="Number of birds at the end of the day (after mortality/culls)"
                  icon={Users}
                />
                <NumberField
                  label="Feed Consumed (kg)"
                  name="feed_kg"
                  register={register}
                  errors={errors}
                  placeholder="e.g., 1250.5"
                  required={true}
                  tooltip="Total feed given to the pen (kg)"
                  icon={Wheat}
                />
              </div>
              {fetchingPrevStock && <p className="text-xs text-gray-500 animate-pulse">Loading previous day's closing stock...</p>}
            </section>

            {/* Egg Quality */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <Egg size={20} className="text-amber-500" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Egg Quality Counts</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <NumberField
                  label="Good Eggs"
                  name="good_eggs"
                  register={register}
                  errors={errors}
                  placeholder="0"
                  tooltip="Grade A eggs – marketable"
                  icon={Egg}
                />
                <NumberField
                  label="Damaged"
                  name="damaged_eggs"
                  register={register}
                  errors={errors}
                  placeholder="0"
                  tooltip="Cracked or dirty eggs"
                  icon={AlertCircle}
                />
                <NumberField
                  label="Small"
                  name="small_eggs"
                  register={register}
                  errors={errors}
                  placeholder="0"
                  tooltip="Underweight eggs"
                  icon={Egg}
                />
                <NumberField
                  label="Double Yolk"
                  name="double_yolk_eggs"
                  register={register}
                  errors={errors}
                  placeholder="0"
                  tooltip="Eggs with two yolks"
                  icon={Egg}
                />
                <NumberField
                  label="Soft Shell"
                  name="soft_shell_eggs"
                  register={register}
                  errors={errors}
                  placeholder="0"
                  tooltip="Shell-less or very thin shells"
                  icon={Egg}
                />
                <NumberField
                  label="Shells"
                  name="shells"
                  register={register}
                  errors={errors}
                  placeholder="0"
                  tooltip="Broken shells only (no content)"
                  icon={Egg}
                />
              </div>
              <div className="mt-3 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Production (eggs)</label>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalEggs.toLocaleString()}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Auto-sum of all egg categories</p>
              </div>
            </section>

            {/* Flock Health */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <Droplet size={20} className="text-red-500" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Flock Health & Management</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <NumberField
                  label="Broody Hens"
                  name="broody_hen"
                  register={register}
                  errors={errors}
                  placeholder="0"
                  tooltip="Hens that are sitting on eggs (not laying)"
                  icon={Droplet}
                />
                <NumberField
                  label="Culls"
                  name="culls"
                  register={register}
                  errors={errors}
                  placeholder="0"
                  tooltip="Birds removed due to low production / illness"
                  icon={AlertCircle}
                />
                <NumberField
                  label="Mortality"
                  name="mortality"
                  register={register}
                  errors={errors}
                  placeholder="0"
                  tooltip="Deaths during the day"
                  icon={Skull}
                />
                <InputField
                  label="Staff Name"
                  name="staff_name"
                  register={register}
                  errors={errors}
                  placeholder="e.g., John Doe"
                  tooltip="Person who recorded this entry"
                  icon={User}
                />
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-2.5 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {initialData ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  initialData ? 'Update Entry' : 'Submit Entry'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}