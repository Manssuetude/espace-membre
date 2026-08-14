import FormInput from '../FormInput'
import Dropdown from '../Dropdown'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  postalCode: string
  city: string
  country: string
  bio: string
}

interface PersonalInfoFormProps {
  formData: FormData
  onFormDataChange: (data: FormData) => void
  onSubmit: (e: React.FormEvent) => void
}

const PersonalInfoForm = ({ formData, onFormDataChange, onSubmit }: PersonalInfoFormProps) => {
  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onFormDataChange({ ...formData, [field]: e.target.value })
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <i className="fa-solid fa-user-edit mr-3 text-primary"></i>
        Informations personnelles
      </h3>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormInput
            label="Prénom"
            value={formData.firstName}
            onChange={handleInputChange('firstName')}
          />
          <FormInput
            label="Nom"
            value={formData.lastName}
            onChange={handleInputChange('lastName')}
          />
        </div>

        <FormInput
          label="Email"
          type="email"
          value={formData.email}
          readOnly
        />

        <FormInput
          label="Téléphone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange('phone')}
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
          <FormInput
            label=""
            value={formData.address}
            onChange={handleInputChange('address')}
            placeholder="Numéro et nom de rue"
            className="mb-3"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormInput
              label=""
              value={formData.postalCode}
              onChange={handleInputChange('postalCode')}
              placeholder="Code postal"
            />
            <FormInput
              label=""
              value={formData.city}
              onChange={handleInputChange('city')}
              placeholder="Ville"
            />
            <Dropdown
              label=""
              value={formData.country}
              onChange={(e) => onFormDataChange({ ...formData, country: e.target.value })}
              options={[
                { value: 'France', label: 'France' },
                { value: 'Belgique', label: 'Belgique' },
                { value: 'Suisse', label: 'Suisse' },
                { value: 'Canada', label: 'Canada' },
              ]}
            />
          </div>
        </div>

        <FormInput
          label="Bio"
          value={formData.bio}
          onChange={handleInputChange('bio')}
          placeholder="Parlez-nous un peu de vous..."
          rows={4}
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:space-x-4 sm:gap-0 pt-6 border-t border-gray-200">
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-primary to-red-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  )
}

export default PersonalInfoForm

