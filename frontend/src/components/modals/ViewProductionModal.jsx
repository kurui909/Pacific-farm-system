// src/components/modals/ViewProductionModal.jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';

export const ViewProductionModal = ({ record, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!record) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Production Details</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-sm text-gray-500">Date</span><p className="font-medium">{new Date(record.date).toLocaleDateString()}</p></div>
            <div><span className="text-sm text-gray-500">Pen</span><p className="font-medium">{record.pen?.name || '—'}</p></div>
            <div><span className="text-sm text-gray-500">Staff</span><p className="font-medium">{record.staff_name || '—'}</p></div>
            <div><span className="text-sm text-gray-500">Feed (kg)</span><p className="font-medium">{record.feed_kg}</p></div>
          </div>
          <div className="border-t dark:border-gray-700 pt-4">
            <h4 className="font-medium mb-2">Egg Counts</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>Good: {record.good_eggs}</div>
              <div>Damaged: {record.damaged_eggs}</div>
              <div>Small: {record.small_eggs}</div>
              <div>Double Yolk: {record.double_yolk_eggs}</div>
              <div>Soft Shell: {record.soft_shell_eggs}</div>
              <div>Shells: {record.shells}</div>
            </div>
            <p className="mt-2"><span className="text-gray-500">Total Eggs:</span> <strong>{record.total_eggs}</strong></p>
          </div>
          <div className="border-t dark:border-gray-700 pt-4">
            <h4 className="font-medium mb-2">Metrics</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Mortality: {record.mortality}</div>
              <div>H/D%: {record.hd_percentage?.toFixed(2)}%</div>
              <div>E/R Ratio: {record.er_ratio?.toFixed(2)}</div>
              <div>Grams/Chicken: {record.grams_per_chicken?.toFixed(2)}</div>
            </div>
          </div>
          {record.image_url && <img src={record.image_url} alt="Report" className="max-h-64 rounded-xl object-cover" loading="lazy" />}
        </div>
      </div>
    </div>
  );
};