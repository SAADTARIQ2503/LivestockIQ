import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { costsAPI } from '@/api/costs';
import { useNotificationStore } from '@/store/notificationStore';
import { QUERY_KEYS } from '@/utils/constants';

/**
 * Custom hook for costs operations
 */
export const useCosts = (filters = {}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  /**
   * Get all transactions query
   */
  const transactionsQuery = useQuery({
    queryKey: QUERY_KEYS.costs.transactions(filters),
    queryFn: () => costsAPI.getTransactions(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  /**
   * Get financial summary query
   */
  const summaryQuery = useQuery({
    queryKey: QUERY_KEYS.costs.summary,
    queryFn: () => costsAPI.getSummary(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /**
   * Create transaction mutation
   */
  const createMutation = useMutation({
    mutationFn: costsAPI.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Transaction added successfully!',
      });
      
      navigate('/costs');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to add transaction.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  /**
   * Update transaction mutation
   */
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => costsAPI.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Transaction updated successfully!',
      });
      
      navigate('/costs');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update transaction.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  /**
   * Delete transaction mutation
   */
  const deleteMutation = useMutation({
    mutationFn: costsAPI.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Transaction deleted successfully!',
      });
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete transaction.';
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    },
  });

  return {
    // Transactions
    transactions: transactionsQuery.data?.data,
    isLoadingTransactions: transactionsQuery.isLoading,
    transactionsError: transactionsQuery.error,
    
    // Summary
    summary: summaryQuery.data?.data,
    isLoadingSummary: summaryQuery.isLoading,
    
    // Create
    createTransaction: createMutation.mutate,
    isCreating: createMutation.isPending,
    
    // Update
    updateTransaction: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    
    // Delete
    deleteTransaction: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};

/**
 * Hook for financial report
 */
export const useFinancialReport = (params = {}) => {
  const reportQuery = useQuery({
    queryKey: QUERY_KEYS.costs.report(params),
    queryFn: () => costsAPI.getReport(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!params.start_date && !!params.end_date,
  });

  return {
    report: reportQuery.data?.data,
    isLoading: reportQuery.isLoading,
    error: reportQuery.error,
  };
};
