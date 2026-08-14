import { useState, useEffect } from 'react'
import FormInput from '../FormInput'
import { ActivityTemplate } from '../../types/format'

// Colors and icons from the reference
const AVAILABLE_COLORS = [
  { value: 'from-red-500 to-red-600', label: 'Rouge' },
  { value: 'from-orange-500 to-red-600', label: 'Orange vers Rouge' },
  { value: 'from-orange-500 to-orange-600', label: 'Orange' },
  { value: 'from-amber-500 to-orange-600', label: 'Ambre vers Orange' },
  { value: 'from-yellow-500 to-amber-600', label: 'Jaune vers Ambre' },
  { value: 'from-rose-500 to-pink-600', label: 'Rose vers Rose' },
  { value: 'from-blue-500 to-indigo-600', label: 'Bleu vers Indigo' },
  { value: 'from-blue-500 to-blue-600', label: 'Bleu' },
  { value: 'from-cyan-500 to-blue-600', label: 'Cyan vers Bleu' },
  { value: 'from-teal-500 to-cyan-600', label: 'Sarcelle vers Cyan' },
  { value: 'from-sky-500 to-blue-600', label: 'Bleu Ciel vers Bleu' },
  { value: 'from-indigo-500 to-purple-600', label: 'Indigo vers Violet' },
  { value: 'from-purple-500 to-pink-600', label: 'Violet vers Rose' },
  { value: 'from-purple-500 to-purple-600', label: 'Violet' },
  { value: 'from-violet-500 to-purple-600', label: 'Violet vers Violet' },
  { value: 'from-fuchsia-500 to-pink-600', label: 'Fuchsia vers Rose' },
  { value: 'from-green-500 to-emerald-600', label: 'Vert vers Émeraude' },
  { value: 'from-green-500 to-green-600', label: 'Vert' },
  { value: 'from-emerald-500 to-teal-600', label: 'Émeraude vers Sarcelle' },
  { value: 'from-lime-500 to-green-600', label: 'Lime vers Vert' },
  { value: 'from-gray-600 to-gray-700', label: 'Gris' },
  { value: 'from-slate-600 to-gray-700', label: 'Ardoise vers Gris' },
  { value: 'from-zinc-600 to-gray-700', label: 'Zinc vers Gris' },
  { value: 'from-stone-600 to-gray-700', label: 'Pierre vers Gris' },
]

const AVAILABLE_ICONS = [
  // Debate & Discussion
  { value: 'fa-fire', label: '🔥 Feu (Débat chaud)' },
  { value: 'fa-comments', label: '💬 Commentaires' },
  { value: 'fa-comment-dots', label: '💭 Points de discussion' },
  { value: 'fa-microphone', label: '🎤 Microphone (Plaidoyer)' },
  { value: 'fa-bullhorn', label: '📢 Mégaphone' },
  { value: 'fa-volume-high', label: '🔊 Volume' },
  { value: 'fa-hand-holding-heart', label: '🤝 Cœur (Plaidoyer)' },
  // Teams & Groups
  { value: 'fa-people-arrows', label: '👥 Flèches (Équipes)' },
  { value: 'fa-users', label: '👤 Utilisateurs' },
  { value: 'fa-user-group', label: '👥 Groupe' },
  { value: 'fa-people-group', label: '👥 Communauté' },
  { value: 'fa-handshake', label: '🤝 Poignée de main' },
  { value: 'fa-users-between-lines', label: '👥 Entre lignes' },
  // Learning & Presentation
  { value: 'fa-chalkboard', label: '📋 Tableau (Présentation)' },
  { value: 'fa-chalkboard-user', label: '📋 Tableau utilisateur' },
  { value: 'fa-presentation-screen', label: '🖥️ Écran présentation' },
  { value: 'fa-book', label: '📚 Livre' },
  { value: 'fa-graduation-cap', label: '🎓 Casquette' },
  { value: 'fa-lightbulb', label: '💡 Ampoule (Idées)' },
  { value: 'fa-brain', label: '🧠 Cerveau' },
  // Interactive & Games
  { value: 'fa-question-circle', label: '❓ Question (Quiz)' },
  { value: 'fa-gamepad', label: '🎮 Manette' },
  { value: 'fa-trophy', label: '🏆 Trophée' },
  { value: 'fa-puzzle-piece', label: '🧩 Pièce puzzle' },
  { value: 'fa-dice', label: '🎲 Dé' },
  { value: 'fa-chess', label: '♟️ Échecs' },
  // Problem Solving
  { value: 'fa-gear', label: '⚙️ Engrenage' },
  { value: 'fa-wrench', label: '🔧 Clé' },
  { value: 'fa-tools', label: '🛠️ Outils' },
  { value: 'fa-hammer', label: '🔨 Marteau' },
  { value: 'fa-screwdriver-wrench', label: '🔩 Tournevis' },
  // Communication
  { value: 'fa-message', label: '💬 Message' },
  { value: 'fa-envelope', label: '✉️ Enveloppe' },
  { value: 'fa-paper-plane', label: '✈️ Avion' },
  { value: 'fa-megaphone', label: '📢 Mégaphone' },
  // Time & Schedule
  { value: 'fa-clock', label: '🕐 Horloge' },
  { value: 'fa-hourglass', label: '⏳ Sablier' },
  { value: 'fa-calendar', label: '📅 Calendrier' },
  { value: 'fa-calendar-days', label: '📆 Jours' },
  // Other
  { value: 'fa-star', label: '⭐ Étoile' },
  { value: 'fa-heart', label: '❤️ Cœur' },
  { value: 'fa-bookmark', label: '🔖 Signet' },
  { value: 'fa-flag', label: '🚩 Drapeau' },
  { value: 'fa-target', label: '🎯 Cible' },
  { value: 'fa-compass', label: '🧭 Boussole' },
  { value: 'fa-map', label: '🗺️ Carte' },
  { value: 'fa-gem', label: '💎 Gemme' },
  { value: 'fa-crown', label: '👑 Couronne' },
  { value: 'fa-shield', label: '🛡️ Bouclier' },
  { value: 'fa-scales', label: '⚖️ Balance' },
  { value: 'fa-gavel', label: '🔨 Marteau justice' },
]

interface CreateFormatModalProps {
  isOpen: boolean
  onClose: () => void
  template?: ActivityTemplate | null
  onSubmit: (data: {
    name: string
    description: string
    icon: string
    color: string
    durationMinutes: number
    rules: string[]
    examples: string[]
  }) => void
}

const CreateFormatModal = ({ isOpen, onClose, template, onSubmit }: CreateFormatModalProps) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [rules, setRules] = useState<string[]>([''])
  const [examples, setExamples] = useState<string[]>([''])

  // Parse duration string to minutes
  const parseDurationToMinutes = (duration?: string): number => {
    if (!duration) return 0
    const hoursMatch = duration.match(/(\d+)h/)
    const minutesMatch = duration.match(/(\d+)min/i)
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0
    return hours * 60 + minutes
  }

  // Initialize form when template is provided (edit mode)
  useEffect(() => {
    if (template && isOpen) {
      setName(template.title)
      setDescription(template.description || '')
      setIcon(template.icon || '')
      setColor(template.color || '')
      setDurationMinutes(parseDurationToMinutes(template.duration).toString())
      setRules(template.rules && template.rules.length > 0 ? template.rules : [''])
      setExamples(template.examples && template.examples.length > 0 ? template.examples : [''])
    } else if (!template && isOpen) {
      // Reset form for create mode
      setName('')
      setDescription('')
      setIcon('')
      setColor('')
      setDurationMinutes('')
      setRules([''])
      setExamples([''])
    }
  }, [template, isOpen])

  if (!isOpen) return null

  const handleAddRule = () => {
    setRules([...rules, ''])
  }

  const handleRemoveRule = (index: number) => {
    if (rules.length > 1) {
      setRules(rules.filter((_, i) => i !== index))
    }
  }

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...rules]
    newRules[index] = value
    setRules(newRules)
  }

  const handleAddExample = () => {
    setExamples([...examples, ''])
  }

  const handleRemoveExample = (index: number) => {
    if (examples.length > 1) {
      setExamples(examples.filter((_, i) => i !== index))
    }
  }

  const handleExampleChange = (index: number, value: string) => {
    const newExamples = [...examples]
    newExamples[index] = value
    setExamples(newExamples)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Filter out empty rules and examples
    const filteredRules = rules.filter((rule) => rule.trim() !== '')
    const filteredExamples = examples.filter((example) => example.trim() !== '')

    if (!name || !icon || !color || !durationMinutes) {
      return
    }

    onSubmit({
      name,
      description,
      icon,
      color,
      durationMinutes: parseInt(durationMinutes, 10),
      rules: filteredRules,
      examples: filteredExamples,
    })

    // Reset form
    setName('')
    setDescription('')
    setIcon('')
    setColor('')
    setDurationMinutes('')
    setRules([''])
    setExamples([''])
  }

  const handleClose = () => {
    // Reset form on close
    setName('')
    setDescription('')
    setIcon('')
    setColor('')
    setDurationMinutes('')
    setRules([''])
    setExamples([''])
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 w-full max-w-3xl my-8 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {template ? 'Modifier le format' : 'Créer un nouveau format'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <FormInput
            label="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Hot Takes"
            required
          />

          {/* Description */}
          <FormInput
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez ce format d'activité..."
            rows={3}
          />

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Icône <span className="text-primary">*</span>
            </label>
            <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-300 rounded-xl bg-gray-50">
              {AVAILABLE_ICONS.map((iconOption) => {
                const isSelected = icon === iconOption.value
                const previewColor = color || 'from-gray-400 to-gray-500'
                return (
                  <button
                    key={iconOption.value}
                    type="button"
                    onClick={() => setIcon(iconOption.value)}
                    className={`relative p-3 rounded-lg border-2 transition-all hover:scale-110 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    title={iconOption.label}
                  >
                    <div className={`w-full h-full rounded-lg bg-gradient-to-br ${previewColor} flex items-center justify-center`}>
                      <i className={`fa-solid ${iconOption.value} text-white text-lg`}></i>
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-check text-white text-xs"></i>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            {!icon && (
              <p className="text-xs text-gray-500 mt-2">Sélectionnez une icône ci-dessus</p>
            )}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Couleur <span className="text-primary">*</span>
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-300 rounded-xl bg-gray-50">
              {AVAILABLE_COLORS.map((colorOption) => {
                const isSelected = color === colorOption.value
                return (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setColor(colorOption.value)}
                    className={`relative h-16 rounded-lg border-2 transition-all hover:scale-110 ${
                      isSelected
                        ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={colorOption.label}
                  >
                    <div className={`w-full h-full rounded-lg bg-gradient-to-br ${colorOption.value}`}></div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-check text-white text-xs"></i>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            {!color && (
              <p className="text-xs text-gray-500 mt-2">Sélectionnez une couleur ci-dessus</p>
            )}
          </div>

          {/* Preview */}
          {(icon || color) && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${color || 'from-gray-400 to-gray-500'} flex items-center justify-center shadow-lg`}>
                {icon ? (
                  <i className={`fa-solid ${icon} text-3xl text-white`}></i>
                ) : (
                  <i className="fa-solid fa-question text-3xl text-white"></i>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Aperçu</p>
                <p className="text-xs text-gray-500">L'icône sera affichée avec cette couleur</p>
              </div>
            </div>
          )}

          {/* Duration */}
          <FormInput
            label="Durée (en minutes)"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="Ex: 90"
            required
          />

          {/* Rules */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Règles spécifiques
            </label>
            <div className="space-y-3">
              {rules.map((rule, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1">
                    <FormInput
                      label=""
                      value={rule}
                      onChange={(e) => handleRuleChange(index, e.target.value)}
                      placeholder={`Règle ${index + 1}`}
                    />
                  </div>
                  {rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(index)}
                      className="mt-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddRule}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-plus"></i>
                Ajouter une règle
              </button>
            </div>
          </div>

          {/* Examples */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Exemples de thèmes
            </label>
            <div className="space-y-3">
              {examples.map((example, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1">
                    <FormInput
                      label=""
                      value={example}
                      onChange={(e) => handleExampleChange(index, e.target.value)}
                      placeholder={`Exemple ${index + 1}`}
                    />
                  </div>
                  {examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExample(index)}
                      className="mt-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddExample}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-plus"></i>
                Ajouter un exemple
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all font-medium"
            >
              {template ? 'Enregistrer les modifications' : 'Créer le format'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateFormatModal

