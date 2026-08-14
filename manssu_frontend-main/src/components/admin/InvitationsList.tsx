import { useState } from 'react'
import { useInvites, useCancelInvite } from '../../services/hooks/useInvitations'
import { InviteStatus } from '../../types/invitation'
import Dropdown from '../Dropdown'

interface InvitationsListProps {
  sessionId?: string
  showSessionTitle?: boolean
}

const InvitationsList = ({ sessionId, showSessionTitle = false }: InvitationsListProps) => {
  const [statusFilter, setStatusFilter] = useState<InviteStatus | 'all'>('all')
  const [emailSearch, setEmailSearch] = useState('')
  const { data: invites, isLoading } = useInvites({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    session_id: sessionId,
    email: emailSearch || undefined,
  })
  const cancelInvite = useCancelInvite()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: InviteStatus) => {
    const statusConfig = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      used: { label: 'Utilisée', color: 'bg-green-100 text-green-800' },
      expired: { label: 'Expirée', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
    }
    const config = statusConfig[status]
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const handleCancel = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette invitation ?')) {
      try {
        await cancelInvite.mutateAsync(id)
      } catch (error) {
        // Error handled by mutation
      }
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center justify-center py-8">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Invitations</h3>
        {invites && invites.length > 0 && (
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-lg">
            {invites.length} invitation{invites.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher par email..."
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="w-full sm:w-48">
          <Dropdown
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'pending', label: 'En attente' },
              { value: 'used', label: 'Utilisées' },
              { value: 'expired', label: 'Expirées' },
              { value: 'cancelled', label: 'Annulées' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InviteStatus | 'all')}
            placeholder="Filtrer par statut"
          />
        </div>
      </div>

      {!invites || invites.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-envelope text-gray-400 text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">Aucune invitation</p>
          <p className="text-gray-400 text-xs">Les invitations apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-gray-900 truncate">{invite.email}</p>
                    {getStatusBadge(invite.status)}
                  </div>
                  {showSessionTitle && invite.sessionTitle && (
                    <p className="text-sm text-gray-600 mb-2">
                      <i className="fa-solid fa-calendar mr-2"></i>
                      {invite.sessionTitle}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>
                      <i className="fa-solid fa-clock mr-1"></i>
                      Créée le {formatDate(invite.createdAt)}
                    </span>
                    <span>
                      <i className="fa-solid fa-calendar-times mr-1"></i>
                      Expire le {formatDate(invite.expiresAt)}
                    </span>
                    {invite.usedAt && (
                      <span>
                        <i className="fa-solid fa-check-circle mr-1"></i>
                        Utilisée le {formatDate(invite.usedAt)}
                      </span>
                    )}
                  </div>
                  {invite.usedByName && (
                    <p className="text-xs text-gray-500 mt-2">
                      Utilisée par: {invite.usedByName}
                    </p>
                  )}
                </div>
                {invite.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(invite.id)}
                    disabled={cancelInvite.isPending}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Annuler l'invitation"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default InvitationsList

