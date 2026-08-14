interface ResourceSessionContextProps {
  sessionId: string
  sessionTitle: string
  sessionDate: string
  addToSession: boolean
  onAddToSessionChange: (checked: boolean) => void
}

const ResourceSessionContext = ({
  sessionId,
  sessionTitle,
  sessionDate,
  addToSession,
  onAddToSessionChange,
}: ResourceSessionContextProps) => {
  if (!sessionId) return null

  return (
    <div className="bg-gradient-to-r from-primary/10 via-red-50 to-secondary/10 border-2 border-primary/20 rounded-2xl shadow-lg p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <i className="fa-solid fa-calendar-check text-primary mr-2"></i>
        Session ciblée
      </h3>
      <div className="space-y-2 sm:space-y-3">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-900">{sessionTitle}</p>
          <p className="text-xs text-gray-600">{sessionDate}</p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="add-to-session"
            checked={addToSession}
            onChange={(e) => onAddToSessionChange(e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20"
          />
          <label htmlFor="add-to-session" className="text-xs sm:text-sm text-gray-700">
            Ajouter à cette session
          </label>
        </div>
      </div>
    </div>
  )
}

export default ResourceSessionContext

