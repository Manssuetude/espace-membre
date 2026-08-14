import { useState, useMemo } from "react";
import { useResources, usePendingResources, useDeleteResource } from "../../services/hooks/useResources";
import { useSessions } from "../../services/hooks/useSessions";
import { translateResourceType } from "../../utils/resourceUtils";
import NextSessionBanner from "../../components/admin/NextSessionBanner";
import PendingResourcesList from "../../components/admin/PendingResourcesList";
import CurrentResourcesList from "../../components/admin/CurrentResourcesList";
import ResourcesSidebar from "../../components/admin/ResourcesSidebar";
import UpdateResourceModal from "../../components/admin/UpdateResourceModal";

const Ressources = () => {
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<{
    resourceId: string;
    title: string;
    description: string;
  } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<{
    resourceId: string;
    title: string;
  } | null>(null);

  const deleteResource = useDeleteResource();

  // Fetch pending resources
  const { data: pendingResourcesData, isLoading: isLoadingPending } = usePendingResources();

  // Fetch upcoming sessions to get the next session
  const { data: sessionsData } = useSessions({ status: "upcoming" });

  const pendingResourcesFromApi = useMemo(() => pendingResourcesData || [], [pendingResourcesData]);

  // Get the next upcoming session
  const nextSession = useMemo(() => {
    const sessions = sessionsData?.data || [];
    if (sessions.length === 0) return null;

    // Filter sessions with dates and find the earliest one
    const sessionsWithDates = sessions
      .filter((session) => session.date)
      .sort((a, b) => {
        const dateA = new Date(a.date!).getTime();
        const dateB = new Date(b.date!).getTime();
        return dateA - dateB;
      });

    return sessionsWithDates.length > 0 ? sessionsWithDates[0] : null;
  }, [sessionsData]);

  // Fetch resources only for the next upcoming session
  const { data: nextSessionResourcesData, isLoading: isLoadingNextSessionResources } = useResources(
    nextSession?.id
      ? {
          sessionId: nextSession.id,
          status: "approved",
        }
      : undefined,
    {
      enabled: !!nextSession?.id, // Only fetch if we have a next session
    },
  );

  const nextSessionResources = useMemo(() => nextSessionResourcesData?.data || [], [nextSessionResourcesData]); // This is already Resource[]

  // Transform pending resources for display
  const pendingResources = useMemo(() => {
    return pendingResourcesFromApi.map((resource) => {
      const daysAgo = resource.createdAt
        ? Math.floor((Date.now() - new Date(resource.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Format file size
      let typeDisplay: string = resource.type;
      if (resource.fileSize) {
        const sizeMB = (resource.fileSize / (1024 * 1024)).toFixed(2);
        typeDisplay = `${resource.type.toUpperCase()} • ${sizeMB} MB`;
      }

      return {
        id: resource.id,
        title: resource.title,
        type: typeDisplay,
        author: "Auteur", // API doesn't return author info
        days: daysAgo,
        category: resource.category || "Non catégorisé",
        description: resource.description,
        link: resource.link,
        folderDescription: resource.folderDescription,
      };
    });
  }, [pendingResourcesFromApi]);

  // Transform resources for current list (resources for the next session)
  const currentResources = useMemo(() => {
    if (!nextSession) return [];

    return nextSessionResources
      .filter((resource) => resource.status === "approved")
      .map((resource) => {
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
              return "fa-folder";
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

        // Format date
        const addedDate = resource.createdAt
          ? new Date(resource.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Date inconnue";

        return {
          title: resource.title,
          type: translateResourceType(resource.type),
          icon: getIcon(resource.type),
          color: getColor(resource.type),
          session: nextSession.title,
          addedDate,
          resourceId: resource.id,
          link: resource.link,
          description: resource.description,
        };
      });
  }, [nextSessionResources, nextSession]);

  // Count pending resources for the next session
  const nextSessionPendingCount = useMemo(() => {
    return pendingResourcesFromApi.filter((r) => !r.sessionId).length;
  }, [pendingResourcesFromApi]);

  // Combine all resources for sidebar stats (pending + next session resources)
  const allResourcesForStats = useMemo(() => {
    return [...pendingResourcesFromApi, ...nextSessionResources];
  }, [pendingResourcesFromApi, nextSessionResources]);

  const handleDeleteResource = (resource: { resourceId: string; title: string }) => {
    setResourceToDelete(resource);
    setDeleteModalOpen(true);
  };

  const confirmDeleteResource = () => {
    if (!resourceToDelete) return;

    deleteResource.mutate(resourceToDelete.resourceId, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setResourceToDelete(null);
      },
    });
  };

  if (isLoadingPending || isLoadingNextSessionResources) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  return (
    <div>
      <NextSessionBanner nextSession={nextSession} pendingCount={nextSessionPendingCount} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PendingResourcesList resources={pendingResources} />
          <CurrentResourcesList
            resources={currentResources}
            onEditResource={(resource) => {
              setSelectedResource({
                resourceId: resource.resourceId,
                title: resource.title,
                description: resource.description,
              });
              setUpdateModalOpen(true);
            }}
            onDeleteResource={handleDeleteResource}
          />
        </div>
        <ResourcesSidebar
          pendingCount={pendingResources.length}
          currentCount={currentResources.length}
          resources={allResourcesForStats}
        />
      </div>

      <UpdateResourceModal
        isOpen={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false);
          setSelectedResource(null);
        }}
        resource={selectedResource}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && resourceToDelete ? (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Supprimer la ressource</h3>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setResourceToDelete(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-trash text-red-500 text-2xl"></i>
              </div>
              <p className="text-gray-700 text-center mb-2">
                Êtes-vous sûr de vouloir supprimer la ressource <strong>"{resourceToDelete.title}"</strong> ?
              </p>
              <p className="text-gray-500 text-sm text-center">
                Cette action est irréversible et supprimera définitivement cette ressource.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:space-y-0">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setResourceToDelete(null);
                }}
                disabled={deleteResource.isPending}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteResource}
                disabled={deleteResource.isPending}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteResource.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Suppression...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-trash mr-2"></i>
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Ressources;
