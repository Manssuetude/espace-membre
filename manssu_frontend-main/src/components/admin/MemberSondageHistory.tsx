import { useState } from "react";
import { Poll } from "../../types/sondage";

interface MemberSondageHistoryProps {
  polls: (Poll & { memberResponse?: string; userChoiceIds?: string[] })[];
}

const MemberSondageHistory = ({ polls }: MemberSondageHistoryProps) => {
  const [expandedPolls, setExpandedPolls] = useState<Record<string, boolean>>({});

  const togglePollExpansion = (pollId: string) => {
    setExpandedPolls((prev) => ({
      ...prev,
      [pollId]: !prev[pollId],
    }));
  };
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <i className="fa-solid fa-poll text-accent mr-2"></i>
        Historique des sondages
      </h2>
      {polls.length > 0 ? (
        <div className="space-y-4">
          {polls.map((poll) => (
            <div key={poll.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{poll.title}</h3>
                  {/* Display questions or legacy question */}
                  {poll.questions && poll.questions.length > 0 ? (
                    <div className="mb-2 space-y-2">
                      {(expandedPolls[poll.id] ? poll.questions : poll.questions.slice(0, 2)).map((q, idx) => {
                        // Get the original index from the full questions array
                        const originalIndex = poll.questions.findIndex((question) => question.id === q.id);
                        return (
                          <p key={q.id || idx} className="text-sm text-gray-600">
                            {poll.questions.length > 1 && `Q${originalIndex + 1}: `}
                            {q.question}
                          </p>
                        );
                      })}
                      {poll.questions.length > 2 && (
                        <button
                          onClick={() => togglePollExpansion(poll.id)}
                          className="text-xs text-accent hover:text-accent/80 font-medium mt-1 flex items-center"
                        >
                          {expandedPolls[poll.id] ? (
                            <>
                              <i className="fa-solid fa-chevron-up mr-1"></i>
                              Voir moins
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-chevron-down mr-1"></i>
                              Voir plus ({poll.questions.length} questions)
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : poll.question ? (
                    <p className="text-sm text-gray-600 mb-2">{poll.question}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {poll.startDate && (
                      <span className="flex items-center">
                        <i className="fa-solid fa-calendar mr-1"></i>
                        {formatDateTime(poll.startDate)}
                      </span>
                    )}
                    <span className="flex items-center">
                      <i className="fa-solid fa-users mr-1"></i>
                      {poll.totalResponses} réponses
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-gradient-to-r from-success to-emerald-500 text-white rounded-full text-xs font-medium whitespace-nowrap">
                  Terminé
                </span>
              </div>
              {/* Display options from first question (or legacy options) */}
              {(() => {
                const firstQuestion = poll.questions && poll.questions.length > 0 ? poll.questions[0] : null;
                const options = firstQuestion?.options || poll.options || [];
                return options.length > 0 ? (
                  <div className="space-y-2">
                    {options.map((option) => {
                      // Check if this option was selected by the member
                      // Support both single response (memberResponse) and multiple response (userChoiceIds)
                      const userChoiceIds = poll.userChoiceIds || [];
                      const isMemberChoice = poll.memberResponse === option.id || userChoiceIds.includes(option.id);
                      return (
                        <div
                          key={option.id}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            isMemberChoice ? "bg-accent/10 border border-accent/30" : "border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {isMemberChoice && <i className="fa-solid fa-check-circle text-accent"></i>}
                            <span
                              className={`text-sm ${isMemberChoice ? "font-semibold text-accent" : "text-gray-700"}`}
                            >
                              {option.label}
                            </span>
                          </div>
                          {option.percentage > 0 && (
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-accent to-blue-600 h-2 rounded-full"
                                style={{ width: `${option.percentage}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null;
              })()}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-accent/10 to-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-square-poll-vertical text-accent text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">Aucun sondage participé</p>
          <p className="text-gray-400 text-xs">L'historique des sondages apparaîtra ici</p>
        </div>
      )}
    </div>
  );
};

export default MemberSondageHistory;
