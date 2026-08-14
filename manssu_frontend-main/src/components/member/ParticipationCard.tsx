import { useParams } from "react-router-dom";
import { useRegisterForSession, useUnregisterFromSession } from "../../services/hooks/useSessions";

interface ParticipationCardProps {
  isMobile?: boolean;
  isRegistered?: boolean;
  isPastSession?: boolean;
}

const ParticipationCard = ({
  isMobile = false,
  isRegistered = false,
  isPastSession = false,
}: ParticipationCardProps) => {
  const { id } = useParams();
  const registerForSession = useRegisterForSession();
  const unregisterFromSession = useUnregisterFromSession();

  const baseClasses = "bg-gradient-to-br from-primary via-red-500 to-secondary rounded-2xl shadow-2xl p-6 text-white";
  const displayClasses = isMobile ? "lg:hidden mb-6" : "hidden lg:block";

  const handleRegister = () => {
    if (!id || isPastSession) return;
    registerForSession.mutate(id);
  };

  const handleUnregister = () => {
    if (!id || isPastSession) return;
    unregisterFromSession.mutate(id);
  };

  return (
    <div className={`${baseClasses} ${displayClasses}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <i className={`fa-solid ${isRegistered ? "fa-user-check" : "fa-user-plus"} mr-2`}></i>
        Ma participation
      </h3>
      {isRegistered ? (
        <>
          <div className="bg-white/20 backdrop-blur-xl rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Statut</span>
              <span className="px-3 py-1 bg-success/30 backdrop-blur-xl rounded-lg text-sm font-semibold">
                <i className="fa-solid fa-check mr-1"></i>
                Inscrit
              </span>
            </div>
            <p className="text-xs text-white/80">Vous êtes inscrit à cette session</p>
          </div>
          <button
            onClick={handleUnregister}
            disabled={unregisterFromSession.isPending || isPastSession}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/30 text-white rounded-xl font-medium hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {unregisterFromSession.isPending ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Annulation...
              </>
            ) : (
              <>
                <i className="fa-solid fa-times mr-2"></i>
                Annuler ma participation
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <div className="bg-white/20 backdrop-blur-xl rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Statut</span>
              <span className="px-3 py-1 bg-warning/30 backdrop-blur-xl rounded-lg text-sm font-semibold">
                <i className="fa-solid fa-clock mr-1"></i>
                Non inscrit
              </span>
            </div>
            <p className="text-xs text-white/80">Vous n'êtes pas encore inscrit à cette session</p>
          </div>
          <button
            onClick={handleRegister}
            disabled={registerForSession.isPending || isPastSession}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/30 text-white rounded-xl font-medium hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {registerForSession.isPending ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                Inscription...
              </>
            ) : (
              <>
                <i className="fa-solid fa-user-plus mr-2"></i>
                S'inscrire à la session
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default ParticipationCard;
