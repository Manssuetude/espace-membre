import { useState, useMemo } from 'react'
import { useSessions } from '../../services/hooks/useSessions'
import { useCreatePollFromThemes, useLinkedThemes, useUnlinkedThemes } from '../../services/hooks/useThemes'
import SearchableDropdown from '../SearchableDropdown'
import { toast } from 'sonner'

interface CreatePollModalProps {
  isOpen: boolean
  onClose: () => void
  isWindowOpen: boolean
  onCreatePoll: () => void
}

const CreatePollModal = ({
  isOpen,
  onClose,
  isWindowOpen,
  onCreatePoll,
}: CreatePollModalProps) => {
  const { data: sessionsData } = useSessions({ status: 'upcoming', limit: 100 })
  const { data: linkedThemesData } = useLinkedThemes()
  const { data: unlinkedThemesData } = useUnlinkedThemes()
  const createPollMutation = useCreatePollFromThemes()
  
  const sessions = sessionsData?.data || []
  const linkedThemes = linkedThemesData || []
  const unlinkedThemes = unlinkedThemesData || []
  
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([])
  const [sessionId, setSessionId] = useState<string>('')

  const sessionOptions = sessions.map((session) => ({
    value: session.id,
    label: `${session.title}${session.date ? ` - ${new Date(session.date).toLocaleDateString('fr-FR')}` : ''}`,
  }))

  // Separate themes into two categories
  const themesWithSessions = useMemo(() => {
    return linkedThemes.map((theme) => ({
      value: theme.id,
      label: theme.title,
    }))
  }, [linkedThemes])

  const themesWithoutSessions = useMemo(() => {
    return unlinkedThemes.map((theme) => ({
      value: theme.id,
      label: theme.title,
    }))
  }, [unlinkedThemes])

  const totalThemes = themesWithSessions.length + themesWithoutSessions.length

  const handleThemeToggle = (themeId: string) => {
    setSelectedThemeIds((prev) => {
      if (prev.includes(themeId)) {
        return prev.filter((id) => id !== themeId)
      } else {
        return [...prev, themeId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedThemeIds.length < 2) {
      toast.error('Veuillez sélectionner au moins 2 thèmes')
      return
    }

    if (!sessionId) {
      toast.error('Veuillez sélectionner une session')
      return
    }

    createPollMutation.mutate(
      {
        themeIds: selectedThemeIds,
        sessionId: sessionId,
      },
      {
        onSuccess: () => {
          onCreatePoll()
          onClose()
          setSelectedThemeIds([])
          setSessionId('')
        },
      }
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Créer un sondage</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        {isWindowOpen && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-start">
              <i className="fa-solid fa-exclamation-triangle text-yellow-600 mr-2 mt-0.5"></i>
              <p className="text-xs sm:text-sm text-yellow-800">
                <strong>Note importante :</strong> La création de ce sondage fermera automatiquement la fenêtre de propositions de thèmes en cours.
              </p>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Sélectionner les thèmes <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">Sélectionnez au moins 2 thèmes pour créer le sondage</p>
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-xl p-3 space-y-4">
              {totalThemes === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Aucun thème disponible</p>
              ) : (
                <>
                  {/* Themes with sessions */}
                  {themesWithSessions.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                        <i className="fa-solid fa-calendar-check text-accent"></i>
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700">
                          Thèmes avec sessions ({themesWithSessions.length})
                        </h4>
                      </div>
                      {themesWithSessions.map((theme) => (
                        <label
                          key={theme.value}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedThemeIds.includes(theme.value)}
                            onChange={() => handleThemeToggle(theme.value)}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                          />
                          <span className="text-sm text-gray-900 flex-1">{theme.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Themes without sessions */}
                  {themesWithoutSessions.length > 0 && (
                    <div className="space-y-2">
                      {themesWithSessions.length > 0 && (
                        <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 pt-2">
                          <i className="fa-solid fa-calendar-plus text-success"></i>
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-700">
                            Thèmes sans sessions ({themesWithoutSessions.length})
                          </h4>
                        </div>
                      )}
                      {themesWithoutSessions.map((theme) => (
                        <label
                          key={theme.value}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedThemeIds.includes(theme.value)}
                            onChange={() => handleThemeToggle(theme.value)}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                          />
                          <span className="text-sm text-gray-900 flex-1">{theme.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {selectedThemeIds.length > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                {selectedThemeIds.length} thème{selectedThemeIds.length > 1 ? 's' : ''} sélectionné{selectedThemeIds.length > 1 ? 's' : ''}
              </p>
            )}
            {selectedThemeIds.length > 0 && selectedThemeIds.length < 2 && (
              <p className="text-xs text-red-500 mt-1">
                Veuillez sélectionner au moins 2 thèmes
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Session <span className="text-red-500">*</span>
            </label>
            <SearchableDropdown
              value={sessionId}
              onChange={setSessionId}
              options={sessionOptions}
              placeholder="Sélectionner une session..."
              className="w-full"
            />
            {sessionOptions.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Aucune session à venir disponible</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:space-y-0 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-sm sm:text-base"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={selectedThemeIds.length < 2 || !sessionId || createPollMutation.isPending}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPollMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Création...
                </span>
              ) : (
                'Créer le sondage'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePollModal

