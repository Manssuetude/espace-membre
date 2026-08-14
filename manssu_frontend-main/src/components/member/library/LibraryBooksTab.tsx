import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LibraryBook, LibraryBookCategory, LibraryBookRequest } from '../../../types/bibliotheque'
import { LIBRARY_BOOK_CATEGORY_OPTIONS, getLibraryCategoryLabel } from '../../../utils/libraryUtils'
import Dropdown from '../../Dropdown'

const LANGUAGE_OPTIONS = [
  { value: 'FR', label: 'Français (FR)' },
  { value: 'EN', label: 'English (EN)' },
  { value: 'AR', label: 'العربية (AR)' },
  { value: 'ES', label: 'Español (ES)' },
  { value: 'DE', label: 'Deutsch (DE)' },
  { value: 'IT', label: 'Italiano (IT)' },
  { value: 'PT', label: 'Português (PT)' },
  { value: 'OTHER', label: 'Autre' },
]

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

interface LibraryBooksTabProps {
  books: LibraryBook[]
  myBooks: LibraryBook[]
  loadingBooks: boolean
  loadingMyBooks: boolean
  isAdmin: boolean
  currentUserId?: string
  bookSearch: string
  bookCategory: LibraryBookCategory | ''
  showOnlyAvailable: boolean
  showBookCreateForm: boolean
  showBookEditForm: boolean
  selectedRequestsBookId: string | null
  selectedBookRequests: LibraryBookRequest[]
  loadingBookRequests: boolean
  newBookForm: BookFormState
  editBookForm: BookFormState
  dueDaysByRequest: Record<string, number>
  statusColorMap: Record<string, string>
  getStatusLabel: (status: string) => string
  formatDate: (value?: string | null) => string
  getOfferCountdown: (offerExpiresAt?: string | null) => string | null
  onBookSearchChange: (value: string) => void
  onBookCategoryChange: (value: LibraryBookCategory | '') => void
  onToggleOnlyAvailable: () => void
  onToggleCreateForm: () => void
  onNewBookFieldChange: (field: keyof BookFormState, value: string | number | File | null) => void
  onEditBookFieldChange: (field: keyof BookFormState, value: string | number | File | null) => void
  onCreateBook: () => void
  onOpenEditBook: (book: LibraryBook) => void
  onUpdateBook: () => void
  onCancelEditBook: () => void
  onToggleBookRequests: (bookId: string) => void
  onToggleBookAvailability: (book: LibraryBook) => void
  onDeleteBook: (bookId: string) => void
  onAcceptRequest: (requestId: string) => void
  onCancelRequest: (requestId: string) => void
  onExpireRequest: (requestId: string) => void
  onDueDaysChange: (requestId: string, days: number) => void
  onCreateLoan: (request: LibraryBookRequest, dueDays: number) => void
}

const LibraryBooksTab = ({
  books,
  myBooks,
  loadingBooks,
  loadingMyBooks,
  isAdmin,
  currentUserId,
  bookSearch,
  bookCategory,
  showOnlyAvailable,
  showBookCreateForm,
  showBookEditForm,
  selectedRequestsBookId,
  selectedBookRequests,
  loadingBookRequests,
  newBookForm,
  editBookForm,
  dueDaysByRequest,
  statusColorMap,
  getStatusLabel,
  formatDate,
  getOfferCountdown,
  onBookSearchChange,
  onBookCategoryChange,
  onToggleOnlyAvailable,
  onToggleCreateForm,
  onNewBookFieldChange,
  onEditBookFieldChange,
  onCreateBook,
  onOpenEditBook,
  onUpdateBook,
  onCancelEditBook,
  onToggleBookRequests,
  onToggleBookAvailability,
  onDeleteBook,
  onAcceptRequest,
  onCancelRequest,
  onExpireRequest,
  onDueDaysChange,
  onCreateLoan,
}: LibraryBooksTabProps) => {
  const navigate = useNavigate()
  const [newImagePreviewUrl, setNewImagePreviewUrl] = useState<string | null>(null)
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!newBookForm.image) {
      setNewImagePreviewUrl(null)
      return
    }
    const previewUrl = URL.createObjectURL(newBookForm.image)
    setNewImagePreviewUrl(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [newBookForm.image])

  useEffect(() => {
    if (!editBookForm.image) {
      setEditImagePreviewUrl(null)
      return
    }
    const previewUrl = URL.createObjectURL(editBookForm.image)
    setEditImagePreviewUrl(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [editBookForm.image])

  const getBookImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return '/logo.png'
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
    const backend = import.meta.env.VITE_BACKEND_URL || ''
    const normalized = imageUrl.startsWith('./') ? imageUrl.slice(1) : imageUrl
    return `${backend}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
  }

  const truncateDescription = (value?: string | null) => {
    if (!value) return ''
    return value.length > 50 ? `${value.slice(0, 50)}...` : value
  }

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

  const renderBookCard = (book: LibraryBook, mode: 'catalog' | 'mine') => {
    return (
      <div
        key={`${mode}-${book.id}`}
        className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden cursor-pointer"
        onClick={() => navigate(`/association/bibliotheque/books/${book.id}`)}
      >
        <div className="relative h-52 bg-gradient-to-br from-slate-100 to-slate-200">
          <img src={getBookImageUrl(book.imageUrl)} alt={book.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute bottom-3 left-3 right-3">
            <h4 className="font-semibold text-white line-clamp-1 drop-shadow">{book.title}</h4>
            <p className="text-xs text-white/90 line-clamp-1">{book.author}</p>
          </div>
          <div className="absolute top-3 left-3 flex gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                book.isAvailableNow
                  ? 'bg-green-100/95 text-green-700 border border-green-200'
                  : 'bg-amber-100/95 text-amber-700 border border-amber-200'
              }`}
            >
              {book.isAvailableNow ? 'Disponible' : 'Indisponible'}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-700 border border-gray-200">
              {getLibraryCategoryLabel(book.category)}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-3">
            <span>
              <i className="fa-solid fa-language mr-1" title="Langue"></i>
              {book.language || 'N/A'}
            </span>
            <span>
              <i className="fa-regular fa-clock mr-1" title="Durée de prêt"></i>
              {book.defaultLoanDays || 21} jours
            </span>
            {book.pageCount ? (
              <span>
                <i className="fa-regular fa-file-lines mr-1" title="Nombre de pages"></i>
                {book.pageCount} pages
              </span>
            ) : null}
          </div>
          {book.description && (
            <p className="text-sm text-gray-600 mt-2">{truncateDescription(book.description)}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {mode === 'mine' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleBookRequests(book.id)
                  }}
                  className="w-8 h-8 rounded-lg text-xs bg-indigo-100 text-indigo-700 flex items-center justify-center"
                  title="Voir la file"
                >
                  <i className="fa-solid fa-list-ol" title="Voir la file des demandes"></i>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenEditBook(book)
                  }}
                  className="w-8 h-8 rounded-lg text-xs bg-blue-100 text-blue-700 flex items-center justify-center"
                  title="Modifier"
                >
                  <i className="fa-solid fa-pen" title="Modifier le livre"></i>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleBookAvailability(book)
                  }}
                  className="w-8 h-8 rounded-lg text-xs bg-gray-100 text-gray-700 flex items-center justify-center"
                  title={book.availabilityMode === 'paused' ? 'Reprendre' : 'Mettre en pause'}
                >
                  <i
                    className={`fa-solid ${
                      book.availabilityMode === 'paused' ? 'fa-play' : 'fa-pause'
                    }`}
                    title={book.availabilityMode === 'paused' ? 'Reprendre la disponibilité' : 'Mettre en pause'}
                  ></i>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteBook(book.id)
                  }}
                  className="w-8 h-8 rounded-lg text-xs bg-red-100 text-red-700 flex items-center justify-center"
                  title="Supprimer"
                >
                  <i className="fa-solid fa-trash" title="Supprimer le livre"></i>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Catalogue</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleOnlyAvailable}
              className={`px-3 py-2 rounded-lg text-sm ${
                showOnlyAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Disponibles uniquement
            </button>
            <button
              onClick={onToggleCreateForm}
              className="px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-primary to-red-500 text-white"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Ajouter un livre
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <input
            value={bookSearch ?? ''}
            onChange={(e) => onBookSearchChange(e.target.value)}
            placeholder="Rechercher par titre ou auteur"
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
          />
          <Dropdown
            value={bookCategory ?? ''}
            onChange={(e) => onBookCategoryChange(e.target.value as LibraryBookCategory | '')}
            options={[
              { value: '', label: 'Toutes les catégories' },
              ...LIBRARY_BOOK_CATEGORY_OPTIONS,
            ]}
            className="py-2 text-sm"
          />
        </div>

        {showBookCreateForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onCreateBook()
            }}
            className="mb-6 p-5 sm:p-6 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-gray-200 shadow-sm space-y-5"
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-red-500/10 flex items-center justify-center">
                <i className="fa-solid fa-book text-primary"></i>
              </div>
              <h3 className="font-semibold text-gray-900">Nouveau livre</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Titre</label>
                  <input
                    required
                    value={newBookForm.title ?? ''}
                    onChange={(e) => onNewBookFieldChange('title', e.target.value)}
                    placeholder="Ex: Clean Code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Auteur</label>
                  <input
                    required
                    value={newBookForm.author ?? ''}
                    onChange={(e) => onNewBookFieldChange('author', e.target.value)}
                    placeholder="Ex: Robert C. Martin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Catégorie</label>
                  <Dropdown
                    value={newBookForm.category ?? ''}
                    onChange={(e) => onNewBookFieldChange('category', e.target.value as LibraryBookCategory | '')}
                    options={[
                      { value: '', label: 'Choisir une catégorie' },
                      ...LIBRARY_BOOK_CATEGORY_OPTIONS,
                    ]}
                    className="py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Langue</label>
                  <Dropdown
                    value={newBookForm.language ?? 'FR'}
                    onChange={(e) => onNewBookFieldChange('language', e.target.value)}
                    options={LANGUAGE_OPTIONS}
                    className="py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre de pages</label>
                  <input
                    type="number"
                    min={1}
                    value={newBookForm.pageCount ?? ''}
                    onChange={(e) => onNewBookFieldChange('pageCount', e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 320"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Durée de prêt souhaitée (jours)
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={90}
                    value={newBookForm.defaultLoanDays ?? 21}
                    onChange={(e) => onNewBookFieldChange('defaultLoanDays', Number(e.target.value) || 21)}
                    placeholder="Entre 7 et 90"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-600">Miniature du livre</label>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="h-36 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mb-2">
                    {newImagePreviewUrl ? (
                      <img src={newImagePreviewUrl} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-400 text-xs">
                        <i className="fa-regular fa-image text-xl mb-1"></i>
                        <p>Aperçu image</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onNewBookFieldChange('image', e.target.files?.[0] || null)}
                    className="w-full text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea
                value={newBookForm.description ?? ''}
                onChange={(e) => onNewBookFieldChange('description', e.target.value)}
                placeholder="Résumé, points clés, état du livre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm min-h-[90px] bg-white"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-primary to-red-500 text-white"
              >
                Publier
              </button>
            </div>
          </form>
        )}

        {showBookEditForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onUpdateBook()
            }}
            className="mb-6 p-5 sm:p-6 bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-blue-200 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent/15 to-blue-600/10 flex items-center justify-center">
                  <i className="fa-solid fa-pen text-accent"></i>
                </div>
                <h3 className="font-semibold text-gray-900">Modifier le livre</h3>
              </div>
              <button type="button" onClick={onCancelEditBook} className="text-xs text-gray-600 hover:underline">
                Fermer
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Titre</label>
                  <input
                    required
                    value={editBookForm.title ?? ''}
                    onChange={(e) => onEditBookFieldChange('title', e.target.value)}
                    placeholder="Ex: Clean Code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Auteur</label>
                  <input
                    required
                    value={editBookForm.author ?? ''}
                    onChange={(e) => onEditBookFieldChange('author', e.target.value)}
                    placeholder="Ex: Robert C. Martin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Catégorie</label>
                  <Dropdown
                    value={editBookForm.category ?? ''}
                    onChange={(e) => onEditBookFieldChange('category', e.target.value as LibraryBookCategory | '')}
                    options={[
                      { value: '', label: 'Choisir une catégorie' },
                      ...LIBRARY_BOOK_CATEGORY_OPTIONS,
                    ]}
                    className="py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Langue</label>
                  <Dropdown
                    value={editBookForm.language ?? 'FR'}
                    onChange={(e) => onEditBookFieldChange('language', e.target.value)}
                    options={LANGUAGE_OPTIONS}
                    className="py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre de pages</label>
                  <input
                    type="number"
                    min={1}
                    value={editBookForm.pageCount ?? ''}
                    onChange={(e) => onEditBookFieldChange('pageCount', e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ex: 320"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Durée de prêt souhaitée (jours)
                  </label>
                  <input
                    type="number"
                    min={7}
                    max={90}
                    value={editBookForm.defaultLoanDays ?? 21}
                    onChange={(e) => onEditBookFieldChange('defaultLoanDays', Number(e.target.value) || 21)}
                    placeholder="Entre 7 et 90"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-600">Miniature du livre</label>
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="h-36 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mb-2">
                    {editImagePreviewUrl ? (
                      <img src={editImagePreviewUrl} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-gray-400 text-xs">
                        <i className="fa-regular fa-image text-xl mb-1"></i>
                        <p>Aperçu image</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onEditBookFieldChange('image', e.target.files?.[0] || null)}
                    className="w-full text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea
                value={editBookForm.description ?? ''}
                onChange={(e) => onEditBookFieldChange('description', e.target.value)}
                placeholder="Résumé, points clés, état du livre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm min-h-[90px] bg-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancelEditBook}
                className="px-3 py-2 rounded-lg text-sm bg-gray-200 text-gray-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-accent to-blue-600 text-white"
              >
                Enregistrer
              </button>
            </div>
          </form>
        )}

        {loadingBooks ? (
          <div className="flex justify-center py-12">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
          </div>
        ) : books.length === 0 ? (
          <div className="py-10 px-4 rounded-2xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <i className="fa-solid fa-book-open text-xl"></i>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Aucun livre trouvé</h3>
            <p className="text-sm text-gray-500 mt-1">
              Essayez d&apos;élargir vos filtres ou publiez une nouvelle annonce.
            </p>
            <button
              type="button"
              onClick={onToggleCreateForm}
              className="mt-4 px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-primary to-red-500 text-white"
            >
              Ajouter un livre
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {books.map((book) => renderBookCard(book, 'catalog'))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Mes livres</h2>
        {loadingMyBooks ? (
          <div className="flex justify-center py-12">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
          </div>
        ) : myBooks.length === 0 ? (
          <div className="py-8 px-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <i className="fa-solid fa-plus"></i>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Aucun livre publié</h3>
            <p className="text-sm text-gray-500 mt-1">
              Ajoutez votre premier livre pour commencer les prêts.
            </p>
            <button
              type="button"
              onClick={onToggleCreateForm}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs bg-blue-100 text-blue-700"
            >
              Publier un livre
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {myBooks.map((book) => renderBookCard(book, 'mine'))}
          </div>
        )}

        {selectedRequestsBookId && (
          <div className="mt-5 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-3">File d'attente du livre sélectionné</h3>
            {loadingBookRequests ? (
              <div className="flex justify-center py-6">
                <i className="fa-solid fa-spinner fa-spin text-primary"></i>
              </div>
            ) : selectedBookRequests.length === 0 ? (
              <div className="py-6 px-4 rounded-xl border border-dashed border-gray-300 bg-white text-center">
                <div className="w-10 h-10 mx-auto rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2">
                  <i className="fa-solid fa-list-check"></i>
                </div>
                <p className="text-sm font-medium text-gray-800">Aucune requête pour ce livre</p>
                <p className="text-xs text-gray-500 mt-1">Les demandes apparaîtront ici.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedBookRequests.map((request: LibraryBookRequest) => {
                  const isRequester = (request.borrowerId || request.requesterId) === currentUserId
                  const requestOwnerId = request.ownerId || request.book?.ownerId
                  const canCreateLoan = requestOwnerId === currentUserId
                  const dueDays = dueDaysByRequest[request.id] || request.book?.defaultLoanDays || 21
                  const countdown = getOfferCountdown(request.offerExpiresAt)
                  const borrowerDisplayName = getMemberDisplayName(request.borrower || request.requester)

                  return (
                    <div key={request.id} className="p-3 rounded-lg border border-gray-200 bg-white">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {borrowerDisplayName}
                          </p>
                          <p className="text-xs text-gray-500">Créée le {formatDate(request.createdAt)}</p>
                          {countdown && <p className="text-xs text-amber-700">{countdown}</p>}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColorMap[request.status] || 'bg-gray-100 text-gray-700'}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {isRequester && request.status === 'offered' && (
                          <button
                            onClick={() => onAcceptRequest(request.id)}
                            className="px-3 py-1.5 rounded-lg text-xs bg-green-100 text-green-700"
                          >
                            Accepter
                          </button>
                        )}

                        {(isRequester || canCreateLoan) && ['queued', 'offered', 'accepted'].includes(request.status) && (
                          <button
                            onClick={() => onCancelRequest(request.id)}
                            className="px-3 py-1.5 rounded-lg text-xs bg-red-100 text-red-700"
                          >
                            Annuler
                          </button>
                        )}

                        {isAdmin && ['queued', 'offered'].includes(request.status) && (
                          <button
                            onClick={() => onExpireRequest(request.id)}
                            className="px-3 py-1.5 rounded-lg text-xs bg-gray-200 text-gray-700"
                          >
                            Forcer expiration
                          </button>
                        )}

                        {canCreateLoan && request.status === 'accepted' && (
                          <>
                            <label className="text-xs text-gray-500">Durée (échéance finalisée à l'activation)</label>
                            <input
                              type="number"
                              min={7}
                              max={90}
                              value={dueDays}
                              onChange={(e) => onDueDaysChange(request.id, Number(e.target.value) || 21)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                            <button
                              onClick={() => onCreateLoan(request, dueDays)}
                              className="px-3 py-1.5 rounded-lg text-xs bg-indigo-100 text-indigo-700"
                            >
                              Créer prêt
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default LibraryBooksTab
