import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commissionsApi } from '../api/commissions'
import { queryKeys } from '../api/queryKeys'
import {
  CreateCommissionRequest,
  UpdateCommissionRequest,
  ApplyToCommissionRequest,
  AssignLeaderRequest,
  RejectApplicationRequest,
  AddMemberRequest,
} from '../../types/commission'
import { toast } from 'sonner'

// List all commissions
export const useCommissions = (params?: {
  status?: 'active' | 'archived'
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: [...queryKeys.commissions, params],
    queryFn: () => commissionsApi.getCommissions(params),
    select: (response) => response.data,
  })
}

// Get commission details
export const useCommission = (id: string) => {
  return useQuery({
    queryKey: queryKeys.commission(id),
    queryFn: () => commissionsApi.getCommission(id),
    select: (response) => response.data,
    enabled: !!id,
  })
}

// Create commission (super admin only)
export const useCreateCommission = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCommissionRequest) => commissionsApi.createCommission(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
      toast.success(response.message || 'Commission créée avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la création de la commission')
    },
  })
}

// Update commission (super admin or leader)
export const useUpdateCommission = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommissionRequest }) =>
      commissionsApi.updateCommission(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.commission(variables.id) })
      toast.success(response.message || 'Commission mise à jour avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour de la commission')
    },
  })
}

// Delete commission (super admin only)
export const useDeleteCommission = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => commissionsApi.deleteCommission(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
      toast.success(response.message || 'Commission supprimée avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la commission')
    },
  })
}

// Assign leader (super admin only)
export const useAssignLeader = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignLeaderRequest }) =>
      commissionsApi.assignLeader(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.commission(variables.id) })
      toast.success(response.message || 'Leader assigné avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de l\'assignation du leader')
    },
  })
}

// Remove leader (super admin only)
export const useRemoveLeader = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => commissionsApi.removeLeader(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.commission(response.data.id) })
      toast.success(response.message || 'Leader retiré avec succès')
    },
    onError: () => {
      toast.error('Erreur lors du retrait du leader')
    },
  })
}

// Get applications for a commission (super admin or leader)
export const useCommissionApplications = (commissionId: string, params?: {
  status?: 'pending' | 'approved' | 'rejected'
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: [...queryKeys.commissionApplications(commissionId), params],
    queryFn: () => commissionsApi.getApplications(commissionId, params),
    select: (response) => response.data,
    enabled: !!commissionId,
  })
}

// Approve application (super admin or leader)
export const useApproveApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commissionId, applicationId }: { commissionId: string; applicationId: string }) =>
      commissionsApi.approveApplication(commissionId, applicationId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.commission(variables.commissionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.commissionApplications(variables.commissionId) })
      toast.success(response.message || 'Candidature approuvée avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de l\'approbation de la candidature')
    },
  })
}

// Reject application (super admin or leader)
export const useRejectApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commissionId, applicationId, data }: { commissionId: string; applicationId: string; data?: RejectApplicationRequest }) =>
      commissionsApi.rejectApplication(commissionId, applicationId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.commission(variables.commissionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.commissionApplications(variables.commissionId) })
      toast.success(response.message || 'Candidature rejetée')
    },
    onError: () => {
      toast.error('Erreur lors du rejet de la candidature')
    },
  })
}

// Add member directly (super admin or leader)
export const useAddMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commissionId, data }: { commissionId: string; data: AddMemberRequest }) =>
      commissionsApi.addMember(commissionId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.commission(variables.commissionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myCommissions })
      toast.success(response.message || 'Membre ajouté avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout du membre')
    },
  })
}

// Remove member (super admin or leader)
export const useRemoveMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commissionId, userId }: { commissionId: string; userId: string }) =>
      commissionsApi.removeMember(commissionId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.commission(variables.commissionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myCommissions })
      toast.success('Membre retiré avec succès')
    },
    onError: () => {
      toast.error('Erreur lors du retrait du membre')
    },
  })
}

// Apply to commission
export const useApplyToCommission = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApplyToCommissionRequest }) =>
      commissionsApi.applyToCommission(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.commission(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.myCommissionApplications })
      toast.success(response.message || 'Candidature soumise avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la soumission de la candidature')
    },
  })
}

// Withdraw application
export const useWithdrawApplication = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => commissionsApi.withdrawApplication(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions })
      queryClient.invalidateQueries({ queryKey: queryKeys.myCommissionApplications })
      toast.success(response.message || 'Candidature retirée avec succès')
    },
    onError: () => {
      toast.error('Erreur lors du retrait de la candidature')
    },
  })
}

// Get my commissions (memberships)
export const useMyCommissions = () => {
  return useQuery({
    queryKey: queryKeys.myCommissions,
    queryFn: () => commissionsApi.getMyCommissions(),
    select: (response) => response.data,
  })
}

// Get my applications
export const useMyApplications = () => {
  return useQuery({
    queryKey: queryKeys.myCommissionApplications,
    queryFn: () => commissionsApi.getMyApplications(),
    select: (response) => response.data,
  })
}


