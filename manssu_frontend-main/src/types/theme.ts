export interface Theme {
  id: string
  title: string
  description: string
  category: string | null
  status: 'pending' | 'approved' | 'rejected' | 'current'
  submittedBy: {
    id: string
    name: string
    avatar: string | null
  } | null
  submittedAt: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  reviewNotes: string | null
  sessionCount: number
  nextSessionDate: string | null
  lastSessionDate: string | null
  likes: number
  createdAt: string | null
  updatedAt: string | null
}

export interface CreateThemeRequest {
  title: string
  description: string
  category?: string
}

export interface UpdateThemeRequest {
  status: 'approved' | 'rejected'
  reviewNotes?: string
}

export interface ThemeWindowStatus {
  isOpen: boolean
  startDate: string | null
  endDate: string | null
  daysRemaining: number | null
  nextOpeningDate: string | null
  userProposals: Theme[] | null
}

export interface ThemeWindow {
  id: string
  startDate: string
  endDate: string
  isActive: boolean
}

export interface OpenWindowRequest {
  duration: number
}

export interface ExtendWindowRequest {
  additionalDays: number
}

