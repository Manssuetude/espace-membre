export interface User {
  id: string
  email: string
  name?: string // Computed from firstName + lastName
  firstName: string
  lastName: string
  role: 'member' | 'admin' | 'super_admin' | 'guest'
  avatar?: string | null
  phone?: string | null
  address?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string | null
  bio?: string | null
  status?: 'active' | 'suspended'
  memberSince?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  lastLogin?: string | null
}

export interface LoginRequest {
  email: string
}

export interface VerifyOTPRequest {
  email: string
  otp: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}

export interface SendOTPResponse {
  message: string
  expiresIn: number
}

