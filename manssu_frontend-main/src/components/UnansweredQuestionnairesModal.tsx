import { useNavigate, useLocation } from "react-router-dom";
import { useMyUnansweredQuestionnaires } from "../services/hooks/useQuestionnaires";
import { useAuth } from "../contexts/AuthContext";

const UnansweredQuestionnairesModal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { data: unansweredData, isLoading } = useMyUnansweredQuestionnaires({
    page: 1,
    limit: 100, // Get all unanswered questionnaires
  });

  const unansweredQuestionnaires = unansweredData?.data || [];
  const hasUnanswered = unansweredQuestionnaires.length > 0;

  // Don't show modal if auth is loading or user is not authenticated
  if (authLoading || !isAuthenticated) {
    return null;
  }

  // Don't show modal for guest users
  if (user?.role === "guest") {
    return null;
  }

  // Don't show modal on auth pages
  if (location.pathname.startsWith("/auth/") || location.pathname.startsWith("/invitation/")) {
    return null;
  }

  // Don't show modal if we're on a questionnaire page (to allow answering)
  if (location.pathname.startsWith("/questionnaires/")) {
    return null;
  }

  // Don't show modal if there are no unanswered questionnaires
  if (!hasUnanswered) {
    return null;
  }

  const handleStartQuestionnaire = (questionnaireId: string) => {
    navigate(`/questionnaires/${questionnaireId}`);
  };

  return (
    <>
      {/* Backdrop - blocks all interaction */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary to-red-500 text-white p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Questionnaires en attente</h2>
                <p className="text-white/90">
                  Vous devez répondre à {unansweredQuestionnaires.length} questionnaire
                  {unansweredQuestionnaires.length > 1 ? "s" : ""} avant de continuer
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-clipboard-question text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unansweredQuestionnaires.map((questionnaire) => (
                  <div
                    key={questionnaire.id}
                    onClick={() => handleStartQuestionnaire(questionnaire.id)}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all cursor-pointer p-6 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                          {questionnaire.title}
                        </h3>
                        {questionnaire.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{questionnaire.description}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <i className="fa-solid fa-arrow-right text-primary"></i>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                      {questionnaire.startDate && (
                        <span className="flex items-center">
                          <i className="fa-solid fa-calendar-check mr-1"></i>
                          Début: {new Date(questionnaire.startDate).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      {questionnaire.endDate && (
                        <span className="flex items-center">
                          <i className="fa-solid fa-calendar-times mr-1"></i>
                          Fin: {new Date(questionnaire.endDate).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                        En attente
                      </span>
                      {questionnaire.hasResponse && !questionnaire.isSubmitted && (
                        <span className="text-xs text-gray-500">
                          <i className="fa-solid fa-file-draft mr-1"></i>
                          Brouillon sauvegardé
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
            <p className="text-sm text-gray-600 text-center">
              <i className="fa-solid fa-info-circle mr-2"></i>
              Vous ne pouvez pas accéder au reste de la plateforme tant que vous n'avez pas répondu à tous les
              questionnaires
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default UnansweredQuestionnairesModal;
