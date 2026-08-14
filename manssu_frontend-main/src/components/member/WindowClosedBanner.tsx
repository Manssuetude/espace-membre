interface WindowClosedBannerProps {
  nextOpeningDate: string | null;
}

const WindowClosedBanner = ({ nextOpeningDate }: WindowClosedBannerProps) => {
  const calculateDaysUntilOpening = (dateString: string | null): number | null => {
    if (!dateString) return null;
    const openingDate = new Date(dateString);
    const now = new Date();
    const diffTime = openingDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const formatTimeUntilOpening = (days: number | null): string | null => {
    if (!days) return null;
    if (days < 7) return `${days} jour${days > 1 ? "s" : ""}`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} semaine${weeks > 1 ? "s" : ""}`;
    }
    const months = Math.floor(days / 30);
    return `${months} mois`;
  };

  const daysUntilOpening = calculateDaysUntilOpening(nextOpeningDate);
  const timeUntilOpening = formatTimeUntilOpening(daysUntilOpening);

  return (
    <div className="mb-8 bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 border-2 border-gray-300/50 rounded-2xl p-6 shadow-lg">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mr-5 shadow-lg shadow-gray-400/40">
            <i className="fa-solid fa-door-closed text-white text-2xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Fenêtre de propositions fermée</h2>
            <p className="text-gray-600">La prochaine session est en cours de préparation</p>
          </div>
        </div>
        {timeUntilOpening && (
          <div className="text-left lg:text-right">
            <p className="text-sm font-medium text-gray-600 mb-1">Prochaine ouverture dans</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
              {timeUntilOpening}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WindowClosedBanner;
