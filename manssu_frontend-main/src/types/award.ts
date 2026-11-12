// Types for the permanent Awards (teasing + nomination + vote + ceremony + palmarès) feature.
export type AwardTargetType = "member" | "commission";

export type AwardCategoryStatus =
  "nomination" | "curation" | "vote_scheduled" | "vote_open" | "awaiting_ceremony" | "results_published";

export type AwardEditionPhase =
  "not_started" | "teasing" | "nomination" | "selection" | "vote" | "ceremony_pending" | "published";

export type AwardEmailMode = "off" | "test" | "on";

export interface AwardNominationInfo {
  nominatedUserId: string | null;
  nominatedCommissionId: string | null;
  name: string;
  avatarUrl: string | null;
  count: number;
  proposedBy: string[];
  suggested?: boolean;
  tieAtCutoff?: boolean;
}

// Full candidate info, only ever sent to organizers via `candidates`. Members get `finalists`/`winners`
// (same shape, but votes/percentage/nominationCount are always null).
export interface AwardCandidate {
  id: string;
  nominatedUserId: string | null;
  nominatedCommissionId: string | null;
  name: string;
  avatarUrl: string | null;
  nominationCount: number | null;
  votes: number | null;
  percentage: number | null;
}

export interface AwardCategory {
  id: string;
  name: string | null; // null while locked during teasing, for non-organizers
  description: string | null;
  icon: string | null;
  targetType: AwardTargetType;
  status: AwardCategoryStatus;
  nominationsOpen: boolean;
  orderIndex: number;
  myNominations: AwardNominationInfo[];
  myVote: string | null;
  candidates: AwardCandidate[] | null; // organizers only
  finalists: AwardCandidate[] | null; // members only, always score-stripped
  winners: AwardCandidate[] | null; // everyone, once published - always score-stripped
  isCoWinner: boolean;
  ceremonyOrder: number;
  nominationCount: number;
  resultsPublishedAt: string | null;
  // Teasing
  revealed: boolean | null;
  revealAt: string | null;
  revealNumber: number | null;
  isNew: boolean;
}

export interface AwardCeremonySession {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  location: string | null;
}

export interface AwardSettings {
  editionYear: number;
  teasingStartAt: string | null;
  nominationStartAt: string | null;
  nominationEndAt: string | null;
  voteStartAt: string | null;
  voteEndAt: string | null;
  ceremonySession: AwardCeremonySession | null;
  emailMode: AwardEmailMode;
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

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  targetType: AwardTargetType;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  targetType?: AwardTargetType;
  revealAt?: string;
}

export interface UpdateAwardSettingsRequest {
  editionYear?: number;
  teasingStartAt?: string;
  nominationStartAt?: string;
  nominationEndAt?: string;
  voteStartAt?: string;
  voteEndAt?: string;
  ceremonySessionId?: string;
  emailMode?: AwardEmailMode;
}

// Ceremony preparation
export interface TieBreakResolution {
  mode: "co_winners" | "winner";
  candidateId?: string;
}

export interface PreparationCandidate {
  id: string;
  name: string;
  avatarUrl: string | null;
  votes: number;
}

export interface PreparationCategoryItem {
  id: string;
  name: string;
  icon: string | null;
  ceremonyOrder: number;
  candidates: PreparationCandidate[];
  tie: boolean;
  resolution: TieBreakResolution | null;
}

export interface SaveCeremonyPreparationRequest {
  order: string[];
  resolutions: Record<string, TieBreakResolution>;
}

export interface CeremonyCategoryItem {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  ceremonyOrder: number;
  finalists: PreparationCandidate[];
  winners: PreparationCandidate[];
  isCoWinner: boolean;
}

// Dashboard card
export interface AwardDashboardSummary {
  phase: AwardEditionPhase;
  year: number;
  lastRevealed?: { name: string; icon: string | null } | null;
  nominationStartAt?: string | null;
  nominationEndAt?: string | null;
  nominationCount?: number;
  voteStartAt?: string | null;
  voteEndAt?: string | null;
  voteCount?: number;
  totalCategories?: number;
  ceremonySession?: AwardCeremonySession | null;
  publishedAt?: string | null;
}
