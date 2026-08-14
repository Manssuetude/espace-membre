export type LibraryBookCondition = 'new' | 'very_good' | 'good' | 'fair' | 'poor'
export type LibraryAvailabilityMode = 'always' | 'from_date' | 'paused'
export type LibraryBookStatus = 'available' | 'loaned' | 'paused'
export type LibraryBookCategory =
  | 'fiction'
  | 'non_fiction'
  | 'science'
  | 'technology'
  | 'business'
  | 'biography'
  | 'history'
  | 'philosophy'
  | 'self_help'
  | 'children'
  | 'education'
  | 'other'

export type LibraryRequestStatus =
  | 'queued'
  | 'offered'
  | 'accepted'
  | 'expired'
  | 'cancelled'
  | 'fulfilled'

export type LibraryLoanStatus =
  | 'pending_handover'
  | 'active'
  | 'pending_return'
  | 'completed'
  | 'cancelled'

export type LibraryNotificationType = 'wishlist_match' | 'queue_offer' | 'loan_due_reminder'

export interface LibraryUserSummary {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  avatar?: string | null
  email?: string
}

export interface LibraryBook {
  id: string
  ownerId: string
  title: string
  author: string
  description?: string | null
  comment?: string | null
  category?: LibraryBookCategory | null
  pageCount?: number | null
  language?: string | null
  condition?: LibraryBookCondition | null
  imageUrl?: string | null
  availabilityMode: LibraryAvailabilityMode
  availableFrom?: string | null
  status: LibraryBookStatus
  defaultLoanDays?: number | null
  isAvailableNow: boolean
  createdAt: string
  updatedAt: string
  owner?: LibraryUserSummary
}

export interface LibraryBookListResponse {
  data: LibraryBook[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LibraryBookRequest {
  id: string
  bookId: string
  requesterId: string
  ownerId?: string
  borrowerId?: string
  status: LibraryRequestStatus
  offerExpiresAt?: string | null
  acceptedAt?: string | null
  fulfilledAt?: string | null
  cancelledAt?: string | null
  cancelledById?: string | null
  cancelledReason?: string | null
  createdAt: string
  updatedAt: string
  owner?: LibraryUserSummary
  borrower?: LibraryUserSummary
  requester?: LibraryUserSummary
  book?: LibraryBook
}

export interface LibraryLoan {
  id: string
  bookId: string
  requestId: string
  sourceRequestId?: string | null
  ownerId: string
  borrowerId: string
  plannedStartAt?: string | null
  startedAt?: string | null
  dueAt?: string | null
  returnedAt?: string | null
  status: LibraryLoanStatus
  ownerHandoverConfirmedAt?: string | null
  borrowerHandoverConfirmedAt?: string | null
  borrowerReturnConfirmedAt?: string | null
  returnInitiatedAt?: string | null
  ownerReturnConfirmedAt?: string | null
  createdAt: string
  updatedAt: string
  owner?: LibraryUserSummary
  borrower?: LibraryUserSummary
  book?: LibraryBook
}

export interface LibraryLoanListResponse {
  data: LibraryLoan[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LibraryWishlistItem {
  id: string
  userId: string
  title: string
  author?: string | null
  category?: string | null
  comment?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LibraryNotification {
  id: string
  userId: string
  type: LibraryNotificationType
  isRead: boolean
  title: string
  message: string
  payload?: Record<string, unknown> | null
  createdAt: string
  readAt?: string | null
}

export interface LibraryNotificationListResponse {
  data: LibraryNotification[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateLibraryBookRequest {
  title: string
  author: string
  description?: string
  comment?: string
  category?: LibraryBookCategory
  pageCount?: number
  language?: string
  condition?: LibraryBookCondition
  availabilityMode?: LibraryAvailabilityMode
  availableFrom?: string
  defaultLoanDays?: number
  image?: File
}

export interface UpdateLibraryBookRequest extends Partial<CreateLibraryBookRequest> {}

export interface UpdateLibraryBookAvailabilityRequest {
  availabilityMode: LibraryAvailabilityMode
  availableFrom?: string | null
  status: LibraryBookStatus
}

export interface CreateLibraryLoanRequest {
  plannedStartAt: string
  dueDays?: number
}

export interface LibraryMyWishlistResponse {
  data: LibraryWishlistItem[]
}

export interface CreateLibraryWishlistItemRequest {
  title: string
  author?: string
  category?: string
  comment?: string
}

export interface UpdateLibraryWishlistItemRequest {
  title?: string
  author?: string
  category?: string
  comment?: string
  isActive?: boolean
}
