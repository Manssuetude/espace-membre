import { useMemo } from 'react'
import { useMyFeedbacks } from '../../services/hooks/useFeedback'

const FeedbackStatsSidebar = () => {
  const { data: feedbacksData } = useMyFeedbacks({ limit: 100 })
  const feedbacks = feedbacksData?.data || []

  const stats = useMemo(() => {
    const total = feedbacks.length
    const resolved = feedbacks.filter((f) => f.status === 'read' || f.status === 'resolved').length
    const pending = feedbacks.filter((f) => f.status === 'new').length

    return [
      { icon: 'fa-comment-dots', label: 'Total envoyés', value: total.toString(), color: 'accent' },
      { icon: 'fa-check-circle', label: 'Traités', value: resolved.toString(), color: 'success' },
      { icon: 'fa-clock', label: 'En attente', value: pending.toString(), color: 'warning' },
    ]
  }, [feedbacks])

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Vos feedbacks</h3>
      <div className="space-y-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`flex items-center justify-between p-3 bg-gradient-to-r from-${stat.color}/10 to-${stat.color === 'accent' ? 'blue-600' : stat.color === 'success' ? 'emerald-600' : 'yellow-600'}/10 rounded-xl`}
          >
            <div className="flex items-center">
              <i className={`fa-solid ${stat.icon} text-${stat.color} mr-3`}></i>
              <span className="text-sm font-medium text-gray-700">{stat.label}</span>
            </div>
            <span className={`font-bold text-${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeedbackStatsSidebar

