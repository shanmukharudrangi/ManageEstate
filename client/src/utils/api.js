import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);
export const addExpense = (data) => API.post('/expenses', data);
export const getExpenseBreakdown = (month) =>
  API.get('/expenses/breakdown', { params: { month } });
export const getAllExpenses = () => API.get('/expenses/all');
export const getTrends = () => API.get('/expenses/trends');
export const askAI = (data) => API.post('/expenses/ask-ai', data);

export const getListings = (params) => API.get('/marketplace/listings', { params });
export const createListing = (formData) =>
  API.post('/marketplace/listings', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateListing = (id, data) => API.put(`/marketplace/listings/${id}`, data);
export const deleteListing = (id) => API.delete(`/marketplace/listings/${id}`);
export const purchaseListing = (id) => API.post(`/marketplace/listings/${id}/purchase`);
export const getMyProfile = () => API.get('/marketplace/profile/me');

export default API;
