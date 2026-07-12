import axios from 'axios';

// Fallback to hardcoded URL if env var not injected by Netlify
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : window.location.hostname === 'localhost'
    ? '/api'
    : 'https://passguard-api-im01.onrender.com/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

export default api;
