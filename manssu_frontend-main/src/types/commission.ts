// User Summary for commissions
export interface CommissionUserSummary {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl: string | null
}

// Commission Member
export interface CommissionMember {
  id: string
  user: CommissionUserSummary
  joinedAt: string
}

// Commission Application
export interface CommissionApplication {
  id: string
  user: CommissionUserSummary
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt: string | null
  reviewedBy: CommissionUserSummary | null
  rejectionReason: string | null
}

// My Application (for user's own applications list)
export interface MyCommissionApplication {
  id: string
  commissionId: string
  commissionName: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewedAt: string | null
  rejectionReason: string | null
}

// My Commission (for user's memberships)
export interface MyCommission {
  id: string
  name: string
  description: string | null
  status: 'active' | 'archived'
  isLeader: boolean
  memberCount: number
  joinedAt: string
}

// Commission (list view)
export interface Commission {
  id: string
  name: string
  description: string | null
  status: 'active' | 'archived'
  maxMembers: number | null
  memberCount: number
  pendingApplicationsCount: number
  leader: CommissionUserSummary | null
  createdAt: string
  updatedAt: string
}

// Commission Detail (extends Commission)
export interface CommissionDetail extends Commission {
  members: CommissionMember[]
  applications: CommissionApplication[] | null
  isMember: boolean
  isLeader: boolean
  myPendingApplication: CommissionApplication | null
}

// Create Commission Request
export interface CreateCommissionRequest {
  name: string
  description?: string
  maxMembers?: number | null
}

// Update Commission Request
export interface UpdateCommissionRequest {
  name?: string
  description?: string
  maxMembers?: number | null
  status?: 'active' | 'archived'
}

// Apply to Commission Request
export interface ApplyToCommissionRequest {
  reason: string
}

// Assign Leader Request
export interface AssignLeaderRequest {
  userId: string
}

// Reject Application Request
export interface RejectApplicationRequest {
  reason?: string
}

// Add Member Request (direct add, bypassing application)
export interface AddMemberRequest {
  userId: string
}

// Paginated Response
export interface CommissionListResponse {
  data: Commission[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CommissionApplicationListResponse {
  data: CommissionApplication[]
  total: number
  page: number
  limit: number
  totalPages: number
}
