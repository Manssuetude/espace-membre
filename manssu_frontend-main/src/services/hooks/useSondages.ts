import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sondagesApi } from "../api/sondages";
import { queryKeys } from "../api/queryKeys";
import { CreatePollRequest, UpdatePollRequest, VoteRequest } from "../../types/sondage";
import { toast } from "sonner";

export const useSondages = (params?: { status?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...queryKeys.sondages, params],
    queryFn: () => sondagesApi.getSondages(params),
    select: (response) => response.data,
  });
};

export const useSondage = (id: string) => {
  return useQuery({
    queryKey: queryKeys.sondage(id),
    queryFn: () => sondagesApi.getSondage(id),
    select: (response) => response.data,
    enabled: !!id,
  });
};

export const useSondageResults = (id: string) => {
  return useQuery({
    queryKey: queryKeys.sondageResults(id),
    queryFn: () => sondagesApi.getSondageResults(id),
    select: (response) => response.data,
    enabled: !!id,
  });
};

export const useCreateSondage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePollRequest) => sondagesApi.createSondage(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sondages });
      toast.success(response.message || "Sondage créé avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la création du sondage");
    },
  });
};

export const useUpdateSondage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePollRequest }) => sondagesApi.updateSondage(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sondages });
      queryClient.invalidateQueries({ queryKey: queryKeys.sondage(variables.id) });
      toast.success(response.message || "Sondage mis à jour avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du sondage");
    },
  });
};

export const useRelaunchMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sondagesApi.relaunchMembers(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sondages });
      queryClient.invalidateQueries({ queryKey: queryKeys.sondage(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sondageResults(id) });
      toast.success(response.message || "Membres relancés avec succès");
    },
    onError: () => {
      toast.error("Erreur lors du relancement des membres");
    },
  });
};

export const useDeleteSondage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sondagesApi.deleteSondage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sondages });
      toast.success("Sondage supprimé avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du sondage");
    },
  });
};

export const useVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pollId, data }: { pollId: string; data: VoteRequest }) => sondagesApi.vote(pollId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sondages });
      queryClient.invalidateQueries({ queryKey: queryKeys.sondage(variables.pollId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sondageResults(variables.pollId) });
      toast.success(response.message || "Vote enregistré avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement du vote");
    },
  });
};

export const usePublishSondage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sondagesApi.publishSondage(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sondages });
      queryClient.invalidateQueries({ queryKey: queryKeys.sondage(id) });
      toast.success(response.message || "Sondage publié avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la publication du sondage");
    },
  });
};

export const useStopSondage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sondagesApi.stopSondage(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sondages });
      queryClient.invalidateQueries({ queryKey: queryKeys.sondage(id) });
      toast.success(response.message || "Sondage arrêté avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de l'arrêt du sondage");
    },
  });
};

export const useClosePoll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sondagesApi.closePoll(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sondages });
      queryClient.invalidateQueries({ queryKey: queryKeys.sondage(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sondageResults(id) });
      toast.success(response.message || "Sondage fermé avec succès");
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  });
};
