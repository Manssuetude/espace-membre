interface WindowOpenBannerProps {
  daysRemaining: number
  startDate: string | null
  endDate: string | null
}

const WindowOpenBanner = ({ daysRemaining, startDate, endDate }: WindowOpenBannerProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const dateRange = startDate && endDate
    ? `Ouverte du ${formatDate(startDate)} au ${formatDate(endDate)}`
    : 'Fenêtre de propositions ouverte'

  return (
    <div className="mb-8 bg-gradient-to-r from-orange-50 via-red-50 to-orange-50 border-2 border-secondary/30 rounded-2xl p-4 sm:p-6 shadow-lg">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center flex-1 min-w-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-secondary to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-5 shadow-lg shadow-secondary/40 flex-shrink-0">
            <i className="fa-solid fa-door-open text-white text-lg sm:text-2xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Fenêtre de propositions ouverte</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 flex items-center">
              <i className="fa-solid fa-calendar mr-2 text-secondary flex-shrink-0"></i>
              <span className="truncate">{dateRange}</span>
            </p>
          </div>
        </div>
        <div className="text-left lg:text-right w-full sm:w-auto">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Fermeture dans</p>
          <p className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-secondary to-orange-600 bg-clip-text text-transparent">
            {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

export default WindowOpenBanner

