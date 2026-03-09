import axios from './axios';

/**
 * Environment API endpoints
 */
export const environmentAPI = {
  /**
   * Get current weather status
   * @param {string} city - City name (optional)
   * @param {Object} coords - Coordinates { latitude, longitude } (optional)
   * @returns {Promise} API response
   */
  getCurrentStatus: (city, coords) => {
    const params = {};
    if (city) params.city = city;
    if (coords?.latitude) params.latitude = coords.latitude;
    if (coords?.longitude) params.longitude = coords.longitude;
    
    return axios.get('/environment/status/', { params });
  },

  /**
   * Get environment statistics
   * @param {string} city - City name (optional)
   * @param {Object} coords - Coordinates { latitude, longitude } (optional)
   * @returns {Promise} API response
   */
  getStatistics: (city, coords) => {
    const params = {};
    if (city) params.city = city;
    if (coords?.latitude) params.latitude = coords.latitude;
    if (coords?.longitude) params.longitude = coords.longitude;
    return axios.get('/environment/statistics/', { params });
  },

  /**
   * Get weather forecast
   * @param {number} days - Number of days (1-7)
   * @param {string} city - City name (optional)
   * @param {Object} coords - Coordinates { latitude, longitude } (optional)
   * @returns {Promise} API response
   */
  getForecast: (days = 7, city, coords) => {
    const params = { days };
    if (city) params.city = city;
    if (coords?.latitude) params.latitude = coords.latitude;
    if (coords?.longitude) params.longitude = coords.longitude;
    return axios.get('/environment/forecast/', { params });
  },

  /**
   * Get environment alerts
   * @param {string} city - City name (optional)
   * @param {Object} coords - Coordinates { latitude, longitude } (optional)
   * @returns {Promise} API response
   */
  getAlerts: (city, coords) => {
    const params = {};
    if (city) params.city = city;
    if (coords?.latitude) params.latitude = coords.latitude;
    if (coords?.longitude) params.longitude = coords.longitude;
    return axios.get('/environment/alerts/', { params });
  },

  /**
   * Get environment history
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {string} city - City name (optional)
   * @returns {Promise} API response
   */
  getHistory: (startDate, endDate, city) => {
    const params = { start_date: startDate, end_date: endDate };
    if (city) params.city = city;
    return axios.get('/environment/history/', { params });
  },

  /**
   * Get optimal conditions for livestock
   * @returns {Promise} API response
   */
  getOptimalConditions: () => axios.get('/environment/optimal/'),

  /**
   * Get weather for all user's farms
   * @returns {Promise} API response with farms weather data
   */
  getFarmsWeather: () => axios.get('/environment/farms-weather/'),
};