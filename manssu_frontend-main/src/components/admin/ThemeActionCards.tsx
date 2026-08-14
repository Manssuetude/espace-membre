interface ThemeActionCardsProps {
  isWindowOpen: boolean;
  daysRemaining: number;
  onOpenWindow: () => void;
  onAddTheme: () => void;
  onCreatePoll: () => void;
  onManageWindow: () => void;
}

const ThemeActionCards = ({
  isWindowOpen,
  daysRemaining,
  onOpenWindow,
  onAddTheme,
  onCreatePoll,
  onManageWindow,
}: ThemeActionCardsProps) => {
  // When window is closed, show only the "Ouvrir fenêtre" button, make it prominent
  if (!isWindowOpen) {
    return (
      <div className="mb-6 sm:mb-8">
        <div
          onClick={onOpenWindow}
          className="bg-gradient-to-br from-success/10 via-emerald-50 to-success/5 backdrop-blur-xl p-4 sm:p-6 rounded-xl shadow-lg border-2 border-success/30 hover:shadow-xl hover:border-success/50 transition-all group cursor-pointer w-full"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-success to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg flex-shrink-0">
                <i className="fa-solid fa-plus-circle text-white text-xl sm:text-2xl"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                  Ouvrir la fenêtre de propositions
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">Permettre aux membres de proposer de nouveaux thèmes</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <i className="fa-solid fa-arrow-right text-white text-base sm:text-lg"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // When window is open, show all action cards
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div
        onClick={onAddTheme}
        className="bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-accent/10 to-blue-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-lightbulb text-accent text-xl sm:text-2xl"></i>
          </div>
          <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-accent transition-colors text-sm sm:text-base"></i>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Ajouter thème</h3>
        <p className="text-xs sm:text-sm text-gray-600">Créer directement un nouveau thème validé</p>
      </div>

      <div
        onClick={onCreatePoll}
        className="bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-chart-bar text-purple-500 text-xl sm:text-2xl"></i>
          </div>
          <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-purple-500 transition-colors text-sm sm:text-base"></i>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Créer sondage</h3>
        <p className="text-xs sm:text-sm text-gray-600">Lancer un vote pour le thème de la prochaine session</p>
      </div>

      {/* Only show "Gérer fenêtre" card when window is open */}
      {isWindowOpen && (
        <div
          onClick={onManageWindow}
          className="bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-warning/10 to-yellow-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-clock text-warning text-xl sm:text-2xl"></i>
            </div>
            <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-warning transition-colors text-sm sm:text-base"></i>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Gérer fenêtre</h3>
          <p className="text-xs sm:text-sm text-gray-600">Prolonger ou fermer la fenêtre de propositions</p>
        </div>
      )}

      {/* Show window status card only when window is open */}
      {isWindowOpen && (
        <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200/50">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/10 to-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <i className="fa-solid fa-hourglass-half text-primary text-xl sm:text-2xl"></i>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Statut fenêtre</h3>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              <span className="text-xs sm:text-sm font-medium text-success">Ouverte</span>
            </div>
            <p className="text-xs text-gray-500">
              Ferme dans {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeActionCards;
