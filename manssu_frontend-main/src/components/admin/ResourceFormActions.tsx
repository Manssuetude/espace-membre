type ResourceType = "file" | "video" | "audio" | "folder" | "";

interface ResourceFormActionsProps {
  isLoading: boolean;
  resourceType: ResourceType;
  onSaveDraft: () => void;
  disabled?: boolean;
}

const ResourceFormActions = ({ isLoading, resourceType, onSaveDraft, disabled = false }: ResourceFormActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
      <button
        type="button"
        onClick={onSaveDraft}
        disabled={isLoading || disabled}
        className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
      >
        <i className="fa-solid fa-save mr-2"></i>
        Sauvegarder en brouillon
      </button>
      <button
        type="submit"
        disabled={isLoading || !resourceType || disabled}
        className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <i className="fa-solid fa-spinner fa-spin mr-2"></i>
            Création...
          </span>
        ) : (
          <>
            Continuer
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </>
        )}
      </button>
    </div>
  );
};

export default ResourceFormActions;
