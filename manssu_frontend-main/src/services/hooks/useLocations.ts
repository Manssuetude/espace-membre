import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { locationsApi } from '../api/locations'
import { queryKeys } from '../api/queryKeys'
import { CreateLocationRequest, UpdateLocationRequest } from '../../types/location'
import { toast } from 'sonner'

export const useLocations = (params?: {
  search?: string
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: [...queryKeys.locations, params],
    queryFn: () => locationsApi.getLocations(params),
    select: (response) => response.data,
  })
}

export const useLocation = (id: string) => {
  return useQuery({
    queryKey: queryKeys.location(id),
    queryFn: () => locationsApi.getLocation(id),
    select: (response) => response.data,
    enabled: !!id,
  })
}

export const useCreateLocation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLocationRequest) => locationsApi.createLocation(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations })
      toast.success(response.message || 'Lieu créé avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la création du lieu')
    },
  })
}

export const useUpdateLocation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLocationRequest }) =>
      locationsApi.updateLocation(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations })
      queryClient.invalidateQueries({ queryKey: queryKeys.location(variables.id) })
      toast.success(response.message || 'Lieu mis à jour avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du lieu')
    },
  })
}

export const useDeleteLocation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => locationsApi.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations })
      toast.success('Lieu supprimé avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du lieu')
    },
  })
}

