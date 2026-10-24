import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nijer_bazaar_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — redirect to login
      localStorage.removeItem('nijer_bazaar_token');
      localStorage.removeItem('nijer_bazaar_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Admin API instance
export const adminApi = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nijer_bazaar_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nijer_bazaar_admin_token');
      localStorage.removeItem('nijer_bazaar_admin');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;