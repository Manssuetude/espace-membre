// Global Awards windows (nomination, vote) — pure helpers shared by the admin page.

export type WindowPhase = "unset" | "upcoming" | "active" | "ended";

// The API returns naive UTC datetimes (no timezone suffix, e.g. "2026-11-12T17:00:00"):
// read them as UTC, not as local time.
export const parseApiDate = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso);
  const date = new Date(hasZone ? iso : `${iso}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

// "yyyy-MM-ddTHH:mm" in the viewer's local time, for <input type="datetime-local">.
export const toLocalInputValue = (date: Date | null): string => {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
};

export const windowPhase = (start: Date | null, end: Date | null, now: Date): WindowPhase => {
  if (!start || !end) return "unset";
  if (now < start) return "upcoming";
  if (now < end) return "active";
  return "ended";
};

export const splitDuration = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
};

// "mer. 12 nov. 2026 à 18h00"
export const formatWindowDate = (date: Date): string => {
  const day = date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
  return `${day} à ${time}`;
};

const HOUR = 3_600_000;

export const EXTENSION_PRESETS = [
  { label: "+1 heure", ms: HOUR },
  { label: "+1 jour", ms: 24 * HOUR },
  { label: "+3 jours", ms: 3 * 24 * HOUR },
  { label: "+1 semaine", ms: 7 * 24 * HOUR },
] as const;

// Why an extension is refused (null = allowed): it must push the end later, and the
// nomination window must not run into the vote window.
export const extensionError = (currentEnd: Date, newEnd: Date, limit: Date | null): string | null => {
  if (Number.isNaN(newEnd.getTime())) return "Date invalide.";
  if (newEnd <= currentEnd) return "La nouvelle fin doit être postérieure à la fin actuelle.";
  if (limit && newEnd > limit) return `Impossible de dépasser le début du vote (${formatWindowDate(limit)}).`;
  return null;
};
