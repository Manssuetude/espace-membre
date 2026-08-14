import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { resourcesApi } from "../api/resources";
import { queryKeys } from "../api/queryKeys";
import { CreateResourceRequest, UpdateResourceRequest, UpdateResourceStatusRequest } from "../../types/resource";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { ApiResponse, PaginatedResponse } from "../../types/api";
import { Resource } from "../../types/resource";
import { Session } from "../../types/session";

export type ResourceSessionHistoryEntry = {
  session: Session;
  resources: Resource[];
};

export const useResources = (
  params?: {
    sessionId?: string;
    type?: string;
    category?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  },
  options?: Partial<
    Omit<
      UseQueryOptions<ApiResponse<PaginatedResponse<Resource>>, Error, PaginatedResponse<Resource>>,
      "queryKey" | "queryFn" | "select"
    >
  >,
) => {
  return useQuery({
    queryKey: [...queryKeys.resources, params],
    queryFn: () => resourcesApi.getResources(params),
    select: (response) => response.data,
    ...options,
  });
};

export const usePendingResources = () => {
  return useQuery({
    queryKey: [...queryKeys.resources, "pending"],
    queryFn: () => resourcesApi.getPendingResources(),
    select: (response) => response.data,
  });
};

export const useResourceSessionsHistory = (
  params?: {
    page?: number;
    limit?: number;
  },
  options?: Partial<
    Omit<
      UseQueryOptions<
        ApiResponse<PaginatedResponse<ResourceSessionHistoryEntry>>,
        Error,
        PaginatedResponse<ResourceSessionHistoryEntry>
      >,
      "queryKey" | "queryFn" | "select"
    >
  >,
) => {
  return useQuery({
    queryKey: [...queryKeys.resourceSessionsHistory, params],
    queryFn: () => resourcesApi.getResourceSessionsHistory(params),
    select: (response) => response.data,
    ...options,
  });
};

// Note: Past resources endpoint not available in current API
// If needed, use getResources with appropriate filters
// export const usePastResources = (params?: {
//   year?: number
//   month?: number
//   type?: string
//   search?: string
// }) => {
//   return useQuery({
//     queryKey: [...queryKeys.pastResources, params],
//     queryFn: () => resourcesApi.getPastResources(params),
//     select: (response) => response.data,
//   })
// }

export const useResource = (id: string) => {
  return useQuery({
    queryKey: queryKeys.resource(id),
    queryFn: () => resourcesApi.getResource(id),
    select: (response) => response.data,
    enabled: !!id,
  });
};

export const useCreateResource = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return useMutation({
    mutationFn: (data: CreateResourceRequest & { file?: File }) => {
      // Use admin endpoint if user is admin, otherwise use regular endpoint
      if (isAdmin) {
        return resourcesApi.createResourceAsAdmin(data);
      }
      return resourcesApi.createResource(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resources });
      toast.success(response.message || "Ressource créée avec succès");
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  });
};

export const useUpdateResourceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResourceStatusRequest }) =>
      resourcesApi.updateResourceStatus(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resources });
      queryClient.invalidateQueries({ queryKey: queryKeys.resource(variables.id) });
      toast.success(response.message || "Statut de la ressource mis à jour avec succès");
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  });
};

export const useUpdateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResourceRequest }) => resourcesApi.updateResource(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resources });
      queryClient.invalidateQueries({ queryKey: queryKeys.resource(variables.id) });
      toast.success(response.message || "Ressource mise à jour avec succès");
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  });
};

export const useDeleteResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resourcesApi.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resources });
      toast.success("Ressource supprimée avec succès");
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  });
};
