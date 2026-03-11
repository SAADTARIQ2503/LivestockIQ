import api from './axios';

export const mortalityAPI = {
  getAll: (params = {}) => api.get('/mortality/', { params }),
  getById: (id) => api.get(`/mortality/${id}/`),
  create: (data) => api.post('/mortality/', data),
  delete: (id) => api.delete(`/mortality/${id}/`),
  getSummary: () => api.get('/mortality/summary/'),
};
