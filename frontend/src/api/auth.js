import axios from './axios';

export const authAPI = {
  register: (data) => axios.post('/auth/register/', data),
  
  login: (credentials) => axios.post('/auth/login/', credentials),
  
  logout: (refreshToken) => axios.post('/auth/logout/', { refresh: refreshToken }),
  
  getProfile: () => axios.get('/auth/user/'),
  
  updateProfile: (data) => axios.put('/auth/user/update/', data),
  
  changePassword: (data) => axios.post('/auth/change-password/', data),
  
  getDashboardStats: () => axios.get('/auth/dashboard/'),
  
  refreshToken: (refreshToken) => axios.post('/auth/refresh/', { refresh: refreshToken }),
};