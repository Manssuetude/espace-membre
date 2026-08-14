import { Resource } from '../../types/resource'

interface SessionResourcesProps {
  resources: Resource[]
}

const SessionResources = ({ resources }: SessionResourcesProps) => {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'file':
        return 'fa-file-pdf'
      case 'video':
        return 'fa-video'
      case 'audio':
        return 'fa-headphones'
      case 'folder':
        return 'fa-folder'
      default:
        return 'fa-file'
    }
  }
  const getResourceColor = (idx: number) => {
    const colors = [
      { bg: 'from-red-50 to-orange-50', border: 'border-primary/20', button: 'text-primary border-primary hover:bg-primary hover:text-white', icon: 'from-primary to-secondary' },
      { bg: 'from-blue-50 to-indigo-50', border: 'border-accent/20', button: 'text-accent border-accent hover:bg-accent hover:text-white', icon: 'from-accent to-blue-600' },
      { bg: 'from-green-50 to-emerald-50', border: 'border-success/20', button: 'text-success border-success hover:bg-success hover:text-white', icon: 'from-success to-emerald-600' },
    ]
    return colors[idx % colors.length]
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
        <i className="fa-solid fa-folder-open text-primary mr-2 sm:mr-3"></i>
        Ressources de la session
      </h2>
      {!resources || resources.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-folder-open text-gray-400 text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm">Aucune ressource disponible</p>
          <p className="text-gray-400 text-xs mt-1">Ajoutez des ressources pour cette session</p>
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
          {resources.map((resource, idx) => {
          const color = getResourceColor(idx)
          return (
            <div
              key={resource.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 sm:p-4 bg-gradient-to-r ${color.bg} rounded-xl border ${color.border} hover:shadow-md transition-all`}
            >
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0 w-full sm:w-auto">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${color.icon} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <i className={`fa-solid ${getResourceIcon(resource.type)} text-white text-base sm:text-lg`}></i>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">{resource.title}</p>
                </div>
              </div>
              <a
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full sm:w-auto px-3 sm:px-4 py-2 bg-white border rounded-lg transition-all text-sm ${color.button} whitespace-nowrap flex-shrink-0 text-center inline-flex items-center justify-center`}
              >
                <i className="fa-solid fa-external-link mr-2"></i>
                Consulter
              </a>
            </div>
          )
        })}
        </div>
      )}
    </div>
  )
}

export default SessionResources

