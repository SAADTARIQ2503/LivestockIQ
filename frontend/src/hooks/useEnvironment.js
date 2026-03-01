import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentAPI } from '@/api/environment';
import { useNotificationStore } from '@/store/notificationStore';
import { QUERY_KEYS } from '@/utils/constants';

/**
 * Custom hook for environment operations
 */
export const useEnvironment = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  /**
   * Get current environmental status
   */
  const statusQuery = useQuery({
    queryKey: QUERY_KEYS.environment.status,
    queryFn: environmentAPI.getCurrentStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  /**
   * Get environmental statistics
   */
  const statisticsQuery = useQuery({
    queryKey: QUERY_KEYS.environment.statistics,
    queryFn: environmentAPI.getStatistics,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  /**
   * Get forecast
   */
  const forecastQuery = useQuery({
    queryKey: QUERY_KEYS.environment.forecast,
    queryFn: () => environmentAPI.getForecast(7),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  /**
   * Get alerts
   */
  const alertsQuery = useQuery({
    queryKey: QUERY_KEYS.environment.alerts,
    queryFn: environmentAPI.getAlerts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  });

  /**
   * Record environmental data mutation
   */
  const recordMutation = useMutation({
    mutationFn: environmentAPI.recordData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environment'] });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Environmental data recorded successfully!',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to record data.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  return {
    // Current status
    status: statusQuery.data?.data,
    isLoadingStatus: statusQuery.isLoading,
    statusError: statusQuery.error,
    
    // Statistics
    statistics: statisticsQuery.data?.data,
    isLoadingStatistics: statisticsQuery.isLoading,
    
    // Forecast
    forecast: forecastQuery.data?.data,
    isLoadingForecast: forecastQuery.isLoading,
    
    // Alerts
    alerts: alertsQuery.data?.data,
    isLoadingAlerts: alertsQuery.isLoading,
    
    // Record data
    recordData: recordMutation.mutate,
    isRecording: recordMutation.isPending,
  };
};

/**
 * Hook for environmental history
 */
export const useEnvironmentHistory = (filters = {}) => {
  const historyQuery = useQuery({
    queryKey: QUERY_KEYS.environment.history(filters),
    queryFn: () => environmentAPI.getHistory(filters),
    staleTime: 5 * 60 * 1000,
  });

  return {
    history: historyQuery.data?.data,
    isLoading: historyQuery.isLoading,
    error: historyQuery.error,
  };
};
