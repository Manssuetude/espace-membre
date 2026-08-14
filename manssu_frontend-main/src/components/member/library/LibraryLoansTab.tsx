import { useNavigate } from 'react-router-dom'
import { LibraryLoan } from '../../../types/bibliotheque'

interface LibraryLoansTabProps {
  loans: LibraryLoan[]
  loadingLoans: boolean
  currentUserId?: string
  isAdmin: boolean
  statusColorMap: Record<string, string>
  getStatusLabel: (status: string) => string
  formatDate: (value?: string | null) => string
  onConfirmOwnerHandover: (loanId: string) => void
  onConfirmBorrowerHandover: (loanId: string) => void
  onInitiateReturn: (loanId: string) => void
  onConfirmReturnOwner: (loanId: string) => void
  onCancelLoan: (loanId: string) => void
}

const LibraryLoansTab = ({
  loans,
  loadingLoans,
  currentUserId,
  isAdmin,
  statusColorMap,
  getStatusLabel,
  formatDate,
  onConfirmOwnerHandover,
  onConfirmBorrowerHandover,
  onInitiateReturn,
  onConfirmReturnOwner,
  onCancelLoan,
}: LibraryLoansTabProps) => {
  const navigate = useNavigate()
  const canCancelLoan = (loan: LibraryLoan) => isAdmin || loan.ownerId === currentUserId
  const getMemberDisplayName = (member?: {
    name?: string
    firstName?: string
    lastName?: string
    email?: string
  }) => {
    return (
      member?.name ||
      `${member?.firstName || ''} ${member?.lastName || ''}`.trim() ||
      member?.email ||
      'Membre'
    )
  }

  const getBookImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return '/logo.png'
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
    const backend = import.meta.env.VITE_BACKEND_URL || ''
    const normalized = imageUrl.startsWith('./') ? imageUrl.slice(1) : imageUrl
    return `${backend}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
  }

  return (
    <section className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Mes prêts</h2>

      {loadingLoans ? (
        <div className="flex justify-center py-12">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
        </div>
      ) : loans.length === 0 ? (
        <div className="py-10 px-4 rounded-2xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
            <i className="fa-solid fa-handshake-angle text-xl"></i>
          </div>
          <h3 className="text-base font-semibold text-gray-900">Aucun prêt en cours</h3>
          <p className="text-sm text-gray-500 mt-1">
            Quand un prêt sera créé ou accepté, vous le verrez ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {loans.map((loan) => {
            const isOwner = loan.ownerId === currentUserId
            const isBorrower = loan.borrowerId === currentUserId

            return (
              <article
                key={loan.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/association/bibliotheque/loans/${loan.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/association/bibliotheque/loans/${loan.id}`)
                  }
                }}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden cursor-pointer"
              >
                <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200">
                  <img
                    src={getBookImageUrl(loan.book?.imageUrl)}
                    alt={loan.book?.title || 'Livre'}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-semibold text-white line-clamp-1">{loan.book?.title || 'Livre'}</h3>
                    <p className="text-xs text-white/90 line-clamp-1">{loan.book?.author || 'Auteur inconnu'}</p>
                  </div>
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      statusColorMap[loan.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {getStatusLabel(loan.status)}
                  </span>
                </div>

                <div className="p-4">
                  <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                    <span title="Date d'échéance">
                      <i className="fa-regular fa-clock mr-1" title="Échéance"></i>
                      Échéance: {formatDate(loan.dueAt)}
                    </span>
                    <span title="Date de création">
                      <i className="fa-regular fa-calendar mr-1" title="Créé le"></i>
                      Créé: {formatDate(loan.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Propriétaire: {getMemberDisplayName(loan.owner)} • Emprunteur: {getMemberDisplayName(loan.borrower)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {loan.status === 'pending_handover' && isOwner && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          onConfirmOwnerHandover(loan.id)
                        }}
                        className="w-8 h-8 rounded-lg text-xs bg-indigo-100 text-indigo-700 flex items-center justify-center"
                        title="Confirmer la remise (propriétaire)"
                        aria-label="Confirmer la remise en tant que propriétaire"
                      >
                        <i className="fa-solid fa-handshake" title="Confirmer la remise"></i>
                      </button>
                    )}

                    {loan.status === 'pending_handover' && isBorrower && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          onConfirmBorrowerHandover(loan.id)
                        }}
                        className="w-8 h-8 rounded-lg text-xs bg-indigo-100 text-indigo-700 flex items-center justify-center"
                        title="Confirmer la remise (emprunteur)"
                        aria-label="Confirmer la remise en tant qu'emprunteur"
                      >
                        <i className="fa-solid fa-handshake-angle" title="Confirmer la remise"></i>
                      </button>
                    )}

                    {loan.status === 'active' && isBorrower && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          onInitiateReturn(loan.id)
                        }}
                        className="w-8 h-8 rounded-lg text-xs bg-amber-100 text-amber-700 flex items-center justify-center"
                        title="Initier le retour"
                        aria-label="Initier le retour"
                      >
                        <i className="fa-solid fa-rotate-left" title="Initier le retour"></i>
                      </button>
                    )}

                    {loan.status === 'pending_return' && isOwner && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          onConfirmReturnOwner(loan.id)
                        }}
                        className="w-8 h-8 rounded-lg text-xs bg-green-100 text-green-700 flex items-center justify-center"
                        title="Confirmer le retour"
                        aria-label="Confirmer le retour"
                      >
                        <i className="fa-solid fa-check" title="Confirmer le retour"></i>
                      </button>
                    )}

                    {canCancelLoan(loan) && ['pending_handover', 'active', 'pending_return'].includes(loan.status) && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          onCancelLoan(loan.id)
                        }}
                        className="w-8 h-8 rounded-lg text-xs bg-red-100 text-red-700 flex items-center justify-center"
                        title="Annuler le prêt"
                        aria-label="Annuler le prêt"
                      >
                        <i className="fa-solid fa-xmark" title="Annuler le prêt"></i>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default LibraryLoansTab
