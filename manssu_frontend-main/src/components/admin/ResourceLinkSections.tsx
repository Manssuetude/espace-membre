import FormInput from "../FormInput";

type ResourceType = "file" | "video" | "audio" | "folder" | "";

interface ResourceLinkSectionsProps {
  resourceType: ResourceType;
  formData: {
    fileLink: string;
    videoLink: string;
    audioLink: string;
    folderDescription: string;
    folderLink: string;
  };
  onFormDataChange: (data: Partial<ResourceLinkSectionsProps["formData"]>) => void;
  errors: {
    fileLink?: string;
    videoLink?: string;
    audioLink?: string;
    folderDescription?: string;
    folderLink?: string;
  };
}

const ResourceLinkSections = ({ resourceType, formData, onFormDataChange, errors }: ResourceLinkSectionsProps) => {
  return (
    <>
      {/* File Link Section */}
      {resourceType === "file" && (
        <div className="mt-6 sm:mt-8">
          <FormInput
            label="Lien vers le fichier *"
            type="url"
            placeholder="https://drive.google.com/file/..."
            value={formData.fileLink}
            onChange={(e) => {
              onFormDataChange({ fileLink: e.target.value });
            }}
            required
          />
          {errors.fileLink && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <i className="fa-solid fa-exclamation-circle mr-1"></i>
              {errors.fileLink}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">Lien direct vers le fichier ou lien Google Drive</p>
        </div>
      )}

      {/* Video Link Section */}
      {resourceType === "video" && (
        <div className="mt-6 sm:mt-8">
          <FormInput
            label="Lien YouTube *"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={formData.videoLink}
            onChange={(e) => {
              onFormDataChange({ videoLink: e.target.value });
            }}
            required
          />
          {errors.videoLink && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <i className="fa-solid fa-exclamation-circle mr-1"></i>
              {errors.videoLink}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">URL complète de la vidéo YouTube</p>
        </div>
      )}

      {/* Audio Link Section */}
      {resourceType === "audio" && (
        <div className="mt-6 sm:mt-8">
          <FormInput
            label="Lien vers le podcast/audio *"
            type="url"
            placeholder="https://..."
            value={formData.audioLink}
            onChange={(e) => {
              onFormDataChange({ audioLink: e.target.value });
            }}
            required
          />
          {errors.audioLink && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <i className="fa-solid fa-exclamation-circle mr-1"></i>
              {errors.audioLink}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Lien vers le podcast ou fichier audio (Spotify, Apple Podcasts, SoundCloud, etc.)
          </p>
        </div>
      )}

      {/* Folder Link Section */}
      {resourceType === "folder" && (
        <div className="mt-6 sm:mt-8 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description du dossier <span className="text-primary">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Décrivez le contenu du dossier et les fichiers qu'il contient..."
              value={formData.folderDescription}
              onChange={(e) => {
                onFormDataChange({ folderDescription: e.target.value });
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm sm:text-base ${
                errors.folderDescription
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-primary"
              }`}
              required
            />
            {errors.folderDescription && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <i className="fa-solid fa-exclamation-circle mr-1"></i>
                {errors.folderDescription}
              </p>
            )}
          </div>
          <div>
            <FormInput
              label="Lien Google Drive vers le dossier *"
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={formData.folderLink}
              onChange={(e) => {
                onFormDataChange({ folderLink: e.target.value });
              }}
              required
            />
            {errors.folderLink && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <i className="fa-solid fa-exclamation-circle mr-1"></i>
                {errors.folderLink}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">Assurez-vous que le dossier est accessible aux membres</p>
          </div>
        </div>
      )}
    </>
  );
};

export default ResourceLinkSections;
