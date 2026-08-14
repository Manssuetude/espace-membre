import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useUpcomingSessions } from '../../contexts/UpcomingSessionsContext'
import { useCreateSondage } from '../../services/hooks/useSondages'
import { CreatePollRequest } from '../../types/sondage'
import SearchableDropdown from '../../components/SearchableDropdown'
import PollConfiguration from '../../components/admin/PollConfiguration'
import PollFormActions from '../../components/admin/PollFormActions'
import FormInput from '../../components/FormInput'

interface QuestionOption {
  id: number
  label: string
}

interface Question {
  id: number
  question: string
  description: string
  singleResponse: boolean
  options: QuestionOption[]
}

const CreateSondage = () => {
  const navigate = useNavigate()
  const { upcomingSessions } = useUpcomingSessions()
  const createSondage = useCreateSondage()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sessionId: '',
    startDate: '',
    endDate: '',
    visibility: 'realtime',
    anonymous: false,
  })

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      question: '',
      description: '',
      singleResponse: true,
      options: [
    { id: 1, label: '' },
    { id: 2, label: '' },
      ],
    },
  ])

  const [openTemplateDropdown, setOpenTemplateDropdown] = useState<Record<number, boolean>>({})

  const sessionOptions = upcomingSessions.map((session) => ({
    value: session.id,
    label: `${session.title}${session.date ? ` - ${new Date(session.date).toLocaleDateString('fr-FR')}` : ''}`,
  }))

  // Question management
  const addQuestion = () => {
    const newQuestionId = Math.max(...questions.map(q => q.id), 0) + 1
    setQuestions([
      ...questions,
      {
        id: newQuestionId,
        question: '',
        description: '',
        singleResponse: true,
        options: [
          { id: 1, label: '' },
          { id: 2, label: '' },
        ],
      },
    ])
  }

  const removeQuestion = (questionId: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== questionId))
    } else {
      toast.error('Un sondage doit avoir au moins une question')
    }
  }

  const updateQuestion = (questionId: number, field: 'question' | 'description' | 'singleResponse', value: string | boolean) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q))
    )
  }

  // Option management per question
  const addOption = (questionId: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const newOptionId = Math.max(...q.options.map(opt => opt.id), 0) + 1
          return {
            ...q,
            options: [...q.options, { id: newOptionId, label: '' }],
          }
        }
        return q
      })
    )
  }

  const removeOption = (questionId: number, optionId: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          if (q.options.length > 2) {
            return {
              ...q,
              options: q.options.filter((opt) => opt.id !== optionId),
            }
          } else {
            toast.error('Une question doit avoir au moins 2 options')
            return q
          }
        }
        return q
      })
    )
  }

  const updateOption = (questionId: number, optionId: number, label: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map((opt) =>
              opt.id === optionId ? { ...opt, label } : opt
            ),
          }
        }
        return q
      })
    )
  }

  // Predefined choice templates
  const predefinedTemplates = {
    yesNo: {
      name: 'Oui/Non',
      options: [
        { id: 1, label: 'Oui' },
        { id: 2, label: 'Non' },
      ],
    },
    likert: {
      name: 'Échelle de Likert',
      options: [
        { id: 1, label: 'Pas du tout d\'accord' },
        { id: 2, label: 'Peu d\'accord' },
        { id: 3, label: 'Neutre' },
        { id: 4, label: 'D\'accord' },
        { id: 5, label: 'Parfaitement d\'accord' },
      ],
    },
    satisfaction: {
      name: 'Échelle de satisfaction',
      options: [
        { id: 1, label: 'Très insatisfait' },
        { id: 2, label: 'Insatisfait' },
        { id: 3, label: 'Neutre' },
        { id: 4, label: 'Satisfait' },
        { id: 5, label: 'Très satisfait' },
      ],
    },
    frequency: {
      name: 'Échelle de fréquence',
      options: [
        { id: 1, label: 'Jamais' },
        { id: 2, label: 'Rarement' },
        { id: 3, label: 'Parfois' },
        { id: 4, label: 'Souvent' },
        { id: 5, label: 'Toujours' },
      ],
    },
  }

  const applyTemplate = (questionId: number, templateKey: keyof typeof predefinedTemplates) => {
    const template = predefinedTemplates[templateKey]
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: template.options.map((opt, idx) => ({
              id: idx + 1,
              label: opt.label,
            })),
          }
        }
        return q
      })
    )
    setOpenTemplateDropdown({ ...openTemplateDropdown, [questionId]: false })
    toast.success(`Modèle "${template.name}" appliqué`)
  }

  const toggleTemplateDropdown = (questionId: number) => {
    setOpenTemplateDropdown({
      ...openTemplateDropdown,
      [questionId]: !openTemplateDropdown[questionId],
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title) {
      toast.error('Veuillez remplir le titre du sondage')
      return
    }

    if (!formData.startDate) {
      toast.error('Veuillez sélectionner une date de début')
      return
    }

    // Validate all questions
    for (const question of questions) {
      if (!question.question.trim()) {
        toast.error('Veuillez remplir toutes les questions')
        return
      }

      const validOptions = question.options.filter(opt => opt.label.trim())
    if (validOptions.length < 2) {
        toast.error('Chaque question doit avoir au moins 2 options de réponse')
      return
      }
    }

    const pollData: CreatePollRequest = {
      title: formData.title,
      description: formData.description || undefined,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      sessionId: formData.sessionId || undefined,
      resultsVisibility: formData.visibility === 'realtime' ? 'realtime' : 'hidden',
      anonymous: formData.anonymous,
      questions: questions.map((q, idx) => ({
        question: q.question.trim(),
        description: q.description.trim() || undefined,
        singleResponse: q.singleResponse,
        orderIndex: idx,
        options: q.options
          .filter(opt => opt.label.trim())
          .map((opt, optIdx) => ({
            label: opt.label.trim(),
            orderIndex: optIdx,
          })),
      })),
    }

    createSondage.mutate(pollData, {
      onSuccess: () => {
        navigate('/admin/sondages')
      },
    })
  }


  return (
    <div>
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8">
        {/* Session Selection */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-accent to-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
              0
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Association</h2>
              <p className="text-gray-600 text-sm">Associez ce sondage à une session (optionnel)</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Session
            </label>
            <SearchableDropdown
              value={formData.sessionId}
              onChange={(value) => setFormData({ ...formData, sessionId: value })}
              options={sessionOptions}
              placeholder="Sélectionner une session (optionnel)..."
              className="w-full"
            />
            {sessionOptions.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Aucune session à venir disponible</p>
            )}
          </div>
        </div>

        {/* General Info */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-accent to-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
              1
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Informations générales</h2>
              <p className="text-gray-600 text-sm">Définissez les informations de base de votre sondage</p>
            </div>
          </div>

          <div className="space-y-6">
            <FormInput
              label="Titre du sondage *"
              placeholder="Ex: Sélection du thème de la prochaine session"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <FormInput
              label="Description (optionnelle)"
              placeholder="Décrivez brièvement l'objectif de ce sondage..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, qIdx) => (
            <div key={question.id} className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-10 h-10 min-w-[2.5rem] bg-gradient-to-r from-primary to-red-500 text-white rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    {qIdx + 1}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-900">
                      Question {qIdx + 1}
                    </h2>
                    <p className="text-gray-600 text-sm">Définissez la question et ses options</p>
                  </div>
                </div>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ml-2"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <FormInput
                  label="Question *"
                  placeholder="Posez votre question ici..."
                  rows={3}
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                />

                <FormInput
                  label="Description (optionnelle)"
                  placeholder="Description ou instructions supplémentaires..."
                  rows={2}
                  value={question.description}
                  onChange={(e) => updateQuestion(question.id, 'description', e.target.value)}
        />

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Type de réponse pour cette question</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="relative">
                      <input
                        type="radio"
                        name={`response-type-${question.id}`}
                        checked={question.singleResponse}
                        onChange={() => updateQuestion(question.id, 'singleResponse', true)}
                        className="sr-only"
                      />
                      <div
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          question.singleResponse
                            ? 'border-accent bg-accent/10'
                            : 'border-gray-200 hover:border-accent/50'
                        }`}
                      >
                        <div className="text-center">
                          <i
                            className={`fa-solid fa-circle-dot text-2xl mb-2 ${
                              question.singleResponse ? 'text-accent' : 'text-gray-400'
                            }`}
                          ></i>
                          <p className="font-semibold text-gray-900 text-sm">Choix unique</p>
                        </div>
                      </div>
                    </label>
                    <label className="relative">
                      <input
                        type="radio"
                        name={`response-type-${question.id}`}
                        checked={!question.singleResponse}
                        onChange={() => updateQuestion(question.id, 'singleResponse', false)}
                        className="sr-only"
                      />
                      <div
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          !question.singleResponse
                            ? 'border-accent bg-accent/10'
                            : 'border-gray-200 hover:border-accent/50'
                        }`}
                      >
                        <div className="text-center">
                          <i
                            className={`fa-solid fa-square-check text-2xl mb-2 ${
                              !question.singleResponse ? 'text-accent' : 'text-gray-400'
                            }`}
                          ></i>
                          <p className="font-semibold text-gray-900 text-sm">Choix multiples</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-3">
                    <label className="block text-sm font-semibold text-gray-900">Options de réponse *</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => toggleTemplateDropdown(question.id)}
                        className="px-3 py-1.5 text-xs font-medium text-accent border border-accent rounded-lg hover:bg-accent hover:text-white transition-all flex items-center"
                      >
                        <i className="fa-solid fa-magic mr-1.5"></i>
                        Modèles prédéfinis
                        <i className={`fa-solid fa-chevron-${openTemplateDropdown[question.id] ? 'up' : 'down'} ml-1.5 text-xs`}></i>
                      </button>
                      {openTemplateDropdown[question.id] && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => toggleTemplateDropdown(question.id)}
                          ></div>
                          <div className="absolute right-0 sm:right-0 left-0 sm:left-auto top-full mt-2 w-full sm:w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
                            <button
                              type="button"
                              onClick={() => applyTemplate(question.id, 'yesNo')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <i className="fa-solid fa-check-double mr-2 text-primary"></i>
                              Oui/Non
                            </button>
                            <button
                              type="button"
                              onClick={() => applyTemplate(question.id, 'likert')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <i className="fa-solid fa-sliders mr-2 text-accent"></i>
                              Échelle de Likert
                            </button>
                            <button
                              type="button"
                              onClick={() => applyTemplate(question.id, 'satisfaction')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <i className="fa-solid fa-face-smile mr-2 text-success"></i>
                              Échelle de satisfaction
                            </button>
                            <button
                              type="button"
                              onClick={() => applyTemplate(question.id, 'frequency')}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <i className="fa-solid fa-repeat mr-2 text-secondary"></i>
                              Échelle de fréquence
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {question.options.map((option, optIdx) => (
                      <div key={option.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-accent to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          {optIdx + 1}
                        </div>
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => updateOption(question.id, option.id, e.target.value)}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                          placeholder={`Option ${optIdx + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(question.id, option.id)}
                          disabled={question.options.length <= 2}
                          className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => addOption(question.id)}
                    className="mt-4 px-4 py-3 text-accent border border-accent hover:bg-accent hover:text-white rounded-xl transition-all flex items-center"
                  >
                    <i className="fa-solid fa-plus mr-2"></i>
                    Ajouter une option
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full px-6 py-4 text-accent border-2 border-dashed border-accent hover:bg-accent hover:text-white rounded-xl transition-all flex items-center justify-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            Ajouter une question
          </button>
        </div>

        <PollConfiguration
          startDate={formData.startDate}
          endDate={formData.endDate}
          visibility={formData.visibility}
          anonymous={formData.anonymous}
          onStartDateChange={(value) => setFormData({ ...formData, startDate: value })}
          onEndDateChange={(value) => setFormData({ ...formData, endDate: value })}
          onVisibilityChange={(value) => setFormData({ ...formData, visibility: value })}
          onAnonymousChange={(value) => setFormData({ ...formData, anonymous: value })}
        />

        <PollFormActions onSubmit={(e) => handleSubmit(e || ({} as React.FormEvent))} isLoading={createSondage.isPending} />
      </form>
    </div>
  )
}

export default CreateSondage
