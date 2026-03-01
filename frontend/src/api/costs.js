import axios from './axios';

/**
 * Costs API endpoints
 */
export const costsAPI = {
  /**
   * Get all transactions (expenses + revenue)
   * @param {Object} params - Query parameters (filters)
   * @returns {Promise} API response with transactions
   */
  getTransactions: (params) => axios.get('/costs/transactions/', { params }),

  /**
   * Get transaction by ID
   * @param {number} id - Transaction ID
   * @returns {Promise} API response with transaction details
   */
  getTransactionById: (id) => axios.get(`/costs/transactions/${id}/`),

  /**
   * Create new transaction
   * @param {Object} data - Transaction data
   * @returns {Promise} API response
   */
  createTransaction: (data) => axios.post('/costs/transactions/', data),

  /**
   * Update transaction
   * @param {number} id - Transaction ID
   * @param {Object} data - Updated transaction data
   * @returns {Promise} API response
   */
  updateTransaction: (id, data) => axios.put(`/costs/transactions/${id}/`, data),

  /**
   * Delete transaction
   * @param {number} id - Transaction ID
   * @returns {Promise} API response
   */
  deleteTransaction: (id) => axios.delete(`/costs/transactions/${id}/`),

  /**
   * Get financial summary
   * @param {Object} params - Date range filters
   * @returns {Promise} API response with summary
   */
  getSummary: (params) => axios.get('/costs/summary/', { params }),

  /**
   * Get financial report
   * @param {Object} params - Report parameters (date range, type)
   * @returns {Promise} API response with report data
   */
  getReport: (params) => axios.get('/costs/report/', { params }),

  /**
   * Get cost breakdown by category
   * @param {Object} params - Filters
   * @returns {Promise} API response with breakdown
   */
  getCategoryBreakdown: (params) => axios.get('/costs/breakdown/', { params }),

  /**
   * Get profit/loss statement
   * @param {Object} params - Date range
   * @returns {Promise} API response with P&L
   */
  getProfitLoss: (params) => axios.get('/costs/profit-loss/', { params }),
};
