import apiClient from './client'
import { ApiResponse, PaginatedResponse } from '../../types/api'
import { Poll, CreatePollRequest, UpdatePollRequest, VoteRequest, PollResult } from '../../types/sondage'

export const sondagesApi = {

  relaunchMembers: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/api/v1/polls/${id}/remind`)
    return response.data
  },

  // Get all polls
  getSondages: async (params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<Poll>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Poll>>>('/api/v1/polls', {
      params: {
        status: params?.status || 'all',
        page: params?.page || 1,
        limit: params?.limit || 10,
      },
    })
    return response.data
  },

  // Get poll by ID
  getSondage: async (id: string): Promise<ApiResponse<Poll>> => {
    const response = await apiClient.get<ApiResponse<Poll>>(`/api/v1/polls/${id}`)
    return response.data
  },

  // Create poll
  createSondage: async (data: CreatePollRequest): Promise<ApiResponse<Poll>> => {
    const response = await apiClient.post<ApiResponse<Poll>>('/api/v1/polls', data)
    return response.data
  },

  // Update poll
  updateSondage: async (id: string, data: UpdatePollRequest): Promise<ApiResponse<Poll>> => {
    const response = await apiClient.patch<ApiResponse<Poll>>(`/api/v1/polls/${id}`, data)
    return response.data
  },

  // Delete poll
  deleteSondage: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/polls/${id}`)
    return response.data
  },

  // Vote on poll
  vote: async (pollId: string, data: VoteRequest): Promise<ApiResponse<{ message: string; pollId: string; optionId: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string; pollId: string; optionId: string }>>(`/api/v1/polls/${pollId}/vote`, data)
    return response.data
  },

  // Legacy methods for backward compatibility (can be removed if not used)
  getSondageResults: async (id: string): Promise<ApiResponse<PollResult>> => {
    const pollResponse = await sondagesApi.getSondage(id)
    if (!pollResponse.data || !pollResponse.data.options) {
      throw new Error('Poll not found or has no options')
    }
    
    const poll = pollResponse.data
    const result: PollResult = {
      poll,
      distribution: poll.options?.map(opt => ({
        optionId: opt.id,
        votes: opt.votes,
        percentage: opt.percentage,
      })) || [],
      participants: [],
      timeline: [],
    }
    
    return {
      data: result,
      success: true,
    }
  },

  publishSondage: async (id: string): Promise<ApiResponse<Poll>> => {
    return sondagesApi.updateSondage(id, { status: 'active' })
  },

  stopSondage: async (id: string): Promise<ApiResponse<Poll>> => {
    return sondagesApi.updateSondage(id, { status: 'completed', endDate: new Date().toISOString().split('T')[0] })
  },

  // Close poll
  closePoll: async (id: string): Promise<ApiResponse<Poll>> => {
    const response = await apiClient.post<ApiResponse<Poll>>(`/api/v1/polls/${id}/close`)
    return response.data
  },
}

