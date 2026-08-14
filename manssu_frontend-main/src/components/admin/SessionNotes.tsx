import { SessionRating } from "../../types/session";
import { formatDateWithTime } from "../../utils/dateUtils";

interface SessionNotesProps {
  ratings: SessionRating[];
  totalRatings: number;
  sessionId: string;
  ratingReminderSent?: boolean;
  onRemindRatings?: () => void;
  isReminding?: boolean;
}

const SessionNotes = ({
  ratings,
  totalRatings,
  ratingReminderSent,
  onRemindRatings,
  isReminding,
}: SessionNotesProps) => {
  // Calculate average rating
  const averageRating =
    ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length : 0;

  // Format date
  const formatDate = (dateStr: string) => {
    return formatDateWithTime(dateStr);
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
          <i className="fa-solid fa-star text-warning mr-2 sm:mr-3"></i>
          Notes des membres
        </h2>
        {ratingReminderSent === false && onRemindRatings && (
          <button
            onClick={onRemindRatings}
            disabled={isReminding}
            className="px-3 py-1.5 bg-gradient-to-r from-primary to-red-500 text-white text-xs sm:text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            title="Remercier les participants et inviter à noter"
          >
            {isReminding ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Envoi...
              </>
            ) : (
              <>
                <i className="fa-solid fa-envelope mr-2"></i>
                Inviter à noter
              </>
            )}
          </button>
        )}
      </div>
      {ratings.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-star text-gray-400 text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm">Aucune note reçue</p>
          <p className="text-gray-400 text-xs mt-1">Les participants n'ont pas encore noté cette session</p>
        </div>
      ) : (
        <>
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm sm:text-base text-gray-600">Note moyenne</span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">/ 5</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <i
                  key={star}
                  className={`fa-solid fa-star text-lg sm:text-xl ${
                    star <= Math.round(averageRating) ? "text-warning" : "text-gray-300"
                  }`}
                ></i>
              ))}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">{totalRatings} avis</p>
          </div>
          <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto">
            {ratings.slice(0, 10).map((rating, idx) => (
              <div key={rating.userId || idx} className="border border-gray-200 rounded-xl p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{rating.userName}</p>
                      {rating.attended && (
                        <span className="px-2 py-0.5 bg-success/10 text-success rounded text-xs font-medium whitespace-nowrap">
                          <i className="fa-solid fa-check mr-1"></i>
                          Présent
                        </span>
                      )}
                      {!rating.attended && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium whitespace-nowrap">
                          <i className="fa-solid fa-times mr-1"></i>
                          Absent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(rating.ratedAt)}</p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`fa-solid fa-star text-sm sm:text-base ${
                          star <= rating.rating ? "text-warning" : "text-gray-300"
                        }`}
                      ></i>
                    ))}
                  </div>
                </div>
                {rating.comment && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{rating.comment}</p>}
              </div>
            ))}
          </div>
          {ratings.length > 10 && (
            <button className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all">
              Voir tous les avis ({totalRatings})
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default SessionNotes;
