// PERMANENT module — see src/types/userAward.ts
import apiClient from "./client";
import { ApiResponse } from "../../types/api";
import { UserAwardWin } from "../../types/userAward";

export const userAwardsApi = {
  getMyAwardWins: async (): Promise<ApiResponse<UserAwardWin[]>> => {
    const response = await apiClient.get<ApiResponse<UserAwardWin[]>>("/api/v1/award-wins/me");
    return response.data;
  },

  getUserAwardWins: async (userId: string): Promise<ApiResponse<UserAwardWin[]>> => {
    const response = await apiClient.get<ApiResponse<UserAwardWin[]>>(`/api/v1/award-wins/user/${userId}`);
    return response.data;
  },

  getCommissionAwardWins: async (commissionId: string): Promise<ApiResponse<UserAwardWin[]>> => {
    const response = await apiClient.get<ApiResponse<UserAwardWin[]>>(`/api/v1/award-wins/commission/${commissionId}`);
    return response.data;
  },
};
