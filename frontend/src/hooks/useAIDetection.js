import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { aiDetectionAPI } from '@/api/alerts';
import { useNotificationStore } from '@/store/notificationStore';
import { QUERY_KEYS } from '@/utils/constants';

/**
 * Custom hook for AI disease detection
 */
export const useAIDetection = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  /**
   * Get detection history query
   */
  const historyQuery = useQuery({
    queryKey: QUERY_KEYS.aiDetection.history,
    queryFn: () => aiDetectionAPI.getDetectionHistory(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  /**
   * Detect disease mutation
   */
  const detectMutation = useMutation({
    mutationFn: aiDetectionAPI.detectDisease,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['aiDetection'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      
      const result = response.data.result;
      const disease = result.disease;
      
      if (disease !== 'healthy') {
        addNotification({
          type: 'warning',
          title: 'Disease Detected!',
          message: `${disease.replace('-', ' ').toUpperCase()} detected with ${(result.confidence * 100).toFixed(1)}% confidence`,
        });
      } else {
        addNotification({
          type: 'success',
          title: 'Detection Complete',
          message: `Animal appears healthy (${(result.confidence * 100).toFixed(1)}% confidence)`,
        });
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to analyze image.';
      addNotification({
        type: 'error',
        title: 'Detection Failed',
        message,
      });
    },
  });

  return {
    // History
    detections: historyQuery.data?.data,
    isLoadingHistory: historyQuery.isLoading,
    historyError: historyQuery.error,
    
    // Detect
    detectDisease: detectMutation.mutate,
    isDetecting: detectMutation.isPending,
    detectionResult: detectMutation.data?.data,
    detectionError: detectMutation.error,
  };
};

/**
 * Hook for single detection
 */
export const useDetection = (id) => {
  const detectionQuery = useQuery({
    queryKey: QUERY_KEYS.aiDetection.detail(id),
    queryFn: () => aiDetectionAPI.getDetectionById(id),
    enabled: !!id,
  });

  return {
    detection: detectionQuery.data?.data,
    isLoading: detectionQuery.isLoading,
    error: detectionQuery.error,
  };
};