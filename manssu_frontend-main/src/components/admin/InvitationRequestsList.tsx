import { useState } from "react";
import { useInvitationRequests, useReviewInvitationRequest } from "../../services/hooks/useInvitations";
import { InvitationRequestStatus } from "../../types/invitation";
import Dropdown from "../Dropdown";

interface InvitationRequestsListProps {
  sessionId?: string;
}

const InvitationRequestsList = ({ sessionId }: InvitationRequestsListProps) => {
  const [statusFilter, setStatusFilter] = useState<InvitationRequestStatus | "all">("all");
  const { data: requests, isLoading } = useInvitationRequests({
    status: statusFilter !== "all" ? statusFilter : undefined,
    session_id: sessionId,
  });
  const reviewRequest = useReviewInvitationRequest();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: InvitationRequestStatus) => {
    const statusConfig = {
      pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
      approved: { label: "Approuvée", color: "bg-green-100 text-green-800" },
      rejected: { label: "Rejetée", color: "bg-red-100 text-red-800" },
    };
    const config = statusConfig[status];
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>;
  };

  const handleReview = async (id: string, action: "approve" | "reject") => {
    const actionText = action === "approve" ? "approuver" : "rejeter";
    if (window.confirm(`Êtes-vous sûr de vouloir ${actionText} cette demande d'invitation ?`)) {
      try {
        await reviewRequest.mutateAsync({ id, data: { action } });
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center justify-center py-8">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Demandes d'invitation</h3>
        {requests && requests.length > 0 && (
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-lg">
            {requests.length} demande{requests.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4">
        <div className="w-full sm:w-48">
          <Dropdown
            options={[
              { value: "all", label: "Tous les statuts" },
              { value: "pending", label: "En attente" },
              { value: "approved", label: "Approuvées" },
              { value: "rejected", label: "Rejetées" },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvitationRequestStatus | "all")}
            placeholder="Filtrer par statut"
          />
        </div>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-envelope-open text-gray-400 text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">Aucune demande d'invitation</p>
          <p className="text-gray-400 text-xs">Les demandes d'invitation apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-gray-900">{request.fullName}</p>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <i className="fa-solid fa-envelope mr-2"></i>
                    {request.email}
                  </p>
                  {request.sessionTitle && (
                    <p className="text-sm text-gray-600 mb-2">
                      <i className="fa-solid fa-calendar mr-2"></i>
                      {request.sessionTitle}
                    </p>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3 mb-2">
                    <p className="text-xs text-gray-500 mb-1">Raison:</p>
                    <p className="text-sm text-gray-700">{request.reason}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>
                      <i className="fa-solid fa-user mr-1"></i>
                      Demandé par: {request.requestedByName || "N/A"}
                    </span>
                    <span>
                      <i className="fa-solid fa-clock mr-1"></i>
                      Créée le {formatDate(request.createdAt)}
                    </span>
                    {request.reviewedAt && (
                      <span>
                        <i className="fa-solid fa-check-circle mr-1"></i>
                        Examinée le {formatDate(request.reviewedAt)}
                      </span>
                    )}
                    {request.reviewedByName && (
                      <span>
                        <i className="fa-solid fa-user-check mr-1"></i>
                        Par: {request.reviewedByName}
                      </span>
                    )}
                  </div>
                </div>
                {request.status === "pending" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleReview(request.id, "approve")}
                      disabled={reviewRequest.isPending}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      title="Approuver la demande"
                    >
                      <i className="fa-solid fa-check"></i>
                      Approuver
                    </button>
                    <button
                      onClick={() => handleReview(request.id, "reject")}
                      disabled={reviewRequest.isPending}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      title="Rejeter la demande"
                    >
                      <i className="fa-solid fa-times"></i>
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvitationRequestsList;
