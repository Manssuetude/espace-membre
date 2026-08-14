interface PollOption {
  label: string
  votes: number
  percentage: number
  color: string
}

interface PollQuestionCardProps {
  question: string
  description?: string | null
  options: PollOption[]
  getColorClasses: (color: string, type: 'bg' | 'text' | 'badge') => string
  questionNumber?: number
}

const PollQuestionCard = ({ question, description, options, getColorClasses, questionNumber }: PollQuestionCardProps) => {
  return (
    <div className={`bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 ${questionNumber ? 'mb-6' : 'mb-8'}`}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          {questionNumber ? `Question ${questionNumber} du sondage` : 'Question du sondage'}
        </h2>
        <p className="text-gray-700 text-lg leading-relaxed">{question}</p>
        {description && (
          <p className="text-gray-600 text-sm mt-2">{description}</p>
        )}
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Résultats en temps réel</h3>
        <div className="space-y-4">
          {options.map((option, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-gray-900">{option.label}</span>
                <span className="text-sm font-semibold text-gray-700">{option.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className={`bg-gradient-to-r ${getColorClasses(option.color, 'bg')} h-3 rounded-full`} style={{ width: `${option.percentage}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PollQuestionCard

