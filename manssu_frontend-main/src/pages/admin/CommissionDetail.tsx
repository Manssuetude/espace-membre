import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  useCommission,
  useUpdateCommission,
  useDeleteCommission,
  useAssignLeader,
  useRemoveLeader,
  useCommissionApplications,
  useApproveApplication,
  useRejectApplication,
  useRemoveMember,
  useAddMember,
} from '../../services/hooks/useCommissions'
import { useMembers } from '../../services/hooks/useMembers'
import { CommissionDetail as CommissionDetailType } from '../../types/commission'
import SearchableDropdown from '../../components/SearchableDropdown'

const CommissionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [activeTab, setActiveTab] = useState<'members' | 'applications'>('members')

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    maxMembers: null as number | null,
    status: 'active' as 'active' | 'archived',
  })

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Leader modal
  const [showLeaderModal, setShowLeaderModal] = useState(false)
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null)

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectApplicationId, setRejectApplicationId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Remove member modal
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false)
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null)

  // Add member modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [selectedAddMemberId, setSelectedAddMemberId] = useState<string | null>(null)

  // Queries
  const { data: commission, isLoading } = useCommission(id || '')

  const { data: applicationsData, isLoading: loadingApplications } = useCommissionApplications(
    id || '',
    { status: 'pending', limit: 50 }
  )

  const { data: membersData } = useMembers({ limit: 100 })

  // Mutations
  const updateMutation = useUpdateCommission()
  const deleteMutation = useDeleteCommission()
  const assignLeaderMutation = useAssignLeader()
  const removeLeaderMutation = useRemoveLeader()
  const approveMutation = useApproveApplication()
  const rejectMutation = useRejectApplication()
  const removeMemberMutation = useRemoveMember()
  const addMemberMutation = useAddMember()

  const handleUpdate = () => {
    if (!id || !editForm.name.trim()) return
    updateMutation.mutate(
      {
        id,
        data: {
          name: editForm.name,
          description: editForm.description || undefined,
          maxMembers: editForm.maxMembers,
          status: isSuperAdmin ? editForm.status : undefined,
        },
      },
      {
        onSuccess: () => {
          setShowEditModal(false)
        },
      }
    )
  }

  const handleDelete = () => {
    if (!id) return
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setShowDeleteModal(false)
        navigate('/admin/commissions')
      },
    })
  }

  const handleAssignLeader = () => {
    if (!id || !selectedLeaderId) return
    assignLeaderMutation.mutate(
      { id, data: { userId: selectedLeaderId } },
      {
        onSuccess: () => {
          setShowLeaderModal(false)
          setSelectedLeaderId(null)
        },
      }
    )
  }

  const handleRemoveLeader = () => {
    if (!id) return
    removeLeaderMutation.mutate(id)
  }

  const handleApprove = (applicationId: string) => {
    if (!id) return
    approveMutation.mutate({ commissionId: id, applicationId })
  }

  const handleReject = () => {
    if (!id || !rejectApplicationId) return
    rejectMutation.mutate(
      {
        commissionId: id,
        applicationId: rejectApplicationId,
        data: rejectReason ? { reason: rejectReason } : undefined,
      },
      {
        onSuccess: () => {
          setShowRejectModal(false)
          setRejectApplicationId(null)
          setRejectReason('')
        },
      }
    )
  }

  const handleRemoveMember = () => {
    if (!id || !removeMemberId) return
    removeMemberMutation.mutate(
      { commissionId: id, userId: removeMemberId },
      {
        onSuccess: () => {
          setShowRemoveMemberModal(false)
          setRemoveMemberId(null)
        },
      }
    )
  }

  const handleAddMember = () => {
    if (!id || !selectedAddMemberId) return
    addMemberMutation.mutate(
      { commissionId: id, data: { userId: selectedAddMemberId } },
      {
        onSuccess: () => {
          setShowAddMemberModal(false)
          setSelectedAddMemberId(null)
        },
      }
    )
  }

  const openEdit = (detail: CommissionDetailType) => {
    setEditForm({
      name: detail.name,
      description: detail.description || '',
      maxMembers: detail.maxMembers,
      status: detail.status,
    })
    setShowEditModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const memberOptions = (membersData?.data || []).map((m: any) => ({
    value: m.id,
    label: `${m.firstName} ${m.lastName}`,
  }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    )
  }

  if (!commission) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/admin/commissions')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Retour aux commissions</span>
        </button>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-people-group text-gray-400 text-3xl"></i>
          </div>
          <p className="text-gray-500 text-lg">Commission non trouvée</p>
        </div>
      </div>
    )
  }

  const memberCount = commission.memberCount ?? (commission as any).member_count ?? 0
  const maxMembers = commission.maxMembers ?? (commission as any).max_members
  const pendingCount = commission.pendingApplicationsCount ?? (commission as any).pending_applications_count ?? 0
  const leaderFirstName = commission.leader?.firstName || (commission.leader as any)?.first_name || ''
  const leaderLastName = commission.leader?.lastName || (commission.leader as any)?.last_name || ''
  const createdAt = commission.createdAt || (commission as any).created_at || ''
  const updatedAt = commission.updatedAt || (commission as any).updated_at || ''
  const canManage = isSuperAdmin || commission.isLeader

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/commissions')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <i className="fa-solid fa-arrow-left"></i>
        <span>Retour aux commissions</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8">
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{commission.name}</h1>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                  commission.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {commission.status === 'active' ? 'Active' : 'Archivée'}
              </span>
              {pendingCount > 0 && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full whitespace-nowrap">
                  {pendingCount} candidature{pendingCount > 1 ? 's' : ''} en attente
                </span>
              )}
            </div>
            {commission.description && (
              <p className="text-gray-600 leading-relaxed max-w-2xl whitespace-pre-line">{commission.description}</p>
            )}
          </div>

          {/* Actions */}
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => openEdit(commission)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                <i className="fa-solid fa-edit mr-1"></i>
                Modifier
              </button>
              {isSuperAdmin && (
                <>
                  {commission.leader ? (
                    <button
                      onClick={handleRemoveLeader}
                      disabled={removeLeaderMutation.isPending}
                      className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                    >
                      {removeLeaderMutation.isPending ? (
                        <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                      ) : (
                        <i className="fa-solid fa-crown mr-1"></i>
                      )}
                      <span className="hidden sm:inline">Retirer le leader</span>
                      <span className="sm:hidden">Retirer leader</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowLeaderModal(true)}
                      className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-lg hover:bg-yellow-200 transition-colors"
                    >
                      <i className="fa-solid fa-crown mr-1"></i>
                      <span className="hidden sm:inline">Assigner un leader</span>
                      <span className="sm:hidden">Assigner leader</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3 py-1.5 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <i className="fa-solid fa-trash mr-1"></i>
                    Supprimer
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-crown text-yellow-600 text-sm sm:text-base"></i>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500">Leader</span>
          </div>
          {commission.leader ? (
            <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{leaderFirstName} {leaderLastName}</p>
          ) : (
            <p className="text-gray-400 italic text-sm sm:text-base">Non assigné</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-users text-blue-600 text-sm sm:text-base"></i>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500">Membres</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm sm:text-base">
            {memberCount}
            {maxMembers !== null && maxMembers !== undefined && (
              <span className="text-gray-400 font-normal"> / {maxMembers}</span>
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-calendar-plus text-green-600 text-sm sm:text-base"></i>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500">Créée le</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm sm:text-base">{createdAt ? formatDate(createdAt) : '-'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-clock-rotate-left text-purple-600 text-sm sm:text-base"></i>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500">Mise à jour</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm sm:text-base">{updatedAt ? formatDate(updatedAt) : '-'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="border-b border-gray-200 px-4 sm:px-6 overflow-x-auto">
          <div className="flex items-center gap-4 sm:gap-6 min-w-max">
            <button
              onClick={() => setActiveTab('members')}
              className={`py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'members'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="fa-solid fa-users mr-1 sm:mr-2"></i>
              Membres ({memberCount})
            </button>
            {canManage && (
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'applications'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="fa-solid fa-paper-plane mr-1 sm:mr-2"></i>
                Candidatures ({applicationsData?.total || 0})
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'members' ? (
            <div className="space-y-3">
              {/* Add member button */}
              {canManage && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  <span>Ajouter un membre</span>
                </button>
              )}

              {commission.members && commission.members.length > 0 ? (
                commission.members.map((member: any) => {
                  const userData = member.user || member
                  const memberId = userData.id || member.userId || member.id
                  const firstName = userData.firstName || userData.first_name || ''
                  const lastName = userData.lastName || userData.last_name || ''
                  const email = userData.email || ''
                  const joinedAt = member.joinedAt || member.joined_at || member.createdAt || ''
                  const leaderId = commission.leader?.id

                  return (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-red-600 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-medium flex-shrink-0">
                          {firstName[0] || '?'}
                          {lastName[0] || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                              {firstName} {lastName}
                            </p>
                            {leaderId === memberId && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full whitespace-nowrap">
                                <i className="fa-solid fa-crown mr-1"></i>
                                Leader
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{email}</p>
                          {joinedAt && (
                            <p className="text-xs text-gray-400">
                              Membre depuis {formatDate(joinedAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                        <a
                          href={`/admin/membres/${memberId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors"
                          title="Voir le profil"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </a>
                        {canManage && leaderId !== memberId && (
                          <button
                            onClick={() => {
                              setRemoveMemberId(memberId)
                              setShowRemoveMemberModal(true)
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Retirer le membre"
                          >
                            <i className="fa-solid fa-user-minus"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-users text-gray-400 text-2xl"></i>
                  </div>
                  <p className="text-gray-500">Aucun membre dans cette commission</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {loadingApplications ? (
                <div className="flex items-center justify-center py-8">
                  <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
                </div>
              ) : applicationsData?.data && applicationsData.data.length > 0 ? (
                applicationsData.data.map((application: any) => {
                  const userData = application.user || application
                  const userId = userData.id || application.userId || application.user_id || ''
                  const firstName = userData.firstName || userData.first_name || ''
                  const lastName = userData.lastName || userData.last_name || ''
                  const email = userData.email || ''
                  const createdAt = application.createdAt || application.created_at || ''

                  return (
                    <div key={application.id} className="p-3 sm:p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-medium flex-shrink-0">
                              {firstName[0] || '?'}
                              {lastName[0] || '?'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                  {firstName} {lastName}
                                </p>
                                {userId && (
                                  <a
                                    href={`/admin/membres/${userId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent hover:text-accent/80 transition-colors flex-shrink-0"
                                    title="Voir le profil"
                                  >
                                    <i className="fa-solid fa-external-link text-xs"></i>
                                  </a>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">{email}</p>
                            </div>
                          </div>
                          <div className="ml-0 sm:ml-[52px]">
                            <p className="text-sm text-gray-700 mb-2 whitespace-pre-line">{application.reason}</p>
                            {createdAt && (
                              <p className="text-xs text-gray-500">
                                Candidature soumise le {formatDate(createdAt)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-start flex-shrink-0">
                          <button
                            onClick={() => handleApprove(application.id)}
                            disabled={approveMutation.isPending}
                            className="px-2.5 sm:px-3 py-1.5 bg-green-100 text-green-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            {approveMutation.isPending ? (
                              <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                              <>
                                <i className="fa-solid fa-check mr-1"></i>
                                Approuver
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRejectApplicationId(application.id)
                              setShowRejectModal(true)
                            }}
                            className="px-2.5 sm:px-3 py-1.5 bg-red-100 text-red-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <i className="fa-solid fa-xmark mr-1"></i>
                            Rejeter
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-paper-plane text-gray-400 text-2xl"></i>
                  </div>
                  <p className="text-gray-500">Aucune candidature en attente</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Modifier la commission</h3>
                <button
                  onClick={() => setShowEditModal(false)}
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
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre maximum de membres
                </label>
                <input
                  type="number"
                  value={editForm.maxMembers ?? ''}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      maxMembers: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  placeholder="Laisser vide pour illimité"
                  min="1"
                />
              </div>

              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditForm({ ...editForm, status: 'active' })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        editForm.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setEditForm({ ...editForm, status: 'archived' })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        editForm.status === 'archived'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Archivée
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdate}
                disabled={!editForm.name.trim() || updateMutation.isPending}
                className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-save"></i>
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-trash text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Supprimer la commission ?
              </h3>
              <p className="text-gray-600 text-center">
                Cette action est irréversible. Tous les membres et candidatures seront supprimés.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-6 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Suppression...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-trash"></i>
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leader Modal */}
      {showLeaderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Assigner un leader</h3>
                <button
                  onClick={() => {
                    setShowLeaderModal(false)
                    setSelectedLeaderId(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              <SearchableDropdown
                label="Sélectionner un membre"
                options={memberOptions}
                value={selectedLeaderId || ''}
                onChange={(value) => setSelectedLeaderId(value)}
                placeholder="Rechercher un membre..."
                allowCustom={false}
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowLeaderModal(false)
                  setSelectedLeaderId(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignLeader}
                disabled={!selectedLeaderId || assignLeaderMutation.isPending}
                className="px-6 py-2 bg-yellow-500 text-white font-medium rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {assignLeaderMutation.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Assignation...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-crown"></i>
                    Assigner
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Rejeter la candidature</h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectApplicationId(null)
                    setRejectReason('')
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du rejet (optionnel)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
                placeholder="Expliquez pourquoi la candidature est rejetée..."
              />
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectApplicationId(null)
                  setRejectReason('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="px-6 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {rejectMutation.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Rejet...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-xmark"></i>
                    Rejeter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {showRemoveMemberModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-user-minus text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Retirer ce membre ?
              </h3>
              <p className="text-gray-600 text-center">
                Le membre sera retiré de la commission. Il pourra candidater à nouveau.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setShowRemoveMemberModal(false)
                  setRemoveMemberId(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={removeMemberMutation.isPending}
                className="px-6 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {removeMemberMutation.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Retrait...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-minus"></i>
                    Retirer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Ajouter un membre
                </h3>
                <button
                  onClick={() => {
                    setShowAddMemberModal(false)
                    setSelectedAddMemberId(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Ajouter directement un membre sans passer par la candidature
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un membre
                </label>
                <SearchableDropdown
                  options={(() => {
                    const existingMemberIds = new Set(
                      (commission?.members || []).map((m: any) => {
                        const userData = m.user || m
                        return userData.id || m.userId || m.id
                      })
                    )

                    return (membersData?.data || [])
                      .filter((m: any) => m.role !== 'guest' && !existingMemberIds.has(m.id))
                      .map((m: any) => ({
                        value: m.id,
                        label: `${m.firstName} ${m.lastName}`,
                        sublabel: m.email,
                      }))
                  })()}
                  value={selectedAddMemberId || ''}
                  onChange={setSelectedAddMemberId}
                  placeholder="Rechercher un membre..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddMemberModal(false)
                  setSelectedAddMemberId(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMember}
                disabled={!selectedAddMemberId || addMemberMutation.isPending}
                className="px-6 py-2 bg-gradient-to-r from-primary to-red-500 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {addMemberMutation.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Ajout...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-plus"></i>
                    Ajouter
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

export default CommissionDetail

