// src/components/modals/EnvironmentalModal.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, Thermometer, Droplet, AlertTriangle, Wind } from 'lucide-react';

const EnvironmentalModal = ({ penId, pen, env, onClose }) => {
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
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {pen?.name} - Environment
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {env ? (
              <>
                {/* Temperature */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-center gap-3">
                    <Thermometer size={24} className="text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Temperature</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{env.temperature}°C</p>
                    </div>
                  </div>
                  {env.temperature > 32 && <AlertTriangle size={20} className="text-red-500" />}
                  {env.temperature > 28 && env.temperature <= 32 && <AlertTriangle size={20} className="text-yellow-500" />}
                </motion.div>

                {/* Humidity */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-3">
                    <Droplet size={24} className="text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Humidity</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{env.humidity}%</p>
                    </div>
                  </div>
                </motion.div>

                {/* Ammonia */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center gap-3">
                    <Wind size={24} className="text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Ammonia</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{env.ammonia || 'N/A'} ppm</p>
                    </div>
                  </div>
                  {env.ammonia > 25 && <AlertTriangle size={20} className="text-red-500" />}
                  {env.ammonia > 15 && env.ammonia <= 25 && <AlertTriangle size={20} className="text-yellow-500" />}
                </motion.div>

                {/* Status Indicators */}
                <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Temperature Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        env.temperature > 32
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                          : env.temperature > 28
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      }`}>
                        {env.temperature > 32 ? 'Critical' : env.temperature > 28 ? 'Caution' : 'Normal'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Ammonia Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        env.ammonia > 25
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                          : env.ammonia > 15
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      }`}>
                        {env.ammonia > 25 ? 'Critical' : env.ammonia > 15 ? 'Caution' : 'Normal'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No environmental data available</p>
              </div>
            )}

            {/* Footer */}
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors mt-6"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnvironmentalModal;