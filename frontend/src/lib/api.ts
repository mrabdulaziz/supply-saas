import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto refresh on 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // Never try to refresh on auth endpoints — wrong credentials should fail immediately
    const isAuthEndpoint = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        localStorage.setItem('access_token', newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ─── API helpers ─────────────────────────────────────────────

export const authApi = {
  login: (data: { login: string; password: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  sendOtp: (phone: string) => api.post('/auth/otp/send', { phone }),
  verifyOtp: (phone: string, code: string) => api.post('/auth/otp/verify', { phone, code }),
};

export const ordersApi = {
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  submit: (id: string) => api.post(`/orders/${id}/submit`),
  confirm: (id: string) => api.post(`/orders/${id}/confirm`),
  reject: (id: string, reason: string) => api.post(`/orders/${id}/reject`, { reason }),
  dispatch: (id: string) => api.post(`/orders/${id}/dispatch`),
  deliver: (id: string) => api.post(`/orders/${id}/deliver`),
};

export const productsApi = {
  list: (params?: any) => api.get('/products', { params }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  updateStock: (id: string, stockQty: number) => api.patch(`/products/${id}/stock`, { stockQty }),
};

export const marketsApi = {
  list: (params?: any) => api.get('/markets', { params }),
  get: (id: string) => api.get(`/markets/${id}`),
  register: (data: any) => api.post('/markets', data),
  approve: (id: string) => api.patch(`/markets/${id}/approve`),
  suspend: (id: string, reason?: string) => api.patch(`/markets/${id}/suspend`, { reason }),
  uploadDocument: (id: string, formData: FormData) =>
    api.post(`/markets/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  auditLogs: (params?: any) => api.get('/admin/audit-logs', { params }),
  users: (params?: any) => api.get('/admin/users', { params }),
  updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
};

export const reportsApi = {
  orders: (params?: any) => api.get('/reports/orders', { params }),
  products: (params?: any) => api.get('/reports/products', { params }),
};
