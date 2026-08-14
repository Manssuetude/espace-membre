import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import FormInput from '../../components/FormInput'
import Dropdown from '../../components/Dropdown'

const CompleteProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { email } = location.state || { email: '' }
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'FR',
    studentNumber: '',
    university: '',
  })

  useEffect(() => {
    if (!email) {
      navigate('/auth/login')
      return
    }
  }, [email, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      alert('Profil complété avec succès !')
      navigate('/')
    }, 1000)
  }

  const countries = [
    { value: 'FR', label: 'France' },
    { value: 'BE', label: 'Belgique' },
    { value: 'CH', label: 'Suisse' },
    { value: 'CA', label: 'Canada' },
    { value: 'US', label: 'États-Unis' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 font-inter py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Manssuétude" className="w-16 h-16 object-cover" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Complétez votre profil
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Remplissez les informations suivantes pour finaliser votre inscription
          </p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-red-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <i className="fa-solid fa-user text-white text-sm sm:text-base"></i>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Informations personnelles</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormInput
                label="Prénom *"
                placeholder="Jean"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <FormInput
                label="Nom *"
                placeholder="Dupont"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
              <FormInput
                label="Téléphone"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-accent to-blue-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <i className="fa-solid fa-map-marker-alt text-white text-sm sm:text-base"></i>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Adresse</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="sm:col-span-2">
                <FormInput
                  label="Adresse"
                  placeholder="123 Rue de l'Exemple"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <FormInput
                label="Code postal"
                placeholder="75001"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
              <FormInput
                label="Ville"
                placeholder="Paris"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <div className="sm:col-span-2">
                <Dropdown
                  label="Pays"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  options={countries}
                />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-secondary to-orange-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <i className="fa-solid fa-graduation-cap text-white text-sm sm:text-base"></i>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Informations étudiantes</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <FormInput
                label="Numéro étudiant"
                placeholder="12345678"
                value={formData.studentNumber}
                onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
              />
              <FormInput
                label="Université"
                placeholder="Université de Paris"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 sm:gap-0 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-50 transition-all"
            >
              <i className="fa-solid fa-times mr-2"></i>
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Enregistrement...
                </span>
              ) : (
                <>
                  <i className="fa-solid fa-check mr-2"></i>
                  Finaliser l'inscription
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CompleteProfile

