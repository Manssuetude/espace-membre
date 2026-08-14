import { useState } from "react";
import { useRateSession } from "../../services/hooks/useSessions";

interface SessionRatingFormProps {
  sessionId: string;
}

const SessionRatingForm = ({ sessionId }: SessionRatingFormProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const rateSessionMutation = useRateSession();

  const handleSubmit = () => {
    if (rating === 0) {
      return;
    }

    rateSessionMutation.mutate(
      {
        sessionId,
        data: {
          rating,
          comment: comment.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setRating(0);
          setComment("");
        },
      },
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="fa-solid fa-star text-warning mr-2"></i>
        Noter la session
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Partagez votre expérience pour aider à améliorer les futures sessions
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
        <div className="flex items-center justify-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={`fa-solid fa-star text-4xl cursor-pointer transition-colors ${
                star <= rating ? "text-warning" : "text-gray-300 hover:text-warning"
              }`}
              onClick={() => setRating(star)}
            ></i>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire (optionnel)</label>
        <textarea
          rows={3}
          placeholder="Votre commentaire..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-primary transition-all"
        ></textarea>
      </div>

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || rateSessionMutation.isPending}
        className="w-full px-4 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-medium shadow-lg shadow-primary/30 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {rateSessionMutation.isPending ? (
          <>
            <i className="fa-solid fa-spinner fa-spin mr-2"></i>
            Envoi en cours...
          </>
        ) : (
          <>
            <i className="fa-solid fa-paper-plane mr-2"></i>
            Envoyer mon avis
          </>
        )}
      </button>
    </div>
  );
};

export default SessionRatingForm;
