import apiClient from "./client";
import { ApiResponse, PaginatedResponse } from "../../types/api";
import {
  Resource,
  CreateResourceRequest,
  UpdateResourceRequest,
  UpdateResourceStatusRequest,
} from "../../types/resource";
import { Session } from "../../types/session";

export const resourcesApi = {
  // Get all resources
  getResources: async (params?: {
    sessionId?: string;
    type?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Resource>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Resource>>>("/api/v1/resources", {
      params,
    });
    return response.data;
  },

  // Get resource by ID
  getResource: async (id: string): Promise<ApiResponse<Resource>> => {
    const response = await apiClient.get<ApiResponse<Resource>>(`/api/v1/resources/${id}`);
    return response.data;
  },

  // Create resource (with optional file upload)
  createResource: async (data: CreateResourceRequest & { file?: File }): Promise<ApiResponse<Resource>> => {
    const formData = new FormData();

    // Add all text fields
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("type", data.type);
    formData.append("link", data.link);
    formData.append("sessionId", data.sessionId); // Required field

    if (data.folderDescription) {
      formData.append("folderDescription", data.folderDescription);
    }

    if (data.addToSession !== undefined) {
      formData.append("addToSession", String(data.addToSession));
    }

    // Add file if provided
    if (data.file) {
      formData.append("file", data.file);
    }

    // Don't set Content-Type header - axios will set it automatically with the correct boundary for FormData
    // We need to delete the default 'application/json' header for FormData
    const response = await apiClient.post<ApiResponse<Resource>>("/api/v1/resources", formData, {
      headers: {
        "Content-Type": undefined, // Let axios set the correct Content-Type with boundary
      },
    });
    return response.data;
  },

  // Update resource
  updateResource: async (id: string, data: UpdateResourceRequest): Promise<ApiResponse<Resource>> => {
    const response = await apiClient.patch<ApiResponse<Resource>>(`/api/v1/resources/${id}`, data);
    return response.data;
  },

  // Delete resource
  deleteResource: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/resources/${id}`);
    return response.data;
  },

  // Get pending resources (Admin only)
  getPendingResources: async (): Promise<ApiResponse<Resource[]>> => {
    const response = await apiClient.get<ApiResponse<Resource[]>>("/api/v1/resources/pending");
    return response.data;
  },

  // Create resource directly as approved (Admin only)
  createResourceAsAdmin: async (data: CreateResourceRequest & { file?: File }): Promise<ApiResponse<Resource>> => {
    const formData = new FormData();

    // Add all text fields
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("type", data.type);
    formData.append("link", data.link);
    formData.append("sessionId", data.sessionId); // Required field

    if (data.folderDescription) {
      formData.append("folderDescription", data.folderDescription);
    }

    if (data.addToSession !== undefined) {
      formData.append("addToSession", String(data.addToSession));
    }

    // Add file if provided
    if (data.file) {
      formData.append("file", data.file);
    }

    const response = await apiClient.post<ApiResponse<Resource>>("/api/v1/resources/admin/create", formData, {
      headers: {
        "Content-Type": undefined,
      },
    });
    return response.data;
  },

  // Update resource status (Admin only)
  updateResourceStatus: async (id: string, data: UpdateResourceStatusRequest): Promise<ApiResponse<Resource>> => {
    const response = await apiClient.patch<ApiResponse<Resource>>(`/api/v1/resources/${id}/status`, data);
    return response.data;
  },

  // Get past session resources history
  getResourceSessionsHistory: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<{ session: Session; resources: Resource[] }>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<{ session: Session; resources: Resource[] }>>>(
      "/api/v1/resources/sessions/history",
      {
        params,
      },
    );
    return response.data;
  },
};
