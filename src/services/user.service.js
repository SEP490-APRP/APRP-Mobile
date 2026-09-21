// user.service.js
import apiClient from "./api/apiClient";

export const userService = {
  getProfile: async (userId) => { 
    throw new Error('TODO') 
  },
  updateProfile: async (userId, data) => { 
    const response = await apiClient.put(`/users/${userId}`, data);
    return response.data;
  },
  changePassword: async (data) => { 
    throw new Error('TODO') 
  },
  uploadAvatar: async (file) => { 
    throw new Error('TODO') 
  },
};
