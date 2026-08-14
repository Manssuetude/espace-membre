import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { themesApi } from '../api/themes'
import { queryKeys } from '../api/queryKeys'
import { CreateThemeRequest, UpdateThemeRequest, OpenWindowRequest, ExtendWindowRequest } from '../../types/theme'
import { toast } from 'sonner'

// Window Management Hooks
export const useThemeWindowStatus = () => {
  return useQuery({
    queryKey: queryKeys.themeWindowStatus,
    queryFn: () => themesApi.getWindowStatus(),
    select: (response) => response.data,
    refetchInterval: 60000, // Refetch every minute to keep status updated
  })
}

export const useOpenThemeWindow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OpenWindowRequest) => themesApi.openWindow(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.themeWindowStatus })
      toast.success(response.message || 'Fenêtre de propositions ouverte avec succès')
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  })
}

export const useExtendThemeWindow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ windowId, data }: { windowId: string; data: ExtendWindowRequest }) =>
      themesApi.extendWindow(windowId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.themeWindowStatus })
      toast.success(response.message || 'Fenêtre prolongée avec succès')
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  })
}

export const useCloseThemeWindow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (windowId: string) => themesApi.closeWindow(windowId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.themeWindowStatus })
      toast.success(response.message || 'Fenêtre fermée avec succès')
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  })
}

// Theme CRUD Hooks
export const useThemes = (params?: {
  status?: string
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: [...queryKeys.themes, params],
    queryFn: () => themesApi.getThemes(params),
    select: (response) => response.data,
  })
}

export const usePendingThemes = () => {
  return useQuery({
    queryKey: queryKeys.pendingThemes,
    queryFn: () => themesApi.getPendingThemes(),
    select: (response) => response.data,
  })
}

export const useLinkedThemes = () => {
  return useQuery({
    queryKey: queryKeys.linkedThemes,
    queryFn: () => themesApi.getLinkedThemes(),
    select: (response) => response.data,
  })
}

export const useUnlinkedThemes = () => {
  return useQuery({
    queryKey: queryKeys.unlinkedThemes,
    queryFn: () => themesApi.getUnlinkedThemes(),
    select: (response) => response.data,
  })
}

export const useTheme = (id: string) => {
  return useQuery({
    queryKey: queryKeys.theme(id),
    queryFn: () => themesApi.getTheme(id),
    select: (response) => response.data,
    enabled: !!id,
  })
}

export const useCreateTheme = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateThemeRequest) => themesApi.createTheme(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.themes })
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingThemes })
      queryClient.invalidateQueries({ queryKey: queryKeys.unlinkedThemes })
      queryClient.invalidateQueries({ queryKey: queryKeys.themeWindowStatus }) // Refresh userProposals
      toast.success(response.message || 'Thème proposé avec succès')
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  })
}

export const useCreateThemeAdmin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateThemeRequest) => themesApi.createThemeAdmin(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.themes })
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingThemes })
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedThemes })
      queryClient.invalidateQueries({ queryKey: queryKeys.unlinkedThemes })
      toast.success(response.message || 'Thème créé avec succès')
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  })
}

export const useUpdateTheme = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateThemeRequest }) =>
      themesApi.updateTheme(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.themes })
      queryClient.invalidateQueries({ queryKey: queryKeys.theme(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingThemes })
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedThemes })
      queryClient.invalidateQueries({ queryKey: queryKeys.unlinkedThemes })
      toast.success(response.message || 'Thème mis à jour avec succès')
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  })
}

export const useDeleteTheme = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => themesApi.deleteTheme(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.themes })
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingThemes })
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedThemes })
      queryClient.invalidateQueries({ queryKey: queryKeys.unlinkedThemes })
      toast.success('Thème supprimé avec succès')
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  })
}

export const useCreatePollFromThemes = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { themeIds: string[]; sessionId: string }) => themesApi.createPollFromThemes(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.themeWindowStatus })
      queryClient.invalidateQueries({ queryKey: queryKeys.themes })
      toast.success(response.message || 'Sondage créé avec succès')
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  })
}

