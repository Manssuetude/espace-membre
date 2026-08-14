import { useState } from 'react'
import { useMyFeedbacks } from '../../services/hooks/useFeedback'

const FeedbackHistory = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read'>('all')
  
  // Fetch all feedbacks when "read" filter is selected (to show both "read" and "resolved")
  // Otherwise, filter by status on the API side
  const { data: feedbacksData, isLoading } = useMyFeedbacks({
    status: statusFilter === 'read' ? undefined : (statusFilter !== 'all' ? statusFilter : undefined),
    limit: 100,
  })

  const allFeedbacks = feedbacksData?.data || []
  
  // Filter client-side when "read" is selected to show both "read" and "resolved"
  const feedbacks = statusFilter === 'read' 
    ? allFeedbacks.filter((f) => f.status === 'read' || f.status === 'resolved')
    : allFeedbacks

  // Map feedback status to display status
  const getDisplayStatus = (status: string): string => {
    switch (status) {
      case 'resolved':
      case 'read':
        return 'Traité'
      case 'new':
        return 'En attente'
      default:
        return 'En attente'
    }
  }

  // Get icon and color based on category and type
  const getFeedbackIcon = (category: string, type: string): { icon: string; color: string } => {
    if (category === 'Session') {
      return { icon: 'fa-calendar-days', color: 'accent' }
    } else if (type === 'Complaint') {
      return { icon: 'fa-exclamation-triangle', color: 'primary' }
    } else if (type === 'Compliment') {
      return { icon: 'fa-heart', color: 'success' }
    } else {
      return { icon: 'fa-comment-dots', color: 'secondary' }
    }
  }

  // Format date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Date inconnue'
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="mt-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-900">Historique de vos feedbacks</h2>
        <div className="flex flex-wrap gap-2">
          {(['all', 'new', 'read'] as const).map((filter) => {
            const filterLabels: Record<typeof filter, string> = {
              all: 'Tous',
              new: 'En attente',
              read: 'Traités',
            }
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === filter
                    ? filter === 'all'
                      ? 'bg-gray-200 text-gray-900'
                      : filter === 'new'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-success/20 text-success'
                    : filter === 'all'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : filter === 'new'
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-success/10 text-success hover:bg-success/20'
                }`}
              >
                {filterLabels[filter]}
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-primary mb-4"></i>
          <p className="text-gray-500 text-sm">Chargement de vos feedbacks...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-comments text-gray-400 text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm mb-2">Aucun feedback dans votre historique</p>
          <p className="text-gray-400 text-xs">Vos feedbacks soumis apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => {
            const displayStatus = getDisplayStatus(feedback.status)
            const { icon, color } = getFeedbackIcon(feedback.category, feedback.type)
            const isResolved = feedback.status === 'read' || feedback.status === 'resolved'
            
            return (
              <div key={feedback.id} className="border border-gray-200 rounded-xl p-6 hover:border-primary/30 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3">
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${
                        color === 'accent'
                          ? 'from-accent/20 to-blue-600/20'
                          : color === 'primary'
                          ? 'from-primary/20 to-red-500/20'
                          : color === 'success'
                          ? 'from-success/20 to-emerald-600/20'
                          : 'from-secondary/20 to-orange-600/20'
                      } rounded-lg flex items-center justify-center mr-3`}
                    >
                      <i className={`fa-solid ${icon} ${
                        color === 'accent'
                          ? 'text-accent'
                          : color === 'primary'
                          ? 'text-primary'
                          : color === 'success'
                          ? 'text-success'
                          : 'text-secondary'
                      }`}></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{feedback.subject}</h4>
                      <p className="text-sm text-gray-500">{feedback.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 ${
                        isResolved
                          ? 'bg-success/20 text-success'
                          : 'bg-warning/20 text-warning'
                      } text-xs font-semibold rounded-full`}
                    >
                      {displayStatus}
                    </span>
                    <span className="text-sm text-gray-500">{formatDate(feedback.submittedAt)}</span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-3">{feedback.message}</p>
                {feedback.rating && (
                  <div className="flex items-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`fa-solid fa-star text-sm ${
                          star <= feedback.rating! ? 'text-warning' : 'text-gray-300'
                        }`}
                      ></i>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FeedbackHistory

