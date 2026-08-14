interface ThemeProposalFormProps {
  formData: {
    title: string
    description: string
    category: string
  }
  onFormDataChange: (data: { title: string; description: string; category: string }) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  proposalsUsed?: number
}

const ThemeProposalForm = ({ formData, onFormDataChange, onSubmit, isLoading = false, proposalsUsed = 0 }: ThemeProposalFormProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Proposer un nouveau thème</h3>
          <p className="text-sm text-gray-600 mt-1">Vous pouvez proposer jusqu'à 2 thèmes par session</p>
        </div>
        <div className="px-4 py-2 bg-gradient-to-r from-success/10 to-emerald-500/10 rounded-xl border border-success/30">
          <p className="text-sm font-semibold text-success">{proposalsUsed}/2 propositions utilisées</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Titre du thème *</label>
          <input
            type="text"
            placeholder="Ex: Gestion de l'anxiété sociale"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors"
            required
            value={formData.title}
            onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-2">Soyez clair et concis (max 100 caractères)</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
          <textarea
            rows={5}
            placeholder="Décrivez votre proposition de thème en détail..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 focus:outline-none transition-colors resize-none"
            required
            value={formData.description}
            onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-2">
            Expliquez pourquoi ce thème serait pertinent (max 500 caractères)
          </p>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl border border-accent/20">
          <i className="fa-solid fa-info-circle text-accent text-lg mt-0.5"></i>
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Votre proposition sera vérifiée</p>
            <p className="text-gray-600">
              Notre équipe examinera votre proposition avant de l'ajouter à la liste. Vous recevrez une
              notification une fois validée.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:space-x-4 sm:gap-0 pt-4">
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading || proposalsUsed >= 2}
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-primary to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Envoi en cours...
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane mr-2"></i>
                Soumettre ma proposition
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ThemeProposalForm

