import apiClient from './client'
import { ApiResponse, SendOTPResponse, AuthResponse, LoginRequest, VerifyOTPRequest } from '../../types/api'
import { User } from '../../types/auth'

export const authApi = {
  // Send OTP to email
  // POST /api/v1/auth/send-otp
  sendOTP: async (data: LoginRequest): Promise<ApiResponse<SendOTPResponse>> => {
    const response = await apiClient.post<ApiResponse<SendOTPResponse>>('/api/v1/auth/send-otp', {
      email: data.email,
    })
    return response.data
  },

  // Verify OTP and login
  // POST /api/v1/auth/verify-otp
  verifyOTP: async (data: VerifyOTPRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/verify-otp', {
      email: data.email,
      otp: data.otp,
    })
    return response.data
  },

  // Logout
  // POST /api/v1/auth/logout
  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/api/v1/auth/logout')
    return response.data
  },

  // Get current user (basic info)
  // GET /api/v1/auth/me
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>('/api/v1/auth/me')
    return response.data
  },

  // Send OTP for invite (Public)
  // POST /api/v1/auth/send-otp-invite
  sendOTPForInvite: async (code: string): Promise<ApiResponse<SendOTPResponse>> => {
    const response = await apiClient.post<ApiResponse<SendOTPResponse>>('/api/v1/auth/send-otp-invite', {
      code,
    })
    return response.data
  },

  // Register guest (Public)
  // POST /api/v1/auth/register-guest
  registerGuest: async (data: {
    code: string
    firstName: string
    lastName: string
    otp: string
  }): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/register-guest', data)
    return response.data
  },
}

