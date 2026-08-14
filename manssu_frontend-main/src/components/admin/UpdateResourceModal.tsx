import { useState, useEffect } from 'react'
import { useUpdateResource } from '../../services/hooks/useResources'

interface UpdateResourceModalProps {
  isOpen: boolean
  onClose: () => void
  resource: {
    resourceId: string
    title: string
    description: string
  } | null
}

const UpdateResourceModal = ({ isOpen, onClose, resource }: UpdateResourceModalProps) => {
  const updateResourceMutation = useUpdateResource()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data when resource changes
  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title,
        description: resource.description,
      })
      setErrors({})
    }
  }, [resource])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est obligatoire'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !resource) {
      return
    }

    updateResourceMutation.mutate(
      {
        id: resource.resourceId,
        data: {
          title: formData.title.trim(),
          description: formData.description.trim(),
        },
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  const handleClose = () => {
    setFormData({ title: '', description: '' })
    setErrors({})
    onClose()
  }

  if (!isOpen || !resource) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Modifier la ressource
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Mettez à jour le titre et la description</p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
          >
            <i className="fa-solid fa-times text-gray-400 text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-6">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value })
                  if (errors.title) setErrors({ ...errors, title: '' })
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Entrez le titre de la ressource"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value })
                  if (errors.description) setErrors({ ...errors, description: '' })
                }}
                rows={6}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Entrez la description de la ressource"
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={updateResourceMutation.isPending || !formData.title.trim() || !formData.description.trim()}
              className="px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {updateResourceMutation.isPending ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Mise à jour...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check mr-2"></i>
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UpdateResourceModal

