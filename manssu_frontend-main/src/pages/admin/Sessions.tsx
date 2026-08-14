import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSessions } from "../../services/hooks/useSessions";
import Dropdown from "../../components/Dropdown";

const Sessions = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "all");
  const [dateFrom, setDateFrom] = useState(() => searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(() => searchParams.get("dateTo") || "");
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || ""); // Input value (what user types)
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || ""); // Actual search query (submitted)

  const { data: sessionsData, isLoading } = useSessions({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (dateFrom) {
      params.set("dateFrom", dateFrom);
    }
    if (dateTo) {
      params.set("dateTo", dateTo);
    }
    if (searchQuery) {
      params.set("search", searchQuery);
    }

    setSearchParams(params, { replace: true });
  }, [statusFilter, dateFrom, dateTo, searchQuery, setSearchParams]);

  const handleResetFilters = () => {
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearchInput("");
    setSearchQuery("");
    setSearchParams({}, { replace: true });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const hasActiveFilters = statusFilter !== "all" || dateFrom || dateTo || searchQuery;

  const sessions = sessionsData?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "from-success to-emerald-500";
      case "ongoing":
        return "from-accent to-blue-600";
      case "completed":
        return "from-gray-400 to-gray-500";
      case "cancelled":
        return "from-red-500 to-red-600";
      default:
        return "from-warning to-yellow-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "upcoming":
        return "À venir";
      case "ongoing":
        return "En cours";
      case "completed":
        return "Terminée";
      case "cancelled":
        return "Annulée";
      default:
        return status;
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "non défini";
    const date = new Date(dateStr);
    const weekdayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
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
    return `${weekdayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div></div>
        <Link
          to="/admin/sessions/create"
          className="bg-gradient-to-r from-primary to-red-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium hover:shadow-lg transition-all flex items-center w-full sm:w-auto justify-center"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Créer une session
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 mb-6 sm:mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="text"
                placeholder="Rechercher une session..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm sm:text-base h-[42px]"
              />
            </div>
            <div className="relative [&_select]:h-[42px] [&_select]:py-2.5">
              <Dropdown
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                options={[
                  { value: "all", label: "Tous les statuts" },
                  { value: "upcoming", label: "À venir" },
                  { value: "ongoing", label: "En cours" },
                  { value: "completed", label: "Terminée" },
                  { value: "cancelled", label: "Annulée" },
                ]}
                className="w-full"
              />
            </div>
            <div className="relative">
              <i className="fa-solid fa-calendar absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="date"
                placeholder="Date de début"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm sm:text-base h-[42px]"
              />
            </div>
            <div className="relative">
              <i className="fa-solid fa-calendar-check absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                type="date"
                placeholder="Date de fin"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 w-full border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm sm:text-base h-[42px]"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all flex items-center"
              >
                <i className="fa-solid fa-times mr-2"></i>
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {sessions.length > 0 ? (
          sessions.map((session) => {
            const progress = Math.round((session.registered / session.maxParticipants) * 100);
            const dateStr = formatDate(session.date);
            const timeStr =
              session.startTime && session.endTime
                ? `${session.startTime} - ${session.endTime}${session.duration ? ` (${session.duration})` : ""}`
                : "non défini";

            return (
              <Link
                key={session.id}
                to={`/admin/sessions/${session.id}`}
                className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6 hover:shadow-xl transition-all group cursor-pointer block"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`bg-gradient-to-r ${getStatusColor(session.status)} text-white px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap`}
                      >
                        {getStatusLabel(session.status)}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {session.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">Thème: {session.theme || "non défini"}</p>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 mb-4">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <i className="fa-solid fa-calendar text-primary mr-2 flex-shrink-0"></i>
                    <span className="truncate">{session.date ? dateStr : "non défini"}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <i className="fa-solid fa-clock text-secondary mr-2 flex-shrink-0"></i>
                    <span className="truncate">{session.startTime && session.endTime ? timeStr : "non défini"}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <i className="fa-solid fa-map-marker-alt text-accent mr-2 flex-shrink-0"></i>
                    <span className="truncate">{session.location?.address || "non défini"}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                  <div className="flex items-center">
                    <span className="text-xs sm:text-sm text-gray-600">{session.registered} inscrits</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    {session.maxParticipants} places max
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${getStatusColor(session.status)} h-2 rounded-full`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">Aucune session trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;
