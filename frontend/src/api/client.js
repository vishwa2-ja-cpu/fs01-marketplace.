import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL });

export const tokens = {
  get access() { return localStorage.getItem('accessToken'); },
  get refresh() { return localStorage.getItem('refreshToken'); },
  set({ accessToken, refreshToken }) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  clear() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  if (tokens.access) config.headers.Authorization = `Bearer ${tokens.access}`;
  return config;
});

// If the access token expired (401), refresh once and retry the original request.
// Concurrent 401s share a single refresh call, because refresh tokens work only once.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.startsWith('/auth/');
    if (error.response?.status !== 401 || original._retried || isAuthCall || !tokens.refresh) {
      return Promise.reject(error);
    }
    original._retried = true;
    try {
      refreshing ||= axios
        .post(`${baseURL}/auth/refresh`, { refreshToken: tokens.refresh })
        .then((r) => { tokens.set(r.data); })
        .finally(() => { refreshing = null; });
      await refreshing;
      original.headers.Authorization = `Bearer ${tokens.access}`;
      return api(original);
    } catch (e) {
      tokens.clear();
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(error);
    }
  }
);

export default api;
