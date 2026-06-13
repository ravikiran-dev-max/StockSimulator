import axios from 'axios';
import useNotificationStore from '../store/useNotificationStore';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://stocksimulator-pncv.onrender.com';
const cleanBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

const api = axios.create({
  baseURL: `${cleanBaseUrl}/api`,
});

api.interceptors.request.use(
  (config) => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
      console.error('API request interceptor error:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    
    // Trigger toast notification for failed API call unless config requests to skip it
    if (!error.config?.skipAlert) {
      try {
        const { addNotification } = useNotificationStore.getState();
        addNotification('API Error', message, 'error');
      } catch (e) {
        console.error('Failed to trigger toast alert for API error:', e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
