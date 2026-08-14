import FormInput from '../FormInput'
import Dropdown from '../Dropdown'

interface AddMemberModalProps {
  isOpen: boolean
  formData: {
    firstName: string
    lastName: string
    email: string
    role: 'member' | 'admin' | 'super admin' | ''
  }
  errors: Record<string, string>
  isLoading: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onFormDataChange: (data: Partial<AddMemberModalProps['formData']>) => void
  onErrorClear: (field: string) => void
}

const AddMemberModal = ({
  isOpen,
  formData,
  errors,
  isLoading,
  onClose,
  onSubmit,
  onFormDataChange,
  onErrorClear,
}: AddMemberModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Ajouter un membre</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Prénom"
              value={formData.firstName}
              onChange={(e) => {
                onFormDataChange({ firstName: e.target.value })
                onErrorClear('firstName')
              }}
              error={errors.firstName}
              required
            />
            <FormInput
              label="Nom"
              value={formData.lastName}
              onChange={(e) => {
                onFormDataChange({ lastName: e.target.value })
                onErrorClear('lastName')
              }}
              error={errors.lastName}
              required
            />
          </div>

          <FormInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              onFormDataChange({ email: e.target.value })
              onErrorClear('email')
            }}
            error={errors.email}
            required
          />

          <div>
            <Dropdown
              label="Rôle"
              value={formData.role}
              onChange={(e) => {
                onFormDataChange({ role: e.target.value as 'member' | 'admin' | 'super admin' | '' })
                onErrorClear('role')
              }}
              options={[
                { value: '', label: 'Sélectionner un rôle' },
                { value: 'member', label: 'Membre' },
                { value: 'admin', label: 'Administrateur' },
                { value: 'super admin', label: 'Super Admin' },
              ]}
              error={errors.role}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fa-solid fa-plus mr-2"></i>
              )}
              Ajouter le membre
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddMemberModal

