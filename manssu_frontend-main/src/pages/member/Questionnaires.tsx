import { useNavigate } from "react-router-dom";
import { useMyUnansweredQuestionnaires } from "../../services/hooks/useQuestionnaires";
import { useQuery } from "@tanstack/react-query";
import { questionnairesApi } from "../../services/api/questionnaires";
import { queryKeys } from "../../services/api/queryKeys";

const MemberQuestionnaires = () => {
  const navigate = useNavigate();

  const { data: unansweredData, isLoading: isLoadingUnanswered } = useMyUnansweredQuestionnaires({
    page: 1,
    limit: 50,
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: [...queryKeys.questionnaires, "me", "history"],
    queryFn: () => questionnairesApi.getMyQuestionnaireHistory({ page: 1, limit: 50 }),
    select: (response) => response.data,
  });

  const unanswered = unansweredData?.data || [];
  const historyResponses = historyData?.data || [];

  // Preload questionnaire metadata for history (to show titles)
  const questionnaireIds = Array.from(new Set(historyResponses.map((r) => r.questionnaireId)));
  const { data: questionnaireMeta } = useQuery({
    queryKey: [...queryKeys.questionnaires, "me", "history-meta", questionnaireIds],
    queryFn: async () => {
      const map: Record<string, { title: string; description?: string | null }> = {};
      for (const qid of questionnaireIds) {
        try {
          const res = await questionnairesApi.getQuestionnaire(qid);
          if (res.data) {
            map[qid] = {
              title: res.data.title,
              description: res.data.description,
            };
          }
        } catch (e) {
          // ignore failures
        }
      }
      return map;
    },
    enabled: questionnaireIds.length > 0,
  });

  const getHistoryQuestionnaireTitle = (questionnaireId: string) => {
    const meta = questionnaireMeta?.[questionnaireId];
    return meta?.title || questionnaireId;
  };

  const getHistoryQuestionnaireDescription = (questionnaireId: string) => {
    const meta = questionnaireMeta?.[questionnaireId];
    return meta?.description || "";
  };

  return (
    <div className="space-y-8">
      {/* Unanswered section */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <i className="fa-solid fa-clipboard-question text-primary"></i>
              Questionnaires en attente
            </h2>
            <p className="text-sm text-gray-500">
              Complétez ces questionnaires pour aider l&apos;équipe à mieux vous connaître.
            </p>
          </div>
        </div>

        {isLoadingUnanswered ? (
          <div className="flex items-center justify-center min-h-[160px]">
            <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
          </div>
        ) : unanswered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[160px] text-center">
            <i className="fa-solid fa-circle-check text-3xl text-success mb-3"></i>
            <p className="text-gray-700 font-medium">Vous n&apos;avez aucun questionnaire en attente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unanswered.map((q) => (
              <div
                key={q.id}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-primary/40 hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{q.title}</h3>
                  {q.description && <p className="text-sm text-gray-600 mb-3 line-clamp-3">{q.description}</p>}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning mb-3">
                    <i className="fa-solid fa-circle-exclamation mr-2"></i>À compléter
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/questionnaires/${q.id}`)}
                  className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-red-500 text-white text-sm font-semibold hover:shadow-md hover:shadow-primary/30 transition-all"
                >
                  <i className="fa-solid fa-play mr-2"></i>
                  {q.hasResponse && !q.isSubmitted ? "Continuer" : "Commencer"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History section */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-accent"></i>
              Historique des questionnaires
            </h2>
            <p className="text-sm text-gray-500">
              Consultez vos réponses passées et modifiez-les lorsque c&apos;est encore possible.
            </p>
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center min-h-[160px]">
            <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
          </div>
        ) : historyResponses.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[160px] text-center">
            <i className="fa-solid fa-inbox text-3xl text-gray-300 mb-3"></i>
            <p className="text-gray-700 font-medium">Vous n&apos;avez pas encore répondu à de questionnaires.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyResponses.map((r) => {
              const metaTitle = getHistoryQuestionnaireTitle(r.questionnaireId);
              const metaDescription = getHistoryQuestionnaireDescription(r.questionnaireId);
              const submitted = r.status === "submitted";
              const canEdit =
                submitted && r.editUntil ? new Date(r.editUntil) > new Date() : r.status === "in_progress";

              return (
                <div
                  key={r.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-primary/40 hover:bg-gray-50 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{metaTitle}</p>
                    {metaDescription && <p className="text-xs text-gray-500 truncate mt-0.5">{metaDescription}</p>}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>
                        Statut : <span className="font-medium">{submitted ? "Soumis" : "Brouillon"}</span>
                      </span>
                      {r.submittedAt && (
                        <span>
                          Soumis le{" "}
                          {new Date(r.submittedAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {canEdit && r.editUntil && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary">
                          <i className="fa-solid fa-pen-to-square mr-1"></i>
                          Modifiable jusqu&apos;au {new Date(r.editUntil).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/questionnaires/${r.questionnaireId}`)}
                      className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-red-500 text-white text-xs font-semibold hover:shadow-md hover:shadow-primary/30 transition-all"
                    >
                      <i className="fa-solid fa-eye mr-1"></i>
                      {canEdit ? "Modifier mes réponses" : "Voir mes réponses"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberQuestionnaires;
