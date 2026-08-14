import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activityTemplatesApi } from '../api/activityTemplates'
import { queryKeys } from '../api/queryKeys'
import { CreateActivityTemplateRequest, UpdateActivityTemplateRequest } from '../../types/format'
import { toast } from 'sonner'

export const useActivityTemplates = (params?: {
  search?: string
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: [...queryKeys.activityTemplates, params],
    queryFn: () => activityTemplatesApi.getActivityTemplates(params),
    select: (response) => response.data,
  })
}

export const useActivityTemplate = (id: string) => {
  return useQuery({
    queryKey: queryKeys.activityTemplate(id),
    queryFn: () => activityTemplatesApi.getActivityTemplate(id),
    select: (response) => response.data,
    enabled: !!id,
  })
}

export const useCreateActivityTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateActivityTemplateRequest) => activityTemplatesApi.createActivityTemplate(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activityTemplates })
      toast.success(response.message || 'Format créé avec succès')
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Erreur lors de la création du format'
      toast.error(message)
    },
  })
}

export const useUpdateActivityTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActivityTemplateRequest }) =>
      activityTemplatesApi.updateActivityTemplate(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activityTemplates })
      queryClient.invalidateQueries({ queryKey: queryKeys.activityTemplate(variables.id) })
      toast.success(response.message || 'Format mis à jour avec succès')
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Erreur lors de la mise à jour du format'
      toast.error(message)
    },
  })
}

export const useDeleteActivityTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => activityTemplatesApi.deleteActivityTemplate(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activityTemplates })
      toast.success(response.message || 'Format supprimé avec succès')
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Erreur lors de la suppression du format'
      toast.error(message)
    },
  })
}















