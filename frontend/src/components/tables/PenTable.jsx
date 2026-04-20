// src/components/tables/PenTable.jsx
import { motion } from 'framer-motion';
import {
  Edit, Trash2, Activity, Thermometer, Droplet, Wind,
  TrendingUp, AlertTriangle, Eye, Skull
} from 'lucide-react';

const getStatusBadge = (status) => {
  const styles = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  };
  return styles[status] || styles.inactive;
};

const getHousingIcon = (system) => {
  if (system === 'deep_litter') return '🏠';
  if (system === 'cage') return '🔲';
  return '❓';
};

const getAlertIcon = (pen, env, latestProd) => {
  const birds = latestProd?.closing_stock ?? pen.current_birds ?? 0;
  const densityAlert = (birds / (pen.floor_area_sq_m || 1)) > (pen.max_density || 15);
  const tempAlert = env?.temperature > 32;
  const ammoniaAlert = env?.ammonia > 25;
  const highMortality = (pen.mortality_last_7d || 0) > (birds * 0.05);
  if (densityAlert || tempAlert || ammoniaAlert || highMortality) return <AlertTriangle className="h-4 w-4 text-red-500" />;
  return null;
};

// Table row component
const PenRow = ({ pen, latestProd, env, onEdit, onDelete, onLogMortality, onViewEnvironment }) => {
  const currentBirds = latestProd?.closing_stock ?? pen.current_birds ?? 0;
  const occupancy = pen.capacity ? Math.round((currentBirds / pen.capacity) * 100) : 0;
  const alertIcon = getAlertIcon(pen, env, latestProd);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getHousingIcon(pen.housing_system)}</span>
          <span className="font-medium text-gray-900 dark:text-white">{pen.name}</span>
          {alertIcon && <span className="ml-1">{alertIcon}</span>}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
        {pen.breed || '—'}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(pen.status)}`}>
          {pen.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
        {pen.capacity?.toLocaleString() || '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-1">
          <span>{currentBirds?.toLocaleString() || 0}</span>
          <span className="text-xs text-gray-400">({occupancy}%)</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" title="Temperature">
            <Thermometer size={12} />
            <span>{env?.temperature ?? '—'}°C</span>
          </div>
          <div className="flex items-center gap-1" title="Humidity">
            <Droplet size={12} />
            <span>{env?.humidity ?? '—'}%</span>
          </div>
          <div className="flex items-center gap-1" title="Ammonia">
            <Wind size={12} />
            <span>{env?.ammonia ?? '—'}ppm</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
        {pen.mortality_last_7d || 0}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => onViewEnvironment(pen.id)}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="View environment"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onLogMortality(pen.id)}
            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            title="Record mortality"
          >
            <Skull size={16} />
          </button>
          <button
            onClick={() => onEdit(pen)}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Edit pen"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(pen.id)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete pen"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
};

// Card view component
const PenCard = ({ pen, latestProd, env, onEdit, onDelete, onLogMortality, onViewEnvironment }) => {
  const currentBirds = latestProd?.closing_stock ?? pen.current_birds ?? 0;
  const occupancy = pen.capacity ? Math.round((currentBirds / pen.capacity) * 100) : 0;
  const alertIcon = getAlertIcon(pen, env, latestProd);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getHousingIcon(pen.housing_system)}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{pen.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{pen.breed || 'No breed'}</p>
          </div>
          {alertIcon && <span>{alertIcon}</span>}
        </div>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(pen.status)}`}>
          {pen.status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Capacity</p>
          <p className="font-medium">{pen.capacity?.toLocaleString() || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Current birds</p>
          <p className="font-medium">{currentBirds?.toLocaleString() || 0} ({occupancy}%)</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Mortality (7d)</p>
          <p className="font-medium">{pen.mortality_last_7d || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Environment</p>
          <p className="font-medium text-xs">
            {env?.temperature ?? '—'}°C / {env?.humidity ?? '—'}% / {env?.ammonia ?? '—'}ppm
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
        <button
          onClick={() => onViewEnvironment(pen.id)}
          className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          title="Environment"
        >
          <Eye size={16} />
        </button>
        <button
          onClick={() => onLogMortality(pen.id)}
          className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          title="Mortality"
        >
          <Skull size={16} />
        </button>
        <button
          onClick={() => onEdit(pen)}
          className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Edit"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => onDelete(pen.id)}
          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
};

// Main component
const PenTable = ({
  pens,
  viewMode = 'table',
  latestProduction = {},
  realTimeEnv = {},
  onEdit,
  onDelete,
  onLogMortality,
  onViewEnvironment,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!pens || pens.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-600 dark:bg-gray-800/30">
        <Activity className="mx-auto mb-3 h-10 w-10 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No pens found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create your first pen to see it here.
        </p>
      </div>
    );
  }

  if (viewMode === 'cards') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pens.map((pen) => (
          <PenCard
            key={pen.id}
            pen={pen}
            latestProd={latestProduction[pen.id]}
            env={realTimeEnv[pen.id]}
            onEdit={onEdit}
            onDelete={onDelete}
            onLogMortality={onLogMortality}
            onViewEnvironment={onViewEnvironment}
          />
        ))}
      </div>
    );
  }

  // Table view (default)
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Pen
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Breed
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Capacity
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Current Birds
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Environment
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Mortality (7d)
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {pens.map((pen) => (
            <PenRow
              key={pen.id}
              pen={pen}
              latestProd={latestProduction[pen.id]}
              env={realTimeEnv[pen.id]}
              onEdit={onEdit}
              onDelete={onDelete}
              onLogMortality={onLogMortality}
              onViewEnvironment={onViewEnvironment}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PenTable;