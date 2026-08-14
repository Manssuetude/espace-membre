import { Member } from "../../types/member";

interface MemberStatusCardProps {
  member: Member;
}

const MemberStatusCard = ({ member }: MemberStatusCardProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const roleLabel =
    member.role === "admin" ? "Administrateur" : member.role === "super admin" ? "Super Admin" : "Membre";
  const roleColor =
    member.role === "admin" || member.role === "super admin"
      ? "bg-gradient-to-r from-secondary to-orange-600 text-white"
      : "bg-gray-100 text-gray-800";

  const statusLabel = member.status === "active" ? "Actif" : member.status === "inactive" ? "Inactif" : "Suspendu";
  const statusColor =
    member.status === "active"
      ? "bg-gradient-to-r from-success to-emerald-500 text-white"
      : member.status === "inactive"
        ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
        : "bg-gradient-to-r from-warning to-yellow-500 text-white";

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <i className="fa-solid fa-info-circle text-primary mr-2"></i>
        Statut
      </h2>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rôle</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${roleColor}`}>{roleLabel}</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Statut</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Membre depuis</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(member.memberSince)}</p>
        </div>
      </div>
    </div>
  );
};

export default MemberStatusCard;
