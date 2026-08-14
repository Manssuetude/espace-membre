import apiClient from "./client";
import { ApiResponse, PaginatedResponse } from "../../types/api";
import { Location, CreateLocationRequest, UpdateLocationRequest } from "../../types/location";

export const locationsApi = {
  // Get all locations
  getLocations: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Location>>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Location>>>("/api/v1/locations", {
      params,
    });
    return response.data;
  },

  // Get location by ID
  getLocation: async (id: string): Promise<ApiResponse<Location>> => {
    const response = await apiClient.get<ApiResponse<Location>>(`/api/v1/locations/${id}`);
    return response.data;
  },

  // Create location
  createLocation: async (data: CreateLocationRequest): Promise<ApiResponse<Location>> => {
    const response = await apiClient.post<ApiResponse<Location>>("/api/v1/locations", data);
    return response.data;
  },

  // Update location
  updateLocation: async (id: string, data: UpdateLocationRequest): Promise<ApiResponse<Location>> => {
    const response = await apiClient.patch<ApiResponse<Location>>(`/api/v1/locations/${id}`, data);
    return response.data;
  },

  // Delete location
  deleteLocation: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/api/v1/locations/${id}`);
    return response.data;
  },
};
