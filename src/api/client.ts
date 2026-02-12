import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.traektoriya.space';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (employee_id: string, password: string) =>
    api.post('/api/v1/auth/login', { employee_id, password }),
  refresh: () => api.post('/api/v1/auth/refresh'),
  logout: () => api.post('/api/v1/auth/logout'),
  me: () => api.get('/api/v1/auth/me'),
};
