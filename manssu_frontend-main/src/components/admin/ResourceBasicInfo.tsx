import FormInput from "../FormInput";

interface ResourceBasicInfoProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  titleError?: string;
  descriptionError?: string;
}

const ResourceBasicInfo = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  titleError,
  descriptionError,
}: ResourceBasicInfoProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <FormInput
          label="Titre de la ressource *"
          placeholder="Ex: Guide de méditation pour débutants"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
        />
        {titleError && (
          <p className="text-red-500 text-xs mt-1 flex items-center">
            <i className="fa-solid fa-exclamation-circle mr-1"></i>
            {titleError}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description <span className="text-primary">*</span>
        </label>
        <textarea
          rows={4}
          placeholder="Décrivez le contenu et l'utilité de cette ressource..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm sm:text-base ${
            descriptionError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-primary"
          }`}
          required
        />
        {descriptionError && (
          <p className="text-red-500 text-xs mt-1 flex items-center">
            <i className="fa-solid fa-exclamation-circle mr-1"></i>
            {descriptionError}
          </p>
        )}
      </div>
    </div>
  );
};

export default ResourceBasicInfo;
