import { AwardCategory } from "../types/award";

export const AWARD_STATUS_BADGES: Record<AwardCategory["status"], { label: string; className: string }> = {
  nomination: { label: "Nominations ouvertes", className: "bg-accent/10 text-accent" },
  curation: { label: "Sélection en cours", className: "bg-warning/10 text-warning" },
  vote_scheduled: { label: "Vote à venir", className: "bg-secondary/10 text-secondary" },
  vote_open: { label: "Vote ouvert", className: "bg-success/10 text-success" },
  vote_closed: { label: "Vote clôturé", className: "bg-gray-200 text-gray-600" },
  results_published: { label: "Résultats publiés", className: "bg-primary/10 text-primary" },
};
