import { useMemo, useState } from "react";
import { useResourceSessionsHistory } from "../../services/hooks/useResources";
import { translateResourceType } from "../../utils/resourceUtils";

const PastSessionResources = () => {
  const PAGE_LIMIT = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const { data: historyData, isLoading: isLoadingHistory } = useResourceSessionsHistory({
    page: currentPage,
    limit: PAGE_LIMIT,
  });

  const totalPages = historyData?.totalPages || 1;
  const totalItems = historyData?.total || 0;

  const sessionsWithResources = useMemo(() => {
    const entries = historyData?.data || [];

    return entries
      .map((entry) => {
        const session = entry.session;
        if (!session) return null;

        const formattedResources = entry.resources.map((resource) => {
          const getIcon = (type: string) => {
            switch (type) {
              case "file":
                return "fa-file-pdf";
              case "video":
                return "fa-video";
              case "audio":
                return "fa-headphones";
              case "folder":
                return "fa-folder";
              default:
                return "fa-file";
            }
          };

          const getColor = (type: string) => {
            switch (type) {
              case "file":
                return "primary";
              case "video":
                return "accent";
              case "audio":
                return "success";
              case "folder":
                return "secondary";
              default:
                return "primary";
            }
          };

          let typeDisplay = translateResourceType(resource.type);
          if (resource.fileSize) {
            const sizeMB = (resource.fileSize / (1024 * 1024)).toFixed(1);
            typeDisplay = `${typeDisplay} • ${sizeMB} MB`;
          }

          return {
            icon: getIcon(resource.type),
            title: resource.title,
            description: resource.description,
            type: typeDisplay,
            color: getColor(resource.type),
            link: resource.link,
          };
        });

        return {
          id: session.id,
          title: session.title,
          date: session.date
            ? new Date(session.date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "Date inconnue",
          resources: formattedResources,
        };
      })
      .filter((session) => session !== null)
      .sort((a, b) => {
        if (!a || !b) return 0;
        const dateA = historyData?.data?.find((entry) => entry.session.id === a.id)?.session.date;
        const dateB = historyData?.data?.find((entry) => entry.session.id === b.id)?.session.date;
        if (!dateA || !dateB) return 0;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [historyData]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
      return;
    }
    setCurrentPage(newPage);
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
      </div>
    );
  }

  if (!sessionsWithResources || sessionsWithResources.length === 0) {
    return (
      <div>
        <div className="flex items-center mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full mr-3"></div>
          <h2 className="text-xl font-bold text-gray-900">Sessions passées</h2>
        </div>
        <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <div className="w-16 h-16 bg-gradient-to-br from-secondary/10 to-orange-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-folder-open text-secondary text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">
            Aucune ressource disponible pour les sessions passées
          </p>
          <p className="text-gray-400 text-xs">Les ressources des sessions terminées apparaîtront ici</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="w-1 h-6 bg-gradient-to-b from-gray-400 to-gray-600 rounded-full mr-3"></div>
        <h2 className="text-xl font-bold text-gray-900">Sessions passées</h2>
        {totalItems > 0 && (
          <span className="ml-auto text-sm text-gray-500">
            Page {historyData?.page ?? currentPage}/{totalPages} • {totalItems} sessions
          </span>
        )}
      </div>

      {sessionsWithResources.map((session) => (
        <div key={session.id} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">{session.title}</h3>
            <span className="text-sm text-gray-500">{session.date}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {session.resources.map((resource, rIdx) => {
              const colorClasses = {
                primary: "from-primary/20 to-red-500/20 text-primary border-primary/30",
                accent: "from-accent/20 to-blue-600/20 text-accent border-accent/30",
                success: "from-success/20 to-emerald-600/20 text-success border-success/30",
                secondary: "from-secondary/20 to-orange-600/20 text-secondary border-secondary/30",
              };
              const bgClasses = {
                primary: "from-primary to-red-500",
                accent: "from-accent to-blue-600",
                success: "from-success to-emerald-600",
                secondary: "from-secondary to-orange-600",
              };
              const colorClass = colorClasses[resource.color as keyof typeof colorClasses] || colorClasses.primary;
              const bgClass = bgClasses[resource.color as keyof typeof bgClasses] || bgClasses.primary;

              return (
                <div
                  key={rIdx}
                  className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl hover:border-${resource.color}/30 transition-all group`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <i className={`fa-solid ${resource.icon} text-${resource.color} text-2xl`}></i>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                  <div className="mb-4">
                    {resource.description ? (
                      <>
                        <p className="text-sm text-gray-600">
                          {expandedDescriptions[`${session.id}-${rIdx}`] ||
                          !resource.description ||
                          resource.description.length <= 120
                            ? resource.description
                            : `${resource.description.substring(0, 120)}...`}
                        </p>
                        {resource.description && resource.description.length > 120 && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedDescriptions((prev) => ({
                                ...prev,
                                [`${session.id}-${rIdx}`]: !prev[`${session.id}-${rIdx}`],
                              }));
                            }}
                            className="text-xs text-primary hover:text-primary/80 font-medium mt-1 flex items-center"
                          >
                            {expandedDescriptions[`${session.id}-${rIdx}`] ? (
                              <>
                                <i className="fa-solid fa-chevron-up mr-1"></i>
                                Voir moins
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-chevron-down mr-1"></i>
                                Voir tout
                              </>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Aucune description disponible</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center">
                      <i
                        className={`fa-solid ${resource.icon === "fa-file-pdf" ? "fa-file" : resource.icon === "fa-video" ? "fa-play" : resource.icon === "fa-link" ? "fa-external-link" : "fa-file"} mr-1`}
                      ></i>
                      {resource.type}
                    </span>
                  </div>
                  <a
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-2.5 bg-gradient-to-r ${bgClass} text-white font-medium rounded-lg hover:shadow-lg transition-all block text-center`}
                  >
                    {resource.icon === "fa-video" ? "Regarder" : resource.icon === "fa-link" ? "Accéder" : "Consulter"}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-chevron-left mr-2"></i>
            Précédent
          </button>
          <div className="text-sm text-gray-500">
            Page <span className="font-semibold text-gray-800">{currentPage}</span> sur{" "}
            <span className="font-semibold text-gray-800">{totalPages}</span>
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Suivant
            <i className="fa-solid fa-chevron-right ml-2"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default PastSessionResources;
