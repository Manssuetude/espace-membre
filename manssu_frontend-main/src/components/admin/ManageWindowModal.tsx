import Dropdown from '../Dropdown'

interface ManageWindowModalProps {
  isOpen: boolean
  onClose: () => void
  windowCloseDate: string
  daysRemaining: number
  windowDuration: string
  onDurationChange: (duration: string) => void
  onExtend: (duration: string) => void
  onCloseWindow: () => void
}

const ManageWindowModal = ({
  isOpen,
  onClose,
  windowCloseDate,
  daysRemaining,
  windowDuration,
  onDurationChange,
  onExtend,
  onCloseWindow,
}: ManageWindowModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Gérer la fenêtre de propositions</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          La fenêtre se ferme actuellement le {windowCloseDate} (dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}).
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Prolonger de (jours)</label>
            <Dropdown
              value={windowDuration}
              onChange={(e) => onDurationChange(e.target.value)}
              options={[
                { value: '7', label: '7 jours' },
                { value: '14', label: '14 jours' },
                { value: '21', label: '21 jours' },
                { value: '30', label: '30 jours' },
              ]}
              placeholder="Sélectionner une durée"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:space-y-0 pt-3 sm:pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-sm sm:text-base"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                if (windowDuration) {
                  onExtend(windowDuration)
                }
              }}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-warning to-yellow-500 text-white rounded-xl hover:shadow-lg transition-all text-sm sm:text-base"
            >
              Prolonger
            </button>
            <button
              onClick={onCloseWindow}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-xl hover:shadow-lg transition-all text-sm sm:text-base"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManageWindowModal

