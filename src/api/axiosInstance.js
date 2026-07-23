import axios from 'axios';

// Bo'sh qoldirilsa (production/nginx orqali) so'rovlar nisbiy manzilga boradi —
// bu holda CORS umuman kerak emas, chunki frontend va backend bir xil origin'da bo'ladi.
const API_URL = import.meta.env.VITE_API_URL || '';

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- So'rovga token qo'shish ----
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('chemlab_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- 401 kelganda avtomatik refresh + qayta urinish ----
let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(error, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Login/refresh so'rovining o'zida xato bo'lsa — qayta urinmaymiz
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Boshqa so'rov allaqachon refresh qilyapti — navbatga turamiz
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('chemlab_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        handleLogout();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh/`, {
          refresh: refreshToken,
        });
        const newAccess = data.access;
        localStorage.setItem('chemlab_access_token', newAccess);
        axiosInstance.defaults.headers.Authorization = `Bearer ${newAccess}`;
        resolveQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        resolveQueue(refreshError, null);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function handleLogout() {
  localStorage.removeItem('chemlab_access_token');
  localStorage.removeItem('chemlab_refresh_token');
  localStorage.removeItem('chemlab_user');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export default axiosInstance;
