import axios from 'axios';
import { authService } from '../services/api';

// Configuration d'axios
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        // Token expiré ou invalide
        authService.logout();
        window.location.href = '/admin/login';
      }
      
      if (status === 403) {
        // Accès interdit
        console.error('Accès interdit');
      }
      
      if (status >= 500) {
        console.error('Erreur serveur');
      }
    } else if (error.request) {
      console.error('Erreur réseau');
    } else {
      console.error('Erreur de configuration');
    }
    
    return Promise.reject(error);
  }
);

export default api;