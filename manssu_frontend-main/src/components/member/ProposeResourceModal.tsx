import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { resourcesApi } from "../../services/api/resources";
import { CreateResourceRequest } from "../../types/resource";
import { queryKeys } from "../../services/api/queryKeys";
import { useSessions } from "../../services/hooks/useSessions";
import ResourceTypeSelector from "../admin/ResourceTypeSelector";
import ResourceBasicInfo from "../admin/ResourceBasicInfo";
import ResourceLinkSections from "../admin/ResourceLinkSections";

type ResourceType = "file" | "video" | "audio" | "folder" | "";

interface ProposeResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProposeResourceModal = ({ isOpen, onClose }: ProposeResourceModalProps) => {
  const queryClient = useQueryClient();

  // Fetch the next upcoming session
  const { data: sessionsData, isLoading: isLoadingSession } = useSessions({ status: "upcoming", limit: 1 });
  const nextSession = useMemo(() => {
    if (!sessionsData?.data || sessionsData.data.length === 0) return null;
    // Get the earliest upcoming session
    const sessionsWithDates = sessionsData.data
      .filter((session) => session.date)
      .sort((a, b) => {
        const dateA = new Date(a.date!).getTime();
        const dateB = new Date(b.date!).getTime();
        return dateA - dateB;
      });
    return sessionsWithDates.length > 0 ? sessionsWithDates[0] : null;
  }, [sessionsData]);

  // Always use the member endpoint (creates pending resources)
  const createResourceMutation = useMutation({
    mutationFn: (data: CreateResourceRequest & { file?: File }) => resourcesApi.createResource(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resources });
      toast.success(response.message || "Ressource créée avec succès");
    },
    onError: () => {
      // Error toast is handled by API client interceptor
    },
  });

  const [resourceType, setResourceType] = useState<ResourceType>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fileLink: "",
    videoLink: "",
    audioLink: "",
    folderDescription: "",
    folderLink: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!resourceType) {
      toast.error("Veuillez sélectionner un type de ressource");
      return false;
    }

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est obligatoire";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est obligatoire";
    }

    if (resourceType === "file" && !formData.fileLink.trim()) {
      newErrors.fileLink = "Le lien vers le fichier est obligatoire";
    }

    if (resourceType === "video" && !formData.videoLink.trim()) {
      newErrors.videoLink = "Le lien YouTube est obligatoire";
    } else if (resourceType === "video" && formData.videoLink.trim()) {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      if (!youtubeRegex.test(formData.videoLink)) {
        newErrors.videoLink = "Veuillez entrer un lien YouTube valide";
      }
    }

    if (resourceType === "audio" && !formData.audioLink.trim()) {
      newErrors.audioLink = "Le lien vers le podcast/audio est obligatoire";
    }

    if (resourceType === "folder") {
      if (!formData.folderDescription.trim()) {
        newErrors.folderDescription = "La description du dossier est obligatoire";
      }
      if (!formData.folderLink.trim()) {
        newErrors.folderLink = "Le lien Google Drive est obligatoire";
      } else if (formData.folderLink.trim()) {
        const driveRegex = /^(https?:\/\/)?(www\.)?drive\.google\.com\/drive\/.+/;
        if (!driveRegex.test(formData.folderLink)) {
          newErrors.folderLink = "Veuillez entrer un lien Google Drive valide";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Determine the link based on resource type
    let link = "";
    if (resourceType === "file") {
      link = formData.fileLink;
    } else if (resourceType === "video") {
      link = formData.videoLink;
    } else if (resourceType === "audio") {
      link = formData.audioLink;
    } else if (resourceType === "folder") {
      link = formData.folderLink;
    }

    // Check if we have a session
    if (!nextSession?.id) {
      toast.error("Aucune session à venir disponible");
      return;
    }

    // Prepare API request data
    const requestData: CreateResourceRequest & { file?: File } = {
      title: formData.title,
      description: formData.description,
      type: resourceType as CreateResourceRequest["type"],
      link: link,
      sessionId: nextSession.id, // Required field
    };

    // Add optional fields
    if (resourceType === "folder" && formData.folderDescription) {
      requestData.folderDescription = formData.folderDescription;
    }

    createResourceMutation.mutate(requestData, {
      onSuccess: () => {
        // Reset form
        setResourceType("");
        setFormData({
          title: "",
          description: "",
          fileLink: "",
          videoLink: "",
          audioLink: "",
          folderDescription: "",
          folderLink: "",
        });
        setErrors({});
        onClose();
      },
    });
  };

  const handleClose = () => {
    // Reset form when closing
    setResourceType("");
    setFormData({
      title: "",
      description: "",
      fileLink: "",
      videoLink: "",
      audioLink: "",
      folderDescription: "",
      folderLink: "",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Proposer une ressource
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Partagez une ressource utile avec la communauté</p>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
          >
            <i className="fa-solid fa-times text-gray-400 text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <ResourceTypeSelector
            resourceType={resourceType}
            onTypeChange={(type) => {
              setResourceType(type);
              setErrors({});
            }}
            error={!resourceType ? "Veuillez sélectionner un type de ressource" : undefined}
          />

          <ResourceBasicInfo
            title={formData.title}
            description={formData.description}
            onTitleChange={(value) => {
              setFormData({ ...formData, title: value });
              if (errors.title) setErrors({ ...errors, title: "" });
            }}
            onDescriptionChange={(value) => {
              setFormData({ ...formData, description: value });
              if (errors.description) setErrors({ ...errors, description: "" });
            }}
            titleError={errors.title}
            descriptionError={errors.description}
          />

          <ResourceLinkSections
            resourceType={resourceType}
            formData={{
              fileLink: formData.fileLink,
              videoLink: formData.videoLink,
              audioLink: formData.audioLink,
              folderDescription: formData.folderDescription,
              folderLink: formData.folderLink,
            }}
            onFormDataChange={(data) => {
              setFormData({ ...formData, ...data });
              // Clear errors for changed fields
              const newErrors = { ...errors };
              Object.keys(data).forEach((key) => {
                if (newErrors[key as keyof typeof newErrors]) {
                  delete newErrors[key as keyof typeof newErrors];
                }
              });
              setErrors(newErrors);
            }}
            errors={errors}
          />

          {/* Session Display */}
          {isLoadingSession ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-6">
              <div className="flex items-center justify-center">
                <i className="fa-solid fa-spinner fa-spin text-gray-400 mr-2"></i>
                <p className="text-sm text-gray-600">Chargement de la session...</p>
              </div>
            </div>
          ) : nextSession ? (
            <div className="bg-gradient-to-r from-primary/10 via-red-50 to-secondary/10 border-2 border-primary/20 rounded-xl p-4 sm:p-6 mt-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <i className="fa-solid fa-calendar-check text-primary mr-2"></i>
                Session ciblée
              </h3>
              <div>
                <p className="text-sm sm:text-base font-medium text-gray-900 mb-1">{nextSession.title}</p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {nextSession.date
                    ? new Date(nextSession.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Date non définie"}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 mt-6">
              <div className="flex items-start">
                <i className="fa-solid fa-exclamation-triangle text-red-500 mt-0.5 mr-3"></i>
                <div>
                  <p className="text-sm sm:text-base font-medium text-red-800 mb-1">Aucune session à venir</p>
                  <p className="text-xs sm:text-sm text-red-700">
                    Il n'y a actuellement aucune session à venir. Vous ne pouvez pas proposer de ressource pour le
                    moment.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mt-6">
            <div className="flex items-start">
              <i className="fa-solid fa-info-circle text-amber-500 mt-0.5 mr-3"></i>
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">Information importante</p>
                <p className="text-xs text-amber-700">
                  Votre ressource sera soumise à vérification avant publication pour garantir la qualité et la
                  pertinence du contenu partagé.
                </p>
              </div>
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
              disabled={createResourceMutation.isPending || !resourceType || !nextSession || isLoadingSession}
              className="px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {createResourceMutation.isPending ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Soumission...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane mr-2"></i>
                  Soumettre la ressource
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposeResourceModal;
