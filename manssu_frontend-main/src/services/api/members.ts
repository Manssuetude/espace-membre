import { ApiResponse } from '../../types/api'
import { Member, UpdateMemberRequest, CreateMemberRequest, MembersResponse, MemberStats } from '../../types/member'
import { User } from '../../types/auth'
import { usersApi } from './users'

// Helper function to convert User to Member
const userToMember = (user: any): Member => {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name || `${user.firstName} ${user.lastName}`.trim(),
    role: user.role === 'super_admin' ? 'super admin' : user.role,
    avatar: user.avatar || undefined,
    phone: user.phone || undefined,
    address: user.address || undefined,
    city: user.city || undefined,
    postalCode: user.postalCode || undefined,
    country: user.country || undefined,
    bio: user.bio || undefined,
    status: user.status || 'active',
    memberSince: user.memberSince || user.createdAt || new Date().toISOString(),
    createdAt: user.createdAt || undefined,
    updatedAt: user.updatedAt || undefined,
    lastLogin: user.lastLogin || undefined,
    sessionsCount: user.sessionsCount,
    feedbacksCount: user.feedbacksCount,
    themesCount: user.themesCount,
    pollHistory: user.pollHistory,
    feedbacksHistory: user.feedbacksHistory,
    sessionAttendanceHistory: user.sessionAttendanceHistory,
    studentNumber: undefined,
    university: undefined,
  }
}

export const membersApi = {
  createMember: async (data: CreateMemberRequest): Promise<ApiResponse<Member>> => {
    const response = await usersApi.createUser({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role === 'super admin' ? 'super_admin' : (data.role === 'admin' ? 'admin' : 'member'),
    })
    
    return {
      data: userToMember(response.data),
      success: response.success,
      message: response.message || 'Membre créé avec succès',
    }
  },

  getMembers: async (params?: {
    search?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<MembersResponse>> => {
    // Fetch filtered users
    const response = await usersApi.getUsers({
      search: params?.search,
      status: params?.status === 'all' ? undefined : (params?.status as 'active' | 'suspended' | undefined),
      page: params?.page,
      limit: params?.limit,
    })
    
    // Fetch all users (without filters) to calculate stats
    // Use maximum limit (100) and fetch all pages if needed
    const allUsers: User[] = []
    let currentPage = 1
    let hasMore = true
    const maxLimit = 100 // Maximum allowed by API
    
    while (hasMore) {
      const pageResponse = await usersApi.getUsers({
        page: currentPage,
        limit: maxLimit,
      })
      
      allUsers.push(...pageResponse.data.data)
      
      // Check if there are more pages
      hasMore = currentPage < pageResponse.data.totalPages
      currentPage++
      
      // Safety limit to prevent infinite loops
      if (currentPage > 100) break
    }
    
    const stats: MemberStats = {
      totalMembers: allUsers.length,
      activeMembers: allUsers.filter((u: User) => u.status === 'active').length,
      administrators: allUsers.filter((u: User) => u.role === 'admin' || u.role === 'super_admin').length,
      inactive: allUsers.filter((u: User) => u.status === 'suspended' || !u.status).length,
    }
    
    return {
      data: {
        data: response.data.data.map(userToMember),
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages,
        stats,
      },
      success: response.success,
    }
  },

  getMember: async (id: string): Promise<ApiResponse<Member>> => {
    const response = await usersApi.getUserById(id)
    
    return {
      data: userToMember(response.data),
      success: response.success,
    }
  },

  updateMember: async (id: string, data: UpdateMemberRequest): Promise<ApiResponse<Member>> => {
    const response = await usersApi.updateUser(id, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      country: data.country,
      bio: data.bio,
      role: data.role,
      status: data.status,
    })
    
    return {
      data: userToMember(response.data),
      success: response.success,
      message: response.message || 'Profil mis à jour avec succès',
    }
  },

  suspendMember: async (id: string): Promise<ApiResponse<Member>> => {
    const response = await usersApi.suspendUser(id)
    
    return {
      data: userToMember(response.data),
      success: response.success,
      message: response.message || 'Membre suspendu avec succès',
    }
  },

  unsuspendMember: async (id: string): Promise<ApiResponse<Member>> => {
    const response = await usersApi.unsuspendUser(id)
    
    return {
      data: userToMember(response.data),
      success: response.success,
      message: response.message || 'Membre réactivé avec succès',
    }
  },

  deleteMember: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await usersApi.deleteUser(id)
    
    return {
      data: { message: response.message || 'Membre supprimé avec succès' },
      success: response.success,
    }
  },
}

