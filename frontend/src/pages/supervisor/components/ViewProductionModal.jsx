// src/components/modals/ViewProductionModal.jsx
import { useEffect } from 'react';
import { X, Calendar, User, Package, TrendingUp, Droplet, Egg, Skull, Wheat } from 'lucide-react';
import { format } from 'date-fns';

export const ViewProductionModal = ({ record, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!record) return null;

  const formatNumber = (num) => (num || 0).toLocaleString();
  const formatPercent = (num) => (num || 0).toFixed(1) + '%';
  const formatRatio = (num) => (num || 0).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-4 md:px-6 py-3 md:py-4 border-b dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white">Production Details</h3>
            <p className="text-xs text-gray-500 mt-0.5">Complete record of egg production & flock health</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-5">
          {/* Basic info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{format(new Date(record.date), 'PPP')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package size={16} className="text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Pen</p>
                <p className="font-medium text-gray-900 dark:text-white">{record.pen_name || record.pen?.name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User size={16} className="text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Staff</p>
                <p className="font-medium text-gray-900 dark:text-white">{record.staff_name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wheat size={16} className="text-amber-500" />
              <div>
                <p className="text-xs text-gray-500">Feed (kg)</p>
                <p className="font-medium text-gray-900 dark:text-white">{record.feed_kg?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
          </div>

          {/* Egg counts */}
          <div className="border-t dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <Egg size={18} className="text-amber-500" /> Egg Quality Counts
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Good</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(record.good_eggs)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Damaged</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(record.damaged_eggs)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Small</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(record.small_eggs)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Double Yolk</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(record.double_yolk_eggs)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Soft Shell</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(record.soft_shell_eggs)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Shells</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(record.shells)}</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Eggs</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(record.total_eggs)}</span>
            </div>
          </div>

          {/* Health & efficiency metrics */}
          <div className="border-t dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-500" /> Flock Health & Efficiency
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Mortality</p>
                <p className="font-semibold text-red-600 dark:text-red-400">{formatNumber(record.mortality)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Broody Hens</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(record.broody_hen)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Culls</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(record.culls)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">HD%</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatPercent(record.hd_percentage)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">E/R Ratio</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatRatio(record.er_ratio)}</p>
              </div>
              {record.grams_per_chicken !== undefined && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">Grams/Chicken</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{record.grams_per_chicken?.toFixed(1)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Image if exists */}
          {record.image_url && (
            <div className="border-t dark:border-gray-700 pt-4">
              <img src={record.image_url} alt="Report" className="max-h-64 rounded-xl object-cover w-full" loading="lazy" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t dark:border-gray-700 bg-white dark:bg-gray-800 px-4 md:px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};