import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 20000
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const endpoints = {
  verifyPin: (pin) => api.post('/auth/verify-pin', { pin }),
  dashboard: () => api.get('/dashboard'),
  analytics: () => api.get('/dashboard/analytics'),
  loans: (params) => api.get('/loans', { params }),
  loan: (id) => api.get(`/loans/${id}`),
  createLoan: (payload) => api.post('/loans', payload),
  updateLoan: (id, payload) => api.patch(`/loans/${id}`, payload),
  deleteLoan: (id) => api.delete(`/loans/${id}`),
  addPayment: (payload) => api.post('/payments', payload),
  previewPayment: (params) => api.get('/payments/preview', { params }),
  updatePayment: (id, payload) => api.patch(`/payments/${id}`, payload),
  deletePayment: (id) => api.delete(`/payments/${id}`),
  history: (params) => api.get('/history', { params }),
  settings: () => api.get('/settings'),
  updateSettings: (payload) => api.patch('/settings', payload)
};
