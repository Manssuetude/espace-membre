/**
 * Translates resource type from English to French
 */
export const translateResourceType = (type: string): string => {
  const typeMap: Record<string, string> = {
    file: "Fichier",
    video: "Vidéo",
    audio: "Audio",
    folder: "Dossier",
  };

  return typeMap[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Formats a time string to remove seconds (HH:mm:ss -> HH:mm)
 */
export const formatTimeWithoutSeconds = (timeStr: string | null | undefined): string => {
  if (!timeStr) return "";
  // If time is in format HH:mm:ss, remove seconds
  if (timeStr.includes(":") && timeStr.split(":").length === 3) {
    return timeStr.split(":").slice(0, 2).join(":");
  }
  return timeStr;
};
