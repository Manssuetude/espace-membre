import { Feedback } from './feedback'

export interface PollHistoryItem {
  pollId: string
  pollTitle: string
  pollQuestion: string
  votedAt: string
  allChoices: Array<{
    optionId: string
    optionLabel: string
  }>
  userChoices: Array<{
    optionId: string
    optionLabel: string
  }>
}

export interface SessionAttendanceHistoryItem {
  sessionId: string
  sessionTitle: string
  sessionDate: string
  startTime: string
  endTime: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  registeredAt: string
  attended: boolean
  rating: number | null
  comment: string | null
}

export interface Member {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  role: 'member' | 'admin' | 'super admin' | 'guest'
  avatar?: string
  phone?: string
  studentNumber?: string
  university?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  bio?: string
  status: 'active' | 'inactive' | 'suspended'
  memberSince: string
  sessionsCount?: number
  feedbacksCount?: number
  themesCount?: number
  createdAt?: string
  updatedAt?: string
  lastLogin?: string | null
  pollHistory?: PollHistoryItem[]
  feedbacksHistory?: Feedback[]
  sessionAttendanceHistory?: SessionAttendanceHistoryItem[]
}

export interface CreateMemberRequest {
  firstName: string
  lastName: string
  email: string
  role: 'member' | 'admin' | 'super admin'
}

export interface UpdateMemberRequest {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  bio?: string
  studentNumber?: string
  university?: string
  role?: 'member' | 'admin' | 'super_admin' | 'guest'
  status?: 'active' | 'suspended'
}

export interface MemberStats {
  totalMembers: number
  activeMembers: number
  administrators: number
  inactive: number
}

export interface MembersResponse {
  data: Member[]
  total: number
  page: number
  limit: number
  totalPages: number
  stats: MemberStats
}

