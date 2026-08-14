import { useMemo, useState } from "react";
import { useSessions } from "../../services/hooks/useSessions";
import { useResources } from "../../services/hooks/useResources";
import { translateResourceType } from "../../utils/resourceUtils";

const NextSessionResources = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({});

  // Get the next upcoming session
  const { data: sessionsData, isLoading: isLoadingSessions } = useSessions({ status: "upcoming", limit: 12 });
  const nextSession = sessionsData?.data?.[0];

  // Get resources for the next session (only approved)
  const { data: resourcesData, isLoading: isLoadingResources } = useResources({
    sessionId: nextSession?.id,
    status: "approved",
    page: currentPage,
    limit: 12,
  });

  const totalPages = resourcesData?.totalPages || 1;
  const totalItems = resourcesData?.total || 0;

  // Transform resources for display
  const displayResources = useMemo(() => {
    return (resourcesData?.data || []).map((resource) => {
      // Get icon based on type
      const getIcon = (type: string) => {
        switch (type) {
          case "file":
            return "fa-file-pdf";
          case "video":
            return "fa-video";
          case "audio":
            return "fa-headphones";
          case "folder":
            return "fa-link";
          default:
            return "fa-file";
        }
      };

      // Get color based on type
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

      // Format type display
      let typeDisplay = translateResourceType(resource.type);
      if (resource.fileSize) {
        const sizeMB = (resource.fileSize / (1024 * 1024)).toFixed(1);
        typeDisplay = `${typeDisplay} • ${sizeMB} MB`;
      }

      // Check if resource is new (created in last 7 days)
      const isNew = resource.createdAt
        ? (Date.now() - new Date(resource.createdAt).getTime()) / (1000 * 60 * 60 * 24) < 7
        : false;

      return {
        icon: getIcon(resource.type),
        title: resource.title,
        description: resource.description,
        type: typeDisplay,
        color: getColor(resource.type),
        isNew,
        link: resource.link,
      };
    });
  }, [resourcesData]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
      return;
    }
    setCurrentPage(newPage);
  };

  if (isLoadingSessions || isLoadingResources) {
    return (
      <div className="mb-8 flex items-center justify-center min-h-[200px]">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
      </div>
    );
  }

  if (!nextSession) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center mb-4 gap-2 sm:gap-0">
        <div className="flex items-center">
          <div className="w-1 h-6 bg-gradient-to-b from-primary to-red-500 rounded-full mr-3"></div>
          <h2 className="text-xl font-bold text-gray-900">Prochaine session</h2>
        </div>
        <div className="flex items-center sm:ml-3 gap-3 flex-wrap">
          <span className="px-3 py-1 bg-gradient-to-r from-primary/10 to-red-500/10 text-primary text-sm font-semibold rounded-lg">
            {nextSession.title}
          </span>
          {totalItems > 0 && (
            <span className="text-sm text-gray-500 sm:ml-auto">
              {resourcesData?.page ?? currentPage}/{totalPages} • {totalItems} ressources
            </span>
          )}
        </div>
      </div>

      {displayResources.length === 0 ? (
        <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-folder-open text-primary text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">Aucune ressource disponible pour cette session</p>
          <p className="text-gray-400 text-xs">Les ressources de la prochaine session apparaîtront ici</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayResources.map((resource, idx) => {
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
                key={idx}
                className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl hover:border-${resource.color}/30 transition-all group flex flex-col`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <i className={`fa-solid ${resource.icon} text-${resource.color} text-2xl`}></i>
                  </div>
                  {resource.isNew && (
                    <span className="px-3 py-1 bg-gradient-to-r from-success/10 to-emerald-500/10 text-success text-xs font-semibold rounded-lg">
                      Nouveau
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
                <div className="mb-4 flex-grow">
                  {resource.description ? (
                    <>
                      <p className="text-sm text-gray-600">
                        {expandedDescriptions[idx] || !resource.description || resource.description.length <= 120
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
                              [idx]: !prev[idx],
                            }));
                          }}
                          className="text-xs text-primary hover:text-primary/80 font-medium mt-1 flex items-center"
                        >
                          {expandedDescriptions[idx] ? (
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
                  className={`w-full py-2.5 bg-gradient-to-r ${bgClass} text-white font-medium rounded-lg hover:shadow-lg transition-all block text-center mt-auto`}
                >
                  {resource.icon === "fa-video"
                    ? "Regarder"
                    : resource.icon === "fa-headphones"
                      ? "Écouter"
                      : resource.icon === "fa-link"
                        ? "Accéder"
                        : "Télécharger"}
                </a>
              </div>
            );
          })}
        </div>
      )}
      {displayResources.length > 0 && totalPages > 1 && (
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

export default NextSessionResources;
