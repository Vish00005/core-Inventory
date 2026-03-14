import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // Clear auth state on 401 Unauthorized
        useAuthStore.getState().logout();
        
        // Optional: Redirect to login or show a message
        // Since we have ProtectedRoute and Router in App.jsx, 
        // clearing the state should trigger a re-render and redirect.
      }
      return Promise.reject(error);
    }
  );
};
