interface PollConfigurationCardProps {
  resultsVisible: boolean;
  anonymous: boolean;
  daysLeft: number;
  pollStatus?: "draft" | "active" | "completed";
  singleResponse?: boolean; // Optional for legacy support
}

const PollConfigurationCard = ({
  resultsVisible,
  anonymous,
  daysLeft,
  pollStatus,
  singleResponse,
}: PollConfigurationCardProps) => {
  const isClosed = pollStatus === "completed";

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-2">
        <i className="fa-solid fa-info-circle text-accent"></i>
        <span className="font-semibold text-gray-900">Configuration du sondage</span>
      </div>
      <div
        className={`grid ${singleResponse !== undefined ? "grid-cols-2" : "grid-cols-2"} gap-4 text-sm text-gray-700`}
      >
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-eye text-purple-500"></i>
          <span>{resultsVisible ? "Résultats visibles en temps réel" : "Résultats cachés"}</span>
        </div>
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-user-secret text-gray-500"></i>
          <span>{anonymous ? "Sondage anonyme" : "Sondage nominatif"}</span>
        </div>
        {singleResponse !== undefined && (
          <div className="flex items-center space-x-2">
            <i className="fa-solid fa-check-circle text-success"></i>
            <span>{singleResponse ? "Une seule réponse par membre" : "Réponses multiples autorisées"}</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <i
            className={`fa-solid ${isClosed ? "fa-lock" : "fa-clock"} ${isClosed ? "text-gray-500" : "text-warning"}`}
          ></i>
          <span>{isClosed ? "Sondage fermé" : `Se termine dans ${daysLeft} jours`}</span>
        </div>
      </div>
    </div>
  );
};

export default PollConfigurationCard;
