import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { awardsApi } from "../api/awards";
import { queryKeys } from "../api/queryKeys";
import {
  NominateRequest,
  BuildShortlistRequest,
  VoteRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  UpdateAwardSettingsRequest,
  SaveCeremonyPreparationRequest,
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

export const useIsAwardManager = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.awardIsManager,
    queryFn: () => awardsApi.amIAwardManager(),
    select: (response) => response.data.isManager,
    enabled: options?.enabled,
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

export const useAwardParticipation = () => {
  return useQuery({
    queryKey: queryKeys.awardParticipation,
    queryFn: () => awardsApi.getParticipation(),
    select: (response) => response.data,
    refetchInterval: 60000,
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

export const useCreateAwardCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => awardsApi.createCategory(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.awardCategories });
      toast.success(response.message || "Catégorie créée");
    },
  });
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

export const useDeleteAwardCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => awardsApi.deleteCategory(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.awardCategories });
      toast.success(response.message || "Catégorie supprimée");
    },
  });
};

export const useDistributeReveals = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => awardsApi.distributeReveals(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.awardCategories });
      toast.success(response.message || "Révélations réparties");
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

export const useCeremonyPreparation = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.awardCeremonyPreparation,
    queryFn: () => awardsApi.getCeremonyPreparation(),
    select: (response) => response.data,
    enabled,
  });
};

export const useSaveCeremonyPreparation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveCeremonyPreparationRequest) => awardsApi.saveCeremonyPreparation(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.awardCeremonyPreparation });
      toast.success(response.message || "Préparation enregistrée");
    },
  });
};

export const useCeremony = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.awardCeremony,
    queryFn: () => awardsApi.getCeremony(),
    select: (response) => response.data,
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
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
      toast.success(response.message || "Édition réinitialisée");
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
      toast.success(response.message || "Calendrier mis à jour");
    },
  });
};
