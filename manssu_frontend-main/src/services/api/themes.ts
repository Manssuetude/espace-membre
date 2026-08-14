import apiClient from './client'
import { ApiResponse, PaginatedResponse } from '../../types/api'
import { Theme, CreateThemeRequest, UpdateThemeRequest, ThemeWindowStatus, ThemeWindow, OpenWindowRequest, ExtendWindowRequest } from '../../types/theme'

export const themesApi = {
  // Window Management
  getWindowStatus: async (): Promise<ApiResponse<ThemeWindowStatus>> => {
    const response = await apiClient.get<ApiResponse<ThemeWindowStatus>>('/api/v1/themes/window/status')
    return response.data
  },

  openWindow: async (data: OpenWindowRequest): Promise<ApiResponse<ThemeWindow>> => {
    const response = await apiClient.post<ApiResponse<ThemeWindow>>('/api/v1/themes/window/open', data)
    return response.data
  },

  extendWindow: async (windowId: string, data: ExtendWindowRequest): Promise<ApiResponse<ThemeWindow>> => {
    const response = await apiClient.patch<ApiResponse<ThemeWindow>>(`/api/v1/themes/window/${windowId}/extend`, data)
    return response.data
  },

  closeWindow: async (windowId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/api/v1/themes/window/${windowId}/close`)
    return response.data
  },

  // Theme CRUD
  getThemes: async (params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<Theme>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Theme>>>('/api/v1/themes', {
      params,
    })
    return response.data
  },

  getPendingThemes: async (): Promise<ApiResponse<Theme[]>> => {
    const response = await apiClient.get<ApiResponse<Theme[]>>('/api/v1/themes/pending')
    return response.data
  },

  getLinkedThemes: async (): Promise<ApiResponse<Theme[]>> => {
    const response = await apiClient.get<ApiResponse<Theme[]>>('/api/v1/themes/linked')
    return response.data
  },

  getUnlinkedThemes: async (): Promise<ApiResponse<Theme[]>> => {
    const response = await apiClient.get<ApiResponse<Theme[]>>('/api/v1/themes/unlinked')
    return response.data
  },

  getTheme: async (id: string): Promise<ApiResponse<Theme>> => {
    const response = await apiClient.get<ApiResponse<Theme>>(`/api/v1/themes/${id}`)
    return response.data
  },

  createTheme: async (data: CreateThemeRequest): Promise<ApiResponse<Theme>> => {
    const response = await apiClient.post<ApiResponse<Theme>>('/api/v1/themes', data)
    return response.data
  },

  createThemeAdmin: async (data: CreateThemeRequest): Promise<ApiResponse<Theme>> => {
    const response = await apiClient.post<ApiResponse<Theme>>('/api/v1/themes/admin/create', data)
    return response.data
  },

  updateTheme: async (id: string, data: UpdateThemeRequest): Promise<ApiResponse<Theme>> => {
    const response = await apiClient.patch<ApiResponse<Theme>>(`/api/v1/themes/${id}`, data)
    return response.data
  },

  deleteTheme: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/themes/${id}`)
    return response.data
  },

  // Create poll from themes window
  createPollFromThemes: async (data: {
    themeIds: string[]
    sessionId: string
  }): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/v1/themes/window/create-poll', data)
    return response.data
  },
}

