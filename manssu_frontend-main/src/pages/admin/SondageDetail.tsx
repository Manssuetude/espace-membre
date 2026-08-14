import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSondage, useClosePoll, useRelaunchMembers } from "../../services/hooks/useSondages";
import { usePageTitle } from "../../contexts/PageTitleContext";
import PollQuestionCard from "../../components/admin/PollQuestionCard";
import PollConfigurationCard from "../../components/admin/PollConfigurationCard";
import PollChartCard from "../../components/admin/PollChartCard";
import PollStatsSidebar from "../../components/admin/PollStatsSidebar";
import PollActionsSidebar from "../../components/admin/PollActionsSidebar";
import PollTimelineSidebar from "../../components/admin/PollTimelineSidebar";
import PollParticipantsTable from "../../components/admin/PollParticipantsTable";
import { PollVoterQuestion, PollVoterOption } from "../../types/sondage";
import { formatDateWithTime } from "../../utils/dateUtils";

const SondageDetail = () => {
  const { id } = useParams();
  const { data: poll, isLoading, error } = useSondage(id || "");
  const { setPageTitle } = usePageTitle();
  const closePollMutation = useClosePoll();
  const relaunchMembersMutation = useRelaunchMembers();
  const [isQuestionsExpanded, setIsQuestionsExpanded] = useState(false);

  // Update page title and subtitle - must be called before any early returns
  useEffect(() => {
    if (poll) {
      const formattedDate = poll.startDate
        ? new Date(poll.startDate).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "";
      setPageTitle(poll.title, formattedDate);
    } else {
      setPageTitle(null, null);
    }

    return () => {
      setPageTitle(null, null);
    };
  }, [poll, setPageTitle]);

  const getColorClasses = (color: string, type: "bg" | "text" | "badge") => {
    const colorMap: { [key: string]: { bg: string; text: string; badge: string } } = {
      primary: {
        bg: "from-primary to-red-500",
        text: "text-primary",
        badge: "bg-red-100 text-red-800",
      },
      accent: {
        bg: "from-accent to-blue-600",
        text: "text-accent",
        badge: "bg-blue-100 text-blue-800",
      },
      success: {
        bg: "from-success to-emerald-500",
        text: "text-success",
        badge: "bg-green-100 text-green-800",
      },
      secondary: {
        bg: "from-secondary to-orange-500",
        text: "text-secondary",
        badge: "bg-orange-100 text-orange-800",
      },
      blue: {
        bg: "from-blue-500 to-blue-600",
        text: "text-blue-600",
        badge: "bg-blue-100 text-blue-800",
      },
      green: {
        bg: "from-green-500 to-green-600",
        text: "text-green-600",
        badge: "bg-green-100 text-green-800",
      },
      orange: {
        bg: "from-orange-500 to-orange-600",
        text: "text-orange-600",
        badge: "bg-orange-100 text-orange-800",
      },
    };
    return colorMap[color]?.[type] || colorMap.accent[type];
  };

  // Transform voters to participants format
  const transformVotersToParticipants = () => {
    if (!poll?.voters || !Array.isArray(poll.voters) || poll.voters.length === 0) return [];

    // Create a map of questionId to question number and question text for easy lookup
    const questionNumberMap = new Map<string, number>();
    const questionTextMap = new Map<string, string>();
    if (poll.questions && poll.questions.length > 0) {
      poll.questions.forEach((q, idx) => {
        questionNumberMap.set(q.id, idx + 1);
        questionTextMap.set(q.id, q.question);
      });
    }

    const participants: Array<{
      id: string;
      name: string;
      avatar: string | null;
      choices: Array<{
        questionLabel: string;
        questionNumber: number;
        questionText: string;
        label: string;
        color: string;
        date: string;
      }>;
      earliestDate: string;
      status: "Voté";
    }> = [];

    poll.voters.forEach((voter) => {
      if (!voter.questions || !Array.isArray(voter.questions)) return;

      const allChoices: Array<{
        questionLabel: string;
        questionNumber: number;
        questionText: string;
        label: string;
        color: string;
        date: string;
      }> = [];

      let earliestVoteDate: string | null = null;

      // Process each question the voter answered
      voter.questions.forEach((voterQuestion: PollVoterQuestion) => {
        if (!voterQuestion.options || !Array.isArray(voterQuestion.options)) return;

        const questionNumber = questionNumberMap.get(voterQuestion.questionId) || 0;
        const questionLabel = `Question ${questionNumber}`;
        const questionText = questionTextMap.get(voterQuestion.questionId) || "";

        // Process each option in this question
        voterQuestion.options.forEach((voteOption: PollVoterOption) => {
          const dateLabel = formatDateWithTime(voteOption.votedAt);

          // Find the option color - search through all questions
          let color = "accent";
          if (poll.questions && poll.questions.length > 0) {
            for (const question of poll.questions) {
              if (question.id === voterQuestion.questionId) {
                const option = question.options?.find((opt) => opt.id === voteOption.optionId);
                if (option) {
                  color = option.color || "accent";
                  break;
                }
              }
            }
          } else if (poll.options) {
            const option = poll.options.find((opt) => opt.id === voteOption.optionId);
            color = option?.color || "accent";
          }

          // Track earliest vote date
          if (!earliestVoteDate || new Date(voteOption.votedAt) < new Date(earliestVoteDate)) {
            earliestVoteDate = voteOption.votedAt;
          }

          allChoices.push({
            questionLabel,
            questionNumber,
            questionText,
            label: voteOption.optionLabel,
            color,
            date: dateLabel,
          });
        });
      });

      participants.push({
        id: voter.id,
        name: voter.name,
        avatar: voter.avatar,
        choices: allChoices,
        earliestDate: earliestVoteDate || "",
        status: "Voté" as const,
      });
    });

    return participants;
  };

  // Generate timeline from poll data
  const generateTimeline = () => {
    if (!poll) return [];

    const timeline = [];

    if (poll.createdAt) {
      const createdDate = new Date(poll.createdAt);
      timeline.push({
        event: "Sondage créé",
        date: createdDate.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        color: "success",
      });
    }

    if (poll.voters && Array.isArray(poll.voters) && poll.voters.length > 0) {
      // Find the earliest vote across all voters
      const allVoteDates = poll.voters
        .flatMap(
          (voter) =>
            voter.questions?.flatMap(
              (q: PollVoterQuestion) => q.options?.map((opt: PollVoterOption) => opt.votedAt) || [],
            ) || [],
        )
        .filter(Boolean)
        .sort();

      if (allVoteDates.length > 0) {
        const firstVoteDate = new Date(allVoteDates[0]);
        timeline.push({
          event: "Premier vote reçu",
          date: firstVoteDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          color: "accent",
        });
      }
    }

    if (poll.participation && poll.participation >= 50) {
      timeline.push({
        event: "50% de participation atteinte",
        date: new Date().toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        color: "warning",
      });
    }

    if (poll.endDate) {
      const endDate = new Date(poll.endDate);
      timeline.push({
        event: "Fin prévue",
        date: endDate.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        color: "gray",
        future: endDate > new Date(),
      });
    }

    return timeline;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <p className="text-gray-600">Erreur lors du chargement du sondage</p>
        </div>
      </div>
    );
  }

  const participants = transformVotersToParticipants();
  const timeline = generateTimeline();
  const activeMembers = poll.totalResponses;
  const inactiveMembers = poll.totalMembers - poll.totalResponses;

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        <div className="lg:col-span-3">
          {/* Display all questions */}
          {poll.questions && poll.questions.length > 0 ? (
            <>
              {(isQuestionsExpanded ? poll.questions : poll.questions.slice(0, 2)).map((question, qIdx) => {
                // Get the original index from the full questions array
                const originalIndex = poll.questions.findIndex((q) => q.id === question.id);
                return (
                  <div key={question.id || qIdx} className="mb-8">
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-6">
                      <PollQuestionCard
                        question={question.question}
                        description={question.description}
                        options={question.options || []}
                        getColorClasses={getColorClasses}
                        questionNumber={poll.questions.length > 1 ? originalIndex + 1 : undefined}
                      />
                      {/* Show question-specific response type */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <i
                            className={`fa-solid ${question.singleResponse ? "fa-circle-dot" : "fa-square-check"} text-accent`}
                          ></i>
                          <span>
                            {question.singleResponse
                              ? "Choix unique pour cette question"
                              : "Choix multiples autorisés pour cette question"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <PollChartCard
                      options={question.options || []}
                      questionTitle={
                        poll.questions.length > 1 ? `Question ${originalIndex + 1}: ${question.question}` : undefined
                      }
                    />
                  </div>
                );
              })}
              {poll.questions.length > 2 && (
                <div className="mb-8">
                  <button
                    onClick={() => setIsQuestionsExpanded(!isQuestionsExpanded)}
                    className="w-full px-6 py-4 text-sm font-medium text-accent hover:text-accent/80 border-2 border-dashed border-accent/50 hover:border-accent rounded-xl transition-all flex items-center justify-center bg-accent/5 hover:bg-accent/10"
                  >
                    {isQuestionsExpanded ? (
                      <>
                        <i className="fa-solid fa-chevron-up mr-2"></i>
                        Voir moins
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-chevron-down mr-2"></i>
                        Voir plus ({poll.questions.length} questions)
                      </>
                    )}
                  </button>
                </div>
              )}
              {/* Poll-level configuration */}
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
                <PollConfigurationCard
                  resultsVisible={poll.resultsVisibility === "realtime"}
                  anonymous={poll.anonymous}
                  daysLeft={poll.daysLeft || 0}
                  pollStatus={poll.status}
                />
              </div>
            </>
          ) : (
            // Legacy support: fallback to old question/options format
            <>
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
                <PollQuestionCard
                  question={poll.question || ""}
                  options={poll.options || []}
                  getColorClasses={getColorClasses}
                />
                <PollConfigurationCard
                  resultsVisible={poll.resultsVisibility === "realtime"}
                  anonymous={poll.anonymous}
                  singleResponse={poll.singleResponse}
                  daysLeft={poll.daysLeft || 0}
                  pollStatus={poll.status}
                />
              </div>
              <PollChartCard options={poll.options || []} />
            </>
          )}
        </div>

        <div className="space-y-6">
          <PollStatsSidebar
            totalResponses={poll.totalResponses}
            totalMembers={poll.totalMembers}
            participation={Math.round(poll.participation || 0)}
            activeMembers={activeMembers}
            inactiveMembers={inactiveMembers}
          />
          <PollActionsSidebar
            onRelaunchMembers={() => relaunchMembersMutation.mutate(id || "")}
            isRelaunching={relaunchMembersMutation.isPending}
            pollStatus={poll.status}
            poll={poll}
            onClosePoll={() => {
              if (id && window.confirm("Êtes-vous sûr de vouloir fermer ce sondage ? Cette action est irréversible.")) {
                closePollMutation.mutate(id);
              }
            }}
            isClosing={closePollMutation.isPending}
          />
          {timeline.length > 0 && <PollTimelineSidebar timeline={timeline} />}
        </div>
      </div>

      <PollParticipantsTable
        participants={participants}
        totalResponses={poll.totalResponses}
        totalMembers={poll.totalMembers}
      />
    </div>
  );
};

export default SondageDetail;
