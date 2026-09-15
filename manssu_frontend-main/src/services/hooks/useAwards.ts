import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { awardsApi } from "../api/awards";
import { queryKeys } from "../api/queryKeys";
import {
  NominateRequest,
  BuildShortlistRequest,
  VoteRequest,
  UpdateCategoryRequest,
  UpdateAwardSettingsRequest,
} from "../../types/award";
import { toast } from "sonner";

export const useAwardCategories = () => {
  return useQuery({
    queryKey: queryKeys.awardCategories,
    queryFn: () => awardsApi.getCategories(),
    select: (response) => response.data,
    refetchInterval: 60000,
  });
};

export const useAwardCategory = (id: string) => {
  return useQuery({
    queryKey: queryKeys.awardCategory(id),
    queryFn: () => awardsApi.getCategory(id),
    select: (response) => response.data,
    enabled: !!id,
  });
};

export const useIsAwardCurator = () => {
  return useQuery({
    queryKey: [...queryKeys.awardSettings, "am-i-curator"],
    queryFn: () => awardsApi.amICurator(),
    select: (response) => response.data.isCurator,
  });
};

export const useAwardNominationStats = (categoryId: string) => {
  return useQuery({
    queryKey: queryKeys.awardNominationStats(categoryId),
    queryFn: () => awardsApi.getNominationStats(categoryId),
    select: (response) => response.data,
    enabled: !!categoryId,
  });
};

export const useAwardSettings = () => {
  return useQuery({
    queryKey: queryKeys.awardSettings,
    queryFn: () => awardsApi.getSettings(),
    select: (response) => response.data,
  });
};

const invalidateCategory = (queryClient: ReturnType<typeof useQueryClient>, categoryId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.awardCategories });
  queryClient.invalidateQueries({ queryKey: queryKeys.awardCategory(categoryId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.awardNominationStats(categoryId) });
};

export const useUpdateAwardCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) => awardsApi.updateCategory(id, data),
    onSuccess: (response, variables) => {
      invalidateCategory(queryClient, variables.id);
      toast.success(response.message || "Catégorie mise à jour");
    },
  });
};

export const useNominate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: NominateRequest }) =>
      awardsApi.nominate(categoryId, data),
    onSuccess: (response, variables) => {
      invalidateCategory(queryClient, variables.categoryId);
      toast.success(response.message || "Proposition enregistrée");
    },
  });
};

export const useRemoveNomination = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, nomineeId }: { categoryId: string; nomineeId: string }) =>
      awardsApi.removeNomination(categoryId, nomineeId),
    onSuccess: (response, variables) => {
      invalidateCategory(queryClient, variables.categoryId);
      toast.success(response.message || "Proposition retirée");
    },
  });
};

export const useCloseAllNominations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => awardsApi.closeAllNominations(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.awardCategories });
      toast.success(response.message || "Nominations clôturées");
    },
  });
};

export const useCloseNominations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => awardsApi.closeNominations(categoryId),
    onSuccess: (response, categoryId) => {
      invalidateCategory(queryClient, categoryId);
      toast.success(response.message || "Nominations clôturées");
    },
  });
};

export const useReopenAllNominations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => awardsApi.reopenAllNominations(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.awardCategories });
      toast.success(response.message || "Nominations rouvertes");
    },
  });
};

export const useBuildShortlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: BuildShortlistRequest }) =>
      awardsApi.buildShortlist(categoryId, data),
    onSuccess: (response, variables) => {
      invalidateCategory(queryClient, variables.categoryId);
      toast.success(response.message || "Liste finale validée");
    },
  });
};

export const useVoteAward = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: VoteRequest }) => awardsApi.vote(categoryId, data),
    onSuccess: (response, variables) => {
      invalidateCategory(queryClient, variables.categoryId);
      toast.success(response.message || "Vote enregistré");
    },
  });
};

export const usePublishResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => awardsApi.publishResults(categoryId),
    onSuccess: (response, categoryId) => {
      invalidateCategory(queryClient, categoryId);
      toast.success(response.message || "Résultats publiés");
    },
  });
};

export const usePublishAllResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => awardsApi.publishAllResults(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.awardCategories });
      toast.success(response.message || "Résultats publiés");
    },
  });
};

export const useResetAllAwards = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => awardsApi.resetAll(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.awardCategories });
      queryClient.invalidateQueries({ queryKey: queryKeys.awardSettings });
      toast.success(response.message || "Processus réinitialisé");
    },
  });
};

export const useAwardSettingsUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAwardSettingsRequest) => awardsApi.updateSettings(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.awardSettings });
      queryClient.invalidateQueries({ queryKey: queryKeys.awardCategories });
      toast.success(response.message || "Fenêtre de vote mise à jour");
    },
  });
};
