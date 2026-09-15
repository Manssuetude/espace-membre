import apiClient from "./client";
import { ApiResponse } from "../../types/api";
import {
  AwardCategory,
  AwardSettings,
  AwardNominationInfo,
  NominateRequest,
  BuildShortlistRequest,
  VoteRequest,
  UpdateCategoryRequest,
  UpdateAwardSettingsRequest,
} from "../../types/award";

export const awardsApi = {
  getCategories: async (): Promise<ApiResponse<AwardCategory[]>> => {
    const response = await apiClient.get<ApiResponse<AwardCategory[]>>("/api/v1/awards/categories");
    return response.data;
  },

  getCategory: async (id: string): Promise<ApiResponse<AwardCategory>> => {
    const response = await apiClient.get<ApiResponse<AwardCategory>>(`/api/v1/awards/categories/${id}`);
    return response.data;
  },

  updateCategory: async (id: string, data: UpdateCategoryRequest): Promise<ApiResponse<AwardCategory>> => {
    const response = await apiClient.patch<ApiResponse<AwardCategory>>(`/api/v1/awards/categories/${id}`, data);
    return response.data;
  },

  nominate: async (categoryId: string, data: NominateRequest): Promise<ApiResponse<AwardCategory>> => {
    const response = await apiClient.post<ApiResponse<AwardCategory>>(
      `/api/v1/awards/categories/${categoryId}/nominations`,
      data,
    );
    return response.data;
  },

  removeNomination: async (categoryId: string, nomineeId: string): Promise<ApiResponse<AwardCategory>> => {
    const response = await apiClient.delete<ApiResponse<AwardCategory>>(
      `/api/v1/awards/categories/${categoryId}/nominations/${nomineeId}`,
    );
    return response.data;
  },

  amICurator: async (): Promise<ApiResponse<{ isCurator: boolean }>> => {
    const response = await apiClient.get<ApiResponse<{ isCurator: boolean }>>("/api/v1/awards/am-i-curator");
    return response.data;
  },

  getNominationStats: async (categoryId: string): Promise<ApiResponse<AwardNominationInfo[]>> => {
    const response = await apiClient.get<ApiResponse<AwardNominationInfo[]>>(
      `/api/v1/awards/categories/${categoryId}/nomination-stats`,
    );
    return response.data;
  },

  closeAllNominations: async (): Promise<ApiResponse<{ closedCount: number; closedCategoryIds: string[] }>> => {
    const response = await apiClient.post<ApiResponse<{ closedCount: number; closedCategoryIds: string[] }>>(
      "/api/v1/awards/close-all-nominations",
    );
    return response.data;
  },

  closeNominations: async (categoryId: string): Promise<ApiResponse<AwardCategory>> => {
    const response = await apiClient.post<ApiResponse<AwardCategory>>(
      `/api/v1/awards/categories/${categoryId}/close-nominations`,
    );
    return response.data;
  },

  reopenAllNominations: async (): Promise<ApiResponse<{ reopenedCount: number; reopenedCategoryIds: string[] }>> => {
    const response = await apiClient.post<ApiResponse<{ reopenedCount: number; reopenedCategoryIds: string[] }>>(
      "/api/v1/awards/reopen-all-nominations",
    );
    return response.data;
  },

  buildShortlist: async (categoryId: string, data: BuildShortlistRequest): Promise<ApiResponse<AwardCategory>> => {
    const response = await apiClient.post<ApiResponse<AwardCategory>>(
      `/api/v1/awards/categories/${categoryId}/shortlist`,
      data,
    );
    return response.data;
  },

  vote: async (categoryId: string, data: VoteRequest): Promise<ApiResponse<AwardCategory>> => {
    const response = await apiClient.post<ApiResponse<AwardCategory>>(
      `/api/v1/awards/categories/${categoryId}/vote`,
      data,
    );
    return response.data;
  },

  publishResults: async (categoryId: string): Promise<ApiResponse<AwardCategory>> => {
    const response = await apiClient.post<ApiResponse<AwardCategory>>(
      `/api/v1/awards/categories/${categoryId}/publish-results`,
    );
    return response.data;
  },

  publishAllResults: async (): Promise<ApiResponse<{ publishedCount: number; publishedCategoryIds: string[] }>> => {
    const response = await apiClient.post<ApiResponse<{ publishedCount: number; publishedCategoryIds: string[] }>>(
      "/api/v1/awards/publish-all-results",
    );
    return response.data;
  },

  resetAll: async (): Promise<
    ApiResponse<{ votesDeleted: number; candidatesDeleted: number; nominationsDeleted: number }>
  > => {
    const response =
      await apiClient.post<
        ApiResponse<{ votesDeleted: number; candidatesDeleted: number; nominationsDeleted: number }>
      >("/api/v1/awards/reset-all");
    return response.data;
  },

  getSettings: async (): Promise<ApiResponse<AwardSettings>> => {
    const response = await apiClient.get<ApiResponse<AwardSettings>>("/api/v1/awards/settings");
    return response.data;
  },

  updateSettings: async (data: UpdateAwardSettingsRequest): Promise<ApiResponse<AwardSettings>> => {
    const response = await apiClient.patch<ApiResponse<AwardSettings>>("/api/v1/awards/settings", data);
    return response.data;
  },
};
