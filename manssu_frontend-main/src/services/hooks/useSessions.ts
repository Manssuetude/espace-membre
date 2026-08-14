import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsApi } from '../api/sessions'
import { queryKeys } from '../api/queryKeys'
import { CreateSessionRequest, UpdateSessionRequest, CreateGroupRequest } from '../../types/session'
import { toast } from 'sonner'

export const useSessions = (params?: {
  status?: string
  theme?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: [...queryKeys.sessions, params],
    queryFn: () => sessionsApi.getSessions(params),
    select: (response) => response.data,
  })
}

export const useSession = (id: string) => {
  return useQuery({
    queryKey: queryKeys.session(id),
    queryFn: () => sessionsApi.getSession(id),
    select: (response) => response.data,
    enabled: !!id,
  })
}

export const useCreateSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSessionRequest) => sessionsApi.createSession(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      toast.success(response.message || 'Session créée avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la création de la session')
    },
  })
}

export const useUpdateSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionRequest }) =>
      sessionsApi.updateSession(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      queryClient.invalidateQueries({ queryKey: queryKeys.session(variables.id) })
      toast.success(response.message || 'Session mise à jour avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour de la session')
    },
  })
}

export const useDeleteSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => sessionsApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      toast.success('Session supprimée avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la session')
    },
  })
}

export const useRegisterForSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.registerForSession(sessionId),
    onSuccess: (response, sessionId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.memberDashboard })
      toast.success(response.message || 'Inscription réussie')
    },
    onError: () => {
      toast.error('Erreur lors de l\'inscription')
    },
  })
}

export const useUnregisterFromSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.unregisterFromSession(sessionId),
    onSuccess: (response, sessionId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions })
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.memberDashboard })
      toast.success(response.message || 'Désinscription réussie')
    },
    onError: () => {
      toast.error('Erreur lors de la désinscription')
    },
  })
}

export const useCreateGroups = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: CreateGroupRequest }) =>
      sessionsApi.createWorkGroups(sessionId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionGroups(variables.sessionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.session(variables.sessionId) })
      toast.success(response.message || 'Groupes créés avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la création des groupes')
    },
  })
}

export const useSessionGroups = (sessionId: string) => {
  return useQuery({
    queryKey: queryKeys.sessionGroups(sessionId),
    queryFn: () => sessionsApi.getWorkGroups(sessionId),
    select: (response) => response.data,
    enabled: !!sessionId,
  })
}

export const useRateSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: { rating: number; comment?: string } }) =>
      sessionsApi.rateSession(sessionId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(variables.sessionId) })
      toast.success(response.message || 'Note enregistrée avec succès')
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  })
}

export const useMarkAttendance = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, userId, data }: { sessionId: string; userId: string; data: { attended: boolean } }) =>
      sessionsApi.markAttendance(sessionId, userId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(variables.sessionId) })
      toast.success(response.message || 'Présence enregistrée avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de l\'enregistrement de la présence')
    },
  })
}

export const useRemindRatings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => sessionsApi.remindRatings(sessionId),
    onSuccess: (response, sessionId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) })
      toast.success(response.message || 'Rappel de notation envoyé avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi du rappel de notation')
    },
  })
}

