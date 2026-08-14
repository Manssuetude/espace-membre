interface WindowPropositionsSidebarProps {
  isWindowOpen: boolean
  windowCloseDate: string
  daysRemaining: number
  onManageWindow: () => void
  onCloseWindow: () => void
}

const WindowPropositionsSidebar = ({
  isWindowOpen,
  windowCloseDate,
  daysRemaining,
  onManageWindow,
  onCloseWindow,
}: WindowPropositionsSidebarProps) => {
  if (!isWindowOpen) return null

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <i className="fa-solid fa-window-maximize text-accent mr-2"></i>
        Fenêtre de propositions
      </h3>
      <div className="space-y-3 sm:space-y-4">
        <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-success/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-900">Statut actuel</span>
            <span className="px-2 py-1 bg-success text-white rounded-full text-xs font-medium">Ouverte</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">Se ferme le {windowCloseDate}</p>
          <p className="text-xs text-gray-500 mt-1">Dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}</p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <button
            onClick={onManageWindow}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-warning to-yellow-500 text-white rounded-xl hover:shadow-lg transition-all text-xs sm:text-sm font-medium"
          >
            <i className="fa-solid fa-clock mr-2"></i>
            Prolonger de 7 jours
          </button>
          <button
            onClick={onCloseWindow}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl hover:shadow-lg transition-all text-xs sm:text-sm font-medium"
          >
            <i className="fa-solid fa-times-circle mr-2"></i>
            Fermer maintenant
          </button>
        </div>
      </div>
    </div>
  )
}

export default WindowPropositionsSidebar

