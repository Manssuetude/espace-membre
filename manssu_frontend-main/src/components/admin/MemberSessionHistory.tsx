import { Session } from '../../types/session'

interface MemberSessionHistoryProps {
  sessions: Session[]
}

const MemberSessionHistory = ({ sessions }: MemberSessionHistoryProps) => {
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isSessionInPast = (dateStr: string): boolean => {
    if (!dateStr) return false
    const sessionDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    sessionDate.setHours(0, 0, 0, 0)
    return sessionDate < today
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <i className="fa-solid fa-calendar-check text-primary mr-2"></i>
        Historique des sessions
      </h2>
      {sessions.length > 0 ? (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{session.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    {session.date && (
                      <span className="flex items-center">
                        <i className="fa-solid fa-calendar text-primary mr-2"></i>
                        {formatDateTime(session.date)}
                      </span>
                    )}
                    {session.startTime && session.endTime && (
                      <span className="flex items-center">
                        <i className="fa-solid fa-clock text-secondary mr-2"></i>
                        {session.startTime} - {session.endTime}
                      </span>
                    )}
                  </div>
                  {(session as any).attended !== undefined && (
                    <div className="mt-2 flex items-center gap-2">
                      {(session as any).attended ? (
                        <span className="px-2 py-1 bg-gradient-to-r from-success to-emerald-500 text-white rounded-full text-xs font-medium">
                          <i className="fa-solid fa-check mr-1"></i>
                          Présent
                        </span>
                      ) : (
                        isSessionInPast(session.date || '') && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium">
                            <i className="fa-solid fa-times mr-1"></i>
                            Absent
                          </span>
                        )
                      )}
                      {(session as any).rating && (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={`fa-solid fa-star text-xs ${
                                star <= (session as any).rating ? 'text-warning' : 'text-gray-300'
                              }`}
                            ></i>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {(session as any).comment && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 italic">"{((session as any).comment as string).substring(0, 100)}{((session as any).comment as string).length > 100 ? '...' : ''}"</p>
                    </div>
                  )}
                </div>
                {session.status && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    session.status === 'completed'
                      ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                      : session.status === 'upcoming'
                      ? 'bg-gradient-to-r from-primary to-red-500 text-white'
                      : session.status === 'ongoing'
                      ? 'bg-gradient-to-r from-accent to-blue-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  }`}>
                    {session.status === 'completed' ? 'Terminée' : 
                     session.status === 'upcoming' ? 'À venir' :
                     session.status === 'ongoing' ? 'En cours' : 'Annulée'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-calendar-xmark text-primary text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">Aucune session participée</p>
          <p className="text-gray-400 text-xs">L'historique des sessions apparaîtra ici</p>
        </div>
      )}
    </div>
  )
}

export default MemberSessionHistory

