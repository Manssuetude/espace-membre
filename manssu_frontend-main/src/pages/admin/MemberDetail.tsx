import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMember, useSuspendMember, useUnsuspendMember, useDeleteMember } from '../../services/hooks/useMembers'
import { useAuth } from '../../contexts/AuthContext'
import { Session } from '../../types/session'
import { Poll, PollOption } from '../../types/sondage'
import MemberHeader from '../../components/admin/MemberHeader'
import MemberProfileCard from '../../components/admin/MemberProfileCard'
import MemberSessionHistory from '../../components/admin/MemberSessionHistory'
import MemberSondageHistory from '../../components/admin/MemberSondageHistory'
import MemberStatusCard from '../../components/admin/MemberStatusCard'
import MemberStatisticsCard from '../../components/admin/MemberStatisticsCard'
import MemberAccountInfoCard from '../../components/admin/MemberAccountInfoCard'
import MemberFeedbacksHistory from '../../components/admin/MemberFeedbacksHistory'
import { useMemo } from 'react'

const MemberDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { data: member, isLoading } = useMember(id || '')
  const suspendMember = useSuspendMember()
  const unsuspendMember = useUnsuspendMember()
  const deleteMember = useDeleteMember()

  // Transform session attendance history to Session format
  const memberSessions = useMemo(() => {
    if (!member?.sessionAttendanceHistory) return []
    
    return member.sessionAttendanceHistory.map((attendance) => ({
      id: attendance.sessionId,
      title: attendance.sessionTitle,
      theme: null,
      type: 'workshop' as const,
      date: attendance.sessionDate,
      startTime: attendance.startTime?.substring(0, 5) || null,
      endTime: attendance.endTime?.substring(0, 5) || null,
      location: null,
      locationId: null,
      isOnline: false,
      maxParticipants: 0,
      registered: 0,
      status: attendance.status,
      description: null,
      duration: null,
      objectives: [],
      attendanceRate: null,
      averageGrade: null,
      createdAt: attendance.registeredAt,
      updatedAt: null,
      // Store attendance info for display
      attended: attendance.attended,
      rating: attendance.rating,
      comment: attendance.comment,
    } as Session & { attended?: boolean; rating?: number | null; comment?: string | null }))
  }, [member?.sessionAttendanceHistory])

  // Transform poll history to Poll format
  const memberPolls = useMemo(() => {
    if (!member?.pollHistory) return []
    
    return member.pollHistory.map((pollHistory) => {
      // Transform allChoices to PollOption format
      const options: PollOption[] = pollHistory.allChoices.map((choice, index) => ({
        id: choice.optionId,
        label: choice.optionLabel,
        votes: 0, // Not provided in pollHistory
        percentage: 0, // Not provided in pollHistory
        color: ['primary', 'accent', 'success', 'secondary', 'warning'][index % 5] || 'primary',
        orderIndex: index,
      }))
      
      // Get user's choice IDs
      const userChoiceIds = pollHistory.userChoices.map(c => c.optionId)
      // For display purposes, use the first choice ID if single response, or join multiple IDs
      const memberResponse = userChoiceIds.length > 0 ? userChoiceIds[0] : undefined
      
      return {
        id: pollHistory.pollId,
        title: pollHistory.pollTitle,
        question: pollHistory.pollQuestion,
        status: 'completed' as const,
        options,
        totalResponses: 0, // Not provided
        totalMembers: 0, // Not provided
        participation: null,
        resultsVisibility: 'realtime' as const,
        anonymous: false,
        singleResponse: userChoiceIds.length === 1,
        startDate: pollHistory.votedAt.split('T')[0],
        endDate: null,
        daysLeft: null,
        description: null,
        createdAt: pollHistory.votedAt,
        updatedAt: null,
        memberResponse,
        // Store all user choices for multiple response polls
        userChoiceIds,
      } as Poll & { memberResponse?: string; userChoiceIds?: string[] }
    })
  }, [member?.pollHistory])

  // Use feedbacks history from API
  const memberFeedbacks = useMemo(() => {
    return member?.feedbacksHistory || []
  }, [member?.feedbacksHistory])

  const handleSuspend = () => {
    if (!member) return
    if (window.confirm(`Êtes-vous sûr de vouloir suspendre ${member.name} ?`)) {
      suspendMember.mutate(member.id, {
        onSuccess: () => {
          // Member data will be refreshed automatically
        },
      })
    }
  }

  const handleUnsuspend = () => {
    if (!member) return
    if (window.confirm(`Êtes-vous sûr de vouloir réactiver ${member.name} ?`)) {
      unsuspendMember.mutate(member.id, {
        onSuccess: () => {
          // Member data will be refreshed automatically
        },
      })
    }
  }

  const handleDelete = () => {
    if (!member) return
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${member.name} ? Cette action est irréversible.`)) {
      deleteMember.mutate(member.id, {
        onSuccess: () => {
          navigate('/admin/membres')
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Membre non trouvé</p>
        <Link
          to="/admin/membres"
          className="text-primary hover:text-primary/80 font-medium"
        >
          Retour à la liste des membres
        </Link>
      </div>
    )
  }

  return (
    <div>
      <MemberHeader
        member={member}
        currentUser={currentUser}
        onSuspend={handleSuspend}
        onUnsuspend={handleUnsuspend}
        onDelete={handleDelete}
        suspendPending={suspendMember.isPending}
        unsuspendPending={unsuspendMember.isPending}
        deletePending={deleteMember.isPending}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <MemberProfileCard member={member} />
          <MemberSessionHistory sessions={memberSessions} />
          <MemberSondageHistory polls={memberPolls} />
        </div>

        {/* Right Column - Stats & Status */}
        <div className="space-y-6 sm:space-y-8">
          <MemberStatusCard member={member} />
          <MemberStatisticsCard member={member} />
          <MemberAccountInfoCard member={member} />
          <MemberFeedbacksHistory feedbacks={memberFeedbacks} />
        </div>
      </div>
    </div>
  )
}

export default MemberDetail

