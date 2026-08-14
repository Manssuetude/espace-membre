import { useState } from "react";
import { useUpdateResourceStatus } from "../../services/hooks/useResources";
import { translateResourceType } from "../../utils/resourceUtils";

interface PendingResource {
  id: string;
  title: string;
  type: string;
  author: string;
  days: number;
  category: string;
  description: string;
  link: string;
  folderDescription: string | null;
}

interface PendingResourcesListProps {
  resources: PendingResource[];
}

const PendingResourcesList = ({ resources }: PendingResourcesListProps) => {
  const updateStatusMutation = useUpdateResourceStatus();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const handleApprove = (resourceId: string) => {
    updateStatusMutation.mutate({
      id: resourceId,
      data: {
        status: "approved",
        reviewNotes: reviewNotes[resourceId] || undefined,
      },
    });
  };

  const handleReject = (resourceId: string) => {
    if (!reviewNotes[resourceId]?.trim()) {
      // Show modal to enter rejection reason
      setShowRejectModal(resourceId);
      return;
    }
    updateStatusMutation.mutate({
      id: resourceId,
      data: {
        status: "rejected",
        reviewNotes: reviewNotes[resourceId],
      },
    });
    setShowRejectModal(null);
  };

  const handlePreview = (resource: PendingResource) => {
    window.open(resource.link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <i className="fa-solid fa-clock text-warning mr-2"></i>
          Ressources en attente de validation
        </h3>
        <span className="bg-gradient-to-r from-warning to-yellow-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
          {resources.length} en attente
        </span>
      </div>
      {resources.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-warning/20 to-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-clock text-warning text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">Aucune ressource en attente</p>
          <p className="text-gray-400 text-xs">Toutes les ressources ont été validées</p>
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="p-4 sm:p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-warning/20 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className="fa-solid fa-file-pdf text-red-600 text-lg sm:text-xl"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words">{resource.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">
                        {translateResourceType(resource.type)} • Proposé par {resource.author}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:space-x-4 text-xs text-gray-500">
                    <span>
                      <i className="fa-solid fa-calendar mr-1"></i>
                      Soumis il y a {resource.days} jour{resource.days > 1 ? "s" : ""}
                    </span>
                    <span>
                      <i className="fa-solid fa-tag mr-1"></i>
                      {resource.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => handleApprove(resource.id)}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 sm:flex-initial px-3 py-2 bg-gradient-to-r from-success to-emerald-500 text-white text-xs sm:text-sm rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fa-solid fa-check mr-1"></i>
                  Valider
                </button>
                <button
                  onClick={() => handleReject(resource.id)}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 sm:flex-initial px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs sm:text-sm rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fa-solid fa-times mr-1"></i>
                  Rejeter
                </button>
                <button
                  onClick={() => handlePreview(resource)}
                  className="flex-1 sm:flex-initial px-3 py-2 bg-white border border-gray-300 text-gray-700 text-xs sm:text-sm rounded-lg hover:bg-gray-50 transition-all"
                >
                  <i className="fa-solid fa-eye mr-1"></i>
                  Prévisualiser
                </button>
              </div>
              {showRejectModal === resource.id && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <label className="block text-sm font-semibold text-red-800 mb-2">Raison du rejet (obligatoire)</label>
                  <textarea
                    value={reviewNotes[resource.id] || ""}
                    onChange={(e) => setReviewNotes({ ...reviewNotes, [resource.id]: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
                    placeholder="Expliquez pourquoi cette ressource est rejetée..."
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        if (reviewNotes[resource.id]?.trim()) {
                          handleReject(resource.id);
                        }
                      }}
                      disabled={!reviewNotes[resource.id]?.trim() || updateStatusMutation.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Confirmer le rejet
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectModal(null);
                        setReviewNotes({ ...reviewNotes, [resource.id]: "" });
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingResourcesList;
