import { Link } from "react-router-dom";
import { useState } from "react";
import { useSondages } from "../../services/hooks/useSondages";

const Sondages = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedPolls, setExpandedPolls] = useState<Record<string, boolean>>({});

  const { data: sondagesData, isLoading } = useSondages({
    status: activeFilter !== "all" ? activeFilter : undefined,
  });

  const polls = sondagesData?.data || [];

  const togglePollExpansion = (pollId: string) => {
    setExpandedPolls((prev) => ({
      ...prev,
      [pollId]: !prev[pollId],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div></div>
        <Link
          to="/admin/sondages/create"
          className="bg-gradient-to-r from-accent to-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium hover:shadow-lg transition-all flex items-center w-full sm:w-auto justify-center"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Créer un sondage
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-fit">
          {[
            { id: "all", label: "Tous les sondages" },
            { id: "active", label: "En cours" },
            { id: "completed", label: "Terminés" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none ${
                activeFilter === filter.id
                  ? "bg-gradient-to-r from-accent to-blue-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Polls List */}
      <div className="space-y-4 sm:space-y-6">
        {polls.length > 0 ? (
          polls.map((poll) => {
            const completedDate = poll.endDate
              ? `Terminé le ${new Date(poll.endDate).toLocaleDateString("fr-FR")}`
              : undefined;
            const createdDate = poll.createdAt
              ? `Créé le ${new Date(poll.createdAt).toLocaleDateString("fr-FR")}`
              : undefined;

            return (
              <div
                key={poll.id}
                className={`bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 hover:shadow-xl transition-all ${poll.status === "draft" ? "opacity-75" : ""}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{poll.title}</h3>
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          poll.status === "active"
                            ? "bg-gradient-to-r from-success to-emerald-500 text-white"
                            : poll.status === "completed"
                              ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white"
                              : "bg-gradient-to-r from-warning to-yellow-500 text-white"
                        }`}
                      >
                        <i
                          className={`fa-solid ${
                            poll.status === "active"
                              ? "fa-circle-play"
                              : poll.status === "completed"
                                ? "fa-check-circle"
                                : "fa-edit"
                          } mr-1`}
                        ></i>
                        {poll.status === "active" ? "En cours" : poll.status === "completed" ? "Terminé" : "Brouillon"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 mb-3">
                      {poll.status !== "draft" && (
                        <span className="flex items-center">
                          <i className="fa-solid fa-users mr-1 text-accent"></i>
                          {poll.totalResponses} réponses
                        </span>
                      )}
                      {poll.status === "active" && poll.daysLeft !== null && poll.daysLeft !== undefined && (
                        <>
                          <span className="flex items-center">
                            <i className="fa-solid fa-clock mr-1 text-warning"></i>
                            {poll.daysLeft < 0 && poll.endDate
                              ? `Terminé le ${new Date(poll.endDate).toLocaleDateString("fr-FR")}`
                              : poll.daysLeft === 0
                                ? "Dernier jour pour voter"
                                : `Se termine dans ${poll.daysLeft} jour${poll.daysLeft > 1 ? "s" : ""}`}
                          </span>
                          <span className="flex items-center">
                            <i className="fa-solid fa-eye mr-1 text-purple-500"></i>
                            Résultats visibles en temps réel
                          </span>
                        </>
                      )}
                      {poll.status === "completed" && completedDate && (
                        <>
                          <span className="flex items-center">
                            <i className="fa-solid fa-calendar mr-1 text-gray-500"></i>
                            {completedDate}
                          </span>
                          <span className="flex items-center">
                            <i className="fa-solid fa-eye-slash mr-1 text-red-500"></i>
                            Résultats cachés pendant le sondage
                          </span>
                        </>
                      )}
                      {poll.status === "draft" && createdDate && (
                        <>
                          <span className="flex items-center">
                            <i className="fa-solid fa-calendar mr-1 text-gray-500"></i>
                            {createdDate}
                          </span>
                          <span className="flex items-center">
                            <i className="fa-solid fa-eye mr-1 text-purple-500"></i>
                            Résultats visibles en temps réel
                          </span>
                        </>
                      )}
                    </div>
                    {poll.status !== "draft" && (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className={`h-2 rounded-full ${
                              poll.status === "completed"
                                ? "bg-gradient-to-r from-success to-emerald-500"
                                : "bg-gradient-to-r from-accent to-blue-600"
                            }`}
                            style={{ width: `${Math.round(poll.participation || 0)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {Math.round(poll.participation || 0)}% de participation ({poll.totalResponses}/
                          {poll.totalMembers} membres)
                        </p>
                      </>
                    )}
                    {poll.questions && poll.questions.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mt-3 sm:mt-4 space-y-4">
                        {(expandedPolls[poll.id] ? poll.questions : poll.questions.slice(0, 2)).map(
                          (question, qIdx) => {
                            // Get the original index from the full questions array
                            const originalIndex = poll.questions.findIndex((q) => q.id === question.id);
                            return (
                              <div
                                key={question.id || qIdx}
                                className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0"
                              >
                                <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3">
                                  <strong>Question {originalIndex + 1}:</strong> {question.question}
                                </p>
                                {question.description && (
                                  <p className="text-xs text-gray-600 mb-2">{question.description}</p>
                                )}
                                <div className="space-y-1.5 sm:space-y-2">
                                  {question.options?.map((option, idx) => (
                                    <div key={option.id || idx}>
                                      <span className="text-xs sm:text-sm text-gray-600">• {option.label}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          },
                        )}
                        {poll.questions.length > 2 && (
                          <button
                            onClick={() => togglePollExpansion(poll.id)}
                            className="w-full mt-2 px-4 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                          >
                            {expandedPolls[poll.id] ? (
                              <>
                                <i className="fa-solid fa-chevron-up mr-2"></i>
                                Voir moins
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-chevron-down mr-2"></i>
                                Voir tout ({poll.questions.length} questions)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                    {/* Legacy support: fallback to old question/options format */}
                    {(!poll.questions || poll.questions.length === 0) && poll.question && (
                      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mt-3 sm:mt-4">
                        <p className="text-xs sm:text-sm text-gray-700 mb-2 sm:mb-3">
                          <strong>Question:</strong> {poll.question}
                        </p>
                        <div className="space-y-1.5 sm:space-y-2">
                          {poll.options?.map((option, idx) => (
                            <div key={idx}>
                              <span className="text-xs sm:text-sm text-gray-600">• {option.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-y-0">
                    {poll.status === "draft" ? (
                      <>
                        <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-success to-emerald-500 text-white text-xs sm:text-sm rounded-lg hover:shadow-lg transition-all">
                          <i className="fa-solid fa-play mr-1"></i>
                          Publier
                        </button>
                        <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs sm:text-sm rounded-lg hover:shadow-lg transition-all">
                          <i className="fa-solid fa-edit mr-1"></i>
                          Modifier
                        </button>
                        <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs sm:text-sm rounded-lg hover:shadow-lg transition-all">
                          <i className="fa-solid fa-trash mr-1"></i>
                          Supprimer
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to={`/admin/sondages/${poll.id}`}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-accent to-blue-600 text-white text-xs sm:text-sm rounded-lg hover:shadow-lg transition-all text-center"
                        >
                          <i className="fa-solid fa-chart-bar mr-1"></i>
                          Voir résultats
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50">
            <div className="w-16 h-16 bg-gradient-to-br from-accent/10 to-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-square-poll-vertical text-accent text-2xl"></i>
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              Aucun sondage {activeFilter === "all" ? "" : activeFilter === "active" ? "en cours" : "terminé"}
            </p>
            <p className="text-gray-400 text-xs">
              {activeFilter === "all"
                ? "Créez votre premier sondage pour commencer à recueillir les avis des membres"
                : activeFilter === "active"
                  ? "Aucun sondage n'est actuellement en cours"
                  : "Aucun sondage n'a été terminé pour le moment"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sondages;
