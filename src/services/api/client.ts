import axios from 'axios';
import { API_BASE_URL } from '@/utils/constants';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred';
      console.error(`API Error: ${error.response.status} - ${message}`);
    } else if (error.request) {
      // Request was made but no response
      console.error('Network error: No response received');
    } else {
      // Error setting up request
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);
