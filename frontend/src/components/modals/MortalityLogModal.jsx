// src/components/modals/MortalityLogModal.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

const MortalityLogModal = ({ penId, onSubmit, onClose, isLoading }) => {
  const [count, setCount] = useState('');
  const [cause, setCause] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!count || !cause) return;
    onSubmit({
      count: parseInt(count),
      cause,
      notes,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 border-b border-red-200 dark:border-red-800 p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-red-900 dark:text-red-200">
              <AlertTriangle size={24} /> Log Mortality
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Birds <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="Enter count"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cause of Death <span className="text-red-500">*</span>
              </label>
              <select
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select cause...</option>
                <option value="disease">Disease</option>
                <option value="predation">Predation</option>
                <option value="injury">Injury</option>
                <option value="culling">Culling</option>
                <option value="unknown">Unknown</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details about the incident..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !count || !cause}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Recording...' : 'Record Mortality'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MortalityLogModal;