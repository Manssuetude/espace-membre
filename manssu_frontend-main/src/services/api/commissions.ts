import apiClient from './client'
import {
  CommissionDetail,
  CommissionListResponse,
  CommissionApplicationListResponse,
  CommissionApplication,
  CommissionMember,
  MyCommission,
  MyCommissionApplication,
  CreateCommissionRequest,
  UpdateCommissionRequest,
  ApplyToCommissionRequest,
  AssignLeaderRequest,
  RejectApplicationRequest,
  AddMemberRequest,
} from '../../types/commission'

export const commissionsApi = {
  // List all commissions
  getCommissions: async (params?: {
    status?: 'active' | 'archived'
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get<{ success: boolean; data: CommissionListResponse }>('/api/v1/commissions', {
      params,
    })
    return response.data
  },

  // Get commission details
  getCommission: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: CommissionDetail }>(`/api/v1/commissions/${id}`)
    return response.data
  },

  // Create commission (super admin only)
  createCommission: async (data: CreateCommissionRequest) => {
    const response = await apiClient.post<{ success: boolean; message: string; data: CommissionDetail }>('/api/v1/commissions', data)
    return response.data
  },

  // Update commission (super admin or leader)
  updateCommission: async (id: string, data: UpdateCommissionRequest) => {
    const response = await apiClient.patch<{ success: boolean; message: string; data: CommissionDetail }>(`/api/v1/commissions/${id}`, data)
    return response.data
  },

  // Delete commission (super admin only)
  deleteCommission: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/commissions/${id}`)
    return response.data
  },

  // Assign leader (super admin only)
  assignLeader: async (id: string, data: AssignLeaderRequest) => {
    const response = await apiClient.put<{ success: boolean; message: string; data: CommissionDetail }>(`/api/v1/commissions/${id}/leader`, data)
    return response.data
  },

  // Remove leader (super admin only)
  removeLeader: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string; data: CommissionDetail }>(`/api/v1/commissions/${id}/leader`)
    return response.data
  },

  // List applications for a commission (super admin or leader)
  getApplications: async (id: string, params?: {
    status?: 'pending' | 'approved' | 'rejected'
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get<{ success: boolean; data: CommissionApplicationListResponse }>(`/api/v1/commissions/${id}/applications`, {
      params,
    })
    return response.data
  },

  // Approve application (super admin or leader)
  approveApplication: async (commissionId: string, applicationId: string) => {
    const response = await apiClient.post<{ success: boolean; message: string; data: CommissionApplication }>(`/api/v1/commissions/${commissionId}/applications/${applicationId}/approve`)
    return response.data
  },

  // Reject application (super admin or leader)
  rejectApplication: async (commissionId: string, applicationId: string, data?: RejectApplicationRequest) => {
    const response = await apiClient.post<{ success: boolean; message: string; data: CommissionApplication }>(`/api/v1/commissions/${commissionId}/applications/${applicationId}/reject`, data || {})
    return response.data
  },

  // Add member directly (super admin or leader)
  addMember: async (commissionId: string, data: AddMemberRequest) => {
    const response = await apiClient.post<{ success: boolean; message: string; data: CommissionMember }>(`/api/v1/commissions/${commissionId}/members`, data)
    return response.data
  },

  // Remove member (super admin or leader)
  removeMember: async (commissionId: string, userId: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/commissions/${commissionId}/members/${userId}`)
    return response.data
  },

  // Apply to commission
  applyToCommission: async (id: string, data: ApplyToCommissionRequest) => {
    const response = await apiClient.post<{ success: boolean; message: string; data: CommissionApplication }>(`/api/v1/commissions/${id}/apply`, data)
    return response.data
  },

  // Withdraw application
  withdrawApplication: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/api/v1/commissions/${id}/apply`)
    return response.data
  },

  // Get my commissions (memberships)
  getMyCommissions: async () => {
    const response = await apiClient.get<{ success: boolean; data: MyCommission[] }>('/api/v1/commissions/me')
    return response.data
  },

  // Get my applications
  getMyApplications: async () => {
    const response = await apiClient.get<{ success: boolean; data: MyCommissionApplication[] }>('/api/v1/commissions/me/applications')
    return response.data
  },
}

