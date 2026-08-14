import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { invitationsApi } from "../api/invitations";
import { queryKeys } from "../api/queryKeys";
import { ApiResponse } from "../../types/api";
import {
  Invite,
  CreateInviteRequest,
  ValidateInviteResponse,
  AddSessionToGuestRequest,
  InvitationRequest,
  CreateInvitationRequestRequest,
  ReviewInvitationRequestRequest,
} from "../../types/invitation";
import { toast } from "sonner";
import { getErrorMessage } from "../../utils/errorUtils";

// Get invitations list
export const useInvites = (
  params?: {
    status?: "pending" | "used" | "expired" | "cancelled";
    session_id?: string;
    email?: string;
  },
  options?: Partial<Omit<UseQueryOptions<ApiResponse<Invite[]>, Error, Invite[]>, "queryKey" | "queryFn" | "select">>,
) => {
  return useQuery({
    queryKey: [...queryKeys.invites, params],
    queryFn: () => invitationsApi.getInvites(params),
    select: (response) => response.data,
    ...options,
  });
};

// Get single invitation by ID
export const useInvite = (
  id: string,
  options?: Partial<Omit<UseQueryOptions<ApiResponse<Invite>, Error, Invite>, "queryKey" | "queryFn" | "select">>,
) => {
  return useQuery({
    queryKey: queryKeys.invite(id),
    queryFn: () => invitationsApi.getInviteById(id),
    select: (response) => response.data,
    enabled: !!id,
    ...options,
  });
};

// Validate invite code (Public)
export const useValidateInvite = (
  code: string,
  options?: Partial<
    Omit<UseQueryOptions<ValidateInviteResponse, Error, ValidateInviteResponse>, "queryKey" | "queryFn">
  >,
) => {
  return useQuery({
    queryKey: queryKeys.validateInvite(code),
    queryFn: () => invitationsApi.validateInviteCode(code),
    enabled: !!code,
    ...options,
  });
};

// Create invitation mutation
export const useCreateInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInviteRequest) => invitationsApi.createInvite(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites });
      toast.success(response.message || "Invitation créée et envoyée avec succès");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Erreur lors de la création de l'invitation"));
    },
  });
};

// Cancel invitation mutation
export const useCancelInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invitationsApi.cancelInvite(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites });
      toast.success(response.message || "Invitation annulée avec succès");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Erreur lors de l'annulation de l'invitation"));
    },
  });
};

// Add session to guest mutation
export const useAddSessionToGuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guestId, data }: { guestId: string; data: AddSessionToGuestRequest }) =>
      invitationsApi.addSessionToGuest(guestId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites });
      toast.success(response.message || "Session ajoutée avec succès");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Erreur lors de l'ajout de la session"));
    },
  });
};

// Get invitation requests list (Admin only)
export const useInvitationRequests = (
  params?: {
    status?: "pending" | "approved" | "rejected";
    session_id?: string;
  },
  options?: Partial<
    Omit<
      UseQueryOptions<ApiResponse<InvitationRequest[]>, Error, InvitationRequest[]>,
      "queryKey" | "queryFn" | "select"
    >
  >,
) => {
  return useQuery({
    queryKey: [...queryKeys.invitationRequests, params],
    queryFn: () => invitationsApi.getInvitationRequests(params),
    select: (response) => response.data,
    ...options,
  });
};

// Get single invitation request by ID (Admin only)
export const useInvitationRequest = (
  id: string,
  options?: Partial<
    Omit<UseQueryOptions<ApiResponse<InvitationRequest>, Error, InvitationRequest>, "queryKey" | "queryFn" | "select">
  >,
) => {
  return useQuery({
    queryKey: queryKeys.invitationRequest(id),
    queryFn: () => invitationsApi.getInvitationRequestById(id),
    select: (response) => response.data,
    enabled: !!id,
    ...options,
  });
};

// Create invitation request mutation (Member, Admin, Super Admin)
export const useCreateInvitationRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvitationRequestRequest) => invitationsApi.createInvitationRequest(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitationRequests });
      toast.success(
        response.message || "Demande d'invitation créée avec succès. Elle sera examinée par un administrateur.",
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Erreur lors de la création de la demande d'invitation"));
    },
  });
};

// Review invitation request mutation (Approve/Reject) (Admin only)
export const useReviewInvitationRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewInvitationRequestRequest }) =>
      invitationsApi.reviewInvitationRequest(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitationRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.invites });
      toast.success(response.message || "Demande d'invitation examinée avec succès");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Erreur lors de l'examen de la demande d'invitation"));
    },
  });
};
