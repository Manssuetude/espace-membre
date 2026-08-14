import apiClient from "./client";
import { ApiResponse } from "../../types/api";
import {
  Questionnaire,
  QuestionnaireListResponse,
  CreateQuestionnaireRequest,
  UpdateQuestionnaireRequest,
  QuestionnaireUnansweredListResponse,
  QuestionnaireMeResponse,
  QuestionnaireResponseWithAnswers,
  QuestionnaireAnswerPayload,
} from "../../types/questionnaire";

export const questionnairesApi = {
  // Admin: list questionnaires
  getQuestionnaires: async (params?: {
    status?: "all" | "draft" | "published" | "closed";
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<QuestionnaireListResponse>> => {
    const response = await apiClient.get("/api/v1/questionnaires", {
      params,
    });
    return response.data;
  },

  // Admin: get questionnaire details
  getQuestionnaire: async (id: string): Promise<ApiResponse<Questionnaire>> => {
    const response = await apiClient.get(`/api/v1/questionnaires/${id}`);
    return response.data;
  },

  // Admin: create questionnaire
  createQuestionnaire: async (data: CreateQuestionnaireRequest): Promise<ApiResponse<Questionnaire>> => {
    const response = await apiClient.post("/api/v1/questionnaires", data);
    return response.data;
  },

  // Admin: update questionnaire metadata
  updateQuestionnaire: async (id: string, data: UpdateQuestionnaireRequest): Promise<ApiResponse<Questionnaire>> => {
    const response = await apiClient.patch(`/api/v1/questionnaires/${id}`, data);
    return response.data;
  },

  // Admin: delete questionnaire
  deleteQuestionnaire: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/api/v1/questionnaires/${id}`);
    return response.data;
  },

  // Admin: list responses for a questionnaire (summary)
  getQuestionnaireResponses: async (
    id: string,
    params?: { page?: number; limit?: number },
  ): Promise<
    ApiResponse<{
      data: QuestionnaireResponseWithAnswers[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > => {
    const response = await apiClient.get(`/api/v1/questionnaires/${id}/responses`, {
      params,
    });
    return response.data;
  },

  // Admin: get detailed response for a specific user
  getQuestionnaireUserResponse: async (
    questionnaireId: string,
    userId: string,
  ): Promise<ApiResponse<QuestionnaireResponseWithAnswers>> => {
    const response = await apiClient.get(`/api/v1/questionnaires/${questionnaireId}/responses/${userId}`);
    return response.data;
  },

  // Member: list unanswered questionnaires for current user
  getMyUnansweredQuestionnaires: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<QuestionnaireUnansweredListResponse>> => {
    const response = await apiClient.get("/api/v1/questionnaires/me/unanswered", {
      params,
    });
    return response.data;
  },

  // Member: get questionnaire details + current user's response
  getQuestionnaireForMe: async (id: string): Promise<ApiResponse<QuestionnaireMeResponse>> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Questionnaire & { response?: QuestionnaireResponseWithAnswers | null };
      message?: string;
    }>(`/api/v1/questionnaires/${id}/me`);
    return {
      success: response.data.success,
      data: {
        questionnaire: response.data.data,
        response: response.data.data.response || null,
      },
      message: response.data.message,
    };
  },

  // Member: save or submit answers for current user
  saveMyAnswers: async (
    id: string,
    payload: {
      answers: QuestionnaireAnswerPayload[];
      submit: boolean;
    },
  ): Promise<ApiResponse<QuestionnaireResponseWithAnswers>> => {
    const response = await apiClient.post(`/api/v1/questionnaires/${id}/me/answers`, payload);
    return response.data;
  },

  // Member: get my questionnaire history
  getMyQuestionnaireHistory: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<
    ApiResponse<{
      data: QuestionnaireResponseWithAnswers[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > => {
    const response = await apiClient.get("/api/v1/questionnaires/me/history", {
      params,
    });
    return response.data;
  },
};
