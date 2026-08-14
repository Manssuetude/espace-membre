import Dropdown from '../Dropdown'

interface ProposalWindowModalProps {
  isOpen: boolean
  onClose: () => void
  windowDuration: string
  onDurationChange: (duration: string) => void
  onOpen: (duration: string) => void
}

const ProposalWindowModal = ({
  isOpen,
  onClose,
  windowDuration,
  onDurationChange,
  onOpen,
}: ProposalWindowModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Ouvrir fenêtre de propositions</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Définissez la durée pendant laquelle les membres pourront proposer de nouveaux thèmes.</p>
        <div className="space-y-4">
          <Dropdown
            label="Durée de la fenêtre"
            value={windowDuration}
            onChange={(e) => onDurationChange(e.target.value)}
            options={[
              { value: '7', label: '7 jours' },
              { value: '14', label: '14 jours' },
              { value: '21', label: '21 jours' },
              { value: '30', label: '30 jours' },
            ]}
            placeholder="Sélectionner une durée"
            required
          />
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
                  onOpen(windowDuration)
                }
              }}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-success to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all text-sm sm:text-base"
            >
              Ouvrir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProposalWindowModal

