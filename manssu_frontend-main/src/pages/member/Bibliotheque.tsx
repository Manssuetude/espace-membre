import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  useAcceptLibraryRequest,
  useCancelLibraryLoan,
  useCancelLibraryRequest,
  useConfirmLibraryHandoverBorrower,
  useConfirmLibraryHandoverOwner,
  useConfirmLibraryReturnOwner,
  useCreateLibraryBook,
  useCreateLibraryLoan,
  useDeleteLibraryBook,
  useExpireLibraryRequest,
  useInitiateLibraryReturn,
  useLibraryBookRequests,
  useLibraryBooks,
  useMyLibraryBooks,
  useMyLibraryLoans,
  useUpdateLibraryBook,
  useUpdateLibraryBookAvailability,
} from '../../services/hooks/useLibrary'
import { LibraryBook, LibraryBookCategory, LibraryBookRequest } from '../../types/bibliotheque'
import LibraryBooksTab from '../../components/member/library/LibraryBooksTab'
import LibraryLoansTab from '../../components/member/library/LibraryLoansTab'
import { getLibraryStatusLabel } from '../../utils/libraryUtils'

type TabKey = 'books' | 'loans'

interface BookFormState {
  title: string
  author: string
  category: LibraryBookCategory | ''
  description: string
  language: string
  defaultLoanDays: number
  pageCount: number | ''
  image: File | null
}

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'books', label: 'Livres', icon: 'fa-book' },
  { key: 'loans', label: 'Mes prêts', icon: 'fa-handshake' },
]

const defaultBookForm: BookFormState = {
  title: '',
  author: '',
  category: '',
  description: '',
  language: 'FR',
  defaultLoanDays: 21,
  pageCount: '',
  image: null,
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Non défini'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getOfferCountdown = (offerExpiresAt?: string | null) => {
  if (!offerExpiresAt) return null
  const diff = new Date(offerExpiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expiré'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `Expire dans ${hours}h ${minutes}m`
}

const statusColorMap: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  loaned: 'bg-amber-100 text-amber-700',
  paused: 'bg-gray-200 text-gray-700',
  queued: 'bg-blue-100 text-blue-700',
  offered: 'bg-emerald-100 text-emerald-700',
  accepted: 'bg-indigo-100 text-indigo-700',
  expired: 'bg-gray-200 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  fulfilled: 'bg-purple-100 text-purple-700',
  pending_handover: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  pending_return: 'bg-amber-100 text-amber-700',
  completed: 'bg-purple-100 text-purple-700',
}

const Bibliotheque = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('books')
  const [bookSearch, setBookSearch] = useState('')
  const [bookCategory, setBookCategory] = useState<LibraryBookCategory | ''>('')
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false)
  const [showBookCreateForm, setShowBookCreateForm] = useState(false)
  const [showBookEditForm, setShowBookEditForm] = useState(false)
  const [editingBookId, setEditingBookId] = useState<string | null>(null)
  const [selectedRequestsBookId, setSelectedRequestsBookId] = useState<string | null>(null)
  const [dueDaysByRequest, setDueDaysByRequest] = useState<Record<string, number>>({})

  const [newBookForm, setNewBookForm] = useState<BookFormState>(defaultBookForm)
  const [editBookForm, setEditBookForm] = useState<BookFormState>(defaultBookForm)

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const { data: booksData, isLoading: loadingBooks } = useLibraryBooks({
    search: bookSearch || undefined,
    category: bookCategory || undefined,
    availableOnly: showOnlyAvailable,
    page: 1,
    limit: 30,
  })

  const { data: myBooksData, isLoading: loadingMyBooks } = useMyLibraryBooks({
    page: 1,
    limit: 30,
  })

  const { data: myLoansData, isLoading: loadingLoans } = useMyLibraryLoans({
    status: 'all',
    page: 1,
    limit: 30,
  })

  const { data: selectedBookRequests = [], isLoading: loadingBookRequests } = useLibraryBookRequests(
    selectedRequestsBookId || ''
  )

  const createBookMutation = useCreateLibraryBook()
  const updateBookMutation = useUpdateLibraryBook()
  const updateBookAvailabilityMutation = useUpdateLibraryBookAvailability()
  const deleteBookMutation = useDeleteLibraryBook()

  const acceptRequestMutation = useAcceptLibraryRequest()
  const cancelRequestMutation = useCancelLibraryRequest()
  const expireRequestMutation = useExpireLibraryRequest()
  const createLoanMutation = useCreateLibraryLoan()

  const confirmOwnerHandoverMutation = useConfirmLibraryHandoverOwner()
  const confirmBorrowerHandoverMutation = useConfirmLibraryHandoverBorrower()
  const initiateReturnMutation = useInitiateLibraryReturn()
  const confirmReturnOwnerMutation = useConfirmLibraryReturnOwner()
  const cancelLoanMutation = useCancelLibraryLoan()

  const books = booksData?.data || []
  const loans = myLoansData?.data || []

  const myBooks = myBooksData?.data || ([] as LibraryBook[])

  const handleCreateLoan = (request: LibraryBookRequest, dueDays = 21) => {
    createLoanMutation.mutate({
      requestId: request.id,
      data: {
        plannedStartAt: new Date().toISOString(),
        dueDays,
      },
    })
  }

  const handleCreateBook = () => {
    if (!newBookForm.title.trim() || !newBookForm.author.trim()) return

    createBookMutation.mutate(
      {
        title: newBookForm.title.trim(),
        author: newBookForm.author.trim(),
        category: newBookForm.category || undefined,
        description: newBookForm.description.trim() || undefined,
        language: newBookForm.language.trim() || undefined,
        defaultLoanDays: newBookForm.defaultLoanDays,
        pageCount: newBookForm.pageCount === '' ? undefined : Number(newBookForm.pageCount),
        image: newBookForm.image || undefined,
      },
      {
        onSuccess: () => {
          setNewBookForm(defaultBookForm)
          setShowBookCreateForm(false)
        },
      }
    )
  }

  const handleOpenEditBook = (book: LibraryBook) => {
    setEditingBookId(book.id)
    setEditBookForm({
      title: book.title,
      author: book.author,
      category: book.category || '',
      description: book.description || '',
      language: book.language || 'FR',
      defaultLoanDays: book.defaultLoanDays || 21,
      pageCount: book.pageCount ?? '',
      image: null,
    })
    setShowBookEditForm(true)
  }

  const handleUpdateBook = () => {
    if (!editingBookId || !editBookForm.title.trim() || !editBookForm.author.trim()) return

    updateBookMutation.mutate(
      {
        bookId: editingBookId,
        data: {
          title: editBookForm.title.trim(),
          author: editBookForm.author.trim(),
          category: editBookForm.category || undefined,
          description: editBookForm.description.trim() || undefined,
          language: editBookForm.language.trim() || undefined,
          defaultLoanDays: editBookForm.defaultLoanDays,
          pageCount: editBookForm.pageCount === '' ? undefined : Number(editBookForm.pageCount),
          image: editBookForm.image || undefined,
        },
      },
      {
        onSuccess: () => {
          setShowBookEditForm(false)
          setEditingBookId(null)
          setEditBookForm(defaultBookForm)
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-2 sm:p-3 border border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-primary to-red-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'books' && (
        <LibraryBooksTab
          books={books}
          myBooks={myBooks}
          loadingBooks={loadingBooks}
          loadingMyBooks={loadingMyBooks}
          isAdmin={isAdmin}
          currentUserId={user?.id}
          bookSearch={bookSearch}
          bookCategory={bookCategory}
          showOnlyAvailable={showOnlyAvailable}
          showBookCreateForm={showBookCreateForm}
          showBookEditForm={showBookEditForm}
          selectedRequestsBookId={selectedRequestsBookId}
          selectedBookRequests={selectedBookRequests}
          loadingBookRequests={loadingBookRequests}
          newBookForm={newBookForm}
          editBookForm={editBookForm}
          dueDaysByRequest={dueDaysByRequest}
          statusColorMap={statusColorMap}
          getStatusLabel={getLibraryStatusLabel}
          formatDate={formatDate}
          getOfferCountdown={getOfferCountdown}
          onBookSearchChange={setBookSearch}
          onBookCategoryChange={setBookCategory}
          onToggleOnlyAvailable={() => setShowOnlyAvailable((prev) => !prev)}
          onToggleCreateForm={() => setShowBookCreateForm((prev) => !prev)}
          onNewBookFieldChange={(field, value) => {
            setNewBookForm((prev) => ({
              ...prev,
              [field]:
                field === 'category'
                  ? (value as LibraryBookCategory | '')
                  : (value as never),
            }))
          }}
          onEditBookFieldChange={(field, value) => {
            setEditBookForm((prev) => ({
              ...prev,
              [field]:
                field === 'category'
                  ? (value as LibraryBookCategory | '')
                  : (value as never),
            }))
          }}
          onCreateBook={handleCreateBook}
          onOpenEditBook={handleOpenEditBook}
          onUpdateBook={handleUpdateBook}
          onCancelEditBook={() => {
            setShowBookEditForm(false)
            setEditingBookId(null)
          }}
          onToggleBookRequests={(bookId) =>
            setSelectedRequestsBookId((prev) => (prev === bookId ? null : bookId))
          }
          onToggleBookAvailability={(book) =>
            updateBookAvailabilityMutation.mutate({
              bookId: book.id,
              data: {
                availabilityMode: book.availabilityMode === 'paused' ? 'always' : 'paused',
                availableFrom: null,
                status: book.availabilityMode === 'paused' ? 'available' : 'paused',
              },
            })
          }
          onDeleteBook={(bookId) => deleteBookMutation.mutate(bookId)}
          onAcceptRequest={(requestId) => acceptRequestMutation.mutate(requestId)}
          onCancelRequest={(requestId) => cancelRequestMutation.mutate(requestId)}
          onExpireRequest={(requestId) => expireRequestMutation.mutate(requestId)}
          onDueDaysChange={(requestId, days) =>
            setDueDaysByRequest((prev) => ({
              ...prev,
              [requestId]: Math.max(7, Math.min(90, days || 21)),
            }))
          }
          onCreateLoan={handleCreateLoan}
        />
      )}

      {activeTab === 'loans' && (
        <LibraryLoansTab
          loans={loans}
          loadingLoans={loadingLoans}
          currentUserId={user?.id}
          isAdmin={isAdmin}
          statusColorMap={statusColorMap}
          getStatusLabel={getLibraryStatusLabel}
          formatDate={formatDate}
          onConfirmOwnerHandover={(loanId) => confirmOwnerHandoverMutation.mutate(loanId)}
          onConfirmBorrowerHandover={(loanId) => confirmBorrowerHandoverMutation.mutate(loanId)}
          onInitiateReturn={(loanId) => initiateReturnMutation.mutate(loanId)}
          onConfirmReturnOwner={(loanId) => confirmReturnOwnerMutation.mutate(loanId)}
          onCancelLoan={(loanId) => cancelLoanMutation.mutate(loanId)}
        />
      )}

    </div>
  )
}

export default Bibliotheque
