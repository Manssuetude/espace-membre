import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateSession } from "../../services/hooks/useSessions";
import { useThemes } from "../../services/hooks/useThemes";
import { useLocations, useCreateLocation, useUpdateLocation } from "../../services/hooks/useLocations";
import FormInput from "../../components/FormInput";
import Dropdown from "../../components/Dropdown";
import SearchableDropdown from "../../components/SearchableDropdown";
import GooglePlacesAutocomplete from "../../components/GooglePlacesAutocomplete";

const CreateSession = () => {
  const navigate = useNavigate();
  const createSession = useCreateSession();
  const { data: themesData } = useThemes({ status: "approved" });
  const { data: locationsData } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    theme: "",
    type: "",
    date: "",
    startTime: "",
    endTime: "",
    locationId: "",
    locationName: "",
    location: "",
    instructions: "",
    googlePlaceId: "",
    longitude: 0,
    latitude: 0,
    isOnline: false,
    maxParticipants: "",
    objectives: [] as string[],
  });
  const [newObjective, setNewObjective] = useState("");
  const [locationMode, setLocationMode] = useState<"select" | "create" | "update">("select");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const locationOptions =
    locationsData?.data?.map((loc) => ({
      value: loc.id,
      label: loc.name ? `${loc.name} - ${loc.address}` : loc.address,
    })) || [];

  const selectedLocation = locationsData?.data?.find((loc) => loc.id === formData.locationId);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est obligatoire";
    }

    if (!formData.type) {
      newErrors.type = "Veuillez sélectionner un type de session";
    }

    if (!formData.maxParticipants) {
      newErrors.maxParticipants = "Le nombre maximum de participants est obligatoire";
    } else {
      const num = parseInt(formData.maxParticipants);
      if (isNaN(num) || num < 1 || num > 100) {
        newErrors.maxParticipants = "Veuillez entrer un nombre entre 1 et 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    createSession.mutate(
      {
        title: formData.title,
        description: formData.description.trim() || undefined,
        theme: formData.theme || undefined,
        type: formData.type as "workshop" | "conference" | "group" | "individual",
        date: formData.date || undefined,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        locationId: formData.locationId || undefined,
        isOnline: formData.isOnline,
        maxParticipants: parseInt(formData.maxParticipants),
        objectives: formData.objectives.length > 0 ? formData.objectives : undefined,
      },
      {
        onSuccess: () => {
          navigate("/admin/sessions");
        },
      },
    );
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error("Veuillez au moins entrer un titre pour sauvegarder en brouillon");
      return;
    }
    toast.success("Session sauvegardée en brouillon");
  };

  const handleCancel = () => {
    navigate("/admin/sessions");
  };

  const handleLocationSelect = (locationId: string) => {
    const location = locationsData?.data?.find((l) => l.id === locationId);
    if (location) {
      setFormData({
        ...formData,
        locationId: location.id,
        locationName: location.name || "",
        location: location.address,
        instructions: location.instructions || "",
        googlePlaceId: location.googlePlaceId,
        longitude: location.longitude,
        latitude: location.latitude,
      });
    }
  };

  const handleCreateLocation = async () => {
    if (!formData.location.trim()) {
      toast.error("Veuillez entrer une adresse");
      return;
    }

    if (!formData.googlePlaceId) {
      toast.error("Veuillez sélectionner une adresse depuis les suggestions");
      return;
    }

    createLocation.mutate(
      {
        name: formData.locationName.trim() || undefined,
        address: formData.location,
        instructions: formData.instructions || undefined,
        googlePlaceId: formData.googlePlaceId,
        longitude: formData.longitude,
        latitude: formData.latitude,
      },
      {
        onSuccess: (response) => {
          if (response.data) {
            setFormData({
              ...formData,
              locationId: response.data.id,
            });
            setLocationMode("select");
          }
        },
      },
    );
  };

  const handleUpdateLocation = async () => {
    if (!formData.locationId || !formData.location.trim()) {
      toast.error("Veuillez sélectionner un lieu à modifier");
      return;
    }

    if (!formData.googlePlaceId) {
      toast.error("Veuillez sélectionner une adresse depuis les suggestions");
      return;
    }

    updateLocation.mutate(
      {
        id: formData.locationId,
        data: {
          name: formData.locationName.trim() || undefined,
          address: formData.location,
          instructions: formData.instructions || undefined,
          googlePlaceId: formData.googlePlaceId,
          longitude: formData.longitude,
          latitude: formData.latitude,
        },
      },
      {
        onSuccess: () => {
          setLocationMode("select");
        },
      },
    );
  };

  return (
    <div>
      {/* Back Button */}
      <div className="mb-4 sm:mb-6">
        <Link
          to="/admin/sessions"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Retour aux sessions
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Basic Information */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-red-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
              <i className="fa-solid fa-info-circle text-white text-sm sm:text-base"></i>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Informations de base</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div>
              <FormInput
                label="Titre de la session"
                placeholder="Ex: Gestion du stress en période d'examens"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: "" });
                }}
                required
                error={errors.title}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez le contenu et les objectifs de cette session..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none bg-gray-50 focus:bg-white text-sm sm:text-base"
              />
            </div>

            <div>
              <SearchableDropdown
                label="Thème"
                value={formData.theme}
                onChange={(value) => {
                  setFormData({ ...formData, theme: value });
                  if (errors.theme) setErrors({ ...errors, theme: "" });
                }}
                options={
                  themesData?.data?.map((theme) => ({
                    value: theme.title,
                    label: theme.title,
                  })) || []
                }
                placeholder="Rechercher un thème..."
                allowCustom={true}
                error={errors.theme}
              />
            </div>

            <div>
              <Dropdown
                label="Type de session"
                value={formData.type}
                onChange={(e) => {
                  setFormData({ ...formData, type: e.target.value });
                  if (errors.type) setErrors({ ...errors, type: "" });
                }}
                options={[
                  { value: "", label: "Sélectionner un type" },
                  { value: "workshop", label: "Atelier pratique" },
                  { value: "conference", label: "Conférence" },
                  { value: "group", label: "Séance de groupe" },
                  { value: "individual", label: "Séance individuelle" },
                ]}
                required
                error={errors.type}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value });
                }}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Heure de début</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => {
                    setFormData({ ...formData, startTime: e.target.value });
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Heure de fin</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => {
                    setFormData({ ...formData, endTime: e.target.value });
                  }}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
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
                      setLocationMode("select");
                      if (formData.locationId) {
                        const loc = locationsData?.data?.find((l) => l.id === formData.locationId);
                        if (loc) {
                          setFormData({
                            ...formData,
                            locationName: loc.name || "",
                            location: loc.address,
                            instructions: loc.instructions || "",
                            googlePlaceId: loc.googlePlaceId,
                            longitude: loc.longitude,
                            latitude: loc.latitude,
                          });
                        }
                      }
                    }}
                    className={`px-2 py-1 text-xs rounded-lg transition-all ${
                      locationMode === "select"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Sélectionner
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode("create");
                      setFormData({
                        ...formData,
                        locationId: "",
                        locationName: "",
                        location: "",
                        instructions: "",
                        googlePlaceId: "",
                        longitude: 0,
                        latitude: 0,
                      });
                    }}
                    className={`px-2 py-1 text-xs rounded-lg transition-all ${
                      locationMode === "create"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Nouveau
                  </button>
                  {formData.locationId && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocationMode("update");
                      }}
                      className={`px-2 py-1 text-xs rounded-lg transition-all ${
                        locationMode === "update"
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Modifier
                    </button>
                  )}
                </div>
              </div>

              {locationMode === "select" ? (
                <div>
                  <SearchableDropdown
                    label="Sélectionner un lieu"
                    value={formData.locationId}
                    onChange={handleLocationSelect}
                    options={locationOptions}
                    placeholder="Rechercher un lieu..."
                    allowCustom={false}
                  />
                  {selectedLocation && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{selectedLocation.address}</p>
                      {selectedLocation.instructions && (
                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                          {selectedLocation.instructions}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Nom du lieu (optionnel)
                    </label>
                    <input
                      type="text"
                      value={formData.locationName}
                      onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                      placeholder="Ex: Salle de conférence A"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Adresse</label>
                    <GooglePlacesAutocomplete
                      value={formData.location}
                      onChange={(address, placeId, longitude, latitude) => {
                        setFormData({
                          ...formData,
                          location: address,
                          googlePlaceId: placeId,
                          longitude: longitude,
                          latitude: latitude,
                        });
                      }}
                      placeholder="Rechercher une adresse en France..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Accès (instructions)
                    </label>
                    <textarea
                      rows={4}
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="Instructions pour accéder au lieu..."
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none bg-gray-50 focus:bg-white text-sm sm:text-base"
                    />
                  </div>

                  {(locationMode === "create" || locationMode === "update") && (
                    <button
                      type="button"
                      onClick={locationMode === "create" ? handleCreateLocation : handleUpdateLocation}
                      disabled={!formData.location.trim() || createLocation.isPending || updateLocation.isPending}
                      className="w-full px-4 py-2 bg-gradient-to-r from-accent to-blue-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createLocation.isPending || updateLocation.isPending ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                          {locationMode === "create" ? "Création..." : "Mise à jour..."}
                        </>
                      ) : (
                        <>
                          <i className={`fa-solid ${locationMode === "create" ? "fa-plus" : "fa-save"} mr-2`}></i>
                          {locationMode === "create" ? "Créer le lieu" : "Mettre à jour le lieu"}
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Nombre maximum de participants
              </label>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="Ex: 25"
                value={formData.maxParticipants}
                onChange={(e) => {
                  setFormData({ ...formData, maxParticipants: e.target.value });
                  if (errors.maxParticipants) setErrors({ ...errors, maxParticipants: "" });
                }}
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50 focus:bg-white text-sm sm:text-base ${
                  errors.maxParticipants
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-primary"
                }`}
                required
              />
              {errors.maxParticipants && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <i className="fa-solid fa-exclamation-circle mr-1"></i>
                  {errors.maxParticipants}
                </p>
              )}
            </div>

            {/* Programme (Objectives) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Programme</label>
              <div className="space-y-2">
                {formData.objectives.map((objective, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl bg-gray-50 text-sm sm:text-base">
                      {objective}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          objectives: formData.objectives.filter((_, i) => i !== index),
                        });
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
                      if (e.key === "Enter" && newObjective.trim()) {
                        e.preventDefault();
                        setFormData({
                          ...formData,
                          objectives: [...formData.objectives, newObjective.trim()],
                        });
                        setNewObjective("");
                      }
                    }}
                    placeholder="Ajouter un point au programme..."
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newObjective.trim()) {
                        setFormData({
                          ...formData,
                          objectives: [...formData.objectives, newObjective.trim()],
                        });
                        setNewObjective("");
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
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 sm:gap-0 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
          <button
            type="button"
            onClick={handleCancel}
            disabled={createSession.isPending}
            className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-times mr-2"></i>
            Annuler
          </button>

          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3 sm:space-y-0">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={createSession.isPending}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl text-sm sm:text-base font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-save mr-2"></i>
              Sauvegarder en brouillon
            </button>

            <button
              type="submit"
              disabled={createSession.isPending}
              className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl text-sm sm:text-base font-medium hover:shadow-lg transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createSession.isPending ? (
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fa-solid fa-plus mr-2"></i>
              )}
              Créer la session
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateSession;
