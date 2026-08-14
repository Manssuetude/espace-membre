import Dropdown from '../Dropdown'

interface MembersFiltersProps {
  searchQuery: string
  roleFilter: string
  onSearchChange: (value: string) => void
  onRoleFilterChange: (value: string) => void
  onAddClick: () => void
}

const MembersFilters = ({
  searchQuery,
  roleFilter,
  onSearchChange,
  onRoleFilterChange,
  onAddClick,
}: MembersFiltersProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <Dropdown
            value={roleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            options={[
              { value: 'all', label: 'Tous les rôles' },
              { value: 'member', label: 'Membres' },
              { value: 'admins', label: 'Administrateurs' },
              { value: 'super admins', label: 'Super administrateurs' },
            ]}
            className="min-w-[180px]"
          />
        </div>
        <button
          onClick={onAddClick}
          className="bg-gradient-to-r from-primary to-red-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
        >
          <i className="fa-solid fa-user-plus mr-2"></i>
          Ajouter un membre
        </button>
      </div>
    </div>
  )
}

export default MembersFilters

