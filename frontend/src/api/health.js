import axios from './axios';

/**
 * Health/Vaccinations API endpoints
 */
export const healthAPI = {
  /**
   * Get all vaccination schedules
   * @param {Object} params - Query parameters (filters)
   * @returns {Promise} API response with schedules
   */
  getSchedules: (params) => axios.get('/health/schedules/', { params }),

  /**
   * Get schedule by ID
   * @param {number} id - Schedule ID
   * @returns {Promise} API response with schedule details
   */
  getScheduleById: (id) => axios.get(`/health/schedules/${id}/`),

  /**
   * Create vaccination schedule
   * @param {Object} data - Schedule data
   * @returns {Promise} API response
   */
  createSchedule: (data) => axios.post('/health/schedules/', data),

  /**
   * Update vaccination schedule
   * @param {number} id - Schedule ID
   * @param {Object} data - Updated schedule data
   * @returns {Promise} API response
   */
  updateSchedule: (id, data) => axios.put(`/health/schedules/${id}/`, data),

  /**
   * Delete vaccination schedule
   * @param {number} id - Schedule ID
   * @returns {Promise} API response
   */
  deleteSchedule: (id) => axios.delete(`/health/schedules/${id}/`),

  /**
   * Get upcoming vaccinations
   * @returns {Promise} API response with upcoming schedules
   */
  getUpcoming: () => axios.get('/health/schedules/upcoming/'),

  /**
   * Get overdue vaccinations
   * @returns {Promise} API response with overdue schedules
   */
  getOverdue: () => axios.get('/health/schedules/overdue/'),

  /**
   * Mark schedule as completed
   * @param {number} id - Schedule ID
   * @returns {Promise} API response
   */
  markCompleted: (id) => axios.post(`/health/schedules/${id}/complete/`),

  /**
   * Get recommended vaccines
   * @param {Object} params - Query parameters (season, species, seasonal)
   * @returns {Promise} API response with recommended vaccines
   */
  getRecommendedVaccines: (params) => axios.get('/health/vaccines/recommended/', { params }),

  /**
   * Get vaccine detail
   * @param {number} id - Vaccine ID
   * @returns {Promise} API response with vaccine details
   */
  getVaccineDetail: (id) => axios.get(`/health/vaccines/${id}/`),

  /**
   * Get vaccines by species (FIXED: using underscore to match ViewSet @action)
   * @param {string} species - Animal species
   * @returns {Promise} API response with vaccines
   */
  getVaccinesBySpecies: (species) => 
    axios.get('/health/vaccines/by_species/', { params: { species } }),
  
  /**
   * Get vaccination history for a specific animal
   * @param {number} animalId - Animal ID
   * @returns {Promise} API response with vaccination history
   */
  getByAnimal: (animalId) =>
    axios.get('/health/schedules/by_animal/', { params: { animal_id: animalId } }),
  
  getVaccineRecommendations: (params) => axios.get('/health/vaccines/recommended/', { params }),
};