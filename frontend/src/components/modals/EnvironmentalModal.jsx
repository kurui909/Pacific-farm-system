import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Thermometer, Wind, Droplets, AlertCircle, Save, Calendar, MapPin, Cloud, Sun, CloudRain, CloudSnow, Zap } from 'lucide-react';
import { weatherService } from '../../services/api';

const EnvironmentalModal = ({ pen, environmentData, onClose, onSaveReading }) => {
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [externalWeather, setExternalWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [recordData, setRecordData] = useState({
    temperature: '',
    humidity: '',
    ammonia: '',
    notes: '',
    recorded_date: new Date().toISOString().split('T')[0],
  });

  // Fetch external weather data
  useEffect(() => {
    const fetchExternalWeather = async () => {
      setLoadingWeather(true);
      try {
        // Try to get weather by farm location (you can configure this)
        // For now, using a default location - replace with your farm coordinates
        const weather = await weatherService.getCurrentWeather(6.5244, 3.3792); // Lagos, Nigeria as example
        setExternalWeather(weather);
      } catch (error) {
        console.error('Failed to fetch external weather:', error);
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchExternalWeather();
  }, []);

  const handleRecordChange = (e) => {
    const { name, value } = e.target;
    setRecordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitRecord = (e) => {
    e.preventDefault();
    if (onSaveReading && recordData.temperature) {
      onSaveReading({ pen_id: pen.id, ...recordData });
      setRecordData({
        temperature: '',
        humidity: '',
        ammonia: '',
        notes: '',
        recorded_date: new Date().toISOString().split('T')[0],
      });
      setShowRecordForm(false);
    }
  };

  const getWeatherIcon = (weatherId) => {
    if (!weatherId) return Cloud;
    if (weatherId >= 200 && weatherId < 300) return Zap; // Thunderstorm
    if (weatherId >= 300 && weatherId < 500) return CloudRain; // Drizzle
    if (weatherId >= 500 && weatherId < 600) return CloudRain; // Rain
    if (weatherId >= 600 && weatherId < 700) return CloudSnow; // Snow
    if (weatherId >= 700 && weatherId < 800) return Cloud; // Atmosphere
    if (weatherId === 800) return Sun; // Clear
    if (weatherId > 800) return Cloud; // Clouds
    return Cloud;
  };

  if (!environmentData && !externalWeather) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Loading Environmental Data</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Fetching real-time data...</p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const getTemperatureStatus = (temp) => {
    if (temp === null || temp === undefined) return { color: 'bg-gray-100 dark:bg-gray-700 text-gray-600', icon: AlertCircle, label: 'N/A', severity: 0 };
    if (temp > 35) return { color: 'bg-red-100 dark:bg-red-900/30 text-red-600', icon: Thermometer, label: `${temp}°C`, severity: 3 };
    if (temp > 30) return { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600', icon: Thermometer, label: `${temp}°C`, severity: 2 };
    if (temp < 15) return { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600', icon: Thermometer, label: `${temp}°C`, severity: 1 };
    return { color: 'bg-green-100 dark:bg-green-900/30 text-green-600', icon: Thermometer, label: `${temp}°C`, severity: 0 };
  };

  const getAmmoniaStatus = (ammonia) => {
    if (ammonia === null || ammonia === undefined) return { color: 'bg-gray-100 dark:bg-gray-700 text-gray-600', icon: AlertCircle, label: 'N/A', severity: 0 };
    if (ammonia > 30) return { color: 'bg-red-100 dark:bg-red-900/30 text-red-600', icon: AlertCircle, label: `${ammonia} ppm`, severity: 3 };
    if (ammonia > 20) return { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600', icon: Wind, label: `${ammonia} ppm`, severity: 2 };
    return { color: 'bg-green-100 dark:bg-green-900/30 text-green-600', icon: Wind, label: `${ammonia} ppm`, severity: 0 };
  };

  const getHumidityStatus = (humidity) => {
    if (humidity === null || humidity === undefined) return { color: 'bg-gray-100 dark:bg-gray-700 text-gray-600', icon: AlertCircle, label: 'N/A', severity: 0 };
    if (humidity > 80) return { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600', icon: Droplets, label: `${humidity}%`, severity: 1 };
    if (humidity < 40) return { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600', icon: Droplets, label: `${humidity}%`, severity: 1 };
    return { color: 'bg-green-100 dark:bg-green-900/30 text-green-600', icon: Droplets, label: `${humidity}%`, severity: 0 };
  };

  const tempStatus = getTemperatureStatus(environmentData?.temperature);
  const ammStatus = getAmmoniaStatus(environmentData?.ammonia);
  const humStatus = getHumidityStatus(environmentData?.humidity);

  const WeatherIcon = getWeatherIcon(externalWeather?.weather?.[0]?.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🌡️ Environmental Conditions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Pen: <span className="font-bold">{pen.name}</span></p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* External Weather Section */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-sky-200 dark:border-sky-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🌍 External Weather Data
              <MapPin size={18} className="text-sky-600" />
            </h3>

            {loadingWeather ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading weather data...</span>
              </div>
            ) : externalWeather ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Weather Main */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3 mb-2">
                    <WeatherIcon size={32} className="text-sky-600" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Weather</p>
                      <p className="font-bold text-gray-900 dark:text-white capitalize">
                        {externalWeather.weather?.[0]?.description || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-sky-600">
                    {Math.round(externalWeather.main?.temp || 0)}°C
                  </p>
                </div>

                {/* External Temperature */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer size={20} className="text-red-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">External Temp</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {Math.round(externalWeather.main?.temp || 0)}°C
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Feels like {Math.round(externalWeather.main?.feels_like || 0)}°C
                  </p>
                </div>

                {/* External Humidity */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets size={20} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">External Humidity</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {externalWeather.main?.humidity || 0}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Wind: {Math.round((externalWeather.wind?.speed || 0) * 3.6)} km/h
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <Cloud size={48} className="mx-auto mb-2 opacity-50" />
                <p>External weather data unavailable</p>
                <p className="text-sm mt-1">Configure OpenWeather API key to enable</p>
              </div>
            )}
          </div>

          {/* Internal Pen Data Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🏠 Internal Pen Data
            </h3>

            {environmentData ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Temperature */}
                <div className={`${tempStatus.color} rounded-lg p-4 border border-gray-200 dark:border-gray-600`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <tempStatus.icon size={20} />
                      <span className="text-sm font-medium">Internal Temp</span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{tempStatus.label}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {environmentData.temperature > 35 && '🔴 CRITICAL: Immediate cooling needed!'}
                    {environmentData.temperature > 30 && environmentData.temperature <= 35 && '🟠 WARNING: Monitor closely'}
                    {environmentData.temperature < 15 && '🔵 Too cold - may impact production'}
                    {environmentData.temperature >= 15 && environmentData.temperature <= 30 && '🟢 Optimal range'}
                  </p>
                </div>

                {/* Ammonia */}
                <div className={`${ammStatus.color} rounded-lg p-4 border border-gray-200 dark:border-gray-600`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ammStatus.icon size={20} />
                      <span className="text-sm font-medium">Ammonia</span>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{ammStatus.label}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    {environmentData.ammonia > 30 && '🔴 CRITICAL: Ventilation required!'}
                    {environmentData.ammonia > 20 && environmentData.ammonia <= 30 && '🟠 HIGH: Improve airflow'}
                    {environmentData.ammonia <= 20 && '🟢 Within acceptable levels'}
                  </p>
                </div>

                {/* Humidity */}
                {environmentData.humidity !== undefined && (
                  <div className={`${humStatus.color} rounded-lg p-4 border border-gray-200 dark:border-gray-600`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <humStatus.icon size={20} />
                        <span className="text-sm font-medium">Internal Humidity</span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">{humStatus.label}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      {environmentData.humidity > 80 && '🔵 High - monitor for disease'}
                      {environmentData.humidity < 40 && '🟠 Low - maintain 40-70%'}
                      {environmentData.humidity >= 40 && environmentData.humidity <= 80 && '🟢 Optimal range'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p>Internal pen environmental data not available</p>
                <p className="text-sm mt-1">Sensors may be offline or not configured</p>
              </div>
            )}
          </div>

          {/* Comparison Section */}
          {environmentData && externalWeather && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                📊 Environment Comparison
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Temperature Difference</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {environmentData.temperature && externalWeather.main?.temp ?
                      `${(environmentData.temperature - externalWeather.main.temp).toFixed(1)}°C` :
                      'N/A'
                    }
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Internal vs External temperature
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Humidity Difference</h4>
                  <p className="text-2xl font-bold text-indigo-600">
                    {environmentData.humidity && externalWeather.main?.humidity ?
                      `${(environmentData.humidity - externalWeather.main.humidity)}%` :
                      'N/A'
                    }
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Internal vs External humidity
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                Internal Data: {environmentData?.timestamp ? new Date(environmentData.timestamp).toLocaleString() : 'Not available'}
              </div>
              <div>
                External Data: {externalWeather?.dt ? new Date(externalWeather.dt * 1000).toLocaleString() : 'Not available'}
              </div>
            </div>
          </div>

          {/* Record New Reading Form */}
          {showRecordForm && (
            <form onSubmit={handleSubmitRecord} className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-2 border-blue-300 dark:border-blue-700 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📊 Record New Reading</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Temperature (°C) *
                  </label>
                  <input
                    type="number"
                    name="temperature"
                    value={recordData.temperature}
                    onChange={handleRecordChange}
                    placeholder={`External: ${externalWeather?.main?.temp ? Math.round(externalWeather.main.temp) + '°C' : 'N/A'}`}
                    step="0.1"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Humidity (%)
                  </label>
                  <input
                    type="number"
                    name="humidity"
                    value={recordData.humidity}
                    onChange={handleRecordChange}
                    placeholder={`External: ${externalWeather?.main?.humidity || 'N/A'}%`}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ammonia (ppm)
                  </label>
                  <input
                    type="number"
                    name="ammonia"
                    value={recordData.ammonia}
                    onChange={handleRecordChange}
                    placeholder="e.g., 15"
                    min="0"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    name="recorded_date"
                    value={recordData.recorded_date}
                    onChange={handleRecordChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={recordData.notes}
                  onChange={handleRecordChange}
                  placeholder="Any observations about the pen environment..."
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save Reading
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecordForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
          {!showRecordForm && onSaveReading && (
            <button
              onClick={() => setShowRecordForm(true)}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Calendar size={18} />
              Record Reading
            </button>
          )}
          <button
            onClick={onClose}
            className={`${!showRecordForm && onSaveReading ? 'flex-1' : 'w-full'} px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors`}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EnvironmentalModal;