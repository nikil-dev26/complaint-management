import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const cleanBaseUrl = rawApiUrl.replace(/\/+$/, '');
const apiBaseURL = cleanBaseUrl.endsWith('/api')
  ? cleanBaseUrl
  : `${cleanBaseUrl}/api`;

const API = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;