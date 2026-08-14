import { Poll } from "../../types/sondage";

interface PollActionsSidebarProps {
  pollStatus?: "draft" | "active" | "completed";
  poll?: Poll;
  onClosePoll?: () => void;
  onRelaunchMembers?: () => void;
  isClosing?: boolean;
  isRelaunching?: boolean;
}

const PollActionsSidebar = ({
  pollStatus,
  poll,
  onClosePoll,
  onRelaunchMembers,
  isClosing,
  isRelaunching,
}: PollActionsSidebarProps) => {
  const isOngoing = pollStatus === "active";
  const isNotClosed = pollStatus === "active" || pollStatus === "draft";

  const handleExportResults = () => {
    if (!poll) return;

    // Prepare CSV data
    const csvRows: string[] = [];

    // Header row
    csvRows.push("Sondage: " + poll.title);
    if (poll.questions && poll.questions.length > 0) {
      poll.questions.forEach((q, idx) => {
        csvRows.push(`Question ${idx + 1}: ${q.question}`);
      });
    } else if (poll.question) {
      csvRows.push("Question: " + poll.question);
    }
    csvRows.push(
      "Statut: " + (poll.status === "active" ? "Actif" : poll.status === "completed" ? "Terminé" : "Brouillon"),
    );
    csvRows.push("Total de réponses: " + poll.totalResponses);
    csvRows.push("Total de membres: " + poll.totalMembers);
    csvRows.push("Taux de participation: " + (poll.participation || 0) + "%");
    csvRows.push("");

    // Options data - handle multiple questions
    if (poll.questions && poll.questions.length > 0) {
      poll.questions.forEach((question, qIdx) => {
        csvRows.push(`Résultats - Question ${qIdx + 1}: ${question.question}`);
        csvRows.push("Option,Votes,Pourcentage");
        if (question.options && question.options.length > 0) {
          question.options.forEach((option) => {
            csvRows.push(`"${option.label}",${option.votes},${option.percentage}%`);
          });
        }
        csvRows.push("");
      });
    } else if (poll.options && poll.options.length > 0) {
      csvRows.push("Résultats par option:");
      csvRows.push("Option,Votes,Pourcentage");
      poll.options.forEach((option) => {
        csvRows.push(`"${option.label}",${option.votes},${option.percentage}%`);
      });
      csvRows.push("");
    }

    csvRows.push("");
    csvRows.push("Participants:");

    // Participants header
    if (poll.singleResponse) {
      csvRows.push("Nom,Option choisie,Date de vote");
    } else {
      csvRows.push("Nom,Options choisies,Date de vote");
    }

    // Participants data
    if (poll.voters && poll.voters.length > 0) {
      poll.voters.forEach((voter) => {
        // Handle new structure with questions array
        if (voter.questions && voter.questions.length > 0) {
          voter.questions.forEach((voterQuestion, qIdx) => {
            if (voterQuestion.options && voterQuestion.options.length > 0) {
              const questionLabel =
                poll.questions && poll.questions.length > 0
                  ? poll.questions.find((q) => q.id === voterQuestion.questionId)?.question || `Question ${qIdx + 1}`
                  : `Question ${qIdx + 1}`;

              if (voterQuestion.options.length === 1) {
                // Single response
                const option = voterQuestion.options[0];
                csvRows.push(
                  `"${voter.name}","${questionLabel}: ${option.optionLabel}",${new Date(option.votedAt).toLocaleString("fr-FR")}`,
                );
              } else {
                // Multiple responses
                const optionsLabels = voterQuestion.options.map((opt) => opt.optionLabel).join("; ");
                const earliestDate = voterQuestion.options.reduce((earliest, opt) => {
                  const optDate = new Date(opt.votedAt);
                  const earliestDate = new Date(earliest);
                  return optDate < earliestDate ? opt.votedAt : earliest;
                }, voterQuestion.options[0].votedAt);
                csvRows.push(
                  `"${voter.name}","${questionLabel}: ${optionsLabels}",${new Date(earliestDate).toLocaleString("fr-FR")}`,
                );
              }
            }
          });
        } else if (voter.options && Array.isArray(voter.options) && voter.options.length > 0) {
          // Legacy structure for backward compatibility
          const legacyOptions = voter.options;
          if (poll.singleResponse && legacyOptions.length > 0) {
            const option = legacyOptions[0];
            csvRows.push(`"${voter.name}","${option.optionLabel}",${new Date(option.votedAt).toLocaleString("fr-FR")}`);
          } else if (!poll.singleResponse && legacyOptions.length > 0) {
            const optionsLabels = legacyOptions.map((opt) => opt.optionLabel).join("; ");
            const earliestDate = legacyOptions.reduce((earliest: string, opt) => {
              const optDate = new Date(opt.votedAt);
              const earliestDate = new Date(earliest);
              return optDate < earliestDate ? opt.votedAt : earliest;
            }, legacyOptions[0].votedAt);
            csvRows.push(`"${voter.name}","${optionsLabels}",${new Date(earliestDate).toLocaleString("fr-FR")}`);
          }
        }
      });
    }

    // Create CSV content
    const csvContent = csvRows.join("\n");

    // Create blob and download
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `sondage_${poll.title.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
      <div className="space-y-3">
        {isOngoing && onClosePoll && (
          <button
            onClick={onClosePoll}
            disabled={isClosing}
            className="w-full px-4 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClosing ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Fermeture...
              </>
            ) : (
              <>
                <i className="fa-solid fa-lock mr-2"></i>
                Fermer le sondage
              </>
            )}
          </button>
        )}
        <button
          onClick={handleExportResults}
          className="w-full px-4 py-3 bg-gradient-to-r from-accent to-blue-600 text-white rounded-xl hover:shadow-lg transition-all"
        >
          <i className="fa-solid fa-download mr-2"></i>
          Exporter les résultats
        </button>
        {isNotClosed && (
          <button
            className="w-full px-4 py-3 bg-gradient-to-r from-warning to-yellow-500 text-white rounded-xl hover:shadow-lg transition-all"
            onClick={onRelaunchMembers}
            disabled={isRelaunching}
          >
            {isRelaunching ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Relancement en cours...
              </>
            ) : (
              <>
                <i className="fa-solid fa-bell mr-2"></i>
                Relancer les membres
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default PollActionsSidebar;
