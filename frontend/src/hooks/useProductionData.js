// src/hooks/useProductionData.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionService } from '../services/api';

export const useProductionData = (filters) => {
  const queryClient = useQueryClient();

  // All records (unfiltered) – for exports and “last 10 days” features
  const { data: allRecords = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ['allProduction'],
    queryFn: () => productionService.getAll({}),
  });

  // Filtered records based on search, pen, date range
  const { data: filteredRecords = [], isLoading, refetch } = useQuery({
    queryKey: ['production', filters],
    queryFn: () =>
      productionService.getAll({
        search: filters.search || undefined,
        pen_id: filters.penId !== 'all' ? filters.penId : undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: productionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['production', 'allProduction']);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['production', 'allProduction']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['production', 'allProduction']);
    },
  });

  return {
    allRecords,
    filteredRecords,
    isLoading,
    refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};