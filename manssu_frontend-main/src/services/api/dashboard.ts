import apiClient from './client'
import { ApiResponse } from '../../types/api'
import { MemberDashboardData, AdminDashboardData } from '../../types/dashboard'

export const dashboardApi = {
  getMemberDashboard: async (): Promise<ApiResponse<MemberDashboardData>> => {
    const response = await apiClient.get<ApiResponse<MemberDashboardData>>('/api/v1/dashboard/member')
    return response.data
  },

  getAdminDashboard: async (): Promise<ApiResponse<AdminDashboardData>> => {
    const response = await apiClient.get<ApiResponse<AdminDashboardData>>('/api/v1/dashboard/admin')
    return response.data
  },
}

