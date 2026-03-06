import axios from './axios';

/**
 * Alerts API endpoints
 */
export const alertsAPI = {
  /**
   * Get all alerts for the authenticated user
   * @param {Object} params - Query parameters (filters)
   * @returns {Promise} API response with alerts
   */
  getAlerts: (params) => axios.get('/alerts/', { params }),

  /**
   * Get alert by ID
   * @param {number} id - Alert ID
   * @returns {Promise} API response with alert details
   */
  getAlertById: (id) => axios.get(`/alerts/${id}/`),

  /**
   * Create new alert
   * @param {Object} data - Alert data
   * @returns {Promise} API response
   */
  createAlert: (data) => axios.post('/alerts/', data),

  /**
   * Resolve/dismiss an alert
   * @param {number} id - Alert ID
   * @returns {Promise} API response
   */
  resolveAlert: (id) => axios.patch(`/alerts/${id}/resolve/`),

  /**
   * Delete alert
   * @param {number} id - Alert ID
   * @returns {Promise} API response
   */
  deleteAlert: (id) => axios.delete(`/alerts/${id}/`),

  /**
   * Get active (unresolved) alerts
   * @returns {Promise} API response with active alerts
   */
  getActiveAlerts: () => axios.get('/alerts/active/'),
};

/**
 * AI Detection API endpoints
 */
export const aiDetectionAPI = {
  /**
   * Upload image/video for disease detection
   * @param {FormData} formData - File and metadata
   * @returns {Promise} API response with detection results
   */
  detectDisease: (formData) => axios.post('/ai/detect/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  detectLameness: (formData) =>
    axios.post('/health/lameness/detect/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getLamenessHistory: () =>
    axios.get('/health/lameness/history/'),
  /**
   * Get detection history
   * @returns {Promise} API response with past detections
   */
  getDetectionHistory: () => axios.get('/ai/history/'),

  /**
   * Get detection by ID
   * @param {number} id - Detection ID
   * @returns {Promise} API response
   */
  getDetectionById: (id) => axios.get(`/ai/detections/${id}/`),
};