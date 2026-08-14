import { useState } from 'react'
import SearchableDropdown from '../SearchableDropdown'
import GooglePlacesAutocomplete from '../GooglePlacesAutocomplete'
import { Location as LocationType } from '../../types/location'

interface EditSessionModalProps {
  isOpen: boolean
  onClose: () => void
  editFormData: {
    title: string
    date: string
    startTime: string
    endTime: string
    locationId: string
    locationName: string
    location: string
    instructions: string
    theme: string
    description: string
    googlePlaceId: string
    longitude: number
    latitude: number
  }
  onFormDataChange: (data: Partial<EditSessionModalProps['editFormData']>) => void
  objectives: string[]
  onObjectivesChange: (objectives: string[]) => void
  locationMode: 'select' | 'create' | 'update'
  onLocationModeChange: (mode: 'select' | 'create' | 'update') => void
  themeOptions: { value: string; label: string }[]
  locationOptions: { value: string; label: string }[]
  locationsData?: { data?: LocationType[] }
  selectedLocation?: LocationType
  onLocationSelect: (locationId: string) => void
  onCreateLocation: () => void
  onUpdateLocation: () => void
  onSave: () => void
  createLocation: { isPending: boolean }
  updateLocation: { isPending: boolean }
  updateSession: { isPending: boolean }
}

const EditSessionModal = ({
  isOpen,
  onClose,
  editFormData,
  onFormDataChange,
  objectives,
  onObjectivesChange,
  locationMode,
  onLocationModeChange,
  themeOptions,
  locationOptions,
  locationsData,
  selectedLocation,
  onLocationSelect,
  onCreateLocation,
  onUpdateLocation,
  onSave,
  createLocation,
  updateLocation,
  updateSession,
}: EditSessionModalProps) => {
  const [newObjective, setNewObjective] = useState('')
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Modifier la session</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Titre</label>
            <input
              type="text"
              value={editFormData.title}
              onChange={(e) => onFormDataChange({ title: e.target.value })}
              placeholder="Titre de la session..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
            />
          </div>

          <div>
            <SearchableDropdown
              label="Thème"
              value={editFormData.theme}
              onChange={(value) => onFormDataChange({ theme: value })}
              options={themeOptions}
              placeholder="Rechercher un thème..."
              allowCustom={true}
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={4}
              value={editFormData.description}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
              placeholder="Décrivez le contenu et les objectifs de cette session..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none bg-gray-50 focus:bg-white text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={editFormData.date}
              onChange={(e) => onFormDataChange({ date: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Heure de début</label>
              <input
                type="time"
                value={editFormData.startTime}
                onChange={(e) => onFormDataChange({ startTime: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Heure de fin</label>
              <input
                type="time"
                value={editFormData.endTime}
                onChange={(e) => onFormDataChange({ endTime: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Lieu</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onLocationModeChange('select')
                    if (editFormData.locationId) {
                      const loc = locationsData?.data?.find(l => l.id === editFormData.locationId)
                      if (loc) {
                        onFormDataChange({
                          locationName: loc.name || '',
                          location: loc.address,
                          instructions: loc.instructions || '',
                          googlePlaceId: loc.googlePlaceId,
                          longitude: loc.longitude,
                          latitude: loc.latitude,
                        })
                      }
                    }
                  }}
                  className={`px-2 py-1 text-xs rounded-lg transition-all ${
                    locationMode === 'select'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sélectionner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLocationModeChange('create')
                    onFormDataChange({
                      locationId: '',
                      locationName: '',
                      location: '',
                      instructions: '',
                      googlePlaceId: '',
                      longitude: 0,
                      latitude: 0,
                    })
                  }}
                  className={`px-2 py-1 text-xs rounded-lg transition-all ${
                    locationMode === 'create'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Nouveau
                </button>
                {editFormData.locationId && (
                  <button
                    type="button"
                    onClick={() => {
                      onLocationModeChange('update')
                    }}
                    className={`px-2 py-1 text-xs rounded-lg transition-all ${
                      locationMode === 'update'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Modifier
                  </button>
                )}
              </div>
            </div>

            {locationMode === 'select' ? (
              <div>
                <SearchableDropdown
                  label="Sélectionner un lieu"
                  value={editFormData.locationId}
                  onChange={onLocationSelect}
                  options={locationOptions}
                  placeholder="Rechercher un lieu..."
                  allowCustom={false}
                />
                {selectedLocation && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{selectedLocation.address}</p>
                    {selectedLocation.instructions && (
                      <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{selectedLocation.instructions}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Nom du lieu (optionnel)</label>
                  <input
                    type="text"
                    value={editFormData.locationName}
                    onChange={(e) => onFormDataChange({ locationName: e.target.value })}
                    placeholder="Ex: Salle de conférence A"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Adresse</label>
                  <GooglePlacesAutocomplete
                    value={editFormData.location}
                    onChange={(address, placeId, longitude, latitude) => {
                      onFormDataChange({
                        location: address,
                        googlePlaceId: placeId,
                        longitude: longitude,
                        latitude: latitude,
                      })
                    }}
                    placeholder="Rechercher une adresse en France..."
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Accès (instructions)</label>
                  <textarea
                    rows={4}
                    value={editFormData.instructions}
                    onChange={(e) => onFormDataChange({ instructions: e.target.value })}
                    placeholder="Instructions pour accéder au lieu..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none bg-gray-50 focus:bg-white text-sm sm:text-base"
                  />
                </div>

                {(locationMode === 'create' || locationMode === 'update') && (
                  <button
                    type="button"
                    onClick={locationMode === 'create' ? onCreateLocation : onUpdateLocation}
                    disabled={!editFormData.location.trim() || createLocation.isPending || updateLocation.isPending}
                    className="w-full px-4 py-2 bg-gradient-to-r from-accent to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createLocation.isPending || updateLocation.isPending ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        {locationMode === 'create' ? 'Création...' : 'Mise à jour...'}
                      </>
                    ) : (
                      <>
                        <i className={`fa-solid ${locationMode === 'create' ? 'fa-plus' : 'fa-save'} mr-2`}></i>
                        {locationMode === 'create' ? 'Créer le lieu' : 'Mettre à jour le lieu'}
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Programme (Objectives) */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Programme
            </label>
            <div className="space-y-2">
              {objectives.map((objective, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl bg-gray-50 text-sm sm:text-base">
                    {objective}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onObjectivesChange(objectives.filter((_, i) => i !== index))
                    }}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newObjective.trim()) {
                      e.preventDefault()
                      onObjectivesChange([...objectives, newObjective.trim()])
                      setNewObjective('')
                    }
                  }}
                  placeholder="Ajouter un point au programme..."
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newObjective.trim()) {
                      onObjectivesChange([...objectives, newObjective.trim()])
                      setNewObjective('')
                    }
                  }}
                  disabled={!newObjective.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:space-y-0 pt-3 sm:pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-xs sm:text-sm font-medium"
            >
              Annuler
            </button>
            <button
              onClick={onSave}
              disabled={updateSession.isPending}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl hover:shadow-lg transition-all text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateSession.isPending ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Enregistrement...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check mr-2"></i>
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditSessionModal

