import axios from 'axios';
import { API_BASE_URL } from '../config/env';

// Create a basic axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  login: async (email, password) => { 
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  
  registerBuyer: async (data) => { 
    const response = await apiClient.post('/users', data);
    return response.data;
  },
  
  registerShop: async (data) => { 
    const response = await apiClient.post('/users/shops', data);
    return response.data;
  },
  
  registerShipper: async (data) => { 
    const response = await apiClient.post('/users/shippers', data);
    return response.data;
  },
  
  logout: async (token) => { 
    const response = await apiClient.post('/auth/logout', { token });
    return response.data;
  },
  
  refreshToken: async (token) => { 
    const response = await apiClient.post('/auth/refresh', { token });
    return response.data;
  },
  
  sendOtp: async (email) => { 
    const response = await apiClient.post('/users/resend-otp', { email });
    return response.data;
  },
  
  verifyOtp: async (email, otp) => { 
    const response = await apiClient.post('/users/verify-otp', { email, otp: Number(otp) });
    return response.data;
  },
  
  resetPassword: async (data) => { throw new Error('Chưa có API Reset Password từ Backend') },
};

