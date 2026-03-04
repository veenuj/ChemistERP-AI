import axios from 'axios';

/**
 * Centralized Axios instance for the QuickRx ERP.
 * This connects your React frontend (port 5173) 
 * to your Spring Boot backend (port 8080).
 */
const api = axios.create({
  // Use your local Spring Boot URL
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add a request interceptor for future Auth tokens
api.interceptors.request.use(
  (config) => {
    // If you add Spring Security later, you'll attach the token here
    // const token = localStorage.getItem('token');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;