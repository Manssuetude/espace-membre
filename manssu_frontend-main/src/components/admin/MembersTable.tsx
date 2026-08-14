import { Member } from '../../types/member'
import { User } from '../../types/auth'
import { getMemberAvatarUrl, getMemberInitials } from '../../utils/userUtils'

interface MembersTableProps {
  members: Member[]
  isLoading: boolean
  currentUser: User | null
  onViewMember: (memberId: string) => void
  onEditMember: (member: Member) => void
  onSuspendMember: (memberId: string, memberName: string) => void
  onUnsuspendMember: (memberId: string, memberName: string) => void
  onDeleteMember: (memberId: string, memberName: string) => void
  isSuspending: boolean
  isUnsuspending: boolean
  isDeleting: boolean
}

const MembersTable = ({
  members,
  isLoading,
  currentUser,
  onViewMember,
  onEditMember,
  onSuspendMember,
  onUnsuspendMember,
  onDeleteMember,
  isSuspending,
  isUnsuspending,
  isDeleting,
}: MembersTableProps) => {
  // Helper function to check if user can suspend/delete a member
  const canManageMember = (member: Member): boolean => {
    if (!currentUser) return false
    
    // User cannot manage themselves
    if (member.id === currentUser.id) return false
    
    // Only super_admin can manage admins and super_admins
    if (member.role === 'admin' || member.role === 'super admin') {
      return currentUser.role === 'super_admin'
    }
    
    // Admins and super_admins can manage regular members
    return currentUser.role === 'admin' || currentUser.role === 'super_admin'
  }
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <i className="fa-solid fa-list text-primary mr-2"></i>
          Liste des membres
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Membre</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sessions</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
                </td>
              </tr>
            ) : members.length > 0 ? (
              members.map((member) => {
                const roleLabel = 
                  member.role === 'admin' 
                    ? 'Administrateur' 
                    : member.role === 'super admin' 
                    ? 'Super Admin' 
                    : member.role === 'guest'
                    ? 'Invité'
                    : 'Membre'
                const roleColor = member.role === 'admin' || member.role === 'super admin'
                  ? 'bg-gradient-to-r from-secondary to-orange-600 text-white'
                  : member.role === 'guest'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
                
                const avatarUrl = getMemberAvatarUrl(member)
                const initials = getMemberInitials(member)
                
                return (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-red-500 flex items-center justify-center text-white font-semibold text-sm mr-3">
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColor}`}>
                        {roleLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-gradient-to-r from-success to-emerald-500 text-white rounded-full text-xs font-medium">
                        {member.status === 'active' ? 'Actif' : member.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.sessionsCount || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onViewMember(member.id)}
                          className="text-accent hover:text-accent/80 transition-colors"
                          title="Voir"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        {canManageMember(member) && (
                          <>
                            <button
                              onClick={() => onEditMember(member)}
                              className="text-primary hover:text-primary/80 transition-colors"
                              title="Modifier"
                            >
                              <i className="fa-solid fa-edit"></i>
                            </button>
                            {member.status === 'suspended' ? (
                              <button
                                onClick={() => onUnsuspendMember(member.id, member.name)}
                                className="text-success hover:text-success/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Réactiver"
                                disabled={isUnsuspending}
                              >
                                <i className="fa-solid fa-play"></i>
                              </button>
                            ) : (
                              <button
                                onClick={() => onSuspendMember(member.id, member.name)}
                                className="text-warning hover:text-warning/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Suspendre"
                                disabled={isSuspending}
                              >
                                <i className="fa-solid fa-pause"></i>
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteMember(member.id, member.name)}
                              className="text-red-500 hover:text-red-600 transition-colors"
                              title="Supprimer"
                              disabled={isDeleting}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Aucun membre trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MembersTable

