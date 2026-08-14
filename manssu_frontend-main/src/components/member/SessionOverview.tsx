import { formatTimeWithoutSeconds } from "../../utils/resourceUtils";

interface SessionOverviewProps {
  title: string;
  theme?: string;
  formattedDate: string;
  startTime?: string;
  endTime?: string;
  registered: number;
  maxParticipants: number;
  isRegistered?: boolean;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
}

const SessionOverview = ({
  title,
  theme,
  formattedDate,
  startTime,
  endTime,
  registered,
  maxParticipants,
  isRegistered,
  status = "upcoming",
}: SessionOverviewProps) => {
  const getStatusBadge = () => {
    switch (status) {
      case "upcoming":
        return {
          text: "Session à venir",
          bgClass: "bg-primary/10",
          textClass: "text-primary",
          borderClass: "border-primary/20",
        };
      case "ongoing":
        return {
          text: "Session en cours",
          bgClass: "bg-accent/10",
          textClass: "text-accent",
          borderClass: "border-accent/20",
        };
      case "completed":
        return {
          text: "Session terminée",
          bgClass: "bg-gray-100",
          textClass: "text-gray-600",
          borderClass: "border-gray-300",
        };
      case "cancelled":
        return {
          text: "Session annulée",
          bgClass: "bg-red-100",
          textClass: "text-red-600",
          borderClass: "border-red-300",
        };
      default:
        return {
          text: "Session à venir",
          bgClass: "bg-primary/10",
          textClass: "text-primary",
          borderClass: "border-primary/20",
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border-2 border-primary/20 p-6 lg:p-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span
          className={`px-4 py-2 ${statusBadge.bgClass} ${statusBadge.textClass} rounded-xl text-sm font-semibold border ${statusBadge.borderClass}`}
        >
          {statusBadge.text}
        </span>
        {isRegistered && status !== "completed" && status !== "cancelled" && (
          <span className="px-4 py-2 bg-success/10 text-success rounded-xl text-sm font-semibold flex items-center border border-success/20">
            <i className="fa-solid fa-check mr-2"></i>
            Inscrit
          </span>
        )}
      </div>
      <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        {title}
      </h2>
      <p className="text-gray-700 text-lg mb-6">Thème: {theme || "non défini"}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary/5 to-red-50 border border-primary/20 rounded-xl p-4">
          <i className="fa-solid fa-calendar text-primary text-2xl mb-2"></i>
          <p className="text-sm text-gray-600">Date</p>
          <p className="font-semibold text-lg text-gray-900">{formattedDate}</p>
        </div>
        <div className="bg-gradient-to-br from-accent/5 to-blue-50 border border-accent/20 rounded-xl p-4">
          <i className="fa-solid fa-clock text-accent text-2xl mb-2"></i>
          <p className="text-sm text-gray-600">Horaire</p>
          <p className="font-semibold text-lg text-gray-900">
            {startTime && endTime
              ? `${formatTimeWithoutSeconds(startTime)} - ${formatTimeWithoutSeconds(endTime)}`
              : "non défini"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-success/5 to-emerald-50 border border-success/20 rounded-xl p-4">
          <i className="fa-solid fa-users text-success text-2xl mb-2"></i>
          <p className="text-sm text-gray-600">Participants</p>
          <p className="font-semibold text-lg text-gray-900">
            {registered}/{maxParticipants}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionOverview;
