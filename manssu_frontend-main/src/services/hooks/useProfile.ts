import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, UserUpdateRequest } from "../api/users";
import { queryKeys } from "../api/queryKeys";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";

export const useProfile = () => {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => usersApi.getCurrentUserProfile(),
    select: (response) => {
      // Compute name from firstName and lastName if not provided
      const user = response.data;
      return {
        ...user,
        name: user.name || `${user.firstName} ${user.lastName}`.trim(),
      };
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: (data: UserUpdateRequest) => usersApi.updateCurrentUserProfile(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });

      // Update user in localStorage and context
      const updatedUser = {
        ...response.data,
        name: response.data.name || `${response.data.firstName} ${response.data.lastName}`.trim(),
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Update context if user is set
      if (setUser) {
        setUser(updatedUser);
      }

      toast.success(response.message || "Profil mis à jour avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du profil");
    },
  });
};
