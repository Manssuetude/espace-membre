import { Feedback } from "../../types/feedback";

interface MemberFeedbacksHistoryProps {
  feedbacks: Feedback[];
}

const MemberFeedbacksHistory = ({ feedbacks }: MemberFeedbacksHistoryProps) => {
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "Date inconnue";
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
        <i className="fa-solid fa-comment-dots text-accent mr-2"></i>
        Historique des feedbacks
      </h2>
      {feedbacks.length > 0 ? (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <div key={feedback.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase">{feedback.category}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{feedback.type}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{feedback.subject}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{feedback.message}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">{formatDateTime(feedback.submittedAt)}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    feedback.status === "read"
                      ? "bg-gradient-to-r from-accent to-blue-600 text-white"
                      : "bg-gradient-to-r from-warning to-yellow-500 text-white"
                  }`}
                >
                  {feedback.status === "read" ? "Lu" : "Non lu"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-accent/10 to-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-comment-dots text-accent text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">Aucun feedback envoyé</p>
          <p className="text-gray-400 text-xs">L'historique des feedbacks apparaîtra ici</p>
        </div>
      )}
    </div>
  );
};

export default MemberFeedbacksHistory;
