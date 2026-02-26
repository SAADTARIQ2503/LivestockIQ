import axios from './axios';

export const healthAPI = {
  // Vaccination schedules
  getSchedules: (params) => axios.get('/health/schedules/', { params }),
  
  getScheduleById: (id) => axios.get(`/health/schedules/${id}/`),
  
  createSchedule: (data) => axios.post('/health/schedules/', data),
  
  updateSchedule: (id, data) => axios.put(`/health/schedules/${id}/`, data),
  
  deleteSchedule: (id) => axios.delete(`/health/schedules/${id}/`),
  
  getUpcomingSchedules: () => axios.get('/health/schedules/upcoming/'),
  
  getOverdueSchedules: () => axios.get('/health/schedules/overdue/'),
  
  completeSchedule: (id) => axios.post(`/health/schedules/${id}/complete/`),
  
  // Vaccines
  getVaccines: (params) => axios.get('/health/vaccines/', { params }),
  
  getVaccineDetail: (id) => axios.get(`/health/vaccines/${id}/`),
  
  getRecommendedVaccines: (params) => 
    axios.get('/health/vaccines/recommended/', { params }),
  
  getVaccinesBySpecies: (species) => 
    axios.get('/health/vaccines/by-species/', { params: { species } }),
};