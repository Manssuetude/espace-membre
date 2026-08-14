import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Session } from "../../types/session";

interface SessionsCalendarProps {
  sessions: Session[];
}

const SessionsCalendar = ({ sessions }: SessionsCalendarProps) => {
  const navigate = useNavigate();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Initialize to current month, or first month with a session
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    const sessionsWithDates = sessions.filter((s) => s.date);
    if (sessionsWithDates.length > 0) {
      const firstSessionDate = new Date(sessionsWithDates[0].date!);
      // If first session is in the past, show current month, otherwise show first session month
      return firstSessionDate >= now ? firstSessionDate : now;
    }
    return now;
  });
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get month name in French
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // Monday = 0

    const days: Array<{
      day: number;
      isCurrentMonth: boolean;
      date: Date;
      key: string;
    }> = [];

    // Previous month days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      days.push({
        day,
        isCurrentMonth: false,
        date,
        key: `prev-${day}`,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({
        day,
        isCurrentMonth: true,
        date,
        key: `current-${day}`,
      });
    }

    // Next month days to fill the grid (6 rows = 42 days)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({
        day,
        isCurrentMonth: false,
        date,
        key: `next-${day}`,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Find session for a specific date
  const getSessionForDate = (date: Date): Session | undefined => {
    return sessions.find((s) => {
      if (!s.date) return false;
      const sessionDate = new Date(s.date);
      return (
        sessionDate.getFullYear() === date.getFullYear() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getDate() === date.getDate()
      );
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={goToPreviousMonth}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center justify-center transition-all"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <h3 className="text-2xl font-bold text-gray-900">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={goToNextMonth}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center justify-center transition-all"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-3 bg-gray-50 rounded-lg">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ day, isCurrentMonth, date, key }) => {
          const sessionForDay = getSessionForDate(date);
          const hasSession = !!sessionForDay;
          const isPast = date < new Date() && date.toDateString() !== new Date().toDateString();
          const isRegistered = sessionForDay && sessionForDay.isRegistered === true;
          const isAvailable = sessionForDay && !isPast;

          return (
            <div
              key={key}
              className={`h-24 p-1 text-center rounded-lg transition-all flex flex-col items-center justify-start text-sm relative ${
                !isCurrentMonth
                  ? "bg-gray-50/50 text-gray-400"
                  : isPast
                    ? "bg-gradient-to-br from-gray-100 to-gray-200"
                    : isRegistered
                      ? "bg-gradient-to-br from-primary to-red-500 text-white shadow-lg shadow-primary/30"
                      : isAvailable
                        ? "bg-gradient-to-br from-accent to-blue-600 text-white shadow-lg shadow-accent/30"
                        : "bg-white hover:bg-gray-50"
              } ${hasSession ? "cursor-pointer" : ""}`}
              onMouseEnter={() => hasSession && setHoveredDay(key)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={() => sessionForDay && navigate(`/sessions/${sessionForDay.id}`)}
            >
              <span
                className={`font-medium mb-1 ${
                  !isCurrentMonth
                    ? "text-gray-400"
                    : isRegistered || isAvailable
                      ? "font-bold text-white"
                      : isPast
                        ? "text-gray-800"
                        : "text-gray-900"
                }`}
              >
                {day}
              </span>
              {sessionForDay && isCurrentMonth && (
                <div className="w-full px-1">
                  <div
                    className={`text-xs px-1 py-0.5 rounded truncate font-medium ${
                      isPast ? "bg-gray-600 text-white" : isRegistered || isAvailable ? "bg-white/20 text-white" : ""
                    }`}
                  >
                    {sessionForDay.title}
                  </div>
                </div>
              )}
              {hoveredDay === key && sessionForDay && (
                <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-gray-900 text-white rounded-lg shadow-2xl p-4 pointer-events-none">
                  <h4 className="font-bold mb-2">{sessionForDay.title}</h4>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center">
                      <i className="fa-solid fa-clock w-4 mr-2"></i>
                      {sessionForDay.startTime && sessionForDay.endTime
                        ? `${sessionForDay.startTime} - ${sessionForDay.endTime}`
                        : "non défini"}
                    </p>
                    <p className="flex items-center">
                      <i className="fa-solid fa-location-dot w-4 mr-2"></i>
                      {sessionForDay.location
                        ? typeof sessionForDay.location === "string"
                          ? sessionForDay.location
                          : sessionForDay.location.address
                        : "non défini"}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
                      Cliquez pour voir les détails
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionsCalendar;
