import { useState } from 'react'
import PollOption from '../PollOption'
import { Poll } from '../../types/sondage'
import { formatDate } from '../../utils/dateUtils'

interface ActivePollCardProps {
  poll: Poll
  selectedOptions: Record<string, string | string[]> // { questionId: optionId } for single, { questionId: optionIds[] } for multiple
  onSelectOption: (pollId: string, questionId: string, optionId: string, singleResponse: boolean) => void
  onVote: (pollId: string) => void
  isVoting: boolean
  getColorForOption: (index: number) => 'primary' | 'accent' | 'secondary'
}

const ActivePollCard = ({
  poll,
  selectedOptions,
  onSelectOption,
  onVote,
  isVoting,
  getColorForOption,
}: ActivePollCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  // Use questions array if available, otherwise fallback to legacy format
  const questions = poll.questions && poll.questions.length > 0 
    ? poll.questions 
    : poll.question 
      ? [{
          id: 'legacy-question',
          question: poll.question,
          description: poll.description,
          orderIndex: 0,
          singleResponse: poll.singleResponse ?? true,
          options: poll.options || [],
          userVote: poll.userVote || null,
        }]
      : []
  
  // Check if user has voted on all questions
  const hasVoted = questions.length > 0 && questions.every(q => {
    const userVote = q.userVote
    if (!userVote) return false
    if (Array.isArray(userVote)) return userVote.length > 0
    return true
  })

  const formatVoteDate = (dateStr: string | null) => {
    return formatDate(dateStr, { includeTime: true })
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{poll.title}</h3>
          <p className="text-gray-600 flex items-center flex-wrap gap-3">
            <span className="flex items-center">
              <i className="fa-solid fa-users mr-2 text-accent"></i>
              {poll.totalResponses} réponses
            </span>
            {poll.daysLeft !== null && poll.daysLeft !== undefined && (
              <span className="flex items-center">
                <i className="fa-solid fa-clock mr-2 text-warning"></i>
                {poll.daysLeft < 0 && poll.endDate
                  ? `Terminé le ${new Date(poll.endDate).toLocaleDateString('fr-FR')}`
                  : poll.daysLeft === 0
                  ? "Dernier jour pour voter"
                  : `Se termine dans ${poll.daysLeft} jour${poll.daysLeft > 1 ? 's' : ''}`
                }
              </span>
            )}
          </p>
        </div>
        <div className="px-4 py-2 bg-gradient-to-r from-success/10 to-emerald-500/10 rounded-xl border border-success/20">
          <span className="text-success font-semibold text-sm">Actif</span>
        </div>
      </div>

      {/* Display all questions */}
      {questions.length > 0 && (
        <div className="space-y-6 mb-6">
          {(isExpanded ? questions : questions.slice(0, 2)).map((question, qIdx) => {
            // Get the original index from the full questions array
            const originalIndex = questions.findIndex(q => q.id === question.id)
            const questionUserVote = question.userVote
            // Normalize userVote to array format for easier handling
            const userVotesArray = questionUserVote 
              ? Array.isArray(questionUserVote) 
                ? questionUserVote 
                : [questionUserVote]
              : []
            const hasVotedOnQuestion = userVotesArray.length > 0
            const questionSelection = selectedOptions[question.id]
            const userVotedOptionIds = userVotesArray.map(v => v.optionId)
            
            // Handle both single (string) and multiple (string[]) selections
            // Priority: current selection state > saved vote
            const isSelectedOption = (optionId: string): boolean => {
              // If user has made a selection in the current session, use that
              if (questionSelection) {
                if (Array.isArray(questionSelection)) {
                  return questionSelection.includes(optionId)
                }
                return questionSelection === optionId
              }
              // Otherwise, fall back to saved vote
              if (hasVotedOnQuestion && userVotedOptionIds.includes(optionId)) {
                return true
              }
              return false
            }
            
            return (
              <div key={question.id || qIdx} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {questions.length > 1 && `Question ${originalIndex + 1}: `}
                    {question.question}
                  </h4>
                  {question.description && (
                    <p className="text-sm text-gray-600 mb-4">{question.description}</p>
                  )}
                </div>

                {/* Show user's vote if they've voted on this question */}
                {hasVotedOnQuestion && userVotesArray.length > 0 && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-primary/10 to-red-500/10 rounded-xl border border-primary/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <i className="fa-solid fa-check-circle text-primary mr-2"></i>
                          <span className="text-sm font-medium text-gray-900">
                            {userVotesArray.length > 1 ? 'Vos choix :' : 'Votre choix :'}
                          </span>
                        </div>
                        <div className="ml-6 space-y-1">
                          {userVotesArray.map((vote, voteIdx) => (
                            <div key={voteIdx} className="flex items-center justify-between">
                              <span className="text-sm text-primary font-semibold">
                                • {vote.optionLabel}
                              </span>
                              {vote.votedAt && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {formatVoteDate(vote.votedAt)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Display options for this question */}
                {question.options && question.options.length > 0 && (
                  <div className="space-y-4">
                    {question.options.map((option, index) => {
                      const isUserVote = hasVotedOnQuestion && userVotedOptionIds.includes(option.id)
                      const isSelected = isSelectedOption(option.id)
                      
                      return (
                        <div key={option.id} className="relative">
                          <PollOption
                            id={option.id}
                            label={option.label}
                            votes={option.votes || 0}
                            totalVotes={poll.totalResponses}
                            selected={isSelected}
                            color={getColorForOption(index)}
                            onSelect={() => onSelectOption(poll.id, question.id, option.id, question.singleResponse)}
                            singleResponse={question.singleResponse}
                            questionId={question.id}
                          />
                          {isUserVote && (
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-lg flex items-center">
                                <i className="fa-solid fa-check mr-1"></i>
                                Votre choix
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {questions.length > 2 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-4 px-4 py-3 text-sm font-medium text-accent hover:text-accent/80 border border-accent/30 hover:border-accent rounded-xl transition-all flex items-center justify-center"
            >
              {isExpanded ? (
                <>
                  <i className="fa-solid fa-chevron-up mr-2"></i>
                  Voir moins
                </>
              ) : (
                <>
                  <i className="fa-solid fa-chevron-down mr-2"></i>
                  Voir tout ({questions.length} questions)
                </>
              )}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-8 gap-4">
        <p className="text-sm text-gray-500">
          {hasVoted
            ? "Vous pouvez modifier vos réponses jusqu'à la fermeture du sondage"
            : `Veuillez répondre à ${questions.length > 1 ? 'toutes les questions' : 'la question'}`}
        </p>
        <button
          onClick={() => onVote(poll.id)}
          disabled={
            Object.keys(selectedOptions).length === 0 || 
            Object.values(selectedOptions).every(sel => {
              // Check if selection is empty (empty array or empty string)
              if (Array.isArray(sel)) return sel.length === 0
              return !sel
            }) ||
            isVoting
          }
          className="px-8 py-3 bg-gradient-to-r from-primary to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVoting ? (
            <span className="flex items-center">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              Enregistrement...
            </span>
          ) : hasVoted ? (
            'Modifier mon vote'
          ) : (
            'Voter'
          )}
        </button>
      </div>
    </div>
  )
}

export default ActivePollCard

