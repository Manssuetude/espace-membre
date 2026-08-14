import { Member } from "../../types/member";

interface MemberAccountInfoCardProps {
  member: Member;
}

const MemberAccountInfoCard = ({ member }: MemberAccountInfoCardProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <i className="fa-solid fa-clock text-warning mr-2"></i>
        Informations du compte
      </h2>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Membre depuis le</p>
          <p className="text-sm font-medium text-gray-900">{formatDate(member.memberSince)}</p>
        </div>
        {member.lastLogin && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Dernière connexion</p>
            <p className="text-sm font-medium text-gray-900">{formatDateTime(member.lastLogin)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberAccountInfoCard;
