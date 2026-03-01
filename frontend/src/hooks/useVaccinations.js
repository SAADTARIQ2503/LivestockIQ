import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { healthAPI } from '@/api/health';
import { useNotificationStore } from '@/store/notificationStore';
import { QUERY_KEYS } from '@/utils/constants';

/**
 * Custom hook for vaccinations operations
 */
export const useVaccinations = (filters = {}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  /**
   * Get all vaccination schedules query
   */
  const schedulesQuery = useQuery({
    queryKey: QUERY_KEYS.health.schedules(filters),
    queryFn: () => healthAPI.getSchedules(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  /**
   * Get upcoming vaccinations query
   */
  const upcomingQuery = useQuery({
    queryKey: QUERY_KEYS.health.upcoming,
    queryFn: healthAPI.getUpcoming,
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Get overdue vaccinations query
   */
  const overdueQuery = useQuery({
    queryKey: QUERY_KEYS.health.overdue,
    queryFn: healthAPI.getOverdue,
    staleTime: 2 * 60 * 1000,
  });

  /**
   * Create schedule mutation
   */
  const createMutation = useMutation({
    mutationFn: healthAPI.createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.dashboard });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Vaccination scheduled successfully!',
      });
      
      navigate('/vaccinations');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to schedule vaccination.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  /**
   * Update schedule mutation
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => healthAPI.updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.dashboard });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Schedule updated successfully!',
      });
      
      navigate('/vaccinations');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update schedule.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  /**
   * Delete schedule mutation
   */
  const deleteMutation = useMutation({
    mutationFn: healthAPI.deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.dashboard });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Schedule deleted successfully!',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete schedule.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  /**
   * Mark as completed mutation
   */
  const completeMutation = useMutation({
    mutationFn: healthAPI.markCompleted,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.dashboard });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Vaccination marked as completed!',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to mark as completed.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  return {
    // Schedules
    schedules: schedulesQuery.data?.data,
    isLoadingSchedules: schedulesQuery.isLoading,
    schedulesError: schedulesQuery.error,
    
    // Upcoming
    upcoming: upcomingQuery.data?.data,
    isLoadingUpcoming: upcomingQuery.isLoading,
    
    // Overdue
    overdue: overdueQuery.data?.data,
    isLoadingOverdue: overdueQuery.isLoading,
    
    // Create
    createSchedule: createMutation.mutate,
    isCreating: createMutation.isPending,
    
    // Update
    updateSchedule: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    
    // Delete
    deleteSchedule: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    
    // Complete
    markCompleted: completeMutation.mutate,
    isMarkingCompleted: completeMutation.isPending,
  };
};

/**
 * Hook for recommended vaccines
 */
export const useRecommendedVaccines = (filters = {}) => {
  const vaccinesQuery = useQuery({
    queryKey: QUERY_KEYS.health.vaccines(filters),
    queryFn: () => healthAPI.getRecommendedVaccines(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    vaccines: vaccinesQuery.data?.data,
    isLoading: vaccinesQuery.isLoading,
    error: vaccinesQuery.error,
  };
};
