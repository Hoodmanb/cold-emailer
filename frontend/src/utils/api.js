// src/utils/axiosInstance.js
import axios from 'axios';
import { getAuth } from 'firebase/auth';

const api = axios.create({
  baseURL: 'http://localhost:9000/api', // You can adjust this if needed
});

api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();
    console.log('Sending token:', token); // ✅ Add this
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No user is logged in');
  }

  return config;
});

export default api;
