import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  useCommissions,
  useCreateCommission,
} from '../../services/hooks/useCommissions'
import Pagination from '../../components/Pagination'

const Commissions = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | undefined>('active')
  
  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    maxMembers: null as number | null,
  })

  // Queries
  const { data: commissionsData, isLoading: loadingCommissions } = useCommissions({
    status: statusFilter,
    page,
    limit: 10,
  })

  // Mutations
  const createMutation = useCreateCommission()

  const handleCreate = () => {
    if (!createForm.name.trim()) return
    createMutation.mutate(
      {
        name: createForm.name,
        description: createForm.description || undefined,
        maxMembers: createForm.maxMembers,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false)
          setCreateForm({ name: '', description: '', maxMembers: null })
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>
          <p className="text-gray-600">Gérer les groupes de travail de l'association</p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            Créer une commission
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Statut:</span>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Actives
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              statusFilter === 'archived'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Archivées
          </button>
        </div>
      </div>

      {/* Commissions List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        {loadingCommissions ? (
          <div className="flex items-center justify-center py-16">
            <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
          </div>
        ) : commissionsData && commissionsData.data.length > 0 ? (
          <>
            <div className="divide-y divide-gray-200">
              {commissionsData.data.map((commission: any) => {
                const pendingCount = commission.pendingApplicationsCount ?? commission.pending_applications_count ?? 0
                const memberCount = commission.memberCount ?? commission.member_count ?? 0
                const maxMembers = commission.maxMembers ?? commission.max_members
                const leaderFirstName = commission.leader?.firstName || commission.leader?.first_name || ''
                const leaderLastName = commission.leader?.lastName || commission.leader?.last_name || ''

                return (
                  <div
                    key={commission.id}
                    className="p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/commissions/${commission.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">{commission.name}</h3>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                              commission.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {commission.status === 'active' ? 'Active' : 'Archivée'}
                          </span>
                          {pendingCount > 0 && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full whitespace-nowrap">
                              {pendingCount} candidature{pendingCount > 1 ? 's' : ''} en attente
                            </span>
                          )}
                        </div>

                        {commission.description && (
                          <p className="text-sm text-gray-600 line-clamp-1 mb-2 whitespace-pre-line">
                            {commission.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          {commission.leader ? (
                            <span className="whitespace-nowrap">
                              <i className="fa-solid fa-crown text-yellow-500 mr-1"></i>
                              {leaderFirstName} {leaderLastName}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Pas de leader</span>
                          )}
                          <span className="whitespace-nowrap">
                            <i className="fa-solid fa-users mr-1"></i>
                            {memberCount}
                            {maxMembers !== null && maxMembers !== undefined && ` / ${maxMembers}`} membre
                            {memberCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/admin/commissions/${commission.id}`)
                          }}
                          className="p-2 text-gray-400 hover:text-primary transition-colors"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {commissionsData.totalPages > 1 && (
              <div className="p-4 border-t border-gray-200">
                <Pagination
                  currentPage={page}
                  totalPages={commissionsData.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-people-group text-gray-400 text-3xl"></i>
            </div>
            <p className="text-gray-500 text-lg">Aucune commission</p>
            <p className="text-sm text-gray-400 mt-1">
              {statusFilter === 'active'
                ? 'Aucune commission active'
                : 'Aucune commission archivée'}
            </p>
            {isSuperAdmin && statusFilter === 'active' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors"
              >
                Créer la première commission
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Créer une commission</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateForm({ name: '', description: '', maxMembers: null })
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  placeholder="Ex: Communication, IT & Développement..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
                  placeholder="Décrivez les responsabilités et missions de cette commission..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre maximum de membres
                </label>
                <input
                  type="number"
                  value={createForm.maxMembers ?? ''}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      maxMembers: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  placeholder="Laisser vide pour illimité"
                  min="1"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateForm({ name: '', description: '', maxMembers: null })
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={!createForm.name.trim() || createMutation.isPending}
                className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Création...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus"></i>
                    Créer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Commissions
