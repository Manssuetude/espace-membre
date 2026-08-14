type ResourceType = "file" | "video" | "audio" | "folder" | "";

interface ResourceTypeSelectorProps {
  resourceType: ResourceType;
  onTypeChange: (type: ResourceType) => void;
  error?: string;
}

const ResourceTypeSelector = ({ resourceType, onTypeChange, error }: ResourceTypeSelectorProps) => {
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
    <div className="mb-6 sm:mb-8">
      <label className="block text-base sm:text-lg font-semibold text-gray-900 mb-4">
        Type de ressource <span className="text-primary">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {(["file", "video", "audio", "folder"] as ResourceType[]).map((type) => (
          <div
            key={type}
            onClick={() => {
              onTypeChange(type);
            }}
            className={`p-4 sm:p-6 border-2 rounded-xl cursor-pointer transition-all ${
              resourceType === type
                ? "border-primary bg-primary/10"
                : "border-gray-200 hover:border-primary/30 hover:bg-primary/5"
            }`}
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                  type === "file"
                    ? "bg-gradient-to-br from-blue-100 to-blue-200"
                    : type === "video"
                      ? "bg-gradient-to-br from-red-100 to-red-200"
                      : type === "audio"
                        ? "bg-gradient-to-br from-purple-100 to-purple-200"
                        : "bg-gradient-to-br from-green-100 to-green-200"
                }`}
              >
                <i
                  className={`fa-solid ${getResourceTypeIcon(type)} ${
                    type === "file"
                      ? "text-blue-600"
                      : type === "video"
                        ? "text-red-600"
                        : type === "audio"
                          ? "text-purple-600"
                          : "text-green-600"
                  } text-lg sm:text-xl`}
                ></i>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{getResourceTypeLabel(type)}</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  {type === "file"
                    ? "Lien vers fichier ou Drive"
                    : type === "video"
                      ? "Lien YouTube"
                      : type === "audio"
                        ? "Lien vers podcast ou audio"
                        : "Dossier Drive de fichiers"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-2 flex items-center">
          <i className="fa-solid fa-exclamation-circle mr-1"></i>
          {error}
        </p>
      )}
    </div>
  );
};

export default ResourceTypeSelector;
