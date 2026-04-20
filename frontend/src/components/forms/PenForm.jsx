// src/components/forms/PenForm.jsx
import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Home, Bird, Layers, AlertTriangle, CheckCircle, Lightbulb, Feather, HelpCircle
} from 'lucide-react';

const Tooltip = ({ text, children }) => (
  <div className="group relative inline-block">
    {children}
    <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform rounded-md bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap group-hover:block">
      {text}
      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
    </div>
  </div>
);

const PenForm = ({
  initialData,
  onSave,
  onClose,
  isLoading = false,
  isLoadingData = false,
  blocks = [],           // Array of { id, name }
}) => {
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      status: initialData?.status || 'active',
      housing_system: initialData?.housing_system || 'deep_litter',
      breed: initialData?.breed || '',
      source_hatchery: initialData?.source_hatchery || '',
      start_date: initialData?.start_date
        ? new Date(initialData.start_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      initial_birds: initialData?.initial_birds ?? '',
      batch_name: initialData?.batch_name || '',
      birds_per_kg: initialData?.birds_per_kg ?? '',
      capacity: initialData?.capacity ?? '',
      notes: initialData?.notes || '',
      block_id: initialData?.block_id ?? '',
      // Deep Litter
      floor_area_sq_m: initialData?.floor_area_sq_m ?? '',
      max_density: initialData?.max_density ?? '',
      litter_type: initialData?.litter_type || 'wood_shavings',
      feeder_count: initialData?.feeder_count ?? '',
      waterer_count: initialData?.waterer_count ?? '',
      nest_count: initialData?.nest_count ?? '',
      perch_length_cm: initialData?.perch_length_cm ?? '',
      // Cage
      cell_length_mm: initialData?.cell_length_mm ?? '',
      cell_width_mm: initialData?.cell_width_mm ?? '',
      cell_height_mm: initialData?.cell_height_mm ?? '',
      birds_per_cell: initialData?.birds_per_cell ?? '',
      tiers_per_set: initialData?.tiers_per_set ?? '',
      cells_per_set: initialData?.cells_per_set ?? '',
    },
  });

  const housingSystem = useWatch({ control, name: 'housing_system' });
  const floorArea = useWatch({ control, name: 'floor_area_sq_m' });
  const maxDensity = useWatch({ control, name: 'max_density' });
  const birdsPerCell = useWatch({ control, name: 'birds_per_cell' });
  const tiers = useWatch({ control, name: 'tiers_per_set' });
  const cells = useWatch({ control, name: 'cells_per_set' });

  // Auto‑calculate deep litter capacity
  useEffect(() => {
    if (housingSystem === 'deep_litter' && floorArea && maxDensity) {
      const area = parseFloat(floorArea);
      const density = parseFloat(maxDensity);
      if (!isNaN(area) && !isNaN(density) && area > 0 && density > 0) {
        const calc = Math.round(area * density);
        setValue('capacity', calc);
      }
    }
  }, [floorArea, maxDensity, housingSystem, setValue]);

  // Auto‑calculate cage capacity
  useEffect(() => {
    if (housingSystem === 'cage' && birdsPerCell && tiers && cells) {
      const birds = parseFloat(birdsPerCell);
      const t = parseFloat(tiers);
      const c = parseFloat(cells);
      if (!isNaN(birds) && !isNaN(t) && !isNaN(c) && birds > 0 && t > 0 && c > 0) {
        const calc = Math.round(birds * t * c);
        setValue('capacity', calc);
      }
    }
  }, [birdsPerCell, tiers, cells, housingSystem, setValue]);

  // Reset form when initialData changes (editing)
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        status: initialData.status || 'active',
        housing_system: initialData.housing_system || 'deep_litter',
        breed: initialData.breed || '',
        source_hatchery: initialData.source_hatchery || '',
        start_date: initialData.start_date
          ? new Date(initialData.start_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        initial_birds: initialData.initial_birds ?? '',
        batch_name: initialData.batch_name || '',
        birds_per_kg: initialData.birds_per_kg ?? '',
        capacity: initialData.capacity ?? '',
        notes: initialData.notes || '',
        block_id: initialData.block_id ?? '',
        floor_area_sq_m: initialData.floor_area_sq_m ?? '',
        max_density: initialData.max_density ?? '',
        litter_type: initialData.litter_type || 'wood_shavings',
        feeder_count: initialData.feeder_count ?? '',
        waterer_count: initialData.waterer_count ?? '',
        nest_count: initialData.nest_count ?? '',
        perch_length_cm: initialData.perch_length_cm ?? '',
        cell_length_mm: initialData.cell_length_mm ?? '',
        cell_width_mm: initialData.cell_width_mm ?? '',
        cell_height_mm: initialData.cell_height_mm ?? '',
        birds_per_cell: initialData.birds_per_cell ?? '',
        tiers_per_set: initialData.tiers_per_set ?? '',
        cells_per_set: initialData.cells_per_set ?? '',
      });
    }
  }, [initialData, reset]);

  const handleFormClose = () => {
    setIsFormOpen(false);
    setTimeout(onClose, 200);
  };

  // Clean empty strings to null for numeric fields
  const cleanData = (data) => {
    const numericFields = [
      'initial_birds', 'birds_per_kg', 'capacity',
      'floor_area_sq_m', 'max_density', 'feeder_count', 'waterer_count',
      'nest_count', 'perch_length_cm', 'cell_length_mm', 'cell_width_mm',
      'cell_height_mm', 'birds_per_cell', 'tiers_per_set', 'cells_per_set', 'block_id'
    ];
    const cleaned = { ...data };
    for (const field of numericFields) {
      if (cleaned[field] === '' || cleaned[field] === undefined) {
        cleaned[field] = null;
      } else if (typeof cleaned[field] === 'string' && !isNaN(cleaned[field])) {
        cleaned[field] = parseFloat(cleaned[field]);
      }
    }
    // Ensure start_date is a date string (already YYYY-MM-DD)
    return cleaned;
  };

  const onSubmit = async (data) => {
    const cleaned = cleanData(data);
    setIsSubmitting(true);
    try {
      await onSave(cleaned);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Welfare feedback helpers
  const deepLitterChecks = useMemo(() => {
    const area = parseFloat(floorArea) || 0;
    const density = parseFloat(maxDensity) || 0;
    if (!area || !density) return null;

    const feeders = parseFloat(watch('feeder_count')) || 1;
    const waterers = parseFloat(watch('waterer_count')) || 1;
    const nests = parseFloat(watch('nest_count')) || 1;
    const perches = parseFloat(watch('perch_length_cm')) || 1;
    const birds = parseFloat(watch('capacity')) || 1;

    return [
      { label: 'Stocking density (6-8 birds/m² recommended)', pass: density >= 6 && density <= 8, value: `${density} birds/m²` },
      { label: 'Feeder ratio (≤50 birds/feeder)', pass: birds / feeders <= 50, value: `${Math.round(birds / feeders)} birds/feeder` },
      { label: 'Waterer ratio (≤80 birds/waterer)', pass: birds / waterers <= 80, value: `${Math.round(birds / waterers)} birds/waterer` },
      { label: 'Nest provision (1 per ≤7 hens)', pass: birds / nests <= 7, value: `${Math.round(birds / nests)} birds/nest` },
      { label: 'Perch availability (15-20 cm/bird)', pass: perches / birds >= 0.15 && perches / birds <= 0.20, value: `${(perches / birds).toFixed(1)} cm/bird` },
    ];
  }, [floorArea, maxDensity, watch]);

  const cageChecks = useMemo(() => {
    const len = parseFloat(watch('cell_length_mm')) || 0;
    const wid = parseFloat(watch('cell_width_mm')) || 0;
    const hei = parseFloat(watch('cell_height_mm')) || 0;
    const birds = parseFloat(watch('birds_per_cell')) || 1;
    const tiersVal = parseFloat(watch('tiers_per_set')) || 0;
    const cellsVal = parseFloat(watch('cells_per_set')) || 0;

    if (!len || !wid || !hei || !birds || !tiersVal || !cellsVal) return null;

    const area = len * wid;
    const spacePerBird = area / birds;

    return [
      { label: 'Cell length', pass: len >= 450 && len <= 500, value: `${len}mm (optimal: 480mm)` },
      { label: 'Cell width', pass: wid >= 350 && wid <= 400, value: `${wid}mm (optimal: 375mm)` },
      { label: 'Cell height', pass: hei >= 380 && hei <= 420, value: `${hei}mm (optimal: 400mm)` },
      { label: 'Space per bird', pass: spacePerBird >= 400, value: `${Math.round(spacePerBird)}cm² (min: 400cm²)` },
      { label: 'Birds per cell', pass: birds >= 3 && birds <= 5, value: `${birds} (optimal: 4)` },
      { label: 'Tiers', pass: tiersVal >= 3 && tiersVal <= 4, value: `${tiersVal} (optimal: 4)` },
    ];
  }, [watch]);

  const allOptimal = (housingSystem === 'deep_litter' ? deepLitterChecks : cageChecks)?.every(c => c.pass) ?? false;

  const loading = isSubmitting || isLoading || isLoadingData;

  return (
    <AnimatePresence>
      {isFormOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleFormClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {initialData ? 'Edit Pen' : 'Create New Pen'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {initialData ? 'Update pen details and housing configuration' : 'Add a new pen to your farm'}
                </p>
              </div>
              <button
                onClick={handleFormClose}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
              {/* Basic Information */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <Bird size={20} className="text-blue-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pen Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('name', { required: 'Pen name is required' })}
                      type="text"
                      placeholder="e.g., Pen A1"
                      className={`w-full rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Block (optional)
                    </label>
                    <select
                      {...register('block_id')}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None</option>
                      {blocks.map(block => (
                        <option key={block.id} value={block.id}>{block.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      {...register('status')}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Housing System <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <motion.button
                        type="button"
                        onClick={() => setValue('housing_system', 'deep_litter')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all ${
                          housingSystem === 'deep_litter'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Home size={20} className={housingSystem === 'deep_litter' ? 'text-blue-600' : 'text-gray-500'} />
                          <span className={`font-semibold ${housingSystem === 'deep_litter' ? 'text-blue-900 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300'}`}>
                            Deep Litter
                          </span>
                          {housingSystem === 'deep_litter' && <CheckCircle size={16} className="ml-auto text-blue-600" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Floor-based bedding system, allows natural behavior</p>
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={() => setValue('housing_system', 'cage')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all ${
                          housingSystem === 'cage'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Layers size={20} className={housingSystem === 'cage' ? 'text-purple-600' : 'text-gray-500'} />
                          <span className={`font-semibold ${housingSystem === 'cage' ? 'text-purple-900 dark:text-purple-200' : 'text-gray-700 dark:text-gray-300'}`}>
                            Cage System
                          </span>
                          {housingSystem === 'cage' && <CheckCircle size={16} className="ml-auto text-purple-600" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Battery cages, maximum space efficiency</p>
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Batch Name
                    </label>
                    <input
                      {...register('batch_name')}
                      type="text"
                      placeholder="e.g., Batch 2025-01"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </section>

              {/* Flock Details */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <Feather size={20} className="text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Flock Details</h3>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Breed <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('breed', { required: 'Breed is required' })}
                      type="text"
                      placeholder="e.g., Lohmann Brown"
                      className={`w-full rounded-lg border ${errors.breed ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {errors.breed && <p className="mt-1 text-xs text-red-500">{errors.breed.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Source Hatchery
                    </label>
                    <input
                      {...register('source_hatchery')}
                      type="text"
                      placeholder="Hatchery name"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Arrival Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('start_date', { required: 'Arrival date is required' })}
                      type="date"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Birds per kg
                      <Tooltip text="Average weight of birds in kg">
                        <HelpCircle size={14} className="inline ml-1 text-gray-400 cursor-help" />
                      </Tooltip>
                    </label>
                    <input
                      {...register('birds_per_kg')}
                      type="number"
                      step="0.1"
                      placeholder="e.g., 1.7"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </section>

              {/* Housing Configuration */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <Layers size={20} className="text-purple-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Housing Configuration</h3>
                </div>

                {housingSystem === 'deep_litter' && (
                  <motion.div
                    key="deep_litter"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5 rounded-xl bg-blue-50/50 dark:bg-blue-900/5 p-5 border border-blue-200 dark:border-blue-800"
                  >
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Floor Area (m²)
                        </label>
                        <input
                          {...register('floor_area_sq_m')}
                          type="number"
                          step="0.1"
                          placeholder="100"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Max Density (birds/m²)
                        </label>
                        <input
                          {...register('max_density')}
                          type="number"
                          step="0.5"
                          placeholder="10"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Litter Type
                        </label>
                        <select
                          {...register('litter_type')}
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="wood_shavings">Wood Shavings</option>
                          <option value="rice_hulls">Rice Hulls</option>
                          <option value="straw">Straw</option>
                          <option value="sand">Sand</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Feeder Count
                        </label>
                        <input
                          {...register('feeder_count')}
                          type="number"
                          placeholder="10"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Waterer Count
                        </label>
                        <input
                          {...register('waterer_count')}
                          type="number"
                          placeholder="5"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nest Count
                        </label>
                        <input
                          {...register('nest_count')}
                          type="number"
                          placeholder="15"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Perch Length (cm)
                        </label>
                        <input
                          {...register('perch_length_cm')}
                          type="number"
                          placeholder="2000"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {deepLitterChecks && (
                      <div className="mt-4 rounded-lg bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb size={16} className="text-amber-500" />
                          <h4 className="font-semibold text-gray-900 dark:text-white">Welfare Standards Check</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {deepLitterChecks.map((check, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              {check.pass ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" /> : <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />}
                              <span className={check.pass ? 'text-gray-700 dark:text-gray-300' : 'text-amber-600 dark:text-amber-400'}>
                                {check.label}: <span className="font-mono">{check.value}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {housingSystem === 'cage' && (
                  <motion.div
                    key="cage"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5 rounded-xl bg-purple-50/50 dark:bg-purple-900/5 p-5 border border-purple-200 dark:border-purple-800"
                  >
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cell Length (mm)
                        </label>
                        <input
                          {...register('cell_length_mm')}
                          type="number"
                          placeholder="480"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cell Width (mm)
                        </label>
                        <input
                          {...register('cell_width_mm')}
                          type="number"
                          placeholder="375"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cell Height (mm)
                        </label>
                        <input
                          {...register('cell_height_mm')}
                          type="number"
                          placeholder="400"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Birds per Cell
                        </label>
                        <input
                          {...register('birds_per_cell')}
                          type="number"
                          placeholder="4"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tiers per Set
                        </label>
                        <input
                          {...register('tiers_per_set')}
                          type="number"
                          placeholder="4"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cells per Set
                        </label>
                        <input
                          {...register('cells_per_set')}
                          type="number"
                          placeholder="12"
                          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    {cageChecks && (
                      <div className="mt-4 rounded-lg bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3">
                          {allOptimal ? <CheckCircle size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {allOptimal ? 'Configuration Excellent!' : 'Performance Recommendations'}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {cageChecks.map((check, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              {check.pass ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" /> : <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />}
                              <span className={check.pass ? 'text-gray-700 dark:text-gray-300' : 'text-amber-600 dark:text-amber-400'}>
                                {check.label}: <span className="font-mono">{check.value}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </section>

              {/* Capacity & Notes */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <CheckCircle size={20} className="text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Capacity & Notes</h3>
                </div>
                <div className="rounded-xl bg-green-50/50 dark:bg-green-900/5 p-5 border border-green-200 dark:border-green-800">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Capacity <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('capacity', { required: 'Capacity is required' })}
                        type="number"
                        placeholder="Auto-calculated or override"
                        className={`w-full rounded-lg border ${errors.capacity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500`}
                      />
                      {errors.capacity && <p className="mt-1 text-xs text-red-500">{errors.capacity.message}</p>}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Auto-calculated from housing configuration or override</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes
                        <Tooltip text="Any additional information about this pen">
                          <HelpCircle size={14} className="inline ml-1 text-gray-400 cursor-help" />
                        </Tooltip>
                      </label>
                      <textarea
                        {...register('notes')}
                        rows="3"
                        placeholder="Additional notes about this pen..."
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleFormClose}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-2.5 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      {initialData ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    initialData ? 'Update Pen' : 'Create Pen'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PenForm;