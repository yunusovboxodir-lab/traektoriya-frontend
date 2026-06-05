import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.traektoriya.space';

export const api = axios.create({
  baseURL: API_URL,
  // Таймаут: без него заблокированный/перехваченный API «висит» бесконечно
  // (типично для гостевых Wi-Fi с captive portal). 20 сек → быстрый явный отказ
  // вместо вечного спиннера, дальше показываем понятную сетевую ошибку.
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['Accept-Language'] = localStorage.getItem('language') || 'uz';
  return config;
});

// Авто-обновление токена при 401.
// Используем Promise-singleton: один refresh-запрос для всех параллельных 401,
// вместо флага+очереди (который имел race, если refresh падает).
let refreshPromise: Promise<string> | null = null;

function redirectToLogin() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

async function doRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('no_refresh_token');
  }
  const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
    refresh_token: refreshToken,
  });
  const newToken: string | undefined = res.data?.access_token;
  const newRefresh: string | undefined = res.data?.refresh_token;
  if (!newToken) throw new Error('refresh_response_missing_token');
  localStorage.setItem('accessToken', newToken);
  if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
  return newToken;
}

function getRefreshPromise(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      // Сбрасываем singleton ПОСЛЕ резолва/реджекта, чтобы все ожидающие
      // await-ы получили одно и то же значение/ошибку.
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await getRefreshPromise();
        originalRequest.headers = originalRequest.headers || {};
        (originalRequest.headers as Record<string, string>).Authorization =
          `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: (employee_id: string, password: string) =>
    api.post('/api/v1/auth/login', { employee_id, password }),
  refresh: () => api.post('/api/v1/auth/refresh'),
  logout: () => api.post('/api/v1/auth/logout'),
  me: () => api.get('/api/v1/auth/me'),
};
