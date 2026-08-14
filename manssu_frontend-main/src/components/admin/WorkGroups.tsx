import { Session } from '../../types/session'

interface WorkGroupsProps {
  session: Session
  onCreateGroupsClick: () => void
}

const WorkGroups = ({ session, onCreateGroupsClick }: WorkGroupsProps) => {
  const getColorClasses = (color: string, type: 'bg' | 'border' | 'text') => {
    const colorMap: { [key: string]: { bg: string; border: string; text: string } } = {
      primary: {
        bg: 'from-primary/5 to-red-500/5',
        border: 'border-primary/20',
        text: 'text-primary',
      },
      accent: {
        bg: 'from-accent/5 to-blue-500/5',
        border: 'border-accent/20',
        text: 'text-accent',
      },
      secondary: {
        bg: 'from-secondary/5 to-orange-500/5',
        border: 'border-secondary/20',
        text: 'text-secondary',
      },
      warning: {
        bg: 'from-warning/5 to-yellow-500/5',
        border: 'border-warning/20',
        text: 'text-warning',
      },
    }
    return colorMap[color]?.[type] || colorMap.primary[type]
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
          <i className="fa-solid fa-users-line text-secondary mr-2 sm:mr-3"></i>
          Groupes de travail
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2 sm:space-y-0">
          <button
            onClick={onCreateGroupsClick}
            className="bg-gradient-to-r from-success to-emerald-500 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg transition-all"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            Créer groupes
          </button>
          <button className="bg-gradient-to-r from-secondary to-orange-600 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium hover:shadow-lg transition-all">
            <i className="fa-solid fa-shuffle mr-2"></i>
            Réorganiser
          </button>
        </div>
      </div>

      {!session.workGroups || session.workGroups.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-users-line text-gray-400 text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm">Aucun groupe de travail créé</p>
          <p className="text-gray-400 text-xs mt-1">Créez des groupes pour organiser les participants</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {session.workGroups.map((group, idx) => (
          <div
            key={idx}
            className={`border-2 ${getColorClasses(group.color, 'border')} bg-gradient-to-br ${getColorClasses(group.color, 'bg')} rounded-xl p-4`}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center min-w-0">
                <span
                  className={`w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r ${
                    group.color === 'primary'
                      ? 'from-primary to-red-500'
                      : 'from-accent to-blue-600'
                  } text-white rounded-lg flex items-center justify-center text-xs sm:text-sm mr-2 flex-shrink-0`}
                >
                  {group.letter}
                </span>
                <span className="truncate">{group.name}</span>
              </h3>
              <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0 ml-2">{group.members.length} membres</span>
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              {group.members.map((member, memberIdx) => (
                <div key={memberIdx} className="flex items-center bg-white/50 rounded-lg p-1.5 sm:p-2">
                  <img
                    src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/${member.avatar}`}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover mr-2 sm:mr-3 flex-shrink-0"
                    alt={member.name}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{member.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  )
}

export default WorkGroups

