import axios from './axios';

/**
 * Environment API endpoints
 */
export const environmentAPI = {
  /**
   * Get current environmental status
   * @param {string} city - Optional city name to search
   */
  getCurrentStatus: (city) =>
    axios.get('/environment/status/', { params: city ? { city } : {} }),

  /**
   * Get environmental statistics
   * @param {string} city - Optional city name
   */
  getStatistics: (city) =>
    axios.get('/environment/statistics/', { params: city ? { city } : {} }),

  /**
   * Get weather forecast
   * @param {number} days - Number of days (max 5 on free OWM tier)
   * @param {string} city - Optional city name
   */
  getForecast: (days = 7, city) =>
    axios.get('/environment/forecast/', { params: { days, ...(city ? { city } : {}) } }),

  /**
   * Get livestock weather alerts
   * @param {string} city - Optional city name
   */
  getAlerts: (city) =>
    axios.get('/environment/alerts/', { params: city ? { city } : {} }),

  /**
   * Get environmental history
   */
  getHistory: (params) =>
    axios.get('/environment/history/', { params }),

  /**
   * Record environmental data
   */
  recordData: (data) =>
    axios.post('/environment/record/', data),

  /**
   * Get optimal conditions for a species
   */
  getOptimalConditions: (species) =>
    axios.get('/environment/optimal/', { params: { species } }),
};