// PERMANENT hooks — see src/types/userAward.ts
import { useQuery } from "@tanstack/react-query";
import { userAwardsApi } from "../api/userAwards";
import { queryKeys } from "../api/queryKeys";

export const useMyAwardWins = () => {
  return useQuery({
    queryKey: queryKeys.myAwardWins,
    queryFn: () => userAwardsApi.getMyAwardWins(),
    select: (response) => response.data,
  });
};

export const useUserAwardWins = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userAwardWins(userId),
    queryFn: () => userAwardsApi.getUserAwardWins(userId),
    select: (response) => response.data,
    enabled: !!userId,
  });
};

export const useCommissionAwardWins = (commissionId: string) => {
  return useQuery({
    queryKey: queryKeys.commissionAwardWins(commissionId),
    queryFn: () => userAwardsApi.getCommissionAwardWins(commissionId),
    select: (response) => response.data,
    enabled: !!commissionId,
  });
};
