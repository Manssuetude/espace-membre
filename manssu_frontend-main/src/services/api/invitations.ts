import apiClient from './client'
import { ApiResponse } from '../../types/api'
import {
  Invite,
  CreateInviteRequest,
  ValidateInviteResponse,
  AddSessionToGuestRequest,
  InvitationRequest,
  CreateInvitationRequestRequest,
  ReviewInvitationRequestRequest,
} from '../../types/invitation'

export const invitationsApi = {
  // Create invitation (Admin only)
  // POST /api/v1/invites
  createInvite: async (data: CreateInviteRequest): Promise<ApiResponse<Invite>> => {
    const response = await apiClient.post<ApiResponse<Invite>>('/api/v1/invites', data)
    return response.data
  },

  // List invitations (Admin only)
  // GET /api/v1/invites?status={status}&session_id={id}&email={email}
  getInvites: async (params?: {
    status?: 'pending' | 'used' | 'expired' | 'cancelled'
    session_id?: string
    email?: string
  }): Promise<ApiResponse<Invite[]>> => {
    const response = await apiClient.get<ApiResponse<Invite[]>>('/api/v1/invites', { params })
    return response.data
  },

  // Get invitation by ID (Admin only)
  // GET /api/v1/invites/{invite_id}
  getInviteById: async (id: string): Promise<ApiResponse<Invite>> => {
    const response = await apiClient.get<ApiResponse<Invite>>(`/api/v1/invites/${id}`)
    return response.data
  },

  // Cancel invitation (Admin only)
  // POST /api/v1/invites/{invite_id}/cancel
  cancelInvite: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/api/v1/invites/${id}/cancel`
    )
    return response.data
  },

  // Validate invite code (Public)
  // GET /api/v1/invites/validate/{code}
  validateInviteCode: async (code: string): Promise<ValidateInviteResponse> => {
    const response = await apiClient.get<ValidateInviteResponse>(`/api/v1/invites/validate/${code}`)
    return response.data
  },

  // Add session to guest (Admin only)
  // POST /api/v1/invites/guests/{guest_id}/sessions
  addSessionToGuest: async (
    guestId: string,
    data: AddSessionToGuestRequest
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/api/v1/invites/guests/${guestId}/sessions`,
      data
    )
    return response.data
  },

  // Create invitation request (Member, Admin, Super Admin)
  // POST /api/v1/invites/requests
  createInvitationRequest: async (
    data: CreateInvitationRequestRequest
  ): Promise<ApiResponse<InvitationRequest>> => {
    const response = await apiClient.post<ApiResponse<InvitationRequest>>(
      '/api/v1/invites/requests',
      data
    )
    return response.data
  },

  // List invitation requests (Admin only)
  // GET /api/v1/invites/requests?status={status}&session_id={id}
  getInvitationRequests: async (params?: {
    status?: 'pending' | 'approved' | 'rejected'
    session_id?: string
  }): Promise<ApiResponse<InvitationRequest[]>> => {
    const response = await apiClient.get<ApiResponse<InvitationRequest[]>>('/api/v1/invites/requests', {
      params,
    })
    return response.data
  },

  // Get invitation request by ID (Admin only)
  // GET /api/v1/invites/requests/{request_id}
  getInvitationRequestById: async (id: string): Promise<ApiResponse<InvitationRequest>> => {
    const response = await apiClient.get<ApiResponse<InvitationRequest>>(`/api/v1/invites/requests/${id}`)
    return response.data
  },

  // Review invitation request (Approve/Reject) (Admin only)
  // POST /api/v1/invites/requests/{request_id}/review
  reviewInvitationRequest: async (
    id: string,
    data: ReviewInvitationRequestRequest
  ): Promise<ApiResponse<InvitationRequest>> => {
    const response = await apiClient.post<ApiResponse<InvitationRequest>>(
      `/api/v1/invites/requests/${id}/review`,
      data
    )
    return response.data
  },
}




