import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  useCancelLibraryLoan,
  useConfirmLibraryHandoverBorrower,
  useConfirmLibraryHandoverOwner,
  useConfirmLibraryReturnOwner,
  useInitiateLibraryReturn,
  useLibraryLoan,
} from '../../services/hooks/useLibrary'
import { getLibraryStatusLabel } from '../../utils/libraryUtils'

const statusColorMap: Record<string, string> = {
  pending_handover: 'bg-blue-100 text-blue-700 border border-blue-200',
  active: 'bg-green-100 text-green-700 border border-green-200',
  pending_return: 'bg-amber-100 text-amber-700 border border-amber-200',
  completed: 'bg-purple-100 text-purple-700 border border-purple-200',
  cancelled: 'bg-red-100 text-red-700 border border-red-200',
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Non défini'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getBookImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return '/logo.png'
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  const backend = import.meta.env.VITE_BACKEND_URL || ''
  const normalized = imageUrl.startsWith('./') ? imageUrl.slice(1) : imageUrl
  return `${backend}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
}

const getMemberDisplayName = (member?: {
  name?: string
  firstName?: string
  lastName?: string
  email?: string
}) => {
  return member?.name || `${member?.firstName || ''} ${member?.lastName || ''}`.trim() || member?.email || 'Membre'
}

const BibliothequeLoanDetail = () => {
  const { id = '' } = useParams()
  const { user } = useAuth()

  const { data: loan, isLoading } = useLibraryLoan(id)

  const confirmOwnerHandoverMutation = useConfirmLibraryHandoverOwner()
  const confirmBorrowerHandoverMutation = useConfirmLibraryHandoverBorrower()
  const initiateReturnMutation = useInitiateLibraryReturn()
  const confirmReturnOwnerMutation = useConfirmLibraryReturnOwner()
  const cancelLoanMutation = useCancelLibraryLoan()

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const isOwner = loan?.ownerId === user?.id
  const isBorrower = loan?.borrowerId === user?.id

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
      </div>
    )
  }

  if (!loan) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <p className="text-gray-700">Prêt introuvable.</p>
        <Link to="/association/bibliotheque" className="text-primary text-sm mt-3 inline-block">
          Retour à la bibliothèque
        </Link>
      </div>
    )
  }

  const canCancel = (isOwner || isAdmin) && ['pending_handover', 'active', 'pending_return'].includes(loan.status)
  const returnInitiatedAt = loan.borrowerReturnConfirmedAt ?? loan.returnInitiatedAt

  const progressItems = [
    {
      label: 'Prêt créé',
      date: loan.createdAt,
      completed: true,
      icon: 'fa-plus',
    },
    {
      label: 'Remise propriétaire',
      date: loan.ownerHandoverConfirmedAt,
      completed: Boolean(loan.ownerHandoverConfirmedAt),
      icon: 'fa-handshake',
    },
    {
      label: 'Remise emprunteur',
      date: loan.borrowerHandoverConfirmedAt,
      completed: Boolean(loan.borrowerHandoverConfirmedAt),
      icon: 'fa-handshake-angle',
    },
    {
      label: 'Retour initié',
      date: returnInitiatedAt,
      completed: Boolean(returnInitiatedAt),
      icon: 'fa-rotate-left',
    },
    {
      label: 'Retour confirmé',
      date: loan.ownerReturnConfirmedAt,
      completed: Boolean(loan.ownerReturnConfirmedAt),
      icon: 'fa-check',
    },
  ]

  return (
    <div className="space-y-6">
      <Link to="/association/bibliotheque" className="inline-flex items-center text-sm text-primary hover:underline">
        <i className="fa-solid fa-arrow-left mr-2" title="Retour"></i>
        Retour à la bibliothèque
      </Link>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-[260px,minmax(0,1fr)] gap-4 items-start">
          <aside className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm aspect-[3/4] bg-slate-100">
              <img
                src={getBookImageUrl(loan.book?.imageUrl)}
                alt={loan.book?.title || 'Livre'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3">
                <h1 className="text-lg font-bold text-white line-clamp-2 drop-shadow">
                  {loan.book?.title || 'Détail du prêt'}
                </h1>
                <p className="text-xs text-white/90 line-clamp-1">{loan.book?.author || 'Auteur inconnu'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Actions</h2>
              <div className="space-y-2">
                {loan.status === 'pending_handover' && isOwner && (
                  <button
                    onClick={() => confirmOwnerHandoverMutation.mutate(loan.id)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-indigo-100 text-indigo-700 text-left"
                  >
                    <i className="fa-solid fa-handshake mr-2" title="Confirmer la remise"></i>
                    Confirmer la remise (propriétaire)
                  </button>
                )}

                {loan.status === 'pending_handover' && isBorrower && (
                  <button
                    onClick={() => confirmBorrowerHandoverMutation.mutate(loan.id)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-indigo-100 text-indigo-700 text-left"
                  >
                    <i className="fa-solid fa-handshake-angle mr-2" title="Confirmer la remise"></i>
                    Confirmer la remise (emprunteur)
                  </button>
                )}

                {loan.status === 'active' && isBorrower && (
                  <button
                    onClick={() => initiateReturnMutation.mutate(loan.id)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-amber-100 text-amber-700 text-left"
                  >
                    <i className="fa-solid fa-rotate-left mr-2" title="Initier le retour"></i>
                    Initier le retour
                  </button>
                )}

                {loan.status === 'pending_return' && isOwner && (
                  <button
                    onClick={() => confirmReturnOwnerMutation.mutate(loan.id)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-green-100 text-green-700 text-left"
                  >
                    <i className="fa-solid fa-check mr-2" title="Confirmer le retour"></i>
                    Confirmer le retour
                  </button>
                )}

                {canCancel && (
                  <button
                    onClick={() => cancelLoanMutation.mutate(loan.id)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-red-100 text-red-700 text-left"
                  >
                    <i className="fa-solid fa-xmark mr-2" title="Annuler le prêt"></i>
                    Annuler le prêt
                  </button>
                )}

                {!canCancel && loan.status === 'completed' && (
                  <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    Ce prêt est terminé.
                  </p>
                )}

                {!canCancel && loan.status === 'cancelled' && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    Ce prêt a été annulé.
                  </p>
                )}
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColorMap[loan.status] || 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                {getLibraryStatusLabel(loan.status)}
              </span>
              {loan.dueAt && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                  Échéance: {formatDateTime(loan.dueAt)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-xl border border-gray-200 p-4 bg-white">
                <p className="text-xs text-gray-500 mb-1">Propriétaire</p>
                <p className="text-sm font-semibold text-gray-900">{getMemberDisplayName(loan.owner)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 bg-white">
                <p className="text-xs text-gray-500 mb-1">Emprunteur</p>
                <p className="text-sm font-semibold text-gray-900">{getMemberDisplayName(loan.borrower)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 bg-white">
                <p className="text-xs text-gray-500 mb-1">Début prévu</p>
                <p className="text-sm font-semibold text-gray-900">{formatDateTime(loan.plannedStartAt)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 bg-white">
                <p className="text-xs text-gray-500 mb-1">Retour final</p>
                <p className="text-sm font-semibold text-gray-900">{formatDateTime(loan.returnedAt)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Progression du prêt</h2>
              <div className="space-y-2">
                {progressItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                          item.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                        title={item.completed ? `${item.label} confirmé` : `${item.label} en attente`}
                      >
                        <i className={`fa-solid ${item.icon}`} title={item.label}></i>
                      </span>
                      <p className="text-sm text-gray-800 truncate">{item.label}</p>
                    </div>
                    <p className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(item.date)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Historique</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p className="text-gray-700">Créé le: <span className="font-medium">{formatDateTime(loan.createdAt)}</span></p>
                <p className="text-gray-700">Mis à jour le: <span className="font-medium">{formatDateTime(loan.updatedAt)}</span></p>
                <p className="text-gray-700">Remise propriétaire: <span className="font-medium">{formatDateTime(loan.ownerHandoverConfirmedAt)}</span></p>
                <p className="text-gray-700">Remise emprunteur: <span className="font-medium">{formatDateTime(loan.borrowerHandoverConfirmedAt)}</span></p>
                <p className="text-gray-700">Retour initié: <span className="font-medium">{formatDateTime(returnInitiatedAt)}</span></p>
                <p className="text-gray-700">Retour confirmé: <span className="font-medium">{formatDateTime(loan.ownerReturnConfirmedAt)}</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default BibliothequeLoanDetail
