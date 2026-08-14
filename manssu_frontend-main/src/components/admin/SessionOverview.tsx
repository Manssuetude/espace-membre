import { Session } from "../../types/session";

interface SessionOverviewProps {
  session: Session;
  formattedDate: string;
  formattedTime: string;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onCancelClick?: () => void;
}

const SessionOverview = ({
  session,
  formattedDate,
  formattedTime,
  onEditClick,
  onDeleteClick,
  onCancelClick,
}: SessionOverviewProps) => {
  const isPastSession = session.status === "completed" || (session.date && new Date(session.date) < new Date());
  const isOngoing = session.status === "ongoing";

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
          <i className="fa-solid fa-info-circle text-primary mr-2 sm:mr-3"></i>
          Informations générales
        </h2>
        {!isPastSession && (
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-y-0">
            <button
              onClick={onEditClick}
              className="px-4 py-2 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center"
            >
              <i className="fa-solid fa-pencil mr-2"></i>
              Modifier
            </button>
            {isOngoing && onCancelClick && (
              <button
                onClick={onCancelClick}
                className="px-4 py-2 bg-gradient-to-r from-warning to-yellow-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center"
              >
                <i className="fa-solid fa-ban mr-2"></i>
                Annuler la session
              </button>
            )}
            <button
              onClick={onDeleteClick}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center"
            >
              <i className="fa-solid fa-trash mr-2"></i>
              Supprimer
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary/10 to-red-500/10 rounded-xl flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <i className="fa-solid fa-calendar text-primary text-sm sm:text-base"></i>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-500">Date</p>
              <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-secondary/10 to-orange-500/10 rounded-xl flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <i className="fa-solid fa-clock text-secondary text-sm sm:text-base"></i>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-500">Horaire</p>
              <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">{formattedTime}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-success/10 to-emerald-500/10 rounded-xl flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <i className="fa-solid fa-users text-success text-sm sm:text-base"></i>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-500">Participants</p>
              <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">
                {session.registered} / {session.maxParticipants} inscrits
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-accent/10 to-blue-500/10 rounded-xl flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <i className="fa-solid fa-map-marker-alt text-accent text-sm sm:text-base"></i>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-500">Lieu</p>
              <p className="font-semibold text-sm sm:text-base text-gray-900 break-words">
                {session.location?.address || "non défini"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {session.location?.instructions && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center">
            <i className="fa-solid fa-directions text-accent mr-2"></i>
            Accès
          </h3>
          <div className="bg-gradient-to-r from-accent/5 to-blue-50 border border-accent/20 rounded-xl p-3 sm:p-4">
            <div className="flex items-start space-x-3">
              <i className="fa-solid fa-circle-info text-accent mt-1"></i>
              <div className="text-sm text-gray-700">
                <p className="whitespace-pre-line">{session.location.instructions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {session.description && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Description</h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
            {session.description}
          </p>
        </div>
      )}

      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Thème</h3>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{session.theme || "non défini"}</p>
      </div>

      {session.objectives && session.objectives.length > 0 && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Objectifs de la session</h3>
          <ul className="space-y-2">
            {session.objectives.map((objective, idx) => (
              <li key={idx} className="flex items-start">
                <i className="fa-solid fa-check text-success mr-2 mt-1 text-xs sm:text-sm"></i>
                <span className="text-sm sm:text-base text-gray-600">{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SessionOverview;
