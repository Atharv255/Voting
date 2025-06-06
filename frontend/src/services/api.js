import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
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

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// Candidates API calls
export const candidatesAPI = {
  register: (candidateData) => api.post('/candidates/register', candidateData),
  getAll: () => api.get('/candidates'),
  getById: (id) => api.get(`/candidates/${id}`),
  checkStatus: () => api.get('/candidates/check/status'),
};

// Votes API calls
export const votesAPI = {
  castVote: (candidateId) => api.post('/votes', { candidateId }),
  getResults: () => api.get('/votes/results'),
  getMyVote: () => api.get('/votes/my-vote'),
};

// Admin API calls
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getVotes: (page = 1, limit = 20) => api.get(`/admin/votes?page=${page}&limit=${limit}`),
  getUsers: () => api.get('/admin/users'),
  getCandidates: () => api.get('/admin/candidates'),
  createAdmin: (adminData) => api.post('/admin/create-admin', adminData),
};

export default api;
