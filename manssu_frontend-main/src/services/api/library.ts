import apiClient from './client'
import { ApiResponse } from '../../types/api'
import {
  LibraryBook,
  LibraryBookListResponse,
  LibraryBookRequest,
  LibraryLoan,
  LibraryLoanListResponse,
  LibraryMyWishlistResponse,
  LibraryNotification,
  LibraryNotificationListResponse,
  LibraryWishlistItem,
  CreateLibraryBookRequest,
  UpdateLibraryBookRequest,
  UpdateLibraryBookAvailabilityRequest,
  CreateLibraryLoanRequest,
  CreateLibraryWishlistItemRequest,
  UpdateLibraryWishlistItemRequest,
  LibraryBookCategory,
} from '../../types/bibliotheque'

const LIBRARY_BASE = '/api/v1/library'

const appendIfDefined = (
  formData: FormData,
  key: string,
  value: string | number | undefined | null
) => {
  if (value !== undefined && value !== null && value !== '') {
    formData.append(key, String(value))
  }
}

const toBookFormData = (data: CreateLibraryBookRequest | UpdateLibraryBookRequest) => {
  const formData = new FormData()

  appendIfDefined(formData, 'title', data.title)
  appendIfDefined(formData, 'author', data.author)
  appendIfDefined(formData, 'description', data.description)
  appendIfDefined(formData, 'comment', data.comment)
  appendIfDefined(formData, 'category', data.category)
  appendIfDefined(formData, 'pageCount', data.pageCount)
  appendIfDefined(formData, 'language', data.language)
  appendIfDefined(formData, 'condition', data.condition)
  appendIfDefined(formData, 'availabilityMode', data.availabilityMode)
  appendIfDefined(formData, 'availableFrom', data.availableFrom)
  appendIfDefined(formData, 'defaultLoanDays', data.defaultLoanDays)

  if (data.image) {
    formData.append('image', data.image)
  }

  return formData
}

export const libraryApi = {
  getBooks: async (params?: {
    search?: string
    category?: LibraryBookCategory
    status?: 'all' | 'available' | 'loaned' | 'paused'
    ownerId?: string
    availableOnly?: boolean
    page?: number
    limit?: number
  }): Promise<ApiResponse<LibraryBookListResponse>> => {
    const response = await apiClient.get<ApiResponse<LibraryBookListResponse>>(`${LIBRARY_BASE}/books`, {
      params,
    })
    return response.data
  },

  getBook: async (bookId: string): Promise<ApiResponse<LibraryBook>> => {
    const response = await apiClient.get<ApiResponse<LibraryBook>>(`${LIBRARY_BASE}/books/${bookId}`)
    return response.data
  },

  getMyBooks: async (params?: {
    search?: string
    category?: LibraryBookCategory
    status?: 'all' | 'available' | 'loaned' | 'paused'
    page?: number
    limit?: number
  }): Promise<ApiResponse<LibraryBookListResponse | LibraryBook[]>> => {
    const response = await apiClient.get<ApiResponse<LibraryBookListResponse | LibraryBook[]>>(
      `${LIBRARY_BASE}/books/mine`,
      { params }
    )
    return response.data
  },

  createBook: async (data: CreateLibraryBookRequest): Promise<ApiResponse<LibraryBook>> => {
    const formData = toBookFormData(data)
    const response = await apiClient.post<ApiResponse<LibraryBook>>(`${LIBRARY_BASE}/books`, formData, {
      headers: { 'Content-Type': undefined },
    })
    return response.data
  },

  updateBook: async (
    bookId: string,
    data: UpdateLibraryBookRequest
  ): Promise<ApiResponse<LibraryBook>> => {
    const formData = toBookFormData(data)
    const response = await apiClient.patch<ApiResponse<LibraryBook>>(
      `${LIBRARY_BASE}/books/${bookId}`,
      formData,
      { headers: { 'Content-Type': undefined } }
    )
    return response.data
  },

  updateBookAvailability: async (
    bookId: string,
    data: UpdateLibraryBookAvailabilityRequest
  ): Promise<ApiResponse<LibraryBook>> => {
    const response = await apiClient.patch<ApiResponse<LibraryBook>>(
      `${LIBRARY_BASE}/books/${bookId}/availability`,
      data
    )
    return response.data
  },

  deleteBook: async (bookId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`${LIBRARY_BASE}/books/${bookId}`)
    return response.data
  },

  requestBook: async (bookId: string): Promise<ApiResponse<LibraryBookRequest>> => {
    const response = await apiClient.post<ApiResponse<LibraryBookRequest>>(`${LIBRARY_BASE}/books/${bookId}/request`)
    return response.data
  },

  getBookRequests: async (bookId: string): Promise<ApiResponse<LibraryBookRequest[]>> => {
    const response = await apiClient.get<ApiResponse<LibraryBookRequest[]>>(
      `${LIBRARY_BASE}/books/${bookId}/requests`
    )
    return response.data
  },

  acceptRequest: async (requestId: string): Promise<ApiResponse<LibraryBookRequest>> => {
    const response = await apiClient.post<ApiResponse<LibraryBookRequest>>(
      `${LIBRARY_BASE}/requests/${requestId}/accept`
    )
    return response.data
  },

  cancelRequest: async (requestId: string): Promise<ApiResponse<LibraryBookRequest>> => {
    const response = await apiClient.post<ApiResponse<LibraryBookRequest>>(
      `${LIBRARY_BASE}/requests/${requestId}/cancel`
    )
    return response.data
  },

  expireRequest: async (requestId: string): Promise<ApiResponse<LibraryBookRequest>> => {
    const response = await apiClient.post<ApiResponse<LibraryBookRequest>>(
      `${LIBRARY_BASE}/requests/${requestId}/expire`
    )
    return response.data
  },

  createLoanFromRequest: async (
    requestId: string,
    data: CreateLibraryLoanRequest
  ): Promise<ApiResponse<LibraryLoan>> => {
    const response = await apiClient.post<ApiResponse<LibraryLoan>>(
      `${LIBRARY_BASE}/requests/${requestId}/create-loan`,
      data
    )
    return response.data
  },

  confirmHandoverOwner: async (loanId: string): Promise<ApiResponse<LibraryLoan>> => {
    const response = await apiClient.post<ApiResponse<LibraryLoan>>(
      `${LIBRARY_BASE}/loans/${loanId}/confirm-handover/owner`
    )
    return response.data
  },

  confirmHandoverBorrower: async (loanId: string): Promise<ApiResponse<LibraryLoan>> => {
    const response = await apiClient.post<ApiResponse<LibraryLoan>>(
      `${LIBRARY_BASE}/loans/${loanId}/confirm-handover/borrower`
    )
    return response.data
  },

  initiateReturn: async (loanId: string): Promise<ApiResponse<LibraryLoan>> => {
    const response = await apiClient.post<ApiResponse<LibraryLoan>>(
      `${LIBRARY_BASE}/loans/${loanId}/initiate-return`
    )
    return response.data
  },

  confirmReturnOwner: async (loanId: string): Promise<ApiResponse<LibraryLoan>> => {
    const response = await apiClient.post<ApiResponse<LibraryLoan>>(
      `${LIBRARY_BASE}/loans/${loanId}/confirm-return/owner`
    )
    return response.data
  },

  cancelLoan: async (loanId: string): Promise<ApiResponse<LibraryLoan>> => {
    const response = await apiClient.post<ApiResponse<LibraryLoan>>(`${LIBRARY_BASE}/loans/${loanId}/cancel`)
    return response.data
  },

  getMyLoans: async (params?: {
    status?: 'all' | 'pending_handover' | 'active' | 'pending_return' | 'completed' | 'cancelled'
    page?: number
    limit?: number
  }): Promise<ApiResponse<LibraryLoanListResponse>> => {
    const response = await apiClient.get<ApiResponse<LibraryLoanListResponse>>(`${LIBRARY_BASE}/loans/me`, {
      params,
    })
    return response.data
  },

  getLoan: async (loanId: string): Promise<ApiResponse<LibraryLoan>> => {
    const response = await apiClient.get<ApiResponse<LibraryLoan>>(`${LIBRARY_BASE}/loans/id/${loanId}`)
    return response.data
  },

  getMyWishlist: async (params?: { activeOnly?: boolean }): Promise<ApiResponse<LibraryWishlistItem[] | LibraryMyWishlistResponse>> => {
    const response = await apiClient.get<ApiResponse<LibraryWishlistItem[] | LibraryMyWishlistResponse>>(
      `${LIBRARY_BASE}/wishlist/me`,
      { params }
    )
    return response.data
  },

  createWishlistItem: async (
    data: CreateLibraryWishlistItemRequest
  ): Promise<ApiResponse<LibraryWishlistItem>> => {
    const response = await apiClient.post<ApiResponse<LibraryWishlistItem>>(`${LIBRARY_BASE}/wishlist`, data)
    return response.data
  },

  updateWishlistItem: async (
    itemId: string,
    data: UpdateLibraryWishlistItemRequest
  ): Promise<ApiResponse<LibraryWishlistItem>> => {
    const response = await apiClient.patch<ApiResponse<LibraryWishlistItem>>(
      `${LIBRARY_BASE}/wishlist/${itemId}`,
      data
    )
    return response.data
  },

  deleteWishlistItem: async (itemId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`${LIBRARY_BASE}/wishlist/${itemId}`)
    return response.data
  },

  getNotifications: async (params?: {
    unreadOnly?: boolean
    page?: number
    limit?: number
  }): Promise<ApiResponse<LibraryNotificationListResponse | LibraryNotification[]>> => {
    const response = await apiClient.get<ApiResponse<LibraryNotificationListResponse | LibraryNotification[]>>(
      `${LIBRARY_BASE}/notifications`,
      { params }
    )
    return response.data
  },

  markNotificationRead: async (notificationId: string): Promise<ApiResponse<LibraryNotification>> => {
    const response = await apiClient.post<ApiResponse<LibraryNotification>>(
      `${LIBRARY_BASE}/notifications/${notificationId}/read`
    )
    return response.data
  },

  triggerDueReminders: async (daysBefore = 3): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `${LIBRARY_BASE}/loans/reminders/due`,
      undefined,
      { params: { daysBefore } }
    )
    return response.data
  },
}
