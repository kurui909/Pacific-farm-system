// src/services/api.js
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';

const rawApiUrl =
  process.env.REACT_APP_API_URL || 'http://192.168.1.133:8000';

const API_PREFIX = '/api/v1';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const API_URL = rawApiUrl.endsWith(API_PREFIX)
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/+$/, '')}${API_PREFIX}`;

const api = axios.create({ baseURL: API_URL });

// Request interceptor – attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------
// Auth Service
// ----------------------------------------------------------------------
export const authService = {
  login: (email, password) =>
    api
      .post(
        '/auth/login',
        new URLSearchParams({ username: email, password }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      .then((r) => r.data),

  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  googleAuth: (data) => api.post('/auth/google', data).then((r) => r.data),
  getProfile: () => api.get('/users/me').then((r) => r.data),
  updateProfile: (data) => api.put('/users/me', data).then((r) => r.data),
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', null, { params: { email } }),
  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, new_password: password }),
  getAllUsers: () => api.get('/users').then((r) => r.data),
  createUser: (data) => api.post('/users', data).then((r) => r.data),
  updateUser: (id, data) => api.put(`/users/${id}`, data).then((r) => r.data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  toggleUserStatus: (id, isActive) =>
    api.patch(`/users/${id}/status`, { is_active: isActive }),
};

// ----------------------------------------------------------------------
// Farm Service (multi‑tenant)
// ----------------------------------------------------------------------
export const farmService = {
  getAllFarms: () => api.get('/farms').then((r) => r.data),
  getFarmById: (id) => api.get(`/farms/${id}`).then((r) => r.data),
  createFarm: (data) => api.post('/farms', data).then((r) => r.data),
  updateFarm: (id, data) => api.put(`/farms/${id}`, data).then((r) => r.data),
  deleteFarm: (id) => api.delete(`/farms/${id}`),
  getFarmStats: (id) => api.get(`/farms/${id}/stats`).then((r) => r.data),
};

// ----------------------------------------------------------------------
// Payments & Subscription
// ----------------------------------------------------------------------
export const paymentsService = {
  getAllPayments: () => api.get('/payments').then((r) => r.data),
  approvePayment: (id) => api.post(`/payments/${id}/approve`).then((r) => r.data),
  rejectPayment: (id) => api.post(`/payments/${id}/reject`).then((r) => r.data),
  getSubscriptionStatus: () => api.get('/subscription/status').then((r) => r.data),
  startFreeTrial: () => api.post('/subscription/start-trial'),
};

// ----------------------------------------------------------------------
// Pens (with block_id support)
// ----------------------------------------------------------------------
export const penService = {
  getAll: () => api.get('/pens').then((r) => r.data),
  getSummary: (params = {}) =>
    api.get('/pens/summary', { params }).then((r) => r.data),
  create: (data) => api.post('/pens', data).then((r) => r.data),
  update: (id, data) => api.put(`/pens/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/pens/${id}`),
  getById: (id) => api.get(`/pens/${id}`).then((r) => r.data),
  getEnvironment: (id) => api.get(`/pens/${id}/environment`).then((r) => r.data),
  recordMortality: (id, data) => api.post(`/pens/${id}/mortality`, data).then((r) => r.data),
  // Block methods (legacy – kept for compatibility, but use blockService instead)
  // getBlocks: () => api.get('/pens/blocks').then((r) => r.data),
  // createBlock: (name) => api.post('/pens/blocks', { name }).then((r) => r.data),
  // deleteBlock: (name) => api.delete(`/pens/blocks/${encodeURIComponent(name)}`).then((r) => r.data),
  // assignPensToBlock: (blockName, penIds) => api.post(`/pens/blocks/${encodeURIComponent(blockName)}/assign`, { pen_ids: penIds }).then((r) => r.data),
  // removePenFromBlock: (blockName, penId) => api.post(`/pens/blocks/${encodeURIComponent(blockName)}/remove`, { pen_id: penId }).then((r) => r.data),
};

// ----------------------------------------------------------------------
// Production
// ----------------------------------------------------------------------
export const productionService = {
  getAll: (params) => api.get('/production', { params }).then((r) => r.data),
  // In api.js, inside productionService
  create: (data) => api.post('/production', data).then(r => r.data),
  createBatch: (data) => api.post('/production/', data).then((r) => r.data),
  update: (id, data) => api.put(`/production/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/production/${id}`),
  // Create a single production record
  create: (data) => api.post('/production', data).then((r) => r.data),
  // Get the previous day's production record for a pen (auto-fill opening stock)
  getPreviousRecord: (penId, date) =>
    api.get('/production/previous', { params: { pen_id: penId, date } }).then((r) => r.data).catch((error) => {
      if (error.response?.status === 404) return null; // No previous record found
      throw error;
    }),
};

// ----------------------------------------------------------------------
// Dashboard & Analytics
// ----------------------------------------------------------------------
export const dashboardService = {
  getMetrics: (dateRange) =>
    api.get('/dashboard/metrics', { params: { date_range: dateRange } }).then((r) => r.data),
  getTrends: (params) => api.get('/analytics/trends', { params }).then((r) => r.data),
};

export const analyticsService = {
  getPenPerformance: () => api.get('/analytics/pen-performance').then((r) => r.data),
  getTrends: (params) => api.get('/analytics/trends', { params }).then((r) => r.data),
};

// ----------------------------------------------------------------------
// Eggs & Trays
// ----------------------------------------------------------------------
export const eggsService = {
  getInventory: () => api.get('/eggs/inventory').then((r) => r.data),
  updateInventory: (data) => api.post('/eggs/inventory', data).then((r) => r.data),
  getSales: () => api.get('/eggs/sales').then((r) => r.data),
  recordSale: (data) => api.post('/eggs/sales', data).then((r) => r.data),
};

export const traysService = {
  getInventory: () => api.get('/trays/inventory').then((r) => r.data),
  recordSale: (data) => api.post('/trays/sales', data).then((r) => r.data),
};

// ----------------------------------------------------------------------
// Feed Management
// ----------------------------------------------------------------------
export const feedService = {
  getInventory: () => api.get('/feed/inventory').then((r) => r.data),
  getIngredients: () => api.get('/feed/ingredients').then((r) => r.data),
  createIngredient: (data) => api.post('/feed/ingredients', data).then((r) => r.data),
  updateIngredient: (id, data) => api.put(`/feed/ingredients/${id}`, data).then((r) => r.data),
  deleteIngredient: (id) => api.delete(`/feed/ingredients/${id}`),
  getMixes: () => api.get('/feed/mixes').then((r) => r.data),
  createMix: (data) => api.post('/feed/mixes', data).then((r) => r.data),
  deleteMix: (id) => api.delete(`/feed/mixes/${id}`),
};

// ----------------------------------------------------------------------
// Reports
// ----------------------------------------------------------------------
export const reportsService = {
  generatePDF: (params) =>
    api.get('/reports/pdf', { params, responseType: 'blob' }),
  generateCSV: (params) =>
    api.get('/reports/csv', { params, responseType: 'blob' }),
};

// ----------------------------------------------------------------------
// Notifications & Alerts
// ----------------------------------------------------------------------
export const notificationService = {
  getAll: () => api.get('/notifications').then((r) => r.data),
  create: (data) => api.post('/notifications', data).then((r) => r.data),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  unreadCount: () => api.get('/notifications/count').then((r) => r.data.count),
};

export const alertsService = {
  getActive: () => api.get('/alerts').then((r) => r.data),
  acknowledge: (id) => api.post(`/alerts/${id}/acknowledge`),
};

// ----------------------------------------------------------------------
// Block management (NEW – dedicated endpoints)
// ----------------------------------------------------------------------
export const blockService = {
  getAll: () => api.get('/blocks').then((r) => r.data),
  getById: (id) => api.get(`/blocks/${id}`).then((r) => r.data),
  create: (data) => api.post('/blocks', data).then((r) => r.data),
  update: (id, data) => api.put(`/blocks/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/blocks/${id}`).then((r) => r.data),
  assignPens: (blockId, penIds) => api.post(`/blocks/${blockId}/assign-pens`, { pen_ids: penIds }).then((r) => r.data),
};

// ----------------------------------------------------------------------
// Weather Service
// ----------------------------------------------------------------------
export const weatherService = {
  getCurrentWeather: (lat, lon) => {
    const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn('OpenWeather API key not configured');
      return Promise.resolve(null);
    }
    
    return fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
      .then((r) => r.json())
      .catch((error) => {
        console.error('Weather API error:', error);
        return null;
      });
  },

  getWeatherByCity: (city) => {
    const apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn('OpenWeather API key not configured');
      return Promise.resolve(null);
    }
    
    return fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
      .then((r) => r.json())
      .catch((error) => {
        console.error('Weather API error:', error);
        return null;
      });
  },
};

// ----------------------------------------------------------------------
// Default export
// ----------------------------------------------------------------------
export default api;
