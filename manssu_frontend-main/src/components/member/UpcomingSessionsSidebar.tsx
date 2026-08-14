import { Session } from "../../types/session";

interface UpcomingSessionsSidebarProps {
  sessions: Session[];
}

const UpcomingSessionsSidebar = ({ sessions }: UpcomingSessionsSidebarProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Prochaines sessions</h3>
      <div className="space-y-4">
        {sessions.length > 0 ? (
          sessions.slice(0, 3).map((session) => {
            const sessionDate = session.date ? new Date(session.date) : null;
            const day = sessionDate ? sessionDate.getDate() : null;
            const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
            const month = sessionDate ? monthNames[sessionDate.getMonth()] : null;
            const dateStr = day && month ? `${day} ${month}` : "non défini";
            const timeStr =
              session.startTime && session.endTime ? `${session.startTime} - ${session.endTime}` : "non défini";
            const borderClass = session.status === "upcoming" ? "border-primary" : "border-accent";

            return (
              <div key={session.id} className={`border-l-4 ${borderClass} pl-4 py-2`}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900 text-sm">{session.title}</h4>
                  <span className="text-xs text-gray-500">{dateStr}</span>
                </div>
                <p className="text-xs text-gray-600">{timeStr}</p>
                <p className="text-xs text-gray-500">{session.location?.address || "non défini"}</p>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Aucune session à venir</p>
        )}
      </div>
    </div>
  );
};

export default UpcomingSessionsSidebar;
