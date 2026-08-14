import { useNavigate } from 'react-router-dom'
import { Session } from '../../types/session'
import { formatTimeWithoutSeconds } from '../../utils/resourceUtils'

interface SessionsListProps {
  sessions: Session[]
}

const SessionsList = ({ sessions }: SessionsListProps) => {
  const navigate = useNavigate()

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune session à venir</p>
      </div>
    )
  }

  return (
    <div>
      {sessions.map((session) => {
        const sessionDate = session.date ? new Date(session.date) : null
        const day = sessionDate ? sessionDate.getDate() : null
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
        const month = sessionDate ? monthNames[sessionDate.getMonth()] : null
        const timeStr = session.startTime && session.endTime
          ? `${formatTimeWithoutSeconds(session.startTime)} - ${formatTimeWithoutSeconds(session.endTime)}`
          : 'non défini'
        const participants = `${session.registered}/${session.maxParticipants}`
        
        return (
          <div
            key={session.id}
            onClick={() => navigate(`/sessions/${session.id}`)}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-6 cursor-pointer hover:shadow-xl transition-all"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="flex items-center space-x-4">
                {day && month ? (
                  <>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{day}</div>
                      <div className="text-sm font-medium text-gray-600">{month}</div>
                    </div>
                    <div className="h-16 w-px bg-gray-200 hidden sm:block"></div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-400">-</div>
                    <div className="text-sm font-medium text-gray-400">-</div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{session.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">Thème: {session.theme || 'non défini'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <i className="fa-solid fa-clock text-primary mr-2"></i>
                    {timeStr}
                  </div>
                  <div className="flex items-center">
                    <i className="fa-solid fa-map-marker-alt text-accent mr-2"></i>
                    {session.location?.address || 'non défini'}
                  </div>
                  <div className="flex items-center">
                    <i className="fa-solid fa-users text-success mr-2"></i>
                    {participants} participants
                  </div>
                </div>
              </div>
              {session.isRegistered && (
                <div className="flex-shrink-0">
                  <span className="px-4 py-2 bg-gradient-to-r from-success to-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-success/30">
                    Inscrit
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SessionsList

