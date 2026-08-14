import { toast } from 'sonner'
import { useCreateGroups } from '../../services/hooks/useSessions'

interface Participant {
  id: string
  name: string
  avatar: string
}

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  numberOfGroups: number
  onNumberOfGroupsChange: (count: number) => void
  isRandomMode: boolean
  onRandomModeChange: (isRandom: boolean) => void
  groupAssignments: { [memberId: string]: number | null }
  onGroupAssignmentsChange: (assignments: { [memberId: string]: number | null }) => void
  allParticipants: Participant[]
}

const CreateGroupModal = ({
  isOpen,
  onClose,
  sessionId,
  numberOfGroups,
  onNumberOfGroupsChange,
  isRandomMode,
  onRandomModeChange,
  groupAssignments,
  onGroupAssignmentsChange,
  allParticipants,
}: CreateGroupModalProps) => {
  const createGroups = useCreateGroups()

  if (!isOpen) return null

  const handleClose = () => {
    onRandomModeChange(false)
    onGroupAssignmentsChange({})
    onClose()
  }

  const handleNumberOfGroupsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(e.target.value) || 2
    onNumberOfGroupsChange(newCount)
    // Reset group assignments when number changes
    const newAssignments: { [memberId: string]: number | null } = {}
    Object.keys(groupAssignments).forEach((memberId) => {
      if (groupAssignments[memberId] !== null && (groupAssignments[memberId] as number) < newCount) {
        newAssignments[memberId] = groupAssignments[memberId]
      } else {
        newAssignments[memberId] = null
      }
    })
    onGroupAssignmentsChange(newAssignments)
  }

  const handleManualCreate = () => {
    const assignedCount = Object.values(groupAssignments).filter((g) => g !== null).length
    if (assignedCount === 0) {
      toast.error('Veuillez assigner au moins un participant à un groupe.')
      return
    }

    // Filter out null assignments and convert to number
    const assignments: { [memberId: string]: number } = {}
    Object.keys(groupAssignments).forEach((memberId) => {
      const groupIndex = groupAssignments[memberId]
      if (groupIndex !== null) {
        assignments[memberId] = groupIndex
      }
    })

    createGroups.mutate(
      {
        sessionId,
        data: {
          numberOfGroups,
          isRandom: false,
          assignments,
        },
      },
      {
        onSuccess: () => {
          handleClose()
        },
      }
    )
  }

  const handleRandomCreate = () => {
    createGroups.mutate(
      {
        sessionId,
        data: {
          numberOfGroups,
          isRandom: true,
        },
      },
      {
        onSuccess: () => {
          handleClose()
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Créer des groupes</h3>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Nombre de groupes
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={numberOfGroups}
              onChange={handleNumberOfGroupsChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm sm:text-base"
            />
          </div>

          {/* Mode Selection */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-4 sm:space-y-0 p-3 sm:p-4 bg-gray-50 rounded-xl">
            <button
              onClick={() => onRandomModeChange(false)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                !isRandomMode
                  ? 'bg-gradient-to-r from-accent to-blue-600 text-white shadow-lg'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <i className="fa-solid fa-hand-pointer mr-2"></i>
              Sélection manuelle
            </button>
            <button
              onClick={() => {
                onRandomModeChange(true)
                onGroupAssignmentsChange({})
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                isRandomMode
                  ? 'bg-gradient-to-r from-success to-emerald-500 text-white shadow-lg'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <i className="fa-solid fa-shuffle mr-2"></i>
              Répartition aléatoire
            </button>
          </div>

          {!isRandomMode ? (
            <>
              {/* Manual Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Sélectionner les membres pour chaque groupe ({allParticipants.length} participants disponibles)
                </label>
                <div className="space-y-2 sm:space-y-4 max-h-64 sm:max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {allParticipants.map((participant) => (
                    <div key={participant.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-2 sm:p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                      <div className="flex items-center flex-1 min-w-0">
                        <span className="text-sm sm:text-base font-medium text-gray-900 truncate">{participant.name}</span>
                      </div>
                      <select
                        value={groupAssignments[participant.id] || ''}
                        onChange={(e) => {
                          const groupId = e.target.value ? parseInt(e.target.value) : null
                          onGroupAssignmentsChange({
                            ...groupAssignments,
                            [participant.id]: groupId,
                          })
                        }}
                        className="sm:ml-4 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs sm:text-sm w-full sm:w-auto"
                      >
                        <option value="">Non assigné</option>
                        {Array.from({ length: numberOfGroups }, (_, i) => (
                          <option key={i} value={i}>
                            Groupe {String.fromCharCode(65 + i)} ({i + 1})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                <div className="flex items-start space-x-2">
                  <i className="fa-solid fa-info-circle text-accent mt-0.5 text-sm sm:text-base"></i>
                  <div className="text-xs sm:text-sm text-gray-700">
                    <p className="font-medium mb-1">Sélection manuelle</p>
                    <p className="text-gray-600">
                      Assignez chaque participant au groupe de votre choix en utilisant le menu déroulant.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:space-y-0 pt-3 sm:pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-xs sm:text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleManualCreate}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-accent to-blue-600 text-white rounded-xl hover:shadow-lg transition-all text-xs sm:text-sm font-medium"
                >
                  <i className="fa-solid fa-check mr-2"></i>
                  Créer les groupes
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Random Mode */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                <div className="flex items-start space-x-2">
                  <i className="fa-solid fa-info-circle text-accent mt-0.5 text-sm sm:text-base"></i>
                  <div className="text-xs sm:text-sm text-gray-700">
                    <p className="font-medium mb-1">Répartition automatique</p>
                    <p className="text-gray-600">
                      Les {allParticipants.length} participants seront répartis aléatoirement en {numberOfGroups} groupes équilibrés.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:space-y-0 pt-3 sm:pt-4">
                <button
                  onClick={handleClose}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-xs sm:text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRandomCreate}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-success to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all text-xs sm:text-sm font-medium"
                >
                  <i className="fa-solid fa-shuffle mr-2"></i>
                  Créer aléatoirement
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateGroupModal

