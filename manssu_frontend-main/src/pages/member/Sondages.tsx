import { useState, useEffect } from 'react'
import { useSondages, useVote } from '../../services/hooks/useSondages'
import ActivePollsSection from '../../components/member/ActivePollsSection'
import CompletedPollsSection from '../../components/member/CompletedPollsSection'

const Sondages = () => {
  // Track selected options per poll and question: 
  // { pollId: { questionId: optionId } } for single response
  // { pollId: { questionId: string[] } } for multiple choice
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Record<string, string | string[]>>>({})

  // Fetch active polls
  const { data: activePollsData, isLoading: isLoadingActive } = useSondages({
    status: 'active',
  })

  // Fetch completed polls
  const { data: completedPollsData, isLoading: isLoadingCompleted } = useSondages({
    status: 'completed',
  })

  const voteMutation = useVote()

  const activePolls = activePollsData?.data || []
  const completedPolls = completedPollsData?.data || []

  // Initialize selectedOptions with user's existing votes
  useEffect(() => {
    if (activePolls.length === 0) return

    const initialSelections: Record<string, Record<string, string | string[]>> = {}

    activePolls.forEach((poll) => {
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

      questions.forEach((question) => {
        if (question.userVote) {
          const userVotesArray = Array.isArray(question.userVote) 
            ? question.userVote 
            : [question.userVote]
          
          if (userVotesArray.length > 0) {
            const optionIds = userVotesArray.map(v => v.optionId)
            
            if (!initialSelections[poll.id]) {
              initialSelections[poll.id] = {}
            }

            if (question.singleResponse) {
              // Single response: store as string
              initialSelections[poll.id][question.id] = optionIds[0]
            } else {
              // Multiple response: store as array
              initialSelections[poll.id][question.id] = optionIds
            }
          }
        }
      })
    })

    // Only update if there are initial selections and current state is empty for those polls
    if (Object.keys(initialSelections).length > 0) {
      setSelectedOptions((prev) => {
        // Merge with existing selections, but prefer existing if poll already has selections
        const merged: Record<string, Record<string, string | string[]>> = { ...prev }
        Object.keys(initialSelections).forEach((pollId) => {
          if (!merged[pollId]) {
            merged[pollId] = { ...initialSelections[pollId] }
          } else {
            // Only initialize questions that don't have selections yet
            Object.keys(initialSelections[pollId]).forEach((questionId) => {
              if (!merged[pollId][questionId]) {
                merged[pollId][questionId] = initialSelections[pollId][questionId]
              }
            })
          }
        })
        return merged
      })
    }
  }, [activePolls])

  const handleSelectOption = (pollId: string, questionId: string, optionId: string, singleResponse: boolean) => {
    setSelectedOptions((prev) => {
      const pollSelections = prev[pollId] || {}
      const questionSelection = pollSelections[questionId]
      
      if (singleResponse) {
        // Single response: toggle selection (allow unselecting by clicking again)
        if (questionSelection === optionId) {
          // Unselect if clicking the same option
          const newPollSelections = { ...pollSelections }
          delete newPollSelections[questionId]
          return {
            ...prev,
            [pollId]: newPollSelections,
          }
        } else {
          // Select new option
          return {
            ...prev,
            [pollId]: {
              ...pollSelections,
              [questionId]: optionId,
            },
          }
        }
      } else {
        // Multiple response: toggle selection for this question
        const currentSelections = Array.isArray(questionSelection) 
          ? questionSelection 
          : questionSelection 
            ? [questionSelection as string]
            : []
        
        if (currentSelections.includes(optionId)) {
          // Remove option
          const newSelections = currentSelections.filter(id => id !== optionId)
          const newPollSelections = { ...pollSelections }
          if (newSelections.length > 0) {
            newPollSelections[questionId] = newSelections
          } else {
            delete newPollSelections[questionId]
          }
          return {
            ...prev,
            [pollId]: newPollSelections,
          }
        } else {
          // Add option
          return {
            ...prev,
            [pollId]: {
              ...pollSelections,
              [questionId]: [...currentSelections, optionId],
            },
          }
        }
      }
    })
  }

  const handleVote = (pollId: string) => {
    const pollSelections = selectedOptions[pollId] || {}
    const poll = activePolls.find((p) => p.id === pollId)
    if (!poll) return
    
    // Use questions array if available, otherwise fallback to legacy format
    const questions = poll.questions && poll.questions.length > 0 
      ? poll.questions 
      : poll.question 
        ? [{
            id: 'legacy-question',
            question: poll.question,
            description: poll.description,
            orderIndex: 0,
            singleResponse: poll.singleResponse,
            options: poll.options || [],
            userVote: poll.userVote || null,
          }]
        : []
    
    // Convert to votes array format per question
    const votes = Object.entries(pollSelections)
      .filter(([_, selection]) => {
        // Filter out empty selections
        if (Array.isArray(selection)) {
          return selection.length > 0
        }
        return !!selection
      })
      .map(([questionId, selection]) => {
        // Find the question to get its singleResponse setting
        const question = questions.find(q => q.id === questionId)
        const isSingleResponse = question?.singleResponse ?? poll.singleResponse ?? true
        
        if (isSingleResponse) {
          // Single response: use optionId
          return {
            questionId,
            optionId: selection as string,
          }
        } else {
          // Multiple choice: use optionIds
          const optionIds = Array.isArray(selection) ? selection : [selection as string]
          return {
            questionId,
            optionIds,
          }
        }
      })
    
    if (votes.length === 0) {
      return
    }

    // Use new votes format
    voteMutation.mutate(
      {
        pollId,
        data: {
          votes,
        },
      },
      {
        onSuccess: () => {
          setSelectedOptions((prev) => {
            const newOptions = { ...prev }
            delete newOptions[pollId]
            return newOptions
          })
        },
      }
    )
  }

  const getColorForOption = (index: number): 'primary' | 'accent' | 'secondary' => {
    const colors: ('primary' | 'accent' | 'secondary')[] = ['primary', 'accent', 'secondary']
    return colors[index % colors.length]
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (isLoadingActive || isLoadingCompleted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    )
  }

  return (
    <div>
      <ActivePollsSection
        polls={activePolls}
        selectedOptions={selectedOptions}
        onSelectOption={handleSelectOption}
        onVote={handleVote}
        isVoting={voteMutation.isPending}
        getColorForOption={getColorForOption}
      />
      <CompletedPollsSection
        polls={completedPolls}
        formatDate={formatDate}
      />
    </div>
  )
}

export default Sondages

