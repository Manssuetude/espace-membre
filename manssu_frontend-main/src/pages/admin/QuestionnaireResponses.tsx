import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useQuestionnaire,
  useQuestionnaireResponses,
  useQuestionnaireUserResponse,
} from "../../services/hooks/useQuestionnaires";
import { usersApi } from "../../services/api/users";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../services/api/queryKeys";
import { QuestionnaireAnswerPayload } from "../../types/questionnaire";

// The admin responses endpoint enriches raw answers with human-readable labels
// not present in the base submission payload type.
type DisplayAnswer = QuestionnaireAnswerPayload & {
  answer: {
    optionId?: string;
    optionLabel?: string;
    optionIds?: string[];
    options?: { optionId: string; optionLabel?: string }[];
    text?: string;
    rating?: number;
    number?: number;
    date?: string;
  };
};

const QuestionnaireResponses = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const questionnaireId = id || "";
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: questionnaire, isLoading: isLoadingQuestionnaire } = useQuestionnaire(questionnaireId);
  const { data: responsesData, isLoading: isLoadingResponses } = useQuestionnaireResponses(questionnaireId, {
    page: 1,
    limit: 100,
  });

  const { data: selectedResponse, isLoading: isLoadingSelectedResponse } = useQuestionnaireUserResponse(
    questionnaireId,
    selectedUserId || undefined,
  );

  // Fetch basic user info for all userIds in responses
  const userIds = responsesData?.data.map((r) => r.userId) || [];
  const { data: usersMap } = useQuery({
    queryKey: [...queryKeys.members, "questionnaire-users", questionnaireId, userIds],
    queryFn: async () => {
      const map: Record<string, { name: string; email: string }> = {};
      for (const uid of userIds) {
        try {
          const res = await usersApi.getUserById(uid);
          if (res.data) {
            map[uid] = {
              name: res.data.name || `${res.data.firstName} ${res.data.lastName}`.trim(),
              email: res.data.email,
            };
          }
        } catch (e) {
          // ignore individual failures
        }
      }
      return map;
    },
    enabled: userIds.length > 0,
  });

  if (isLoadingQuestionnaire) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <p className="text-gray-600">Questionnaire introuvable</p>
        </div>
      </div>
    );
  }

  const responses = responsesData?.data || [];
  const questions = questionnaire.questions || [];
  const sortedQuestions = [...questions].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  const getUserLabel = (userId: string) => {
    const info = usersMap?.[userId];
    if (!info) return userId;
    return info.name;
  };

  const getAnswerForQuestion = (questionId: string) => {
    if (!selectedResponse) return null;
    return selectedResponse.answers.find((a) => a.questionId === questionId) || null;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Left: responses list */}
      <div className="xl:col-span-1">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin/questionnaires")}
                className="inline-flex items-center text-xs text-gray-600 hover:text-primary self-start"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Retour à la liste des questionnaires
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <i className="fa-solid fa-users text-primary"></i>
                  Réponses des membres
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Questionnaire : <span className="font-medium">{questionnaire.title}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 max-h-[540px] overflow-y-auto">
            {isLoadingResponses ? (
              <div className="flex items-center justify-center py-8">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
              </div>
            ) : responses.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <i className="fa-solid fa-inbox text-3xl mb-3 text-gray-300"></i>
                <p>Aucune réponse trouvée pour ce questionnaire.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {responses.map((r) => {
                  const isSelected = selectedUserId === r.userId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedUserId(r.userId)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 text-gray-900 shadow-sm"
                          : "border-gray-200 bg-white hover:border-primary/40 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 truncate">{getUserLabel(r.userId)}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Statut :{" "}
                            <span className="font-medium">{r.status === "submitted" ? "Soumis" : "Brouillon"}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
                          {r.submittedAt && (
                            <span>
                              <i className="fa-solid fa-check mr-1 text-success"></i>
                              {new Date(r.submittedAt).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                          {!r.submittedAt && (
                            <span>
                              <i className="fa-solid fa-pen mr-1"></i>
                              En cours
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: detailed answers */}
      <div className="xl:col-span-2">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 lg:p-8">
          {!selectedUserId ? (
            <div className="flex items-center justify-center min-h-[300px] text-center">
              <div>
                <i className="fa-solid fa-user-check text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-600">Sélectionnez un membre à gauche pour voir ses réponses.</p>
              </div>
            </div>
          ) : isLoadingSelectedResponse && !selectedResponse ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
            </div>
          ) : !selectedResponse ? (
            <div className="flex items-center justify-center min-h-[300px] text-center">
              <div>
                <i className="fa-solid fa-circle-info text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-600">Aucune réponse détaillée trouvée pour ce membre sur ce questionnaire.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Réponses de {getUserLabel(selectedResponse.userId)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Statut :{" "}
                    <span className="font-semibold">
                      {selectedResponse.status === "submitted" ? "Soumis" : "Brouillon"}
                    </span>
                  </p>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  {selectedResponse.submittedAt && (
                    <p>
                      <i className="fa-solid fa-circle-check mr-1 text-success"></i>
                      Soumis le{" "}
                      {new Date(selectedResponse.submittedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  {selectedResponse.editUntil && (
                    <p>
                      <i className="fa-solid fa-pen-to-square mr-1"></i>
                      Éditable jusqu&apos;au{" "}
                      {new Date(selectedResponse.editUntil).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {sortedQuestions.map((q, index) => {
                  const answer = getAnswerForQuestion(q.id) as DisplayAnswer | null;

                  return (
                    <div key={q.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/60">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {index + 1}. {q.question} {q.required && <span className="text-red-500 text-xs">*</span>}
                      </h3>
                      {q.description && <p className="text-xs text-gray-500 mb-3">{q.description}</p>}

                      {/* Render answer depending on type */}
                      {!answer ? (
                        <p className="text-xs italic text-gray-400">Aucune réponse fournie pour cette question.</p>
                      ) : answer.type === "single_choice" ? (
                        <div className="px-3 py-2 rounded-lg bg-white border border-primary/30 inline-flex items-center gap-2 text-sm text-gray-800">
                          <i className="fa-solid fa-circle-dot text-primary"></i>
                          <span>{answer.answer.optionLabel || answer.answer.optionId}</span>
                        </div>
                      ) : answer.type === "multiple_choice" ? (
                        <div className="flex flex-wrap gap-2">
                          {(answer.answer.options || []).map((opt) => (
                            <span
                              key={opt.optionId}
                              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                            >
                              {opt.optionLabel || opt.optionId}
                            </span>
                          ))}
                        </div>
                      ) : answer.type === "text" ? (
                        <p className="text-sm text-gray-800 whitespace-pre-line">{answer.answer.text}</p>
                      ) : answer.type === "rating" ? (
                        <div className="flex items-center gap-2 text-sm text-gray-800">
                          <span>Note :</span>
                          <span className="font-semibold text-primary">{answer.answer.rating} / 5</span>
                        </div>
                      ) : answer.type === "number" ? (
                        <p className="text-sm text-gray-800">{answer.answer.number}</p>
                      ) : answer.type === "date" ? (
                        <p className="text-sm text-gray-800">{answer.answer.date}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireResponses;
