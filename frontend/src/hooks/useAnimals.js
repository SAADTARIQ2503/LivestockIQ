import { useQuery, useMutation, useQueryClient } from 'react-query';
import { animalsAPI } from '@/api/animals';

export const useAnimals = () => {
  const queryClient = useQueryClient();

  const animalsQuery = useQuery('animals', animalsAPI.getAll);

  const statisticsQuery = useQuery('animal-statistics', animalsAPI.getStatistics);

  const createAnimalMutation = useMutation(animalsAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('animals');
      queryClient.invalidateQueries('animal-statistics');
    },
  });

  const updateAnimalMutation = useMutation(
    ({ id, data }) => animalsAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('animals');
        queryClient.invalidateQueries('animal-statistics');
      },
    }
  );

  const deleteAnimalMutation = useMutation(animalsAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('animals');
      queryClient.invalidateQueries('animal-statistics');
    },
  });

  return {
    animals: animalsQuery.data?.data?.results || [],
    statistics: statisticsQuery.data?.data,
    isLoading: animalsQuery.isLoading,
    createAnimal: createAnimalMutation.mutate,
    updateAnimal: updateAnimalMutation.mutate,
    deleteAnimal: deleteAnimalMutation.mutate,
    isCreating: createAnimalMutation.isLoading,
  };
};