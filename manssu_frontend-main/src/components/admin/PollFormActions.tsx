import { Link } from "react-router-dom";

interface PollFormActionsProps {
  onSubmit: (e?: React.FormEvent) => void;
  isLoading?: boolean;
}

const PollFormActions = ({ onSubmit, isLoading = false }: PollFormActionsProps) => {
  return (
    <div className="flex items-center justify-end space-x-4 pt-6">
      <Link
        to="/admin/sondages"
        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all"
      >
        Annuler
      </Link>
      <button
        type="submit"
        onClick={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
        disabled={isLoading}
        className="px-6 py-3 bg-gradient-to-r from-accent to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <i className="fa-solid fa-spinner fa-spin mr-2"></i>
            Publication en cours...
          </>
        ) : (
          <>
            <i className="fa-solid fa-paper-plane mr-2"></i>
            Publier le sondage
          </>
        )}
      </button>
    </div>
  );
};

export default PollFormActions;
