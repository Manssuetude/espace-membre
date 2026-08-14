interface PollOption {
  id: number
  label: string
}

interface PollResponseOptionsProps {
  responseType: string
  options: PollOption[]
  onResponseTypeChange: (value: string) => void
  onAddOption: () => void
  onRemoveOption: (id: number) => void
  onUpdateOption: (id: number, label: string) => void
}

const PollResponseOptions = ({
  responseType,
  options,
  onResponseTypeChange,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
}: PollResponseOptionsProps) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-accent to-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
          2
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Options de réponse</h2>
          <p className="text-gray-600 text-sm">Définissez les choix disponibles pour les participants</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Type de réponse</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="relative">
              <input
                type="radio"
                name="response-type"
                value="single"
                checked={responseType === 'single'}
                onChange={(e) => onResponseTypeChange(e.target.value)}
                className="sr-only"
              />
              <div
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  responseType === 'single'
                    ? 'border-accent bg-accent/10'
                    : 'border-gray-200 hover:border-accent/50'
                }`}
              >
                <div className="text-center">
                  <i
                    className={`fa-solid fa-circle-dot text-2xl mb-2 ${
                      responseType === 'single' ? 'text-accent' : 'text-gray-400'
                    }`}
                  ></i>
                  <p className="font-semibold text-gray-900 text-sm">Choix unique</p>
                </div>
              </div>
            </label>
            <label className="relative">
              <input
                type="radio"
                name="response-type"
                value="multiple"
                checked={responseType === 'multiple'}
                onChange={(e) => onResponseTypeChange(e.target.value)}
                className="sr-only"
              />
              <div
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  responseType === 'multiple'
                    ? 'border-accent bg-accent/10'
                    : 'border-gray-200 hover:border-accent/50'
                }`}
              >
                <div className="text-center">
                  <i
                    className={`fa-solid fa-square-check text-2xl mb-2 ${
                      responseType === 'multiple' ? 'text-accent' : 'text-gray-400'
                    }`}
                  ></i>
                  <p className="font-semibold text-gray-900 text-sm">Choix multiples</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Options de réponse</label>
          <div className="space-y-3">
            {options.map((option, idx) => (
              <div key={option.id} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-accent to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {idx + 1}
                </div>
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => onUpdateOption(option.id, e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  placeholder={`Option ${idx + 1}`}
                />
                <button
                  type="button"
                  onClick={() => onRemoveOption(option.id)}
                  disabled={options.length <= 2}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onAddOption}
            className="mt-4 px-4 py-3 text-accent border border-accent hover:bg-accent hover:text-white rounded-xl transition-all flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            Ajouter une option
          </button>
        </div>
      </div>
    </div>
  )
}

export default PollResponseOptions

