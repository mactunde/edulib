import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  timeout: 15000,
});

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edulib_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 — clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('edulib_token');
      localStorage.removeItem('edulib_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

// ── Books (learner) ───────────────────────────────────────────
export const booksAPI = {
  list:     (params = {}) => api.get('/api/books', { params }),
  subjects: (params = {}) => api.get('/api/books/subjects', { params }),
  openBook: (id)          => api.get(`/api/books/${id}/read`),
};

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  stats:          ()          => api.get('/api/admin/stats'),
  listBooks:      ()          => api.get('/api/admin/books'),
  uploadBook:     (formData)  => api.post('/api/admin/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  editBook:       (id, data)  => api.patch(`/api/admin/books/${id}`, data),
  deleteBook:     (id)        => api.delete(`/api/admin/books/${id}`),
  listUsers:      ()          => api.get('/api/admin/users'),
  deleteUser:     (id)        => api.delete(`/api/admin/users/${id}`),
  activity:       ()          => api.get('/api/admin/activity'),
  exportUsers:    ()          => api.get('/api/admin/export/users',    { responseType: 'blob' }),
  exportActivity: ()          => api.get('/api/admin/export/activity', { responseType: 'blob' }),
};

// ── My activity ───────────────────────────────────────────────
export const activityAPI = {
  mine: () => api.get('/api/activity/my'),
};

// ── User profile & password ───────────────────────────────────
export const userAPI = {
  profile:        ()       => api.get('/api/users/profile'),
  updateProfile:  (data)   => api.patch('/api/users/profile', data),
  changePassword: (data)   => api.post('/api/users/change-password', data),
};
