import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Resource } from '../../types/resource'

interface ResourcesSidebarProps {
  pendingCount: number
  currentCount: number
  resources: Resource[]
}

const ResourcesSidebar = ({ resources }: ResourcesSidebarProps) => {
  // Calculate stats
  const stats = useMemo(() => {
    const pending = resources.filter((r) => r.status === 'pending').length
    const validated = resources.filter((r) => r.status === 'approved').length
    const rejected = resources.filter((r) => r.status === 'rejected').length
    const total = resources.length

    return { pending, validated, rejected, total }
  }, [resources])

  // Calculate resource types
  const resourceTypes = useMemo(() => {
    const typeCounts: Record<string, number> = {
      file: 0,
      folder: 0,
      video: 0,
      audio: 0,
    }

    resources.forEach((resource) => {
      if (resource.type in typeCounts) {
        typeCounts[resource.type]++
      }
    })

    return typeCounts
  }, [resources])

  // Get recent activity (last 5 resources sorted by updatedAt or createdAt)
  const recentActivity = useMemo(() => {
    return resources
      .map((resource) => ({
        ...resource,
        activityDate: resource.updatedAt || resource.createdAt,
      }))
      .sort((a, b) => {
        if (!a.activityDate || !b.activityDate) return 0
        return new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
      })
      .slice(0, 5)
      .map((resource) => {
        const date = resource.activityDate ? new Date(resource.activityDate) : new Date()
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        let timeAgo = ''
        if (diffMins < 60) {
          timeAgo = `Il y a ${diffMins} min`
        } else if (diffHours < 24) {
          timeAgo = `Il y a ${diffHours}h`
        } else if (diffDays === 1) {
          timeAgo = 'Il y a 1j'
        } else {
          timeAgo = `Il y a ${diffDays}j`
        }

                // Determine activity type based on status
                const activityType = resource.status === 'approved' ? 'validated' : resource.status === 'rejected' ? 'rejected' : 'new'
                const activityLabel = resource.status === 'approved' ? 'Ressource validée' : resource.status === 'rejected' ? 'Ressource rejetée' : 'Nouvelle ressource'

        return {
          title: resource.title,
          timeAgo,
          activityType,
          activityLabel,
        }
      })
  }, [resources])

  return (
    <div className="space-y-6">
      {/* Actions rapides */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="space-y-3">
          <Link
            to="/admin/ressources/add"
            className="w-full px-4 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            Ajouter une ressource
          </Link>
          <Link
            to="/admin/ressources/past"
            className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-primary/30 transition-all font-medium flex items-center justify-center"
          >
            <i className="fa-solid fa-history mr-2"></i>
            Sessions passées
          </Link>
        </div>
      </div>

      {/* Statistiques */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i className="fa-solid fa-chart-bar text-accent mr-2"></i>
          Statistiques
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">En attente</span>
            <span className="text-lg font-semibold text-warning">{stats.pending}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Validées</span>
            <span className="text-lg font-semibold text-success">{stats.validated}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rejetées</span>
            <span className="text-lg font-semibold text-gray-400">{stats.rejected}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-xl font-bold text-gray-900">{stats.total}</span>
          </div>
        </div>
      </div>

      {/* Types de ressources */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <i className="fa-solid fa-folder-open text-secondary mr-2"></i>
            Types de ressources
          </h3>
        </div>
        <div className="space-y-3">
          {resourceTypes.file > 0 && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="fa-solid fa-file-pdf text-red-600 text-sm"></i>
                </div>
                <span className="text-sm font-medium text-gray-900">Fichiers</span>
              </div>
              <span className="text-xs text-red-600 font-medium">
                {resourceTypes.file} fichier{resourceTypes.file > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {resourceTypes.folder > 0 && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="fa-solid fa-folder text-blue-600 text-sm"></i>
                </div>
                <span className="text-sm font-medium text-gray-900">Dossiers</span>
              </div>
              <span className="text-xs text-blue-600 font-medium">
                {resourceTypes.folder} dossier{resourceTypes.folder > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {resourceTypes.video > 0 && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="fa-solid fa-video text-purple-600 text-sm"></i>
                </div>
                <span className="text-sm font-medium text-gray-900">Vidéos</span>
              </div>
              <span className="text-xs text-purple-600 font-medium">
                {resourceTypes.video} vidéo{resourceTypes.video > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {resourceTypes.audio > 0 && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <i className="fa-solid fa-headphones text-green-600 text-sm"></i>
                </div>
                <span className="text-sm font-medium text-gray-900">Audio</span>
              </div>
              <span className="text-xs text-green-600 font-medium">
                {resourceTypes.audio} audio
              </span>
            </div>
          )}

          {Object.values(resourceTypes).every((count) => count === 0) && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Aucune ressource disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i className="fa-solid fa-clock-rotate-left text-accent mr-2"></i>
          Activité récente
        </h3>
        {recentActivity.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Aucune activité récente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => {
              const getActivityIcon = () => {
                if (activity.activityType === 'validated') {
                  return 'fa-check'
                }
                if (activity.activityType === 'rejected') {
                  return 'fa-times'
                }
                return 'fa-upload'
              }

              const getActivityColor = () => {
                if (activity.activityType === 'validated') {
                  return 'from-success to-emerald-500'
                }
                if (activity.activityType === 'rejected') {
                  return 'from-red-500 to-red-600'
                }
                return 'from-warning to-yellow-500'
              }

              return (
                <div key={idx} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 bg-gradient-to-br ${getActivityColor()} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <i className={`fa-solid ${getActivityIcon()} text-white text-xs`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{activity.activityLabel}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {activity.title} • {activity.timeAgo}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ResourcesSidebar

