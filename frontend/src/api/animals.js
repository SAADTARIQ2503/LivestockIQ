import axios from './axios';

export const animalsAPI = {
  // Get all animals
  getAll: (params) => axios.get('/animals/', { params }),
  
  // Get single animal
  getById: (id) => axios.get(`/animals/${id}/`),
  
  // Create animal
  create: (data) => axios.post('/animals/', data),
  
  // Update animal
  update: (id, data) => axios.put(`/animals/${id}/`, data),
  
  // Delete animal
  delete: (id) => axios.delete(`/animals/${id}/`),
  
  // Search animals
  search: (filters) => axios.get('/animals/search/', { params: filters }),
  
  // Get statistics
  getStatistics: () => axios.get('/animals/statistics/'),
  
  // Get vaccines by species
  getVaccinesBySpecies: (species) => 
    axios.get('/animals/vaccines-by-species/', { params: { species } }),
};