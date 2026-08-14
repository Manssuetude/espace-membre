import { Session } from "../../types/session";

interface NextSessionBannerProps {
  nextSession: Session | null;
  pendingCount: number;
}

const NextSessionBanner = ({ nextSession, pendingCount }: NextSessionBannerProps) => {
  // Format session date
  const formattedDate = nextSession?.date
    ? (() => {
        const sessionDate = new Date(nextSession.date);
        const day = sessionDate.getDate();
        const monthNames = [
          "Janvier",
          "Février",
          "Mars",
          "Avril",
          "Mai",
          "Juin",
          "Juillet",
          "Août",
          "Septembre",
          "Octobre",
          "Novembre",
          "Décembre",
        ];
        const month = monthNames[sessionDate.getMonth()];
        return `${day} ${month} ${sessionDate.getFullYear()}`;
      })()
    : "Date non définie";

  if (!nextSession) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 via-red-50 to-secondary/10 border-2 border-primary/20 rounded-2xl shadow-lg p-4 sm:p-6 mb-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <i className="fa-solid fa-calendar-check text-white text-lg sm:text-2xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Prochaine session</h3>
            <p className="text-sm sm:text-base text-gray-600 mt-1 break-words">
              {nextSession.title} • {formattedDate}
            </p>
          </div>
        </div>
        <div className="text-left lg:text-right w-full sm:w-auto">
          <p className="text-xs sm:text-sm text-gray-600">Ressources pour cette session</p>
          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {pendingCount} en attente
          </p>
        </div>
      </div>
    </div>
  );
};

export default NextSessionBanner;
