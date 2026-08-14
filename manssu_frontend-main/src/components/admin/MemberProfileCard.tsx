import { Member } from '../../types/member'
import { getMemberAvatarUrl, getMemberInitials } from '../../utils/userUtils'

interface MemberProfileCardProps {
  member: Member
}

const MemberProfileCard = ({ member }: MemberProfileCardProps) => {
  const avatarUrl = getMemberAvatarUrl(member)
  const initials = getMemberInitials(member)
  
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <i className="fa-solid fa-user text-primary mr-2"></i>
        Informations personnelles
      </h2>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={member.name}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-100"
            />
          ) : (
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary to-red-500 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl border-4 border-gray-100">
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Prénom</p>
              <p className="text-sm font-medium text-gray-900">{member.firstName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nom</p>
              <p className="text-sm font-medium text-gray-900">{member.lastName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
              <p className="text-sm font-medium text-gray-900">{member.email}</p>
            </div>
            {member.phone && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Téléphone</p>
                <p className="text-sm font-medium text-gray-900">{member.phone}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Adresse</p>
            <p className="text-sm font-medium text-gray-900">
              {member.address || member.city || member.postalCode || member.country
                ? [member.address, member.city, member.postalCode, member.country].filter(Boolean).join(', ')
                : 'Non renseignée'}
            </p>
          </div>
          {member.bio && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Biographie</p>
              <p className="text-sm text-gray-700">{member.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemberProfileCard

