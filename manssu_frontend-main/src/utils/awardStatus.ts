import { AwardCategory, AwardEditionPhase } from "../types/award";

export const AWARD_STATUS_BADGES: Record<AwardCategory["status"], { label: string; className: string }> = {
  nomination: { label: "Nominations ouvertes", className: "bg-accent/10 text-accent" },
  curation: { label: "Sélection en cours", className: "bg-warning/10 text-warning" },
  vote_scheduled: { label: "Vote à venir", className: "bg-secondary/10 text-secondary" },
  vote_open: { label: "Vote ouvert", className: "bg-success/10 text-success" },
  awaiting_ceremony: { label: "En attente de la cérémonie", className: "bg-gray-200 text-gray-600" },
  results_published: { label: "Résultats publiés", className: "bg-primary/10 text-primary" },
};

export const AWARD_EDITION_PHASE_LABELS: Record<AwardEditionPhase, string> = {
  not_started: "À venir",
  teasing: "Bientôt",
  nomination: "Nominations",
  selection: "Sélection des finalistes",
  vote: "Vote",
  ceremony_pending: "Cérémonie",
  published: "Palmarès",
};

export const AWARD_EDITION_STEP_INDEX: Record<AwardEditionPhase, number> = {
  not_started: 0,
  teasing: 0,
  nomination: 1,
  selection: 2,
  vote: 3,
  ceremony_pending: 4,
  published: 5,
};

/** Coarse, display-only mirror of AwardService._compute_edition_phase (backend stays the source of truth). */
export const computeEditionPhase = (
  settings:
    | {
        teasingStartAt: string | null;
        nominationStartAt: string | null;
        nominationEndAt: string | null;
        voteStartAt: string | null;
        voteEndAt: string | null;
      }
    | undefined,
  hasPublishedCategory: boolean,
  now: Date = new Date(),
): AwardEditionPhase => {
  if (!settings) return "not_started";
  // An unset milestone does not force "not_started": a cycle that started before this
  // teasing/phase system existed (teasingStartAt left null) but already has a
  // nominationStartAt in the past must resolve past "teasing", not get stuck before it.
  const t = settings.teasingStartAt ? new Date(settings.teasingStartAt) : null;
  if (t && now < t) return "not_started";
  if (!t && !settings.nominationStartAt) return "not_started";
  const ns = settings.nominationStartAt ? new Date(settings.nominationStartAt) : null;
  if (ns && now < ns) return "teasing";
  if (!ns) return "teasing";
  const ne = settings.nominationEndAt ? new Date(settings.nominationEndAt) : null;
  if (ne && now < ne) return "nomination";
  if (!ne) return "nomination";
  const vs = settings.voteStartAt ? new Date(settings.voteStartAt) : null;
  if (vs && now < vs) return "selection";
  if (!vs) return "selection";
  const ve = settings.voteEndAt ? new Date(settings.voteEndAt) : null;
  if (ve && now < ve) return "vote";
  if (!ve) return "vote";
  return hasPublishedCategory ? "published" : "ceremony_pending";
};
