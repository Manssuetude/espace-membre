import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Attendant } from "../../types/session";
import { useMarkAttendance } from "../../services/hooks/useSessions";
import { useMembers } from "../../services/hooks/useMembers";
import SearchableDropdown from "../SearchableDropdown";

interface SessionAttendantsProps {
  attendants: Attendant[];
  sessionId: string;
  sessionDate: string | null;
}

const getAttendantAvatarUrl = (avatar: string | null): string | null => {
  if (!avatar) return null;

  // If avatar is already a full URL, return it
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  // Otherwise, construct the URL
  return `https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/${avatar}`;
};

const getAttendantInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.trim() || "";
  const last = lastName?.trim() || "";

  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  } else if (first) {
    return first[0].toUpperCase();
  } else if (last) {
    return last[0].toUpperCase();
  }

  return "U";
};

const SessionAttendants = ({ attendants, sessionId, sessionDate }: SessionAttendantsProps) => {
  const markAttendance = useMarkAttendance();
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);
  const [confirmUserName, setConfirmUserName] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");

  // Fetch all members for the dropdown
  const { data: membersData, isLoading: membersLoading } = useMembers({
    limit: 100,
    page: 1,
  });

  // Filter out members who are already in the attendants list
  const availableMembers = useMemo(() => {
    if (!membersData?.data) return [];
    const attendantIds = new Set(attendants.map((a) => a.id));
    return membersData.data
      .filter((member) => !attendantIds.has(member.id))
      .map((member) => ({
        value: member.id,
        label: member.name || `${member.firstName} ${member.lastName}`.trim(),
      }));
  }, [membersData?.data, attendants]);

  // Check if we are at least on the day of the session
  const isSessionDayOrLater = () => {
    if (!sessionDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const session = new Date(sessionDate);
    session.setHours(0, 0, 0, 0);
    return session <= today;
  };

  const canMarkAttendance = isSessionDayOrLater();

  const handleMarkAttendanceClick = (e: React.MouseEvent, userId: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmUserId(userId);
    setConfirmUserName(name);
  };

  const handleConfirm = () => {
    if (!confirmUserId) return;
    markAttendance.mutate(
      {
        sessionId,
        userId: confirmUserId,
        data: { attended: true },
      },
      {
        onSuccess: () => {
          setConfirmUserId(null);
          setConfirmUserName(null);
        },
      },
    );
  };

  const handleCancel = () => {
    if (markAttendance.isPending) return;
    setConfirmUserId(null);
    setConfirmUserName(null);
  };

  const handleAddMember = () => {
    if (!selectedMemberId) return;

    const selectedMember = membersData?.data?.find((m) => m.id === selectedMemberId);
    if (!selectedMember) return;

    // Mark the selected member as present
    markAttendance.mutate(
      {
        sessionId,
        userId: selectedMemberId,
        data: { attended: true },
      },
      {
        onSuccess: () => {
          setShowAddMemberModal(false);
          setSelectedMemberId("");
        },
      },
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
        {attendants && attendants.length > 0 && (
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-lg">
            {attendants.length} inscrit{attendants.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      {canMarkAttendance && (
        <div className="mb-4 flex-shrink-0">
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="w-full px-3 py-2 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-all flex items-center justify-center gap-1.5"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            Ajouter un membre
          </button>
        </div>
      )}

      {!attendants || attendants.length === 0 ? (
        <div className="text-center py-8 flex-shrink-0">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-users text-gray-400 text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm">Aucun participant</p>
          <p className="text-gray-400 text-xs mt-1">Aucun participant inscrit à cette session</p>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {attendants.map((attendant) => {
              const avatarUrl = getAttendantAvatarUrl(attendant.avatar);
              const initials = getAttendantInitials(attendant.firstName, attendant.lastName);
              const isMarking = markAttendance.isPending && markAttendance.variables?.userId === attendant.id;

              return (
                <div
                  key={attendant.id}
                  className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-all group"
                >
                  <Link to={`/admin/membres/${attendant.id}`} className="flex items-center space-x-3 flex-1 min-w-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={attendant.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-primary/20 transition-all flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-gray-200 group-hover:ring-primary/20 bg-gray-100 group-hover:bg-primary/10 transition-all flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-600 group-hover:text-primary transition-colors">
                          {initials}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors truncate">
                        {attendant.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">Membre</p>
                    </div>
                  </Link>
                  {attendant.attended ? (
                    <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-lg flex-shrink-0">
                      <i className="fa-solid fa-check mr-1"></i>
                      Présent
                    </span>
                  ) : canMarkAttendance ? (
                    <button
                      onClick={(e) => handleMarkAttendanceClick(e, attendant.id, attendant.name)}
                      disabled={isMarking}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-lg flex-shrink-0 hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isMarking ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-check mr-1"></i>
                          Marquer présent
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {confirmUserId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <i className="fa-solid fa-user-check text-primary"></i>
                Marquer comme présent
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={markAttendance.isPending}
              >
                <i className="fa-solid fa-times text-lg"></i>
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Voulez-vous vraiment marquer <span className="font-semibold">{confirmUserName}</span> comme présent à
              cette session ?
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Cette action indique que le membre était effectivement présent. Vous ne pourrez plus modifier la présence
              de ce membre.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:space-y-0">
              <button
                onClick={handleCancel}
                disabled={markAttendance.isPending}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={markAttendance.isPending}
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-red-500 text-white text-sm font-semibold hover:shadow-md hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markAttendance.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-2"></i>
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <i className="fa-solid fa-user-plus text-primary"></i>
                Ajouter un membre
              </h3>
              <button
                onClick={() => {
                  if (!markAttendance.isPending) {
                    setShowAddMemberModal(false);
                    setSelectedMemberId("");
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={markAttendance.isPending}
              >
                <i className="fa-solid fa-times text-lg"></i>
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Sélectionnez un membre qui était présent mais n'était pas inscrit à cette session. Il sera automatiquement
              marqué comme présent.
            </p>

            <div className="mb-6">
              <SearchableDropdown
                label="Membre"
                value={selectedMemberId}
                onChange={setSelectedMemberId}
                options={availableMembers}
                placeholder="Rechercher un membre..."
                required
                allowCustom={false}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:space-y-0">
              <button
                onClick={() => {
                  if (!markAttendance.isPending) {
                    setShowAddMemberModal(false);
                    setSelectedMemberId("");
                  }
                }}
                disabled={markAttendance.isPending}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMember}
                disabled={markAttendance.isPending || !selectedMemberId || membersLoading}
                className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-red-500 text-white text-sm font-semibold hover:shadow-md hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markAttendance.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-2"></i>
                    Ajouter et marquer présent
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

export default SessionAttendants;
