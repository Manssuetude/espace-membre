// PERMANENT type — award wins persist on a member's profile even after the temporary Awards feature is removed.
export interface UserAwardWin {
  id: string;
  awardName: string;
  awardIcon: string | null;
  year: number;
  awardedAt: string;
}
