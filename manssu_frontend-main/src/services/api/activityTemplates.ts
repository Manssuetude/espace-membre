import apiClient from "./client";
import { ApiResponse, PaginatedResponse } from "../../types/api";
import { ActivityTemplate, CreateActivityTemplateRequest, UpdateActivityTemplateRequest } from "../../types/format";

export const activityTemplatesApi = {
  // Get all activity templates
  getActivityTemplates: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<ActivityTemplate>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<ActivityTemplate>>>(
      "/api/v1/activity-templates",
      {
        params,
      },
    );
    return response.data;
  },

  // Get activity template by ID
  getActivityTemplate: async (id: string): Promise<ApiResponse<ActivityTemplate>> => {
    const response = await apiClient.get<ApiResponse<ActivityTemplate>>(`/api/v1/activity-templates/${id}`);
    return response.data;
  },

  // Create activity template
  createActivityTemplate: async (data: CreateActivityTemplateRequest): Promise<ApiResponse<ActivityTemplate>> => {
    const response = await apiClient.post<ApiResponse<ActivityTemplate>>("/api/v1/activity-templates", data);
    return response.data;
  },

  // Update activity template
  updateActivityTemplate: async (
    id: string,
    data: UpdateActivityTemplateRequest,
  ): Promise<ApiResponse<ActivityTemplate>> => {
    const response = await apiClient.patch<ApiResponse<ActivityTemplate>>(`/api/v1/activity-templates/${id}`, data);
    return response.data;
  },

  // Delete activity template
  deleteActivityTemplate: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/activity-templates/${id}`);
    return response.data;
  },
};
