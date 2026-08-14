import {
  LibraryBookCategory,
  LibraryBookStatus,
  LibraryLoanStatus,
  LibraryRequestStatus,
} from '../types/bibliotheque'

export const LIBRARY_BOOK_CATEGORY_OPTIONS: Array<{ value: LibraryBookCategory; label: string }> = [
  { value: 'fiction', label: 'Fiction' },
  { value: 'non_fiction', label: 'Non fiction' },
  { value: 'science', label: 'Science' },
  { value: 'technology', label: 'Technologie' },
  { value: 'business', label: 'Business' },
  { value: 'biography', label: 'Biographie' },
  { value: 'history', label: 'Histoire' },
  { value: 'philosophy', label: 'Philosophie' },
  { value: 'self_help', label: 'Développement personnel' },
  { value: 'children', label: 'Jeunesse' },
  { value: 'education', label: 'Éducation' },
  { value: 'other', label: 'Autre' },
]

const BOOK_STATUS_LABELS: Record<LibraryBookStatus, string> = {
  available: 'Disponible',
  loaned: 'Prêté',
  paused: 'En pause',
}

const REQUEST_STATUS_LABELS: Record<LibraryRequestStatus, string> = {
  queued: 'En file',
  offered: 'Offert',
  accepted: 'Accepté',
  expired: 'Expiré',
  cancelled: 'Annulé',
  fulfilled: 'Finalisé',
}

const LOAN_STATUS_LABELS: Record<LibraryLoanStatus, string> = {
  pending_handover: 'Remise en attente',
  active: 'Actif',
  pending_return: 'Retour en attente',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

export const getLibraryStatusLabel = (status: string) => {
  return (
    (BOOK_STATUS_LABELS as Record<string, string>)[status] ||
    (REQUEST_STATUS_LABELS as Record<string, string>)[status] ||
    (LOAN_STATUS_LABELS as Record<string, string>)[status] ||
    status
  )
}

export const getLibraryCategoryLabel = (category?: string | null) => {
  if (!category) return 'Non définie'
  const option = LIBRARY_BOOK_CATEGORY_OPTIONS.find((item) => item.value === category)
  return option?.label || category
}
