import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { alertsAPI } from '@/api/alerts';
import { useNotificationStore } from '@/store/notificationStore';
import { QUERY_KEYS } from '@/utils/constants';

/**
 * Custom hook for alerts operations
 */
export const useAlerts = (filters = {}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  /**
   * Get all alerts query
   */
  const alertsQuery = useQuery({
    queryKey: QUERY_KEYS.alerts.list(filters),
    queryFn: () => alertsAPI.getAlerts(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  /**
   * Get active alerts query
   */
  const activeAlertsQuery = useQuery({
    queryKey: QUERY_KEYS.alerts.active,
    queryFn: () => alertsAPI.getActiveAlerts(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });

  /**
   * Resolve alert mutation
   */
  const resolveMutation = useMutation({
    mutationFn: alertsAPI.resolveAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Alert resolved successfully!',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to resolve alert.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  /**
   * Delete alert mutation
   */
  const deleteMutation = useMutation({
    mutationFn: alertsAPI.deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Alert deleted successfully!',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete alert.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  return {
    // Alerts
    alerts: alertsQuery.data?.data,
    isLoadingAlerts: alertsQuery.isLoading,
    alertsError: alertsQuery.error,
    
    // Active alerts
    activeAlerts: activeAlertsQuery.data?.data,
    isLoadingActiveAlerts: activeAlertsQuery.isLoading,
    
    // Resolve
    resolveAlert: resolveMutation.mutate,
    isResolving: resolveMutation.isPending,
    
    // Delete
    deleteAlert: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

/**
 * Hook for single alert
 */
export const useAlert = (id) => {
  const alertQuery = useQuery({
    queryKey: QUERY_KEYS.alerts.detail(id),
    queryFn: () => alertsAPI.getAlertById(id),
    enabled: !!id,
  });

  return {
    alert: alertQuery.data?.data,
    isLoading: alertQuery.isLoading,
    error: alertQuery.error,
  };
};