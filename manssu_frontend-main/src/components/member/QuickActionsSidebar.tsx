import { toast } from "sonner";
import { formatTimeWithoutSeconds } from "../../utils/resourceUtils";

interface QuickActionsSidebarProps {
  title: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  location?: { address: string; instructions?: string | null } | null;
  description?: string | null;
  sessionId?: string;
}

const QuickActionsSidebar = ({
  title,
  date,
  startTime,
  endTime,
  location,
  description,
  sessionId,
}: QuickActionsSidebarProps) => {
  const hasDateAndTime = date && startTime && endTime;

  const handleShare = async () => {
    const shareUrl = sessionId ? `${window.location.origin}/sessions/${sessionId}` : window.location.href;

    const shareText = `Découvrez cette session: ${title}${date && startTime ? `\n📅 ${new Date(date).toLocaleDateString("fr-FR")} à ${formatTimeWithoutSeconds(startTime)}` : ""}${location?.address ? `\n📍 ${location.address}` : ""}`;

    // Check if Web Share API is available (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Session partagée avec succès");
      } catch (error) {
        // User cancelled or error occurred
        if (error instanceof Error && error.name !== "AbortError") {
          // Fallback to clipboard if share fails
          copyToClipboard(shareUrl);
        }
      }
    } else {
      // Fallback to clipboard for desktop
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Lien copié dans le presse-papiers");
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("Lien copié dans le presse-papiers");
      } catch (err) {
        toast.error("Impossible de copier le lien");
      }
      document.body.removeChild(textArea);
    }
  };

  const generateICS = () => {
    if (!date || !startTime || !endTime) return;

    // Parse date and times
    const sessionDate = new Date(date);
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const startDateTime = new Date(sessionDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(sessionDate);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    // Format for iCalendar (YYYYMMDDTHHMMSS)
    const formatICSDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    // Escape special characters for iCalendar format
    const escapeICS = (text: string) => {
      return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    };

    const locationStr = location?.address ? escapeICS(location.address) : "";
    const descriptionStr = description ? escapeICS(description) : "";
    const locationInstructions = location?.instructions ? escapeICS(location.instructions) : "";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Manssu//Session Calendar//EN",
      "BEGIN:VEVENT",
      `DTSTART:${formatICSDate(startDateTime)}`,
      `DTEND:${formatICSDate(endDateTime)}`,
      `SUMMARY:${escapeICS(title)}`,
      locationStr ? `LOCATION:${locationStr}` : "",
      descriptionStr || locationInstructions
        ? `DESCRIPTION:${descriptionStr}${locationInstructions ? (descriptionStr ? "\\n\\n" : "") + "Accès: " + locationInstructions : ""}`
        : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter((line) => line !== "")
      .join("\r\n");

    // Create blob and download
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[^a-z0-9]/gi, "_")}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
      <div className="space-y-3">
        {hasDateAndTime && (
          <button
            onClick={generateICS}
            className="w-full px-4 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-medium shadow-lg shadow-primary/30 hover:shadow-xl transition-all"
          >
            <i className="fa-solid fa-calendar-plus mr-2"></i>
            Ajouter au calendrier
          </button>
        )}
        <button
          onClick={handleShare}
          className="w-full px-4 py-3 bg-gradient-to-r from-accent to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-accent/30 hover:shadow-xl transition-all"
        >
          <i className="fa-solid fa-share-nodes mr-2"></i>
          Partager
        </button>
      </div>
    </div>
  );
};

export default QuickActionsSidebar;
