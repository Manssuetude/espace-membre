import apiClient from "./client";
import { ApiResponse, PaginatedResponse } from "../../types/api";
import {
  Session,
  CreateSessionRequest,
  UpdateSessionRequest,
  CreateGroupRequest,
  WorkGroup,
} from "../../types/session";

export const sessionsApi = {
  // Get all sessions
  getSessions: async (params?: {
    status?: string;
    theme?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Session>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Session>>>("/api/v1/sessions", {
      params,
    });
    return response.data;
  },

  // Get session by ID
  getSession: async (id: string): Promise<ApiResponse<Session>> => {
    const response = await apiClient.get<ApiResponse<Session>>(`/api/v1/sessions/${id}`);
    return response.data;
  },

  // Create session
  createSession: async (data: CreateSessionRequest): Promise<ApiResponse<Session>> => {
    const response = await apiClient.post<ApiResponse<Session>>("/api/v1/sessions", data);
    return response.data;
  },

  // Update session
  updateSession: async (id: string, data: UpdateSessionRequest): Promise<ApiResponse<Session>> => {
    const response = await apiClient.patch<ApiResponse<Session>>(`/api/v1/sessions/${id}`, data);
    return response.data;
  },

  // Delete session
  deleteSession: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/sessions/${id}`);
    return response.data;
  },

  // Register for session
  registerForSession: async (sessionId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/api/v1/sessions/${sessionId}/register`);
    return response.data;
  },

  // Unregister from session
  unregisterFromSession: async (sessionId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/sessions/${sessionId}/register`);
    return response.data;
  },

  // Create work groups
  createWorkGroups: async (sessionId: string, data: CreateGroupRequest): Promise<ApiResponse<WorkGroup[]>> => {
    const response = await apiClient.post<ApiResponse<WorkGroup[]>>(`/api/v1/sessions/${sessionId}/groups`, data);
    return response.data;
  },

  // Get work groups
  getWorkGroups: async (sessionId: string): Promise<ApiResponse<WorkGroup[]>> => {
    const response = await apiClient.get<ApiResponse<WorkGroup[]>>(`/api/v1/sessions/${sessionId}/groups`);
    return response.data;
  },

  // Rate session
  rateSession: async (
    sessionId: string,
    data: { rating: number; comment?: string },
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/api/v1/sessions/${sessionId}/rate`, data);
    return response.data;
  },

  // Mark attendance
  markAttendance: async (
    sessionId: string,
    userId: string,
    data: { attended: boolean },
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/api/v1/sessions/${sessionId}/attendance/${userId}`,
      data,
    );
    return response.data;
  },

  // Remind ratings
  remindRatings: async (sessionId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/api/v1/sessions/${sessionId}/remind-ratings`,
    );
    return response.data;
  },
};
