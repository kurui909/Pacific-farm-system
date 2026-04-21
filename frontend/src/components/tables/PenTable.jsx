import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Activity, Eye, ChevronUp, ChevronDown, AlertTriangle, CheckCircle, AlertCircle, Flame, Wind, Droplets, Users, TrendingUp, BarChart3, Heart, SkipBack, Thermometer, Zap, CloudRain } from 'lucide-react';

const PenTable = ({
  pens,
  viewMode,
  latestProduction,
  realTimeEnv,
  blocks,
  onEdit,
  onDelete,
  onLogMortality,
  onViewEnvironment,
  isLoading
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Helper functions
  const getBlockName = (blockId) => blocks?.find(b => b.id === blockId)?.name || 'Unknown';

  const getCurrentBirds = (penId) => {
    const production = latestProduction?.find(p => p.pen_id === penId);
    return production?.current_birds || 0;
  };

  const getMortality = (penId) => {
    if (!Array.isArray(latestProduction)) return 0;
    return latestProduction.find(p => p.pen_id === penId)?.mortality_last_7d || 0;
  };

  const getTemperature = (penId) => {
    if (!Array.isArray(realTimeEnv)) return null;
    return realTimeEnv.find(e => e.pen_id === penId)?.temperature || null;
  };

  const getAmmonia = (penId) => {
    if (!Array.isArray(realTimeEnv)) return null;
    return realTimeEnv.find(e => e.pen_id === penId)?.ammonia || null;
  };

  const getHumidity = (penId) => {
    if (!Array.isArray(realTimeEnv)) return null;
    return realTimeEnv.find(e => e.pen_id === penId)?.humidity || null;
  };

  // Status helpers with logical icons
  const getTemperatureStatus = (temp) => {
    if (temp === null) return { color: 'bg-gray-100 dark:bg-gray-700 text-gray-600', icon: AlertCircle, label: 'N/A', severity: 0 };
    if (temp > 35) return { color: 'bg-red-100 dark:bg-red-900/30 text-red-600', icon: Flame, label: `${temp}°C`, severity: 3 };
    if (temp > 30) return { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600', icon: Thermometer, label: `${temp}°C`, severity: 2 };
    if (temp < 15) return { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600', icon: AlertCircle, label: `${temp}°C`, severity: 1 };
    return { color: 'bg-green-100 dark:bg-green-900/30 text-green-600', icon: CheckCircle, label: `${temp}°C`, severity: 0 };
  };

  const getAmmoniaStatus = (ammonia) => {
    if (ammonia === null) return { color: 'bg-gray-100 dark:bg-gray-700 text-gray-600', icon: AlertCircle, label: 'N/A', severity: 0 };
    if (ammonia > 30) return { color: 'bg-red-100 dark:bg-red-900/30 text-red-600', icon: AlertTriangle, label: `${ammonia} ppm`, severity: 3 };
    if (ammonia > 20) return { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600', icon: Wind, label: `${ammonia} ppm`, severity: 2 };
    return { color: 'bg-green-100 dark:bg-green-900/30 text-green-600', icon: CheckCircle, label: `${ammonia} ppm`, severity: 0 };
  };

  const getHumidityStatus = (humidity) => {
    if (humidity === null) return { color: 'bg-gray-100 dark:bg-gray-700 text-gray-600', icon: AlertCircle, label: 'N/A', severity: 0 };
    if (humidity > 80) return { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600', icon: CloudRain, label: `${humidity}%`, severity: 1 };
    if (humidity < 40) return { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600', icon: AlertCircle, label: `${humidity}%`, severity: 1 };
    return { color: 'bg-green-100 dark:bg-green-900/30 text-green-600', icon: CheckCircle, label: `${humidity}%`, severity: 0 };
  };

  const getOccupancyStatus = (occupancy) => {
    if (occupancy > 100) return { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20', icon: AlertTriangle, label: 'Over' };
    if (occupancy > 90) return { color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20', icon: AlertCircle, label: 'High' };
    if (occupancy > 70) return { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20', icon: CheckCircle, label: 'Good' };
    return { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20', icon: AlertCircle, label: 'Low' };
  };

  const getMortalityStatus = (mortality) => {
    if (mortality > 10) return { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20', icon: AlertTriangle, severity: 3 };
    if (mortality > 5) return { color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20', icon: AlertCircle, severity: 2 };
    if (mortality > 0) return { color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20', icon: Activity, severity: 1 };
    return { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20', icon: Heart, severity: 0 };
  };

  // Sorting logic with real data
  const sortedPens = useMemo(() => {
    if (!sortConfig.key) return pens;

    return [...pens].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'block':
          aValue = a.block || '';
          bValue = b.block || '';
          break;
        case 'capacity':
          aValue = a.capacity || 0;
          bValue = b.capacity || 0;
          break;
        case 'currentBirds':
          // Get real bird count from latestProduction
          aValue = latestProduction?.find(p => p.pen_id === a.id)?.current_birds || 0;
          bValue = latestProduction?.find(p => p.pen_id === b.id)?.current_birds || 0;
          break;
        case 'occupancy':
          // Calculate real occupancy percentage
          const aBirds = latestProduction?.find(p => p.pen_id === a.id)?.current_birds || 0;
          const bBirds = latestProduction?.find(p => p.pen_id === b.id)?.current_birds || 0;
          aValue = a.capacity ? (aBirds / a.capacity) * 100 : 0;
          bValue = b.capacity ? (bBirds / b.capacity) * 100 : 0;
          break;
        case 'mortality':
          // Get real mortality data
          aValue = latestProduction?.find(p => p.pen_id === a.id)?.mortality_last_7d || 0;
          bValue = latestProduction?.find(p => p.pen_id === b.id)?.mortality_last_7d || 0;
          break;
        case 'temperature':
          // Get real temperature from realTimeEnv
          aValue = realTimeEnv?.find(env => env.pen_id === a.id)?.temperature || -Infinity;
          bValue = realTimeEnv?.find(env => env.pen_id === b.id)?.temperature || -Infinity;
          break;
        default:
          return 0;
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [pens, sortConfig, latestProduction, realTimeEnv]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-3 py-3 sm:px-6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-3 sm:px-6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-3 sm:px-6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-3 sm:px-6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-3 sm:px-6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-3 sm:px-6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-3 sm:px-6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-3 sm:px-6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
      <td className="px-3 py-3 sm:px-6"><div className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex gap-1"></div></td>
    </tr>
  );

  if (isLoading) {
    return (
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">🏠 Pen</th>
              <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">📍 Block</th>
              <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">👥 Closing Stock</th>
              <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">📊 Occupancy</th>
              <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">❤️ Mortality</th>
              <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">🌡️ Temp</th>
              <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">💨 Ammonia</th>
              <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">🏠 Housing</th>
              <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">⚙️ Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  if (!sortedPens || sortedPens.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <SkipBack size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg">No pens found</p>
        <p className="text-sm mt-2">Try adjusting your filters or add a new pen</p>
      </div>
    );
  }

  if (viewMode === 'cards') {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2 sm:gap-3">
        {sortedPens.map(pen => {
          const currentBirds = getCurrentBirds(pen.id);
          const mortality = getMortality(pen.id);
          const temp = getTemperature(pen.id);
          const ammonia = getAmmonia(pen.id);
          const humidity = getHumidity(pen.id);
          const occupancy = pen.capacity ? ((currentBirds / pen.capacity) * 100).toFixed(1) : 0;
          const tempStatus = getTemperatureStatus(temp);
          const ammoniaStatus = getAmmoniaStatus(ammonia);
          const humidityStatus = getHumidityStatus(humidity);
          const occupancyStatus = getOccupancyStatus(occupancy);
          const mortalityStatus = getMortalityStatus(mortality);

          return (
            <div key={pen.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden w-full">
              {/* Header - Very Compact */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-1.5 text-white">
                <h3 className="text-xs font-bold truncate">{pen.name}</h3>
                <p className="text-xs opacity-90 truncate">📍 {getBlockName(pen.block_id)}</p>
              </div>

              {/* Content - Ultra Compact */}
              <div className="p-2 space-y-1.5">
                {/* Birds Info - Compact */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded p-1.5 border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Users size={10} /> Stock
                    </span>
                    <span className="text-xs font-bold text-green-600">{currentBirds}</span>
                  </div>
                  <div className="w-full bg-green-200 dark:bg-green-900/30 rounded-full h-1">
                    <div
                      className="bg-green-600 h-1 rounded-full transition-all"
                      style={{ width: `${Math.min(occupancy, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                    <span>{occupancy}%</span>
                    <span className={occupancyStatus.color}>{occupancyStatus.label}</span>
                  </div>
                </div>

                {/* Mortality - Compact */}
                <div className={`${mortalityStatus.bg} rounded p-1.5 border border-gray-200 dark:border-gray-600`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <mortalityStatus.icon size={10} className={mortalityStatus.color} /> Mort
                    </span>
                    <span className={`font-bold text-xs ${mortalityStatus.color}`}>{mortality}</span>
                  </div>
                </div>

                {/* Environment - Compact */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">🌡️ Env</p>
                  
                  {/* Temperature */}
                  <div className={`${tempStatus.color} rounded p-1 border border-gray-200 dark:border-gray-600 flex items-center justify-between`}>
                    <div className="flex items-center gap-1">
                      <tempStatus.icon size={10} />
                      <span className="text-xs font-medium">Temp</span>
                    </div>
                    <span className="font-bold text-xs">{tempStatus.label}</span>
                  </div>

                  {/* Ammonia */}
                  <div className={`${ammoniaStatus.color} rounded p-1 border border-gray-200 dark:border-gray-600 flex items-center justify-between`}>
                    <div className="flex items-center gap-1">
                      <ammoniaStatus.icon size={10} />
                      <span className="text-xs font-medium">Ammonia</span>
                    </div>
                    <span className="font-bold text-xs">{ammoniaStatus.label}</span>
                  </div>
                </div>

                {/* Type - Compact */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-1.5">
                  <p className="text-xs text-gray-600 dark:text-gray-400">🏠 Type</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-xs">{pen.housing_system}</p>
                </div>
              </div>

              {/* Actions - Ultra Compact */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-1.5 flex gap-1 bg-gray-50 dark:bg-gray-700/50">
                <button
                  onClick={() => onViewEnvironment(pen)}
                  className="flex-1 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  title="View Environment"
                >
                  <Eye size={10} />
                </button>
                <button
                  onClick={() => onLogMortality(pen)}
                  className="flex-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  title="Log Mortality"
                >
                  <Activity size={10} />
                </button>
                <button
                  onClick={() => onEdit(pen)}
                  className="flex-1 p-1 bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors"
                  title="Edit"
                >
                  <Edit size={10} />
                </button>
                <button
                  onClick={() => onDelete(pen)}
                  className="flex-1 p-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Table view
  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <table className="min-w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('name')}>
              <div className="flex items-center gap-1 sm:gap-2">
                🏠 Pen <SortIcon columnKey="name" />
              </div>
            </th>
            <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('block')}>
              <div className="flex items-center gap-1 sm:gap-2">
                📍 Block <SortIcon columnKey="block" />
              </div>
            </th>
            <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('currentBirds')}>
              <div className="flex items-center gap-1 sm:gap-2">
                👥 Closing Stock <SortIcon columnKey="currentBirds" />
              </div>
            </th>
            <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('occupancy')}>
              <div className="flex items-center gap-1 sm:gap-2">
                📊 Occupancy <SortIcon columnKey="occupancy" />
              </div>
            </th>
            <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => handleSort('mortality')}>
              <div className="flex items-center gap-1 sm:gap-2">
                ❤️ Mortality <SortIcon columnKey="mortality" />
              </div>
            </th>
            <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">🌡️ Temperature</th>
            <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">💨 Ammonia</th>
            <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">🏠 Housing</th>
            <th className="px-3 py-3 sm:px-6 text-left font-bold text-gray-900 dark:text-white">⚙️ Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedPens.map((pen, idx) => {
            const currentBirds = getCurrentBirds(pen.id);
            const mortality = getMortality(pen.id);
            const temp = getTemperature(pen.id);
            const ammonia = getAmmonia(pen.id);
            const humidity = getHumidity(pen.id);
            const occupancy = pen.capacity ? ((currentBirds / pen.capacity) * 100).toFixed(1) : 0;
            const tempStatus = getTemperatureStatus(temp);
            const ammoniaStatus = getAmmoniaStatus(ammonia);
            const humidityStatus = getHumidityStatus(humidity);
            const occupancyStatus = getOccupancyStatus(occupancy);
            const mortalityStatus = getMortalityStatus(mortality);

            return (
              <tr
                key={pen.id}
                className={`border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors ${
                  idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'
                }`}
              >
                {/* Pen Name */}
                <td className="px-3 py-3 sm:px-6">
                  <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{pen.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{pen.status}</div>
                </td>

                {/* Block */}
                <td className="px-3 py-3 sm:px-6 text-gray-700 dark:text-gray-300 text-sm sm:text-base">{getBlockName(pen.block_id)}</td>

                {/* Birds */}
                <td className="px-3 py-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-green-600" />
                    <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{currentBirds}/{pen.capacity}</span>
                  </div>
                </td>

                {/* Occupancy */}
                <td className="px-3 py-3 sm:px-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-1 min-w-[60px] sm:min-w-[80px]">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            occupancy > 100 ? 'bg-red-600' : occupancy > 90 ? 'bg-orange-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(occupancy, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className={`font-bold w-10 sm:w-12 text-right text-xs sm:text-sm ${occupancyStatus.color}`}>{occupancy}%</span>
                  </div>
                </td>

                {/* Mortality */}
                <td className="px-3 py-3 sm:px-6">
                  <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full ${mortalityStatus.bg}`}>
                    <mortalityStatus.icon size={14} className="sm:w-4 sm:h-4" />
                    <span className={`font-bold text-xs sm:text-sm ${mortalityStatus.color}`}>{mortality}</span>
                  </div>
                </td>

                {/* Temperature */}
                <td className="px-3 py-3 sm:px-6">
                  <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg ${tempStatus.color}`}>
                    <tempStatus.icon size={14} className="sm:w-4 sm:h-4" />
                    <span className="font-semibold text-xs sm:text-sm">{tempStatus.label}</span>
                  </div>
                </td>

                {/* Ammonia */}
                <td className="px-3 py-3 sm:px-6">
                  <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg ${ammoniaStatus.color}`}>
                    <ammoniaStatus.icon size={14} className="sm:w-4 sm:h-4" />
                    <span className="font-semibold text-xs sm:text-sm">{ammoniaStatus.label}</span>
                  </div>
                </td>

                {/* Housing */}
                <td className="px-3 py-3 sm:px-6">
                  <span className="px-2 sm:px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs sm:text-sm font-medium">
                    {pen.housing_system}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-3 sm:px-6">
                  <div className="flex gap-1 sm:gap-2">
                    <button
                      onClick={() => onViewEnvironment(pen)}
                      className="p-1 sm:p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      title="View Environment"
                    >
                      <Eye size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => onLogMortality(pen)}
                      className="p-1 sm:p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      title="Log Mortality"
                    >
                      <Activity size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(pen)}
                      className="p-1 sm:p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(pen)}
                      className="p-1 sm:p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PenTable;