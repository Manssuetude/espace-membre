interface PendingTheme {
  id: string;
  title: string;
  description: string;
  author: string;
  days: number;
}

interface PendingThemesListProps {
  themes: PendingTheme[];
  onApprove: (themeId: string) => void;
  onReject: (themeId: string) => void;
  isLoading?: boolean;
}

const PendingThemesList = ({ themes, onApprove, onReject, isLoading = false }: PendingThemesListProps) => {
  const hasThemes = themes.length > 0;

  const formatDays = (days: number) => {
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    return `Il y a ${days} jours`;
  };

  return (
    <div
      className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 flex flex-col ${hasThemes ? "h-auto sm:h-[500px] lg:h-[600px]" : "h-auto"}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6 flex-shrink-0">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
          <i className="fa-solid fa-clock text-warning mr-2 sm:mr-3"></i>
          Thèmes en attente de validation
        </h3>
        <span className="bg-gradient-to-r from-warning to-yellow-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium w-fit">
          {themes.length} en attente
        </span>
      </div>

      <div className="space-y-3 sm:space-y-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
        {themes.length === 0 ? (
          <div className="text-center py-8">
            <i className="fa-solid fa-clock text-gray-300 text-4xl mb-3"></i>
            <p className="text-gray-500 text-sm">Aucun thème en attente pour le moment</p>
          </div>
        ) : (
          themes.map((theme) => (
            <div
              key={theme.id}
              className="p-3 sm:p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-warning/20 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-semibold text-gray-900 text-base sm:text-lg">{theme.title}</h4>
                  <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm">{theme.description}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center">
                      <i className="fa-solid fa-user mr-1"></i>
                      {theme.author}
                    </span>
                    <span className="flex items-center">
                      <i className="fa-solid fa-calendar mr-1"></i>
                      {formatDays(theme.days)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:space-y-0">
                <button
                  onClick={() => onApprove(theme.id)}
                  disabled={isLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-success to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fa-solid fa-check mr-2"></i>
                  )}
                  Accepter
                </button>
                <button
                  onClick={() => onReject(theme.id)}
                  disabled={isLoading}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fa-solid fa-times mr-2"></i>
                  )}
                  Rejeter
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PendingThemesList;
