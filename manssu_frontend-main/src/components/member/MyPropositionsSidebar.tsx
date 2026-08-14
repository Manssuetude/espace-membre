import { Theme } from '../../types/theme'
import { formatDate as formatDateUtil } from '../../utils/dateUtils'

interface MyPropositionsSidebarProps {
  themes: Theme[]
}

const MyPropositionsSidebar = ({ themes }: MyPropositionsSidebarProps) => {
  const formatDate = (dateString: string | null) => {
    return formatDateUtil(dateString, { includeTime: false, showRelative: true })
  }

  const getStatusLabel = (status: Theme['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'En vérification', color: 'bg-warning/20 text-warning' }
      case 'approved':
        return { label: 'Approuvé', color: 'bg-success/20 text-success' }
      case 'rejected':
        return { label: 'Rejeté', color: 'bg-red-500/20 text-red-500' }
      default:
        return { label: status, color: 'bg-gray-500/20 text-gray-500' }
    }
  }

  if (themes.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mes propositions</h3>
        <p className="text-gray-500 text-sm text-center py-4">Aucune proposition pour le moment</p>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Mes propositions</h3>
      <div className="space-y-3">
        {themes.map((theme) => {
          const status = getStatusLabel(theme.status)
          return (
            <div key={theme.id} className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-primary/30">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm flex-1 pr-2">{theme.title}</h4>
                <span className={`px-2 py-1 ${status.color} text-xs font-semibold rounded flex-shrink-0`}>
                  {status.label}
                </span>
              </div>
              {theme.submittedAt && (
                <p className="text-xs text-gray-600 mb-2">Proposé {formatDate(theme.submittedAt)}</p>
              )}
              {theme.status === 'pending' && (
                <div className="flex items-center text-xs text-gray-500">
                  <i className="fa-solid fa-clock mr-1"></i>
                  Réponse sous 24-48h
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MyPropositionsSidebar

