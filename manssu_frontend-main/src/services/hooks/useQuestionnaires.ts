import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionnairesApi } from "../api/questionnaires";
import { queryKeys } from "../api/queryKeys";
import {
  CreateQuestionnaireRequest,
  Questionnaire,
  QuestionnaireListResponse,
  QuestionnaireMeResponse,
  QuestionnaireUnansweredListResponse,
  QuestionnaireResponseWithAnswers,
  QuestionnaireAnswerPayload,
  UpdateQuestionnaireRequest,
} from "../../types/questionnaire";
import { toast } from "sonner";
import { getErrorMessage } from "../../utils/errorUtils";

export const useQuestionnaires = (params?: {
  status?: "all" | "draft" | "published" | "closed";
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [...queryKeys.questionnaires, params],
    queryFn: () => questionnairesApi.getQuestionnaires(params),
    select: (response): QuestionnaireListResponse => response.data,
  });
};

export const useCreateQuestionnaire = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateQuestionnaireRequest) => questionnairesApi.createQuestionnaire(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires });
      toast.success(response.message || "Questionnaire créé avec succès");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Erreur lors de la création du questionnaire"));
    },
  });
};

export const useUpdateQuestionnaire = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionnaireRequest }) =>
      questionnairesApi.updateQuestionnaire(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires });
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaire(variables.id) });
      toast.success(response.message || "Questionnaire mis à jour avec succès");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Erreur lors de la mise à jour du questionnaire"));
    },
  });
};

export const useDeleteQuestionnaire = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionnairesApi.deleteQuestionnaire(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.questionnaires });
      toast.success(response.message || "Questionnaire supprimé avec succès");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Erreur lors de la suppression du questionnaire"));
    },
  });
};

export const useQuestionnaire = (id: string | undefined) => {
  return useQuery({
    queryKey: id ? queryKeys.questionnaire(id) : ["questionnaire", "undefined"],
    queryFn: () => questionnairesApi.getQuestionnaire(id as string),
    enabled: !!id,
    select: (response): Questionnaire => response.data,
  });
};

export const useMyUnansweredQuestionnaires = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...queryKeys.questionnaires, "me", "unanswered", params],
    queryFn: () => questionnairesApi.getMyUnansweredQuestionnaires(params || { page: 1, limit: 10 }),
    select: (response): QuestionnaireUnansweredListResponse => response.data,
  });
};

export const useQuestionnaireForMe = (id: string | undefined) => {
  return useQuery({
    queryKey: id ? [...queryKeys.questionnaires, "me", id] : ["questionnaire", "me", "undefined"],
    queryFn: () => questionnairesApi.getQuestionnaireForMe(id as string),
    enabled: !!id,
    select: (response): QuestionnaireMeResponse => response.data,
  });
};

export const useQuestionnaireResponses = (
  questionnaireId: string | undefined,
  params?: { page?: number; limit?: number },
) => {
  return useQuery({
    queryKey: questionnaireId
      ? [...queryKeys.questionnaires, questionnaireId, "responses", params]
      : ["questionnaire", "responses", "undefined"],
    queryFn: () => questionnairesApi.getQuestionnaireResponses(questionnaireId as string, params),
    enabled: !!questionnaireId,
    select: (response) => response.data,
  });
};

export const useQuestionnaireUserResponse = (questionnaireId: string | undefined, userId: string | undefined) => {
  return useQuery({
    queryKey:
      questionnaireId && userId
        ? [...queryKeys.questionnaires, "responses", questionnaireId, userId]
        : ["questionnaire", "responses", "undefined"],
    queryFn: () => questionnairesApi.getQuestionnaireUserResponse(questionnaireId as string, userId as string),
    enabled: !!questionnaireId && !!userId,
    select: (response): QuestionnaireResponseWithAnswers => response.data,
  });
};

export const useSaveMyQuestionnaireAnswers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionnaireId,
      data,
    }: {
      questionnaireId: string;
      data: { answers: QuestionnaireAnswerPayload[]; submit: boolean };
    }) => questionnairesApi.saveMyAnswers(questionnaireId, data),
    onSuccess: (response, variables) => {
      // Invalidate unanswered questionnaires list
      queryClient.invalidateQueries({ queryKey: [...queryKeys.questionnaires, "me", "unanswered"] });
      // Invalidate the specific questionnaire for me
      queryClient.invalidateQueries({ queryKey: [...queryKeys.questionnaires, "me", variables.questionnaireId] });
      toast.success(response.message || "Réponses enregistrées avec succès");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Erreur lors de l'enregistrement des réponses"));
    },
  });
};
