import { useState, useMemo } from "react";
import { useSessions } from "../../services/hooks/useSessions";
import SessionsViewToggle from "../../components/member/SessionsViewToggle";
import SessionsSearch from "../../components/member/SessionsSearch";
import SessionsList from "../../components/member/SessionsList";
import SessionsCalendar from "../../components/member/SessionsCalendar";
import CalendarLegend from "../../components/member/CalendarLegend";
import UpcomingSessionsSidebar from "../../components/member/UpcomingSessionsSidebar";

const Sessions = () => {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [showPastSessions, setShowPastSessions] = useState(false);

  const { data: sessionsData, isLoading } = useSessions({});

  const allSessions = useMemo(() => sessionsData?.data || [], [sessionsData]);

  // Separate upcoming and past sessions
  const { upcomingSessions, pastSessions } = useMemo(() => {
    const now = new Date();
    const upcoming: typeof allSessions = [];
    const past: typeof allSessions = [];

    allSessions.forEach((session) => {
      if (session.status === "completed" || (session.date && new Date(session.date) < now)) {
        past.push(session);
      } else {
        upcoming.push(session);
      }
    });

    return { upcomingSessions: upcoming, pastSessions: past };
  }, [allSessions]);

  const displayedSessions = showPastSessions ? pastSessions : upcomingSessions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <SessionsViewToggle view={view} onViewChange={setView} />
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <SessionsSearch />
        </div>
      </div>

      {view === "list" ? (
        <div>
          <SessionsList sessions={displayedSessions} />
          {!showPastSessions && pastSessions.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowPastSessions(true)}
                className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <i className="fa-solid fa-history mr-2"></i>
                Voir les sessions passées ({pastSessions.length})
              </button>
            </div>
          )}
          {showPastSessions && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowPastSessions(false)}
                className="px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <i className="fa-solid fa-arrow-up mr-2"></i>
                Voir les sessions à venir ({upcomingSessions.length})
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <SessionsCalendar sessions={displayedSessions} />
            {!showPastSessions && pastSessions.length > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowPastSessions(true)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  <i className="fa-solid fa-history mr-2"></i>
                  Voir les sessions passées ({pastSessions.length})
                </button>
              </div>
            )}
            {showPastSessions && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowPastSessions(false)}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  <i className="fa-solid fa-arrow-up mr-2"></i>
                  Voir les sessions à venir ({upcomingSessions.length})
                </button>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <CalendarLegend />
            <UpcomingSessionsSidebar sessions={upcomingSessions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;
