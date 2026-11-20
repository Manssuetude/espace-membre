import apiClient from "./client";
import { ApiResponse } from "../../types/api";
import {
  AwardCategory,
  AwardSettings,
  AwardParticipation,
  AwardNominationInfo,
  NominateRequest,
  BuildShortlistRequest,
  VoteRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  UpdateAwardSettingsRequest,
  PreparationCategoryItem,
  SaveCeremonyPreparationRequest,
  CeremonyCategoryItem,
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

  createCategory: async (data: CreateCategoryRequest): Promise<ApiResponse<AwardCategory>> => {
    const response = await apiClient.post<ApiResponse<AwardCategory>>("/api/v1/awards/categories", data);
    return response.data;
  },

  updateCategory: async (id: string, data: UpdateCategoryRequest): Promise<ApiResponse<AwardCategory>> => {
    const response = await apiClient.patch<ApiResponse<AwardCategory>>(`/api/v1/awards/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(`/api/v1/awards/categories/${id}`);
    return response.data;
  },

  distributeReveals: async (): Promise<ApiResponse<{ updatedCount: number }>> => {
    const response = await apiClient.post<ApiResponse<{ updatedCount: number }>>(
      "/api/v1/awards/categories/distribute-reveals",
    );
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

  amIAwardManager: async (): Promise<ApiResponse<{ isManager: boolean }>> => {
    const response = await apiClient.get<ApiResponse<{ isManager: boolean }>>("/api/v1/awards/am-i-award-manager");
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

  getCeremonyPreparation: async (): Promise<ApiResponse<PreparationCategoryItem[]>> => {
    const response = await apiClient.get<ApiResponse<PreparationCategoryItem[]>>("/api/v1/awards/ceremony/preparation");
    return response.data;
  },

  saveCeremonyPreparation: async (data: SaveCeremonyPreparationRequest): Promise<ApiResponse<{ saved: boolean }>> => {
    const response = await apiClient.put<ApiResponse<{ saved: boolean }>>("/api/v1/awards/ceremony/preparation", data);
    return response.data;
  },

  getCeremony: async (): Promise<ApiResponse<CeremonyCategoryItem[]>> => {
    const response = await apiClient.get<ApiResponse<CeremonyCategoryItem[]>>("/api/v1/awards/ceremony");
    return response.data;
  },

  publishAllResults: async (): Promise<
    ApiResponse<{ publishedCount: number; badgesAwarded: number; publishedCategoryIds: string[] }>
  > => {
    const response = await apiClient.post<
      ApiResponse<{ publishedCount: number; badgesAwarded: number; publishedCategoryIds: string[] }>
    >("/api/v1/awards/publish-all-results");
    return response.data;
  },

  resetAll: async (): Promise<
    ApiResponse<{ votesDeleted: number; winnersDeleted: number; candidatesDeleted: number; nominationsDeleted: number }>
  > => {
    const response = await apiClient.post<
      ApiResponse<{
        votesDeleted: number;
        winnersDeleted: number;
        candidatesDeleted: number;
        nominationsDeleted: number;
      }>
    >("/api/v1/awards/reset-all");
    return response.data;
  },

  getParticipation: async (): Promise<ApiResponse<AwardParticipation>> => {
    const response = await apiClient.get<ApiResponse<AwardParticipation>>("/api/v1/awards/participation");
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
