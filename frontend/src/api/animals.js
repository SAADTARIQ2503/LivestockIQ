import axios from './axios';

/**
 * Animals API endpoints
 */
export const animalsAPI = {
  /**
   * Get all animals with optional filters
   * @param {Object} params - Query parameters (page, search, animal_type, sex, is_healthy)
   * @returns {Promise} API response with animals list
   */
  getAll: (params) => axios.get('/animals/', { params }),

  /**
   * Get animal by ID
   * @param {number} id - Animal ID
   * @returns {Promise} API response with animal details
   */
  getById: (id) => axios.get(`/animals/${id}/`),

  /**
   * Create new animal
   * @param {Object} data - Animal data
   * @returns {Promise} API response
   */
  create: (data) => axios.post('/animals/', data),

  /**
   * Update animal
   * @param {number} id - Animal ID
   * @param {Object} data - Updated animal data
   * @returns {Promise} API response
   */
  update: (id, data) => axios.put(`/animals/${id}/`, data),

  /**
   * Delete animal
   * @param {number} id - Animal ID
   * @returns {Promise} API response
   */
  delete: (id) => axios.delete(`/animals/${id}/`),

  /**
   * Search animals
   * @param {string} query - Search query
   * @returns {Promise} API response
   */
  search: (query) => axios.get('/animals/search/', { params: { q: query } }),

  /**
   * Get animals statistics
   * @returns {Promise} API response with statistics
   */
  getStatistics: () => axios.get('/animals/statistics/'),
};
