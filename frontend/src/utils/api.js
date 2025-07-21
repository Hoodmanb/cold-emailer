// src/utils/axiosInstance.js
import axios from 'axios';
import { getAuth } from 'firebase/auth';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});


api.interceptors.request.use(
  async (config) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        const token = await user.getIdToken(/* forceRefresh */ true); // << force refresh helps
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token sent:', token);
      } catch (error) {
        console.error('Failed to get token:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);



export default api;
