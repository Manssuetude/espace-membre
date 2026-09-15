// Types for the temporary Awards (nomination + vote) feature.
export type AwardTargetType = "member" | "commission";

export type AwardCategoryStatus =
  "nomination" | "curation" | "vote_scheduled" | "vote_open" | "vote_closed" | "results_published";

export interface AwardNominationInfo {
  nominatedUserId: string | null;
  nominatedCommissionId: string | null;
  name: string;
  avatarUrl: string | null;
  count: number;
  proposedBy: string[];
}

export interface AwardCandidate {
  id: string;
  nominatedUserId: string | null;
  nominatedCommissionId: string | null;
  name: string;
  avatarUrl: string | null;
  nominationCount: number;
  votes: number;
  percentage: number;
}

export interface AwardCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  targetType: AwardTargetType;
  status: AwardCategoryStatus;
  nominationsOpen: boolean;
  orderIndex: number;
  myNominations: AwardNominationInfo[];
  myVote: string | null;
  candidates: AwardCandidate[] | null;
  nominationCount: number;
  resultsPublishedAt: string | null;
}

export interface AwardSettings {
  nominationStartAt: string | null;
  nominationEndAt: string | null;
  voteStartAt: string | null;
  voteEndAt: string | null;
}

export interface NominateRequest {
  nominatedUserId?: string;
  nominatedCommissionId?: string;
}

export interface BuildShortlistRequest {
  candidates: NominateRequest[];
}

export interface VoteRequest {
  candidateId: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  targetType?: AwardTargetType;
}

export interface UpdateAwardSettingsRequest {
  nominationStartAt?: string;
  nominationEndAt?: string;
  voteStartAt?: string;
  voteEndAt?: string;
}
