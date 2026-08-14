import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackApi } from "../api/feedback";
import { queryKeys } from "../api/queryKeys";
import { CreateFeedbackRequest, UpdateFeedbackRequest } from "../../types/feedback";
import { toast } from "sonner";

export const useFeedbacks = (params?: { status?: string; category?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...queryKeys.feedbacks, params],
    queryFn: () => feedbackApi.getFeedbacks(params),
    select: (response) => response.data,
  });
};

export const useFeedback = (id: string) => {
  return useQuery({
    queryKey: queryKeys.feedback(id),
    queryFn: () => feedbackApi.getFeedback(id),
    select: (response) => response.data,
    enabled: !!id,
  });
};

export const useCreateFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFeedbackRequest) => feedbackApi.createFeedback(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks });
      // Also invalidate my feedbacks if not anonymous
      if (!response.data.anonymous) {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.feedbacks, "me"] });
      }
      toast.success(response.message || "Feedback envoyé avec succès");
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  });
};

export const useUpdateFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeedbackRequest }) => feedbackApi.updateFeedback(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks });
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback(variables.id) });
      toast.success(response.message || "Statut du feedback mis à jour avec succès");
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  });
};

export const useDeleteFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => feedbackApi.deleteFeedback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedbacks });
      toast.success("Feedback supprimé avec succès");
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  });
};

export const useMyFeedbacks = (params?: { status?: string; category?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...queryKeys.feedbacks, "me", params],
    queryFn: () => feedbackApi.getMyFeedbacks(params),
    select: (response) => response.data,
  });
};
