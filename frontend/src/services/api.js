import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email, password, twoFactorCode) =>
    api.post('/auth/login', { email, password, twoFactorCode }),

  register: (userData) =>
    api.post('/auth/register', userData),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get('/auth/me'),

  setup2FA: () =>
    api.post('/auth/2fa/setup'),

  verify2FA: (token) =>
    api.post('/auth/2fa/verify', { token }),

  disable2FA: (token) =>
    api.post('/auth/2fa/disable', { token }),
};

// User endpoints
export const userAPI = {
  getAll: (params) =>
    api.get('/users', { params }),

  getById: (id) =>
    api.get(`/users/${id}`),

  update: (id, data) =>
    api.put(`/users/${id}`, data),

  delete: (id) =>
    api.delete(`/users/${id}`),
};

// Lead endpoints
export const leadAPI = {
  getAll: (params) =>
    api.get('/leads', { params }),

  getById: (id) =>
    api.get(`/leads/${id}`),

  create: (data) =>
    api.post('/leads', data),

  update: (id, data) =>
    api.put(`/leads/${id}`, data),

  delete: (id) =>
    api.delete(`/leads/${id}`),

  addFollowUp: (id, data) =>
    api.post(`/leads/${id}/follow-up`, data),

  convert: (id, data) =>
    api.post(`/leads/${id}/convert`, data),

  assign: (id, assignedTo) =>
    api.patch(`/leads/${id}/assign`, { assignedTo }),

  getStats: () =>
    api.get('/leads/stats'),
};

// Student endpoints
export const studentAPI = {
  getAll: (params) =>
    api.get('/students', { params }),

  getById: (id) =>
    api.get(`/students/${id}`),

  create: (data) =>
    api.post('/students', data),

  update: (id, data) =>
    api.put(`/students/${id}`, data),

  delete: (id) =>
    api.delete(`/students/${id}`),

  uploadDocument: (id, formData) =>
    api.post(`/students/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Task endpoints
export const taskAPI = {
  getAll: (params) =>
    api.get('/tasks', { params }),

  getById: (id) =>
    api.get(`/tasks/${id}`),

  create: (data) =>
    api.post('/tasks', data),

  update: (id, data) =>
    api.put(`/tasks/${id}`, data),

  delete: (id) =>
    api.delete(`/tasks/${id}`),

  addComment: (id, text) =>
    api.post(`/tasks/${id}/comments`, { text }),
};

// Dashboard endpoints
export const dashboardAPI = {
  getStats: (params) =>
    api.get('/dashboard/stats', { params }),

  getLeadAnalytics: () =>
    api.get('/dashboard/leads/analytics'),

  getRevenueAnalytics: () =>
    api.get('/dashboard/revenue/analytics'),

  getStaffPerformance: () =>
    api.get('/dashboard/staff/performance'),
};

// Activity logs
export const activityLogAPI = {
  getAll: (params) =>
    api.get('/activity-logs', { params }),
};

export default api;
