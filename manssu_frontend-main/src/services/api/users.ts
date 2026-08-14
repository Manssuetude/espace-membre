import apiClient from "./client";
import { ApiResponse, PaginatedResponse } from "../../types/api";
import { User } from "../../types/auth";

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  avatar?: string;
  bio?: string;
}

export interface UserCreateRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role?: "member" | "admin" | "super_admin";
}

export interface UserUpdateAdminRequest extends UserUpdateRequest {
  email?: string;
  role?: "member" | "admin" | "super_admin" | "guest";
  status?: "active" | "suspended";
}

export interface GetUsersParams {
  status?: "all" | "active" | "suspended";
  search?: string;
  page?: number;
  limit?: number;
}

export const usersApi = {
  // Get current user profile (full)
  // GET /api/v1/users/me
  getCurrentUserProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>("/api/v1/users/me");
    return response.data;
  },

  // Update current user profile
  // PATCH /api/v1/users/me
  updateCurrentUserProfile: async (data: UserUpdateRequest): Promise<ApiResponse<User>> => {
    const response = await apiClient.patch<ApiResponse<User>>("/api/v1/users/me", data);
    return response.data;
  },

  // Get all users (admin only)
  // GET /api/v1/users
  getUsers: async (params?: GetUsersParams): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>("/api/v1/users", {
      params,
    });
    return response.data;
  },

  // Get user by ID (admin only)
  // GET /api/v1/users/{user_id}
  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>(`/api/v1/users/${userId}`);
    return response.data;
  },

  // Create user (admin only)
  // POST /api/v1/users
  createUser: async (data: UserCreateRequest): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>("/api/v1/users", data);
    return response.data;
  },

  // Update user (admin only)
  // PATCH /api/v1/users/{user_id}
  updateUser: async (userId: string, data: UserUpdateAdminRequest): Promise<ApiResponse<User>> => {
    const response = await apiClient.patch<ApiResponse<User>>(`/api/v1/users/${userId}`, data);
    return response.data;
  },

  // Suspend user (admin only)
  // POST /api/v1/users/{user_id}/suspend
  suspendUser: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>(`/api/v1/users/${userId}/suspend`);
    return response.data;
  },

  // Unsuspend user (admin only)
  // POST /api/v1/users/{user_id}/unsuspend
  unsuspendUser: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>(`/api/v1/users/${userId}/unsuspend`);
    return response.data;
  },

  // Delete user (admin only)
  // DELETE /api/v1/users/{user_id}
  deleteUser: async (userId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/users/${userId}`);
    return response.data;
  },
};
