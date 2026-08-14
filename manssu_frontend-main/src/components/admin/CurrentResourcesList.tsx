import { translateResourceType } from '../../utils/resourceUtils'

interface CurrentResource {
  title: string
  type: string
  icon: string
  color: string
  session: string
  addedDate: string
  resourceId: string
  link: string
  description: string
}

interface CurrentResourcesListProps {
  resources: CurrentResource[]
  onEditResource: (resource: CurrentResource) => void
  onDeleteResource: (resource: { resourceId: string; title: string }) => void
}

const CurrentResourcesList = ({ resources, onEditResource, onDeleteResource }: CurrentResourcesListProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <i className="fa-solid fa-folder-open text-primary mr-2"></i>
          Ressources de la prochaine session
        </h3>
        <span className="bg-gradient-to-r from-primary to-red-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
          {resources.length} ressources actives
        </span>
      </div>
      {resources.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-folder-open text-primary text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">Aucune ressource pour la prochaine session</p>
          <p className="text-gray-400 text-xs">Aucune ressource n'est actuellement liée à la prochaine session</p>
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource, idx) => {
            const iconColorClass =
              resource.color === 'primary'
                ? 'text-primary'
                : resource.color === 'accent'
                ? 'text-accent'
                : 'text-success'
            return (
              <div key={idx} className="p-4 sm:p-5 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3">
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0 w-full sm:w-auto">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${
                        resource.color === 'primary'
                          ? 'from-primary/10 to-red-500/10'
                          : resource.color === 'accent'
                          ? 'from-accent/10 to-blue-600/10'
                          : 'from-success/10 to-emerald-600/10'
                      } rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <i className={`fa-solid ${resource.icon} ${iconColorClass} text-lg sm:text-xl`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 break-words">{resource.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words">
                        {translateResourceType(resource.type)}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 break-words hidden sm:block overflow-hidden text-ellipsis whitespace-nowrap">
                        <i className="fa-solid fa-align-left mr-1 text-accent"></i>
                        {resource.description || 'Aucune description disponible'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3 sm:space-x-4 text-xs text-gray-500 w-full sm:w-auto sm:ml-0">
                    <span className="flex items-center sm:hidden break-words w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      <i className="fa-solid fa-align-left mr-1 text-accent flex-shrink-0"></i>
                      <span className="break-words">{resource.description || 'Aucune description disponible'}</span>
                    </span>
                    <span className="flex items-center">
                      <i className="fa-solid fa-calendar mr-1 flex-shrink-0"></i>
                      Ajouté le {resource.addedDate}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-gradient-to-r from-accent to-blue-600 text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-medium text-center"
                  >
                    <i className="fa-solid fa-eye mr-2"></i>
                    Consulter
                  </a>
                  <button
                    onClick={() => onEditResource(resource)}
                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-xs sm:text-sm font-medium"
                  >
                    <i className="fa-solid fa-edit mr-2"></i>
                    Modifier
                  </button>
                  <button
                    onClick={() => onDeleteResource({ resourceId: resource.resourceId, title: resource.title })}
                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-xs sm:text-sm font-medium"
                  >
                    <i className="fa-solid fa-trash mr-2"></i>
                    Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CurrentResourcesList

