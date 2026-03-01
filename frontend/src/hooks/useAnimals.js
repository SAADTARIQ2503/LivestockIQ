import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { animalsAPI } from '@/api/animals';
import { useNotificationStore } from '@/store/notificationStore';
import { QUERY_KEYS } from '@/utils/constants';

/**
 * Custom hook for animals operations
 */
export const useAnimals = (filters = {}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  /**
   * Get all animals query
   */
  const animalsQuery = useQuery({
    queryKey: QUERY_KEYS.animals.list(filters),
    queryFn: () => animalsAPI.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  /**
   * Get animal statistics query
   */
  const statisticsQuery = useQuery({
    queryKey: QUERY_KEYS.animals.statistics,
    queryFn: animalsAPI.getStatistics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Create animal mutation
   */
  const createMutation = useMutation({
    mutationFn: animalsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.animals.statistics });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.dashboard });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Animal added successfully!',
      });
      
      navigate('/animals');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to add animal. Please try again.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  /**
   * Update animal mutation
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => animalsAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.animals.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.animals.statistics });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.dashboard });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Animal updated successfully!',
      });
      
      navigate('/animals');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update animal. Please try again.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  /**
   * Delete animal mutation
   */
  const deleteMutation = useMutation({
    mutationFn: animalsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.animals.statistics });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.dashboard });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Animal deleted successfully!',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete animal. Please try again.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  return {
    // Animals list
    animals: animalsQuery.data?.data,
    isLoadingAnimals: animalsQuery.isLoading,
    animalsError: animalsQuery.error,
    
    // Statistics
    statistics: statisticsQuery.data?.data,
    isLoadingStatistics: statisticsQuery.isLoading,
    
    // Create
    createAnimal: createMutation.mutate,
    isCreating: createMutation.isPending,
    
    // Update
    updateAnimal: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    
    // Delete
    deleteAnimal: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

/**
 * Hook for single animal detail
 */
export const useAnimal = (id) => {
  const animalQuery = useQuery({
    queryKey: QUERY_KEYS.animals.detail(id),
    queryFn: () => animalsAPI.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  return {
    animal: animalQuery.data?.data,
    isLoading: animalQuery.isLoading,
    error: animalQuery.error,
  };
};
