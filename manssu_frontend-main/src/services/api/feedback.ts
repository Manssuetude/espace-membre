import apiClient from './client'
import { ApiResponse, PaginatedResponse } from '../../types/api'
import { Feedback, CreateFeedbackRequest, UpdateFeedbackRequest } from '../../types/feedback'

export const feedbackApi = {
  // Get all feedbacks (Admin only)
  getFeedbacks: async (params?: {
    status?: string
    category?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<Feedback>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Feedback>>>('/api/v1/feedbacks', {
      params,
    })
    return response.data
  },

  // Get current user's feedbacks
  getMyFeedbacks: async (params?: {
    status?: string
    category?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<Feedback>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Feedback>>>('/api/v1/feedbacks/me', {
      params,
    })
    return response.data
  },

  // Get feedback by ID
  getFeedback: async (id: string): Promise<ApiResponse<Feedback>> => {
    const response = await apiClient.get<ApiResponse<Feedback>>(`/api/v1/feedbacks/${id}`)
    return response.data
  },

  // Create feedback
  createFeedback: async (data: CreateFeedbackRequest): Promise<ApiResponse<Feedback>> => {
    const response = await apiClient.post<ApiResponse<Feedback>>('/api/v1/feedbacks', data)
    return response.data
  },

  // Update feedback status
  updateFeedback: async (id: string, data: UpdateFeedbackRequest): Promise<ApiResponse<Feedback>> => {
    const response = await apiClient.patch<ApiResponse<Feedback>>(`/api/v1/feedbacks/${id}`, data)
    return response.data
  },

  // Delete feedback
  deleteFeedback: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/feedbacks/${id}`)
    return response.data
  },
}

