import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { libraryApi } from "../api/library";
import { queryKeys } from "../api/queryKeys";
import {
  CreateLibraryBookRequest,
  UpdateLibraryBookRequest,
  UpdateLibraryBookAvailabilityRequest,
  CreateLibraryLoanRequest,
  CreateLibraryWishlistItemRequest,
  UpdateLibraryWishlistItemRequest,
  LibraryBookCategory,
} from "../../types/bibliotheque";

const normalizeCollection = <T>(payload: T[] | { data?: T[] } | undefined | null): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const normalizePaginated = <T>(
  payload: { data?: T[]; total?: number; page?: number; limit?: number; totalPages?: number } | T[] | undefined | null,
) => {
  if (!payload) return { data: [] as T[], total: 0, page: 1, limit: 0, totalPages: 0 };
  if (Array.isArray(payload)) {
    return { data: payload, total: payload.length, page: 1, limit: payload.length, totalPages: 1 };
  }
  return {
    data: Array.isArray(payload.data) ? payload.data : ([] as T[]),
    total: payload.total || 0,
    page: payload.page || 1,
    limit: payload.limit || 0,
    totalPages: payload.totalPages || 0,
  };
};

export const useLibraryBooks = (params?: {
  search?: string;
  category?: LibraryBookCategory;
  status?: "all" | "available" | "loaned" | "paused";
  ownerId?: string;
  availableOnly?: boolean;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [...queryKeys.libraryBooks, params],
    queryFn: () => libraryApi.getBooks(params),
    select: (response) => response.data,
  });
};

export const useLibraryBook = (bookId: string) => {
  return useQuery({
    queryKey: queryKeys.libraryBook(bookId),
    queryFn: () => libraryApi.getBook(bookId),
    select: (response) => response.data,
    enabled: !!bookId,
  });
};

export const useMyLibraryBooks = (params?: {
  search?: string;
  category?: LibraryBookCategory;
  status?: "all" | "available" | "loaned" | "paused";
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [...queryKeys.libraryMyBooks, params],
    queryFn: () => libraryApi.getMyBooks(params),
    select: (response) => normalizePaginated(response.data),
  });
};

export const useCreateLibraryBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLibraryBookRequest) => libraryApi.createBook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBooks });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryMyBooks });
      toast.success("Livre ajouté avec succès");
    },
  });
};

export const useUpdateLibraryBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookId, data }: { bookId: string; data: UpdateLibraryBookRequest }) =>
      libraryApi.updateBook(bookId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBooks });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryMyBooks });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBook(variables.bookId) });
      toast.success("Livre mis à jour");
    },
  });
};

export const useUpdateLibraryBookAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookId, data }: { bookId: string; data: UpdateLibraryBookAvailabilityRequest }) =>
      libraryApi.updateBookAvailability(bookId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBooks });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryMyBooks });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBook(variables.bookId) });
      toast.success("Disponibilité mise à jour");
    },
  });
};

export const useDeleteLibraryBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookId: string) => libraryApi.deleteBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBooks });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryMyBooks });
      toast.success("Livre supprimé");
    },
  });
};

export const useRequestLibraryBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookId: string) => libraryApi.requestBook(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBooks });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryNotifications });
      toast.success("Demande envoyée");
    },
  });
};

export const useLibraryBookRequests = (bookId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.libraryBookRequests(bookId),
    queryFn: () => libraryApi.getBookRequests(bookId),
    select: (response) => normalizeCollection(response.data),
    enabled: !!bookId && enabled,
  });
};

export const useAcceptLibraryRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => libraryApi.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBookRequestsRoot });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryMyLoans });
      toast.success("Offre acceptée");
    },
  });
};

export const useCancelLibraryRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => libraryApi.cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBookRequestsRoot });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryMyLoans });
      toast.success("Demande annulée");
    },
  });
};

export const useExpireLibraryRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => libraryApi.expireRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBookRequestsRoot });
      toast.success("Demande expirée");
    },
  });
};

export const useCreateLibraryLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: CreateLibraryLoanRequest }) =>
      libraryApi.createLoanFromRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryMyLoans });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBooks });
      toast.success("Prêt créé");
    },
  });
};

export const useConfirmLibraryHandoverOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (loanId: string) => libraryApi.confirmHandoverOwner(loanId),
    onSuccess: (_, loanId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryMyLoans });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryLoan(loanId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBooks });
      toast.success("Remise confirmée côté propriétaire");
    },
  });
};

export const useConfirmLibraryHandoverBorrower = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (loanId: string) => libraryApi.confirmHandoverBorrower(loanId),
    onSuccess: (_, loanId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryMyLoans });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryLoan(loanId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBooks });
      toast.success("Remise confirmée côté emprunteur");
    },
  });
};

export const useInitiateLibraryReturn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (loanId: string) => libraryApi.initiateReturn(loanId),
    onSuccess: (_, loanId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryMyLoans });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryLoan(loanId) });
      toast.success("Retour initié");
    },
  });
};

export const useConfirmLibraryReturnOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (loanId: string) => libraryApi.confirmReturnOwner(loanId),
    onSuccess: (_, loanId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryMyLoans });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryLoan(loanId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBooks });
      toast.success("Retour confirmé");
    },
  });
};

export const useCancelLibraryLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (loanId: string) => libraryApi.cancelLoan(loanId),
    onSuccess: (_, loanId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryMyLoans });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryLoan(loanId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryBooks });
      toast.success("Prêt annulé");
    },
  });
};

export const useMyLibraryLoans = (params?: {
  status?: "all" | "pending_handover" | "active" | "pending_return" | "completed" | "cancelled";
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [...queryKeys.libraryMyLoans, params],
    queryFn: () => libraryApi.getMyLoans(params),
    select: (response) => response.data,
  });
};

export const useLibraryLoan = (loanId: string) => {
  return useQuery({
    queryKey: queryKeys.libraryLoan(loanId),
    queryFn: () => libraryApi.getLoan(loanId),
    select: (response) => response.data,
    enabled: !!loanId,
  });
};

export const useMyLibraryWishlist = (params?: { activeOnly?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.libraryWishlist, params],
    queryFn: () => libraryApi.getMyWishlist(params),
    select: (response) => normalizeCollection(response.data),
  });
};

export const useCreateLibraryWishlistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLibraryWishlistItemRequest) => libraryApi.createWishlistItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryWishlist });
      toast.success("Souhait ajouté");
    },
  });
};

export const useUpdateLibraryWishlistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateLibraryWishlistItemRequest }) =>
      libraryApi.updateWishlistItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryWishlist });
      toast.success("Souhait mis à jour");
    },
  });
};

export const useDeleteLibraryWishlistItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => libraryApi.deleteWishlistItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryWishlist });
      toast.success("Souhait supprimé");
    },
  });
};

export const useLibraryNotifications = (params?: { unreadOnly?: boolean; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [...queryKeys.libraryNotifications, params],
    queryFn: () => libraryApi.getNotifications(params),
    select: (response) => {
      const raw = response.data;
      if (Array.isArray(raw)) return { data: raw, total: raw.length, page: 1, limit: raw.length, totalPages: 1 };
      return raw;
    },
  });
};

export const useMarkLibraryNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => libraryApi.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryNotifications });
      toast.success("Notification marquée comme lue");
    },
  });
};

export const useTriggerLibraryDueReminders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (daysBefore?: number) => libraryApi.triggerDueReminders(daysBefore),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.libraryNotifications });
      toast.success("Rappels envoyés");
    },
  });
};
