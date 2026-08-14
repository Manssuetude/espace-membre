import { Poll } from '../../types/sondage'

interface SessionPollProps {
  polls: Poll[]
}

const SessionPoll = ({ polls }: SessionPollProps) => {
  const getProgressBarColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      accent: 'from-accent to-blue-600',
      secondary: 'from-secondary to-orange-600',
      warning: 'from-warning to-yellow-500',
    }
    return colorMap[color] || 'from-accent to-blue-600'
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
        <i className="fa-solid fa-square-poll-vertical text-accent mr-2 sm:mr-3"></i>
        Sondages
      </h2>

      {!polls || polls.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-square-poll-vertical text-gray-400 text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm">Aucun sondage associé</p>
          <p className="text-gray-400 text-xs mt-1">Aucun sondage n'a été créé pour cette session</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {polls.map((poll) => (
            <div
              key={poll.id}
              className={`border rounded-xl p-3 sm:p-5 transition-all ${
                poll.status === 'draft'
                  ? 'border-gray-200 opacity-60'
                  : 'border-gray-200 hover:border-accent/50'
              }`}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 line-clamp-2">{poll.title}</h3>
                  {poll.status === 'draft' ? (
                    <p className="text-xs sm:text-sm text-gray-500">Brouillon</p>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-500">
                      {poll.status === 'active' ? 'Actif' : 'Terminé'} - {poll.totalResponses} réponses sur {poll.totalMembers} participants
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    poll.status === 'active'
                      ? 'bg-gradient-to-r from-success to-emerald-500 text-white'
                      : poll.status === 'completed'
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                      : 'bg-gradient-to-r from-warning to-yellow-500 text-white'
                  }`}
                >
                  {poll.status === 'active' ? 'Actif' : poll.status === 'completed' ? 'Terminé' : 'Brouillon'}
                </span>
              </div>
              
              {poll.status === 'active' && (() => {
                // Use first question's options or legacy options
                const firstQuestion = poll.questions && poll.questions.length > 0 ? poll.questions[0] : null
                const options = firstQuestion?.options || poll.options || []
                return options.length > 0 ? (
                <>
                  <div className="space-y-2 sm:space-y-3">
                      {options.map((option, optIdx) => (
                      <div key={option.id || optIdx}>
                        <div className="mb-1">
                          <span className="text-xs sm:text-sm text-gray-700 truncate">{option.label}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`bg-gradient-to-r ${getProgressBarColor(option.color || 'accent')} h-2 rounded-full`}
                            style={{ width: `${option.percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {poll.endDate && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Clôture: {new Date(poll.endDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </>
                ) : null
              })()}
              {poll.status !== 'active' && poll.description ? (
                <>
                  <p className="text-xs sm:text-sm text-gray-600">{poll.description}</p>
                </>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SessionPoll

