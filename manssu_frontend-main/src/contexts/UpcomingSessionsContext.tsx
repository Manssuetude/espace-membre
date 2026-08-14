import { createContext, useContext, ReactNode } from 'react'
import { useSessions } from '../services/hooks/useSessions'
import { Session } from '../types/session'

interface UpcomingSessionsContextType {
  upcomingSessions: Session[]
  isLoading: boolean
}

const UpcomingSessionsContext = createContext<UpcomingSessionsContextType | undefined>(undefined)

export const useUpcomingSessions = () => {
  const context = useContext(UpcomingSessionsContext)
  if (!context) {
    throw new Error('useUpcomingSessions must be used within an UpcomingSessionsProvider')
  }
  return context
}

interface UpcomingSessionsProviderProps {
  children: ReactNode
}

export const UpcomingSessionsProvider = ({ children }: UpcomingSessionsProviderProps) => {
  const { data: sessionsData, isLoading } = useSessions({ status: 'upcoming', limit: 100 })
  
  const upcomingSessions = sessionsData?.data?.filter(session => {
    if (!session.date) return false
    const sessionDate = new Date(session.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return sessionDate >= today
  }) || []

  return (
    <UpcomingSessionsContext.Provider value={{ upcomingSessions, isLoading }}>
      {children}
    </UpcomingSessionsContext.Provider>
  )
}

