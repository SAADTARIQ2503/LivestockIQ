import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmsAPI } from '@/api/farms';
import { useNotificationStore } from '@/store/notificationStore';

export const useFarms = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  const farmsQuery = useQuery({
    queryKey: ['farms'],
    queryFn: farmsAPI.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const farmsWeatherQuery = useQuery({
    queryKey: ['farms-weather'],
    queryFn: farmsAPI.getFarmsWeather,
    staleTime: 10 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: farmsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      addNotification({ type: 'success', title: 'Farm added', message: 'Farm created successfully.' });
    },
    onError: (err) => {
      addNotification({ type: 'error', title: 'Error', message: err.response?.data?.detail || 'Failed to create farm.' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => farmsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      addNotification({ type: 'success', title: 'Farm updated', message: 'Farm updated successfully.' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: farmsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      queryClient.invalidateQueries({ queryKey: ['farms-weather'] });
      addNotification({ type: 'success', title: 'Farm deleted', message: 'Farm removed.' });
    },
  });

  const geocodeMutation = useMutation({
    mutationFn: ({ address, farmId }) => farmsAPI.geocode(address, farmId),
  });

  const farms = farmsQuery.data?.data?.results ?? farmsQuery.data?.data ?? [];
  const farmsWeather = farmsWeatherQuery.data?.data ?? [];

  return {
    farms,
    isLoadingFarms: farmsQuery.isLoading,
    farmsError: farmsQuery.error,

    farmsWeather,
    isLoadingWeather: farmsWeatherQuery.isLoading,

    createFarm: createMutation.mutate,
    isCreating: createMutation.isPending,

    updateFarm: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    deleteFarm: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,

    geocode: geocodeMutation.mutateAsync,
    isGeocoding: geocodeMutation.isPending,
    geocodeError: geocodeMutation.error,
  };
};
