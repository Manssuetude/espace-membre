/**
 * Parses a date string, treating it as UTC if no timezone is specified
 * This handles backend dates that are in UTC but don't have the 'Z' suffix
 */
const parseDateAsUTC = (dateString: string): Date => {
  // If the string already has a timezone indicator (Z, +, -), use it as-is
  if (dateString.includes("Z") || dateString.includes("+") || dateString.match(/[+-]\d{2}:\d{2}$/)) {
    return new Date(dateString);
  }

  // If it's an ISO-like string without timezone, treat it as UTC
  // Format: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ss.sss
  if (dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    // Append 'Z' to indicate UTC, then parse
    return new Date(dateString + "Z");
  }

  // For other formats, parse normally (will use local timezone)
  return new Date(dateString);
};

/**
 * Formats a date string to a human-readable format
 * Returns formats like:
 * - "Aujourd'hui à 14h30" (today with time)
 * - "Hier à 14h30" (yesterday with time)
 * - "Aujourd'hui" (today without time)
 * - "Hier" (yesterday without time)
 * - "Il y a X heures" (hours ago)
 * - "Il y a X jours" (days ago)
 * - Full date format for older dates
 */
export const formatDate = (
  dateString: string | null | undefined,
  options: {
    includeTime?: boolean;
    showRelative?: boolean;
    timeFormat?: "short" | "long"; // 'short' = 14h, 'long' = 14h30
  } = {},
): string => {
  const { includeTime = false, showRelative = true, timeFormat = "long" } = options;

  if (!dateString) return "Date inconnue";

  // Parse date - treat as UTC if no timezone specified (backend sends UTC without Z)
  const date = parseDateAsUTC(dateString);

  // Validate date
  if (isNaN(date.getTime())) {
    return "Date invalide";
  }

  // Get current date in local timezone
  const now = new Date();

  // Normalize dates to midnight in local timezone for accurate day comparison
  const normalizeDate = (d: Date) => {
    const normalized = new Date(d);
    // setHours uses local timezone by default
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const dateNormalized = normalizeDate(date);
  const nowNormalized = normalizeDate(now);
  const yesterdayNormalized = new Date(nowNormalized);
  yesterdayNormalized.setDate(yesterdayNormalized.getDate() - 1);

  // Check if same day
  const isToday = dateNormalized.getTime() === nowNormalized.getTime();

  // Check if yesterday
  const isYesterday = dateNormalized.getTime() === yesterdayNormalized.getTime();

  // Format time if needed - toLocaleTimeString uses local timezone by default
  const formatTime = () => {
    if (timeFormat === "short") {
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  if (isToday) {
    if (includeTime) {
      return `Aujourd'hui à ${formatTime()}`;
    }
    return "Aujourd'hui";
  }

  if (isYesterday) {
    if (includeTime) {
      return `Hier à ${formatTime()}`;
    }
    return "Hier";
  }

  if (showRelative) {
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return "Il y a 1 jour";
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    }
  }

  // Full date format - toLocaleDateString uses local timezone by default
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (includeTime) {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timeZone,
    });
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timeZone,
  });
};

/**
 * Formats a date for display in tables/cards with time
 * Returns: "Aujourd'hui, 14h30" or "Hier, 14h30" or full date
 */
export const formatDateWithTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "";

  // Parse date - treat as UTC if no timezone specified (backend sends UTC without Z)
  const date = parseDateAsUTC(dateString);

  // Validate date
  if (isNaN(date.getTime())) {
    return "Date invalide";
  }

  // Get current date in local timezone
  const now = new Date();

  // Normalize dates to midnight in local timezone for accurate day comparison
  const normalizeDate = (d: Date) => {
    const normalized = new Date(d);
    // setHours uses local timezone by default
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const dateNormalized = normalizeDate(date);
  const nowNormalized = normalizeDate(now);
  const yesterdayNormalized = new Date(nowNormalized);
  yesterdayNormalized.setDate(yesterdayNormalized.getDate() - 1);

  // Check if same day
  const isToday = dateNormalized.getTime() === nowNormalized.getTime();

  // Check if yesterday
  const isYesterday = dateNormalized.getTime() === yesterdayNormalized.getTime();

  // Get local timezone
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Format time in local timezone
  const timeStr = date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timeZone,
  });

  if (isToday) {
    return `Aujourd'hui, ${timeStr}`;
  } else if (isYesterday) {
    return `Hier, ${timeStr}`;
  } else {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timeZone,
    });
  }
};
