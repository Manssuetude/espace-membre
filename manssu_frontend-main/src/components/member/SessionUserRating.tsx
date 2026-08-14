import { UserRating } from '../../types/session'

interface SessionUserRatingProps {
  userRating: UserRating
}

const SessionUserRating = ({ userRating }: SessionUserRatingProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <i className="fa-solid fa-star text-warning mr-2"></i>
        Votre note
      </h3>
      
      <div className="mb-4">
        <div className="flex items-center justify-center space-x-2 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <i
              key={star}
              className={`fa-solid fa-star text-4xl ${
                star <= userRating.rating ? 'text-warning' : 'text-gray-300'
              }`}
            ></i>
          ))}
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Vous avez donné une note de <span className="font-semibold text-gray-900">{userRating.rating}/5</span>
          </p>
        </div>
      </div>

      {userRating.comment && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Votre commentaire</label>
          <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
            {userRating.comment}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          <i className="fa-solid fa-info-circle mr-1"></i>
          Votre note a été enregistrée
        </p>
      </div>
    </div>
  )
}

export default SessionUserRating

