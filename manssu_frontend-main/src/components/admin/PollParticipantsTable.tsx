import { useState, useEffect, useRef } from 'react'
import { formatDateWithTime } from '../../utils/dateUtils'

interface ParticipantChoice {
  questionLabel?: string
  questionNumber?: number
  questionText?: string
  label: string
  color: string
  date: string
}

interface Participant {
  id: string
  name: string
  avatar: string | null
  choices: ParticipantChoice[]
  earliestDate: string
  status: 'Voté' | 'En attente'
}

interface PollParticipantsTableProps {
  participants: Participant[]
  totalResponses: number
  totalMembers: number
}

const getVoterInitials = (firstName: string, lastName: string, name: string): string => {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  } else if (name) {
    const nameParts = name.trim().split(' ')
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    }
    return nameParts[0][0].toUpperCase()
  }
  return 'U'
}

const getVoterAvatarUrl = (avatar: string | null): string | null => {
  if (!avatar) return null
  
  // If avatar is already a full URL, return it
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  
  // Otherwise, construct the URL
  return `https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/${avatar}`
}

const getColorBadgeClass = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    primary: 'bg-red-100 text-red-800',
    accent: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    secondary: 'bg-orange-100 text-orange-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
  }
  return colorMap[color] || colorMap.accent
}

const formatEarliestDate = (earliestDate: string): string => {
  return formatDateWithTime(earliestDate)
}

const PollParticipantsTable = ({ participants, totalResponses, totalMembers }: PollParticipantsTableProps) => {
  const [expandedParticipants, setExpandedParticipants] = useState<Record<string, boolean>>({})
  const [hoveredQuestion, setHoveredQuestion] = useState<{ participantId: string; questionNumber: number } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        // Only close on mobile (touch devices) - on desktop, we rely on onMouseLeave
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
          setHoveredQuestion(null)
        }
      }
    }

    if (hoveredQuestion) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [hoveredQuestion])

  const toggleParticipantExpansion = (participantId: string) => {
    setExpandedParticipants(prev => ({
      ...prev,
      [participantId]: !prev[participantId]
    }))
  }

  // Group choices by question
  const groupChoicesByQuestion = (choices: ParticipantChoice[]) => {
    const grouped = new Map<number, ParticipantChoice[]>()
    choices.forEach(choice => {
      const questionNum = choice.questionNumber || 0
      if (!grouped.has(questionNum)) {
        grouped.set(questionNum, [])
      }
      grouped.get(questionNum)!.push(choice)
    })
    return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0])
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{totalResponses} participants sur {totalMembers} membres</span>
        </div>
      </div>
      
      {participants.length === 0 ? (
        <div className="text-center py-12">
          <i className="fa-solid fa-users text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">Aucun participant pour le moment</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Membre</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Choix</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Date de vote</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Statut</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant, idx) => {
                const avatarUrl = getVoterAvatarUrl(participant.avatar)
                const initials = getVoterInitials('', '', participant.name)
                
                return (
                  <tr key={participant.id || idx} className={`border-b ${idx === participants.length - 1 ? '' : 'border-gray-100'} hover:bg-gray-50`}>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={participant.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-red-500 flex items-center justify-center text-white font-semibold text-xs">
                            {initials}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{participant.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {participant.choices.length > 0 ? (
                        <div className="space-y-2">
                          {(() => {
                            const groupedQuestions = groupChoicesByQuestion(participant.choices)
                            const isExpanded = expandedParticipants[participant.id]
                            const displayedQuestions = isExpanded ? groupedQuestions : groupedQuestions.slice(0, 2)
                            
                            return (
                              <>
                                {displayedQuestions.map(([questionNum, choices]) => {
                                  const firstChoice = choices[0]
                                  const questionText = firstChoice.questionText || ''
                                  const isHovered = hoveredQuestion?.participantId === participant.id && 
                                                   hoveredQuestion?.questionNumber === questionNum
                                  
                                  return (
                                    <div key={questionNum} className="flex items-center gap-2 flex-wrap">
                                      {firstChoice.questionLabel && (
                                        <div className="relative group" ref={tooltipRef}>
                                          <span 
                                            className="text-xs font-semibold text-gray-600 min-w-[60px] cursor-help underline decoration-dotted"
                                            onMouseEnter={() => setHoveredQuestion({ participantId: participant.id, questionNumber: questionNum })}
                                            onMouseLeave={() => {
                                              // Only close on hover leave for desktop (non-touch devices)
                                              if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
                                                setHoveredQuestion(null)
                                              }
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              if (isHovered) {
                                                setHoveredQuestion(null)
                                              } else {
                                                setHoveredQuestion({ participantId: participant.id, questionNumber: questionNum })
                                              }
                                            }}
                                          >
                                            {firstChoice.questionLabel}:
                                          </span>
                                          {isHovered && questionText && (
                                            <div className="absolute left-0 top-full mt-1 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-auto">
                                              <div className="font-semibold mb-1">{firstChoice.questionLabel}</div>
                                              <div className="text-gray-300">{questionText}</div>
                                              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div className="flex flex-wrap gap-1">
                                        {choices.map((choice, choiceIdx) => (
                                          <span
                                            key={choiceIdx}
                                            className={`px-2 py-1 rounded-lg text-xs font-medium ${getColorBadgeClass(choice.color)}`}
                                          >
                                            {choice.label}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                })}
                                {groupedQuestions.length > 2 && (
                                  <button
                                    onClick={() => toggleParticipantExpansion(participant.id)}
                                    className="text-xs text-accent hover:text-accent/80 font-medium mt-1 flex items-center"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <i className="fa-solid fa-chevron-up mr-1"></i>
                                        Voir moins
                                      </>
                                    ) : (
                                      <>
                                        <i className="fa-solid fa-chevron-down mr-1"></i>
                                        Voir plus ({groupedQuestions.length - 2} autres)
                                      </>
                                    )}
                                  </button>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Aucun choix</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatEarliestDate(participant.earliestDate)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium">{participant.status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default PollParticipantsTable

