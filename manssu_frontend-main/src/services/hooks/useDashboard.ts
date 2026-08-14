import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard'
import { queryKeys } from '../api/queryKeys'

export const useMemberDashboard = () => {
  return useQuery({
    queryKey: queryKeys.memberDashboard,
    queryFn: () => dashboardApi.getMemberDashboard(),
    select: (response) => response.data,
  })
}

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: () => dashboardApi.getAdminDashboard(),
    select: (response) => response.data,
  })
}

