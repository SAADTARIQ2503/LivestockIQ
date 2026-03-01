import axios from './axios';

/**
 * Environment API endpoints
 */
export const environmentAPI = {
  /**
   * Get current environmental status
   * @returns {Promise} API response with current conditions
   */
  getCurrentStatus: () => axios.get('/environment/status/'),

  /**
   * Get environmental history
   * @param {Object} params - Query parameters (date range, filters)
   * @returns {Promise} API response with historical data
   */
  getHistory: (params) => axios.get('/environment/history/', { params }),

  /**
   * Get environmental statistics
   * @returns {Promise} API response with stats
   */
  getStatistics: () => axios.get('/environment/statistics/'),

  /**
   * Get weather forecast
   * @param {number} days - Number of days to forecast
   * @returns {Promise} API response with forecast
   */
  getForecast: (days = 7) => axios.get('/environment/forecast/', { params: { days } }),

  /**
   * Get alerts/warnings
   * @returns {Promise} API response with environmental alerts
   */
  getAlerts: () => axios.get('/environment/alerts/'),

  /**
   * Record environmental data
   * @param {Object} data - Environmental data
   * @returns {Promise} API response
   */
  recordData: (data) => axios.post('/environment/record/', data),

  /**
   * Get optimal conditions for species
   * @param {string} species - Animal species
   * @returns {Promise} API response with optimal conditions
   */
  getOptimalConditions: (species) => 
    axios.get('/environment/optimal/', { params: { species } }),
};
