import axios from './axios';

/**
 * Authentication API endpoints
 */
export const authAPI = {
  /**
   * Register a new user
   * @param {Object} data - Registration data
   * @returns {Promise} API response
   */
  register: (data) => axios.post('/auth/register/', data),

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise} API response with tokens and user data
   */
  login: (credentials) => axios.post('/auth/login/', credentials),

  /**
   * Logout user (blacklist refresh token)
   * @param {string} refreshToken - Refresh token to blacklist
   * @returns {Promise} API response
   */
  logout: (refreshToken) => axios.post('/auth/logout/', { refresh: refreshToken }),

  /**
   * Get current user profile
   * @returns {Promise} API response with user data
   */
  getProfile: () => axios.get('/auth/user/'),

  /**
   * Update user profile
   * @param {Object} data - Profile data to update
   * @returns {Promise} API response
   */
  updateProfile: (data) => axios.put('/auth/user/update/', data),

  /**
   * Change user password
   * @param {Object} data - Password change data
   * @returns {Promise} API response
   */
  changePassword: (data) => axios.post('/auth/change-password/', data),

  /**
   * Get dashboard statistics
   * @returns {Promise} API response with dashboard data
   */
  getDashboardStats: () => axios.get('/auth/dashboard/'),

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise} API response with new access token
   */
  refreshToken: (refreshToken) => axios.post('/auth/refresh/', { refresh: refreshToken }),
};
