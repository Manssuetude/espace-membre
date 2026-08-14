import { useState } from 'react'
import { useMembers } from '../../services/hooks/useMembers'
import { getMemberAvatarUrl, getMemberInitials } from '../../utils/userUtils'
import Dropdown from '../../components/Dropdown'
import Pagination from '../../components/Pagination'

const Membres = () => {
  const [roleFilter, setRoleFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12)

  const { data: membersData, isLoading } = useMembers({
    search: searchQuery || undefined,
    page: currentPage,
    limit: pageSize,
  })

  // Filter members by role on client side
  const members = (membersData?.data || []).filter((member) => {
    if (roleFilter === 'all') return true
    if (roleFilter === 'member') return member.role === 'member'
    if (roleFilter === 'admins') return member.role === 'admin'
    if (roleFilter === 'super admins') return member.role === 'super admin'
    return true
  })

  // Reset to page 1 when filters change
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value)
    setCurrentPage(1)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur'
      case 'super admin':
        return 'Super Admin'
      case 'guest':
        return 'Invité'
      default:
        return 'Membre'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'super admin':
        return 'bg-gradient-to-r from-secondary to-orange-600 text-white'
      case 'guest':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <Dropdown
              value={roleFilter}
              onChange={handleRoleFilterChange}
              options={[
                { value: 'all', label: 'Tous les rôles' },
                { value: 'member', label: 'Membres' },
                { value: 'admins', label: 'Administrateurs' },
                { value: 'super admins', label: 'Super administrateurs' },
              ]}
              className="min-w-[180px]"
            />
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <i className="fa-solid fa-users text-primary mr-2"></i>
            Liste des membres
          </h3>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
            </div>
          ) : members.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {members.map((member) => {
                  const avatarUrl = getMemberAvatarUrl(member)
                  const initials = getMemberInitials(member)
                  const memberSince = new Date(member.memberSince).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                  })

                  return (
                    <div
                      key={member.id}
                      className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary/30 transition-all duration-300 p-6 group"
                    >
                      <div className="flex flex-col items-center text-center space-y-4">
                        {/* Avatar */}
                        <div className="relative">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={member.name}
                              className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100 group-hover:ring-primary/20 transition-all"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-red-500 flex items-center justify-center text-white font-bold text-2xl ring-4 ring-gray-100 group-hover:ring-primary/20 transition-all shadow-lg">
                              {initials}
                            </div>
                          )}
                          {(member.role === 'admin' || member.role === 'super admin') && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                              <i className="fa-solid fa-crown text-white text-xs"></i>
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <div className="flex-1 w-full">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-primary transition-colors">
                            {member.name}
                          </h3>
                          <p className="text-sm text-gray-500 mb-3 truncate" title={member.email}>
                            {member.email}
                          </p>
                        </div>

                        {/* Role Badge */}
                        <div className="w-full">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}
                          >
                            {getRoleLabel(member.role)}
                          </span>
                        </div>

                        {/* Member Since */}
                        <div className="w-full pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                            <i className="fa-solid fa-calendar-check"></i>
                            <span>Membre depuis {memberSince}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <i className="fa-solid fa-users text-4xl text-gray-400 mb-4"></i>
                <p className="text-gray-600">Aucun membre trouvé</p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {membersData && membersData.totalPages > 1 && (
          <div className="px-6 pb-6">
            <Pagination
              currentPage={membersData.page}
              totalPages={membersData.totalPages}
              total={membersData.total}
              limit={membersData.limit}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Membres
