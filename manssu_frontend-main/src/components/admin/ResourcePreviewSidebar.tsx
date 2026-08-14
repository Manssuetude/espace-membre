type ResourceType = "file" | "video" | "audio" | "folder" | "";

interface ResourcePreviewSidebarProps {
  resourceType: ResourceType;
  title: string;
  description: string;
}

const ResourcePreviewSidebar = ({ resourceType, title, description }: ResourcePreviewSidebarProps) => {
  const getResourceTypeIcon = (type: ResourceType) => {
    switch (type) {
      case "file":
        return "fa-file";
      case "video":
        return "fa-brands fa-youtube";
      case "audio":
        return "fa-podcast";
      case "folder":
        return "fa-folder";
      default:
        return "fa-file";
    }
  };

  const getResourceTypeLabel = (type: ResourceType) => {
    switch (type) {
      case "file":
        return "Fichier";
      case "video":
        return "Vidéo";
      case "audio":
        return "Podcast/Audio";
      case "folder":
        return "Dossier";
      default:
        return "Type";
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <i className="fa-solid fa-eye text-accent mr-2"></i>
        Aperçu
      </h3>
      <div className="p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
            <i
              className={`fa-solid ${resourceType ? getResourceTypeIcon(resourceType) : "fa-file"} text-gray-500 text-sm sm:text-base`}
            ></i>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-500 text-xs sm:text-sm truncate">
              {title || "Titre de la ressource"}
            </h4>
            <p className="text-xs text-gray-400">
              {resourceType ? getResourceTypeLabel(resourceType) : "Type"} • Catégorie
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 line-clamp-2">
          {description || "Description de la ressource..."}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Niveau: -</span>
          <span>Tags: -</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 sm:mt-3">L'aperçu se met à jour en temps réel</p>
    </div>
  );
};

export default ResourcePreviewSidebar;
