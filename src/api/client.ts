import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://web-production-c2613.up.railway.app';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (employee_id: string, password: string) => 
    api.post('/api/v1/auth/login', { employee_id, password }),
  me: () => api.get('/api/v1/auth/me'),
};
