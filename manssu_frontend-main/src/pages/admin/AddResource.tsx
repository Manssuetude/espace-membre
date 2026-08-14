import { useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useCreateResource } from "../../services/hooks/useResources";
import { CreateResourceRequest } from "../../types/resource";
import { useSessions, useSession } from "../../services/hooks/useSessions";
import ResourceTypeSelector from "../../components/admin/ResourceTypeSelector";
import ResourceBasicInfo from "../../components/admin/ResourceBasicInfo";
import ResourceLinkSections from "../../components/admin/ResourceLinkSections";
import ResourceFormActions from "../../components/admin/ResourceFormActions";
import ResourceTipsSidebar from "../../components/admin/ResourceTipsSidebar";
import ResourcePreviewSidebar from "../../components/admin/ResourcePreviewSidebar";

type ResourceType = "file" | "video" | "audio" | "folder" | "";

const AddResource = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionIdFromState = (location.state as { sessionId?: string } | null)?.sessionId;

  const createResourceMutation = useCreateResource();

  // Fetch the next upcoming session (or use sessionId from state if provided)
  const { data: sessionsData, isLoading: isLoadingSessions } = useSessions({ status: "upcoming", limit: 100 });
  const { data: sessionDataFromState } = useSession(sessionIdFromState || "");

  // Determine which session to use
  const nextSession = useMemo(() => {
    // If sessionId is provided via state, use that
    if (sessionIdFromState && sessionDataFromState) {
      return sessionDataFromState;
    }
    // Otherwise, get the earliest upcoming session
    if (!sessionsData?.data || sessionsData.data.length === 0) return null;
    const sessionsWithDates = sessionsData.data
      .filter((session) => session.date)
      .sort((a, b) => {
        const dateA = new Date(a.date!).getTime();
        const dateB = new Date(b.date!).getTime();
        return dateA - dateB;
      });
    return sessionsWithDates.length > 0 ? sessionsWithDates[0] : null;
  }, [sessionIdFromState, sessionDataFromState, sessionsData]);

  const sessionId = nextSession?.id;

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
    if (!sessionId) {
      toast.error("Aucune session à venir disponible");
      return;
    }

    // Prepare API request data
    const requestData: CreateResourceRequest = {
      title: formData.title,
      description: formData.description,
      type: resourceType as CreateResourceRequest["type"],
      link: link,
      sessionId: sessionId, // Required field
    };

    // Add optional fields
    if (resourceType === "folder" && formData.folderDescription) {
      requestData.folderDescription = formData.folderDescription;
    }

    createResourceMutation.mutate(requestData, {
      onSuccess: () => {
        navigate("/admin/ressources");
      },
    });
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim() || !sessionId) {
      if (!sessionId) {
        toast.error("Aucune session à venir disponible");
      }
      return;
    }

    // For draft, we still need a sessionId (required)
    const link =
      resourceType === "file"
        ? formData.fileLink
        : resourceType === "video"
          ? formData.videoLink
          : resourceType === "audio"
            ? formData.audioLink
            : formData.folderLink;

    const requestData: CreateResourceRequest = {
      title: formData.title,
      description: formData.description || "Brouillon",
      type: (resourceType || "file") as CreateResourceRequest["type"],
      link: link || "https://placeholder.com",
      sessionId: sessionId, // Required
    };

    if (resourceType === "folder" && formData.folderDescription) {
      requestData.folderDescription = formData.folderDescription;
    }

    createResourceMutation.mutate(requestData);
  };

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <Link
          to="/admin/ressources"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          Retour aux ressources
        </Link>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 lg:p-8">
              <form onSubmit={handleSubmit}>
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
                {isLoadingSessions ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-6 sm:mt-8">
                    <div className="flex items-center justify-center">
                      <i className="fa-solid fa-spinner fa-spin text-gray-400 mr-2"></i>
                      <p className="text-sm text-gray-600">Chargement de la session...</p>
                    </div>
                  </div>
                ) : nextSession ? (
                  <div className="bg-gradient-to-r from-primary/10 via-red-50 to-secondary/10 border-2 border-primary/20 rounded-xl p-4 sm:p-6 mt-6 sm:mt-8">
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
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 mt-6 sm:mt-8">
                    <div className="flex items-start">
                      <i className="fa-solid fa-exclamation-triangle text-red-500 mt-0.5 mr-3"></i>
                      <div>
                        <p className="text-sm sm:text-base font-medium text-red-800 mb-1">Aucune session à venir</p>
                        <p className="text-xs sm:text-sm text-red-700">
                          Il n'y a actuellement aucune session à venir. Vous ne pouvez pas créer de ressource pour le
                          moment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <ResourceFormActions
                  isLoading={createResourceMutation.isPending}
                  resourceType={resourceType}
                  onSaveDraft={handleSaveDraft}
                  disabled={!nextSession || isLoadingSessions}
                />
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <ResourceTipsSidebar />
            <ResourcePreviewSidebar
              resourceType={resourceType}
              title={formData.title}
              description={formData.description}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddResource;
