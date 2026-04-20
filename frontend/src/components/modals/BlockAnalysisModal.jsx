import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, TrendingUp, Droplet, Users, Egg, Wheat, Skull } from 'lucide-react';

const MetricCard = ({ title, value, unit, icon: Icon, color }) => (
  <div className={`rounded-xl bg-gradient-to-br ${color} p-4 shadow-sm`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">{title}</p>
        <p className="mt-1 text-2xl font-bold">{value.toLocaleString()}</p>
        {unit && <p className="text-xs opacity-60">{unit}</p>}
      </div>
      <Icon size={20} className="opacity-70" />
    </div>
  </div>
);

export default function BlockAnalysisModal({ isOpen, onClose, blocks, pens, productionRecords }) {
  // Group pens by block
  const blocksWithData = blocks.map(block => {
    const blockPens = pens.filter(p => p.block_id === block.id);
    const blockRecords = blockPens.flatMap(pen => 
      productionRecords.filter(r => r.pen_id === pen.id)
    );
    
    const totalEggs = blockRecords.reduce((sum, r) => sum + (r.total_eggs || 0), 0);
    const totalFeed = blockRecords.reduce((sum, r) => sum + (r.feed_kg || 0), 0);
    const totalMortality = blockRecords.reduce((sum, r) => sum + (r.mortality || 0), 0);
    const avgHd = blockRecords.length ? blockRecords.reduce((sum, r) => sum + (r.hd_percentage || 0), 0) / blockRecords.length : 0;
    const totalBirds = blockPens.reduce((sum, p) => sum + (p.current_birds || p.initial_birds || 0), 0);
    
    return {
      ...block,
      totalEggs,
      totalFeed,
      totalMortality,
      avgHd,
      totalBirds,
      penCount: blockPens.length,
      recordCount: blockRecords.length,
    };
  }).filter(b => b.recordCount > 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Block Analysis</h3>
              <p className="text-sm text-gray-500">Aggregated metrics by block</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 space-y-6">
            {blocksWithData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No production data available for any block.</div>
            ) : (
              blocksWithData.map(block => (
                <div key={block.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Package size={20} className="text-blue-500" />
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{block.name}</h4>
                    <span className="text-sm text-gray-500">({block.penCount} pens, {block.recordCount} records)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <MetricCard
                      title="Total Birds"
                      value={block.totalBirds}
                      unit="birds"
                      icon={Users}
                      color="from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700"
                    />
                    <MetricCard
                      title="Total Eggs"
                      value={block.totalEggs}
                      unit="eggs"
                      icon={Egg}
                      color="from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 text-amber-700"
                    />
                    <MetricCard
                      title="Feed (kg)"
                      value={block.totalFeed}
                      unit="kg"
                      icon={Wheat}
                      color="from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 text-green-700"
                    />
                    <MetricCard
                      title="Mortality"
                      value={block.totalMortality}
                      unit="birds"
                      icon={Skull}
                      color="from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 text-red-700"
                    />
                    <MetricCard
                      title="Avg HD%"
                      value={block.avgHd.toFixed(1)}
                      unit="%"
                      icon={TrendingUp}
                      color="from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-700"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}