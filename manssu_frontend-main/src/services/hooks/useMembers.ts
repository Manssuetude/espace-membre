import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { membersApi } from '../api/members'
import { queryKeys } from '../api/queryKeys'
import { UpdateMemberRequest, CreateMemberRequest } from '../../types/member'
import { toast } from 'sonner'

export const useMembers = (params?: {
  search?: string
  status?: string
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: [...queryKeys.members, params],
    queryFn: () => membersApi.getMembers(params),
    select: (response) => response.data,
  })
}

export const useMemberStats = () => {
  return useQuery({
    queryKey: [...queryKeys.members, 'stats'],
    queryFn: async () => {
      const response = await membersApi.getMembers()
      return response.data.stats
    },
  })
}

export const useMember = (id: string) => {
  return useQuery({
    queryKey: queryKeys.member(id),
    queryFn: () => membersApi.getMember(id),
    select: (response) => response.data,
    enabled: !!id,
  })
}

export const useUpdateMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberRequest }) =>
      membersApi.updateMember(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.member(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      toast.success(response.message || 'Membre mis à jour avec succès')
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Erreur lors de la mise à jour du membre'
      toast.error(message)
    },
  })
}

export const useDeleteMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => membersApi.deleteMember(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      toast.success(response.message || 'Membre supprimé avec succès')
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Erreur lors de la suppression du membre'
      toast.error(message)
    },
  })
}

export const useCreateMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMemberRequest) => membersApi.createMember(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      toast.success(response.message || 'Membre créé avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la création du membre')
    },
  })
}

export const useSuspendMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => membersApi.suspendMember(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      toast.success(response.message || 'Membre suspendu avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la suspension du membre')
    },
  })
}

export const useUnsuspendMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => membersApi.unsuspendMember(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      toast.success(response.message || 'Membre réactivé avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la réactivation du membre')
    },
  })
}

