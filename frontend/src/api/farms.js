import axios from './axios';

export const farmsAPI = {
  /** GET /api/v1/farms/ */
  getAll: () => axios.get('/farms/'),

  /** GET /api/v1/farms/:id/ */
  getById: (id) => axios.get(`/farms/${id}/`),

  /** POST /api/v1/farms/ */
  create: (data) => axios.post('/farms/', data),

  /** PATCH /api/v1/farms/:id/ */
  update: (id, data) => axios.patch(`/farms/${id}/`, data),

  /** DELETE /api/v1/farms/:id/ */
  delete: (id) => axios.delete(`/farms/${id}/`),

  /**
   * POST /api/v1/farms/geocode/
   * { address, farm_id? }
   * Returns { latitude, longitude, formatted_address }
   */
  geocode: (address, farmId = null) =>
    axios.post('/farms/geocode/', { address, ...(farmId ? { farm_id: farmId } : {}) }),

  /** GET /api/v1/environment/farms-weather/ */
  getFarmsWeather: () => axios.get('/environment/farms-weather/'),
};