import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  useCommission,
  useApplyToCommission,
  useWithdrawApplication,
} from '../../services/hooks/useCommissions'

const CommissionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isGuest = user?.role === 'guest'

  const { data: commission, isLoading } = useCommission(id || '')

  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyReason, setApplyReason] = useState('')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const applyMutation = useApplyToCommission()
  const withdrawMutation = useWithdrawApplication()

  const handleApply = () => {
    if (!id || applyReason.trim().length < 10) return
    applyMutation.mutate(
      { id, data: { reason: applyReason } },
      {
        onSuccess: () => {
          setShowApplyModal(false)
          setApplyReason('')
        },
      }
    )
  }

  const handleWithdraw = () => {
    if (!id) return
    withdrawMutation.mutate(id, {
      onSuccess: () => {
        setShowWithdrawModal(false)
      },
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

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
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Retour</span>
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
  const pendingApp = commission.myPendingApplication ?? (commission as any).my_pending_application
  const isMember = commission.isMember ?? (commission as any).is_member ?? false
  const isLeader = commission.isLeader ?? (commission as any).is_leader ?? false
  const leaderFirstName = commission.leader?.firstName || (commission.leader as any)?.first_name || ''
  const leaderLastName = commission.leader?.lastName || (commission.leader as any)?.last_name || ''
  const createdAt = commission.createdAt || (commission as any).created_at || ''
  const updatedAt = commission.updatedAt || (commission as any).updated_at || ''
  const isFull = maxMembers !== null && maxMembers !== undefined && memberCount >= maxMembers

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <i className="fa-solid fa-arrow-left"></i>
        <span>Retour</span>
      </button>

      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-red-50 to-orange-50 rounded-2xl p-6 sm:p-8 border border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-red-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <i className="fa-solid fa-people-group text-white text-2xl"></i>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
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
              </div>
              {commission.description && (
                <p className="text-gray-700 leading-relaxed mt-2 whitespace-pre-line">{commission.description}</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex-shrink-0">
            {isMember ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-xl">
                <i className="fa-solid fa-check"></i>
                {isLeader ? 'Leader' : 'Membre'}
              </span>
            ) : pendingApp ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-xl">
                  <i className="fa-solid fa-clock"></i>
                  Candidature en cours
                </span>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl text-sm transition-colors"
                  title="Retirer la candidature"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ) : !isGuest && commission.status === 'active' && !isFull ? (
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <i className="fa-solid fa-paper-plane"></i>
                Candidater
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Leader */}
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
            <p className="text-gray-400 italic text-sm sm:text-base">Aucun leader assigné</p>
          )}
        </div>

        {/* Members count */}
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

        {/* Created at */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-calendar-plus text-green-600 text-sm sm:text-base"></i>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-500">Créée le</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm sm:text-base">{createdAt ? formatDate(createdAt) : '-'}</p>
        </div>

        {/* Updated at */}
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

      {/* Status notices */}
      {commission.status === 'archived' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <i className="fa-solid fa-archive text-gray-500"></i>
          <p className="text-gray-600">Cette commission est archivée et n'accepte plus de candidatures.</p>
        </div>
      )}

      {isFull && commission.status === 'active' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <i className="fa-solid fa-user-lock text-orange-500"></i>
          <p className="text-orange-700">Cette commission est complète ({memberCount}/{maxMembers} membres).</p>
        </div>
      )}

      {/* Members list */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-accent to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-users text-white text-sm sm:text-base"></i>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Membres
            <span className="text-gray-400 font-normal ml-2">({memberCount})</span>
          </h2>
        </div>

        {commission.members && commission.members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {commission.members.map((member: any) => {
              const userData = member.user || member
              const memberId = userData.id || member.userId || member.id
              const firstName = userData.firstName || userData.first_name || ''
              const lastName = userData.lastName || userData.last_name || ''
              const email = userData.email || ''
              const joinedAt = member.joinedAt || member.joined_at || ''
              const isLeaderMember = commission.leader?.id === memberId

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-red-600 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-medium flex-shrink-0">
                    {firstName[0] || '?'}{lastName[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {firstName} {lastName}
                      </p>
                      {isLeaderMember && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex-shrink-0">
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
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-users text-gray-400 text-2xl"></i>
            </div>
            <p className="text-gray-500">Aucun membre dans cette commission</p>
          </div>
        )}
      </section>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Candidater à cette commission</h3>
                <button
                  onClick={() => {
                    setShowApplyModal(false)
                    setApplyReason('')
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-br from-primary/5 to-red-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-1">{commission.name}</h4>
                {commission.description && (
                  <p className="text-sm text-gray-600 whitespace-pre-line">{commission.description}</p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={applyReason}
                    onChange={(e) => setApplyReason(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
                    placeholder="Expliquez pourquoi vous souhaitez rejoindre cette commission et ce que vous pouvez y apporter (minimum 10 caractères)..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {applyReason.length} / 2000 caractères (minimum 10)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowApplyModal(false)
                  setApplyReason('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleApply}
                disabled={applyReason.trim().length < 10 || applyMutation.isPending}
                className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {applyMutation.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Envoi...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i>
                    Envoyer ma candidature
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Retirer votre candidature ?
              </h3>
              <p className="text-gray-600 text-center">
                Êtes-vous sûr de vouloir retirer votre candidature ? Cette action est irréversible.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-center gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending}
                className="px-6 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {withdrawMutation.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Retrait...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-xmark"></i>
                    Retirer
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

