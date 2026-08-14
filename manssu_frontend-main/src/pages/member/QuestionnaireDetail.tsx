import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuestionnaireForMe, useSaveMyQuestionnaireAnswers } from '../../services/hooks/useQuestionnaires'
import { QuestionnaireAnswerPayload } from '../../types/questionnaire'
import { toast } from 'sonner'
import FormInput from '../../components/FormInput'

const QuestionnaireDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<Record<string, QuestionnaireAnswerPayload>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: questionnaireData, isLoading, error } = useQuestionnaireForMe(id || '')
  const saveAnswersMutation = useSaveMyQuestionnaireAnswers()

  const questionnaire = questionnaireData?.questionnaire
  const existingResponse = questionnaireData?.response

  // Compute whether the user can still edit their answers
  const now = new Date()
  let canEdit = true
  if (existingResponse) {
    if (existingResponse.status === 'submitted') {
      if (existingResponse.editUntil) {
        canEdit = new Date(existingResponse.editUntil) > now
      } else {
        // If no editUntil is provided for a submitted response, consider it non-editable
        canEdit = false
      }
    }
  }

  // Initialize answers from existing response
  useEffect(() => {
    if (existingResponse?.answers) {
      const initialAnswers: Record<string, QuestionnaireAnswerPayload> = {}
      existingResponse.answers.forEach((answer) => {
        initialAnswers[answer.questionId] = answer
      })
      setAnswers(initialAnswers)
    }
  }, [existingResponse])

  const handleAnswerChange = (questionId: string, type: string, value: any) => {
    if (!canEdit) return
    setAnswers((prev) => {
      const newAnswers = { ...prev }
      
      switch (type) {
        case 'single_choice':
          newAnswers[questionId] = {
            questionId,
            type: 'single_choice',
            answer: { optionId: value },
          }
          break
        case 'multiple_choice':
          newAnswers[questionId] = {
            questionId,
            type: 'multiple_choice',
            answer: { optionIds: value },
          }
          break
        case 'text':
          newAnswers[questionId] = {
            questionId,
            type: 'text',
            answer: { text: value },
          }
          break
        case 'rating':
          newAnswers[questionId] = {
            questionId,
            type: 'rating',
            answer: { rating: value },
          }
          break
        case 'number':
          newAnswers[questionId] = {
            questionId,
            type: 'number',
            answer: { number: value },
          }
          break
        case 'date':
          newAnswers[questionId] = {
            questionId,
            type: 'date',
            answer: { date: value },
          }
          break
      }
      
      return newAnswers
    })
  }

  const handleToggleMultipleChoice = (questionId: string, optionId: string) => {
    if (!canEdit) return
    const existingAnswer = answers[questionId] as any
    const currentOptionIds = existingAnswer?.answer?.optionIds || []
    
    if (currentOptionIds.includes(optionId)) {
      handleAnswerChange(questionId, 'multiple_choice', currentOptionIds.filter((id: string) => id !== optionId))
    } else {
      handleAnswerChange(questionId, 'multiple_choice', [...currentOptionIds, optionId])
    }
  }

  const handleSave = async (submit: boolean) => {
    if (!canEdit) return
    if (!id) return

    // Validate required questions
    const requiredQuestions = questionnaire?.questions?.filter((q) => q.required) || []
    const missingRequired = requiredQuestions.filter((q) => !answers[q.id])

    if (submit && missingRequired.length > 0) {
      toast.error(`Veuillez répondre aux questions obligatoires: ${missingRequired.map((q) => q.question).join(', ')}`)
      return
    }

    setIsSubmitting(true)
    const answersArray = Object.values(answers)

    saveAnswersMutation.mutate(
      {
        questionnaireId: id,
        data: {
          answers: answersArray,
          submit,
        },
      },
      {
        onSuccess: () => {
          if (submit) {
            toast.success('Questionnaire soumis avec succès')
            navigate('/')
          } else {
            toast.success('Réponses enregistrées en brouillon')
          }
          setIsSubmitting(false)
        },
        onError: () => {
          setIsSubmitting(false)
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    )
  }

  if (error || !questionnaire) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <p className="text-gray-600">Questionnaire non trouvé ou inaccessible</p>
        </div>
      </div>
    )
  }

  const questions = questionnaire.questions || []
  const sortedQuestions = [...questions].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8 mb-6">
        <button
          type="button"
          onClick={() => navigate('/questionnaires')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary mb-4"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Retour à la liste des questionnaires
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{questionnaire.title}</h1>
        {questionnaire.description && (
          <p className="text-gray-600 mb-6">{questionnaire.description}</p>
        )}

        {existingResponse?.status === 'submitted' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-success/10 to-emerald-500/10 rounded-xl border border-success/20">
            <div className="flex items-center">
              <i className="fa-solid fa-check-circle text-success mr-2"></i>
              <span className="text-success font-semibold">
                Questionnaire soumis le {existingResponse.submittedAt 
                  ? new Date(existingResponse.submittedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </span>
            </div>
            {existingResponse.editUntil && new Date(existingResponse.editUntil) > new Date() && (
              <p className="text-sm text-gray-600 mt-2">
                Vous pouvez modifier vos réponses jusqu'au{' '}
                {new Date(existingResponse.editUntil).toLocaleDateString('fr-FR')}
              </p>
            )}
            {!canEdit && existingResponse.editUntil && new Date(existingResponse.editUntil) <= new Date() && (
              <p className="text-sm text-gray-500 mt-2">
                La fenêtre de modification est expirée. Vous ne pouvez plus modifier vos réponses.
              </p>
            )}
          </div>
        )}

        <div className="space-y-8 mt-4">
          {sortedQuestions.map((question, index) => {
            const questionAnswer = answers[question.id]
            const isRequired = question.required

            return (
              <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {index + 1}. {question.question}
                    {isRequired && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  {question.description && (
                    <p className="text-sm text-gray-600 mb-4">{question.description}</p>
                  )}
                </div>

                {/* Render input based on question type */}
                {question.type === 'single_choice' && question.options && (
                  <div className="space-y-3">
                    {question.options
                      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                      .map((option) => {
                        const isSelected = (questionAnswer as any)?.answer?.optionId === option.id
                        return (
                          <div
                            key={option.id}
                            onClick={() => handleAnswerChange(question.id, 'single_choice', option.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10'
                                : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                                  isSelected
                                    ? 'border-primary bg-primary'
                                    : 'border-gray-300'
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-3 h-3 rounded-full bg-white"></div>
                                )}
                              </div>
                              <span className="text-gray-900 font-medium">{option.label}</span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}

                {question.type === 'multiple_choice' && question.options && (
                  <div className="space-y-3">
                    {question.options
                      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                      .map((option) => {
                        const selectedOptionIds = (questionAnswer as any)?.answer?.optionIds || []
                        const isSelected = selectedOptionIds.includes(option.id)
                        return (
                          <div
                            key={option.id}
                            onClick={() => handleToggleMultipleChoice(question.id, option.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10'
                                : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center">
                              <div
                                className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                                  isSelected
                                    ? 'border-primary bg-primary'
                                    : 'border-gray-300'
                                }`}
                              >
                                {isSelected && (
                                  <i className="fa-solid fa-check text-white text-xs"></i>
                                )}
                              </div>
                              <span className="text-gray-900 font-medium">{option.label}</span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}

                {question.type === 'text' && (
                  <FormInput
                    label=""
                    type="textarea"
                    value={(questionAnswer as any)?.answer?.text || ''}
                    onChange={(e) => handleAnswerChange(question.id, 'text', e.target.value)}
                    placeholder="Votre réponse..."
                    rows={5}
                    readOnly={!canEdit}
                  />
                )}

                {question.type === 'rating' && (
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => {
                      const currentRating = (questionAnswer as any)?.answer?.rating
                      const isSelected = currentRating === rating
                      return (
                        <button
                          key={rating}
                          onClick={() => handleAnswerChange(question.id, 'rating', rating)}
                          className={`w-12 h-12 rounded-lg border-2 font-semibold transition-all ${
                            isSelected
                              ? 'border-primary bg-primary text-white'
                              : 'border-gray-300 text-gray-600 hover:border-primary/50'
                          }`}
                          disabled={!canEdit}
                        >
                          {rating}
                        </button>
                      )
                    })}
                  </div>
                )}

                {question.type === 'number' && (
                  <FormInput
                    label=""
                    type="number"
                    value={(questionAnswer as any)?.answer?.number || ''}
                    onChange={(e) => handleAnswerChange(question.id, 'number', parseFloat(e.target.value) || 0)}
                    placeholder="Entrez un nombre"
                    readOnly={!canEdit}
                  />
                )}

                {question.type === 'date' && (
                  <FormInput
                    label=""
                    type="date"
                    value={(questionAnswer as any)?.answer?.date || ''}
                    onChange={(e) => handleAnswerChange(question.id, 'date', e.target.value)}
                    readOnly={!canEdit}
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mt-8 gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={() => handleSave(true)}
            disabled={!canEdit || isSubmitting || saveAnswersMutation.isPending}
            className="px-8 py-3 bg-gradient-to-r from-primary to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Soumission...
              </span>
            ) : (
              'Soumettre le questionnaire'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionnaireDetail

