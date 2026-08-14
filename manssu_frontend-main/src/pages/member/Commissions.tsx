import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  useCommissions,
  useMyCommissions,
  useMyApplications,
  useApplyToCommission,
  useWithdrawApplication,
} from "../../services/hooks/useCommissions";
import {
  MyCommissionApplication,
  MyCommissionWithSnakeCaseFallback,
  MyCommissionApplicationWithSnakeCaseFallback,
  CommissionWithSnakeCaseFallback,
} from "../../types/commission";
import Pagination from "../../components/Pagination";

const Commissions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGuest = user?.role === "guest";

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | undefined>("active");
  const [selectedCommission, setSelectedCommission] = useState<CommissionWithSnakeCaseFallback | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyReason, setApplyReason] = useState("");
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawCommissionId, setWithdrawCommissionId] = useState<string | null>(null);

  const { data: commissionsData, isLoading: loadingCommissions } = useCommissions({
    status: statusFilter,
    page,
    limit: 10,
  });

  const { data: myCommissions, isLoading: loadingMyCommissions } = useMyCommissions();
  const { data: myApplications, isLoading: loadingMyApplications } = useMyApplications();

  const applyMutation = useApplyToCommission();
  const withdrawMutation = useWithdrawApplication();

  const handleApply = () => {
    if (!selectedCommission || applyReason.trim().length < 10) return;
    applyMutation.mutate(
      { id: selectedCommission.id, data: { reason: applyReason } },
      {
        onSuccess: () => {
          setShowApplyModal(false);
          setSelectedCommission(null);
          setApplyReason("");
        },
      },
    );
  };

  const handleWithdraw = () => {
    if (!withdrawCommissionId) return;
    withdrawMutation.mutate(withdrawCommissionId, {
      onSuccess: () => {
        setShowWithdrawModal(false);
        setWithdrawCommissionId(null);
      },
    });
  };

  const getMyPendingApplication = (commissionId: string): MyCommissionApplication | undefined => {
    return myApplications?.find((app) => app.commissionId === commissionId && app.status === "pending");
  };

  const isMemberOf = (commissionId: string): boolean => {
    return myCommissions?.some((c) => c.id === commissionId) || false;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-red-50 to-orange-50 rounded-2xl p-6 sm:p-8 border border-primary/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-people-group text-white text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Commissions</h1>
            <p className="text-gray-600">Groupes de travail de l'association</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">
          Les commissions sont des groupes de membres qui travaillent ensemble sur des missions spécifiques pour
          soutenir l'association. Vous pouvez candidater pour rejoindre une commission.
        </p>
      </div>

      {/* My Commissions Section */}
      {!isGuest && (
        <section className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-blue-600 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-id-badge text-white"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Mes commissions</h2>
          </div>

          {loadingMyCommissions ? (
            <div className="flex items-center justify-center py-8">
              <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
            </div>
          ) : myCommissions && myCommissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(myCommissions as MyCommissionWithSnakeCaseFallback[]).map((commission) => {
                const isLeader = commission.isLeader ?? commission.is_leader ?? false;
                const memberCount = commission.memberCount ?? commission.member_count ?? 0;
                const joinedAt = commission.joinedAt || commission.joined_at || "";

                return (
                  <div
                    key={commission.id}
                    className="bg-gradient-to-br from-accent/5 to-blue-50 rounded-xl p-5 border border-accent/20 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => navigate(`/association/commissions/${commission.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{commission.name}</h3>
                      {isLeader && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          <i className="fa-solid fa-crown mr-1"></i>
                          Leader
                        </span>
                      )}
                    </div>
                    {commission.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 whitespace-pre-line">
                        {commission.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        <i className="fa-solid fa-users mr-1"></i>
                        {memberCount} membre{memberCount > 1 ? "s" : ""}
                      </span>
                      {joinedAt && <span>Rejoint le {formatDate(joinedAt)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-users text-gray-400 text-2xl"></i>
              </div>
              <p className="text-gray-500">Vous n'êtes membre d'aucune commission</p>
              <p className="text-sm text-gray-400 mt-1">Candidatez à une commission pour y participer</p>
            </div>
          )}
        </section>
      )}

      {/* My Applications Section */}
      {!isGuest && myApplications && myApplications.length > 0 && (
        <section className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-secondary to-orange-600 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-paper-plane text-white"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Mes candidatures</h2>
          </div>

          {loadingMyApplications ? (
            <div className="flex items-center justify-center py-8">
              <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
            </div>
          ) : (
            <div className="space-y-3">
              {(myApplications as MyCommissionApplicationWithSnakeCaseFallback[]).map((application) => {
                const commissionName = application.commissionName || application.commission_name || "";
                const commissionId = application.commissionId || application.commission_id || "";
                const createdAt = application.createdAt || application.created_at || "";
                const rejectionReason = application.rejectionReason || application.rejection_reason || "";

                return (
                  <div
                    key={application.id}
                    className={`rounded-xl p-4 border ${
                      application.status === "pending"
                        ? "bg-yellow-50 border-yellow-200"
                        : application.status === "approved"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900">{commissionName}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2 whitespace-pre-line">
                          {application.reason}
                        </p>
                        {createdAt && <p className="text-xs text-gray-500 mt-2">Soumise le {formatDate(createdAt)}</p>}
                        {rejectionReason && (
                          <p className="text-sm text-red-600 mt-2">
                            <i className="fa-solid fa-circle-info mr-1"></i>
                            {rejectionReason}
                          </p>
                        )}
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            application.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : application.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {application.status === "pending"
                            ? "En attente"
                            : application.status === "approved"
                              ? "Approuvée"
                              : "Rejetée"}
                        </span>
                        {application.status === "pending" && (
                          <button
                            onClick={() => {
                              setWithdrawCommissionId(commissionId);
                              setShowWithdrawModal(true);
                            }}
                            className="text-xs text-red-600 hover:text-red-700 transition-colors"
                          >
                            <i className="fa-solid fa-xmark mr-1"></i>
                            Retirer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* All Commissions Section */}
      <section className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-red-600 rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-list text-white"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Toutes les commissions</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === "active" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Actives
            </button>
            <button
              onClick={() => setStatusFilter("archived")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === "archived" ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Archivées
            </button>
          </div>
        </div>

        {loadingCommissions ? (
          <div className="flex items-center justify-center py-12">
            <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
          </div>
        ) : commissionsData && commissionsData.data.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(commissionsData.data as CommissionWithSnakeCaseFallback[]).map((commission) => {
                const pendingApp = getMyPendingApplication(commission.id);
                const isMember = isMemberOf(commission.id);
                const memberCount = commission.memberCount ?? commission.member_count ?? 0;
                const maxMembers = commission.maxMembers ?? commission.max_members;
                const createdAt = commission.createdAt || commission.created_at || "";
                const leaderFirstName = commission.leader?.firstName || commission.leader?.first_name || "";
                const leaderLastName = commission.leader?.lastName || commission.leader?.last_name || "";
                const isFull = maxMembers !== null && maxMembers !== undefined && memberCount >= maxMembers;

                return (
                  <div
                    key={commission.id}
                    className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/association/commissions/${commission.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{commission.name}</h3>
                          {commission.status === "archived" && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Archivée</span>
                          )}
                        </div>
                        {commission.leader && (
                          <p className="text-sm text-gray-500 mt-1">
                            <i className="fa-solid fa-crown text-yellow-500 mr-1"></i>
                            {leaderFirstName} {leaderLastName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <i className="fa-solid fa-users"></i>
                        <span>
                          {memberCount}
                          {maxMembers !== null && maxMembers !== undefined && ` / ${maxMembers}`}
                        </span>
                      </div>
                    </div>

                    {commission.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 whitespace-pre-line">
                        {commission.description}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-gray-100">
                      {isMember ? (
                        <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg">
                          <i className="fa-solid fa-check mr-1"></i>
                          Membre
                        </span>
                      ) : pendingApp ? (
                        <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-lg">
                          <i className="fa-solid fa-clock mr-1"></i>
                          Candidature en cours
                        </span>
                      ) : isGuest ? (
                        <span className="text-sm text-gray-500 italic">Connectez-vous pour candidater</span>
                      ) : commission.status === "archived" ? (
                        <span className="text-sm text-gray-500 italic">Commission archivée</span>
                      ) : isFull ? (
                        <span className="text-sm text-gray-500 italic">Commission complète</span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCommission(commission);
                            setShowApplyModal(true);
                          }}
                          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <i className="fa-solid fa-paper-plane mr-2"></i>
                          Candidater
                        </button>
                      )}

                      {createdAt && <span className="text-xs text-gray-400">Créée le {formatDate(createdAt)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {commissionsData.totalPages > 1 && (
              <div className="mt-6">
                <Pagination currentPage={page} totalPages={commissionsData.totalPages} onPageChange={setPage} />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-people-group text-gray-400 text-3xl"></i>
            </div>
            <p className="text-gray-500 text-lg">Aucune commission trouvée</p>
            <p className="text-sm text-gray-400 mt-1">
              {statusFilter === "active" ? "Aucune commission active pour le moment" : "Aucune commission archivée"}
            </p>
          </div>
        )}
      </section>

      {/* Apply Modal */}
      {showApplyModal && selectedCommission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Candidater à une commission</h3>
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    setSelectedCommission(null);
                    setApplyReason("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-br from-primary/5 to-red-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-1">{selectedCommission.name}</h4>
                {selectedCommission.description && (
                  <p className="text-sm text-gray-600 whitespace-pre-line">{selectedCommission.description}</p>
                )}
                {selectedCommission.leader && (
                  <p className="text-sm text-gray-500 mt-2">
                    <i className="fa-solid fa-crown text-yellow-500 mr-1"></i>
                    Leader: {selectedCommission.leader.firstName || selectedCommission.leader.first_name}{" "}
                    {selectedCommission.leader.lastName || selectedCommission.leader.last_name}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={applyReason}
                    onChange={(e) => setApplyReason(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none"
                    placeholder="Expliquez pourquoi vous souhaitez rejoindre cette commission et ce que vous pouvez y apporter (minimum 10 caractères)..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{applyReason.length} / 2000 caractères (minimum 10)</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setSelectedCommission(null);
                  setApplyReason("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleApply}
                disabled={applyReason.trim().length < 10 || applyMutation.isPending}
                className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {applyMutation.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Envoi...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i>
                    Envoyer ma candidature
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Retirer votre candidature ?</h3>
              <p className="text-gray-600 text-center">
                Êtes-vous sûr de vouloir retirer votre candidature ? Cette action est irréversible.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawCommissionId(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending}
                className="px-6 py-2 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {withdrawMutation.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Retrait...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-xmark"></i>
                    Retirer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Commissions;
