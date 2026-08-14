import { useNavigate } from "react-router-dom";
import { Member } from "../../types/member";
import { User } from "../../types/auth";

interface MemberHeaderProps {
  member: Member;
  currentUser: User | null;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onDelete: () => void;
  suspendPending: boolean;
  unsuspendPending: boolean;
  deletePending: boolean;
}

const MemberHeader = ({
  member,
  currentUser,
  onSuspend,
  onUnsuspend,
  onDelete,
  suspendPending,
  unsuspendPending,
  deletePending,
}: MemberHeaderProps) => {
  const navigate = useNavigate();

  // Helper function to check if user can suspend/delete this member
  const canManageMember = (): boolean => {
    if (!currentUser) return false;

    // User cannot manage themselves
    if (member.id === currentUser.id) return false;

    // Only super_admin can manage admins and super_admins
    if (member.role === "admin" || member.role === "super admin") {
      return currentUser.role === "super_admin";
    }

    // Admins and super_admins can manage regular members
    return currentUser.role === "admin" || currentUser.role === "super_admin";
  };

  const canManage = canManageMember();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 transition-colors">
          <i className="fa-solid fa-arrow-left text-xl"></i>
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{member.name}</h1>
          <p className="text-gray-500 mt-1">{member.email}</p>
        </div>
      </div>
      {canManage && (
        <div className="flex flex-wrap gap-2">
          {member.status === "suspended" ? (
            <button
              onClick={onUnsuspend}
              disabled={unsuspendPending}
              className="px-4 py-2 bg-gradient-to-r from-success to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {unsuspendPending ? (
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fa-solid fa-play mr-2"></i>
              )}
              Réactiver
            </button>
          ) : (
            <button
              onClick={onSuspend}
              disabled={suspendPending}
              className="px-4 py-2 bg-gradient-to-r from-warning to-yellow-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {suspendPending ? (
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fa-solid fa-pause mr-2"></i>
              )}
              Suspendre
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={deletePending}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deletePending ? (
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
            ) : (
              <i className="fa-solid fa-trash mr-2"></i>
            )}
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberHeader;
