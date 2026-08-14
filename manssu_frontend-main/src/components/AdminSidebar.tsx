import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import CollapsibleSection from './CollapsibleSection'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const AdminSidebar = ({ isOpen, onClose }: AdminSidebarProps) => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Déconnexion réussie')
    navigate('/auth/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Manssuétude" className="w-10 h-10 object-cover" />
              <div>
                <h2 className="text-xl font-bold text-white">Manssuétude</h2>
                <p className="text-sm text-gray-400">Tableau admin</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto mt-6">
          <div className="px-4 pb-4 space-y-1">
            {/* Tableau de bord - standalone */}
            <NavLink
              to="/admin"
              end
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl mb-2 transition-all ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-primary to-red-500 font-medium shadow-lg shadow-red-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`
              }
            >
              <i className="fa-solid fa-chart-pie w-5 mr-3"></i>
              Tableau de bord
            </NavLink>

            {/* Activités - section repliable */}
            <CollapsibleSection title="Activités" icon="fa-calendar-check">
              <NavLink
                to="/admin/sessions"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-primary to-red-500 font-medium shadow-lg shadow-red-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`
                }
              >
                <i className="fa-solid fa-calendar-days w-4 mr-2"></i>
                Sessions
              </NavLink>
              <NavLink
                to="/admin/sondages"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-primary to-red-500 font-medium shadow-lg shadow-red-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`
                }
              >
                <i className="fa-solid fa-square-poll-vertical w-4 mr-2"></i>
                Sondages
              </NavLink>
              <NavLink
                to="/admin/questionnaires"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-primary to-red-500 font-medium shadow-lg shadow-red-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`
                }
              >
                <i className="fa-solid fa-clipboard-list w-4 mr-2"></i>
                Questionnaires
              </NavLink>
              <NavLink
                to="/admin/activites/formats"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-primary to-red-500 font-medium shadow-lg shadow-red-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`
                }
              >
                <i className="fa-solid fa-shapes w-4 mr-2"></i>
                Formats
              </NavLink>
            </CollapsibleSection>

            {/* Contenus - section repliable */}
            <CollapsibleSection title="Contenus" icon="fa-folder-open">
              <NavLink
                to="/admin/themes"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-primary to-red-500 font-medium shadow-lg shadow-red-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`
                }
              >
                <i className="fa-solid fa-lightbulb w-4 mr-2"></i>
                Thèmes
              </NavLink>
              <NavLink
                to="/admin/ressources"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-primary to-red-500 font-medium shadow-lg shadow-red-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`
                }
              >
                <i className="fa-solid fa-file w-4 mr-2"></i>
                Ressources
              </NavLink>
            </CollapsibleSection>

            {/* Association - section repliable */}
            <CollapsibleSection title="Association" icon="fa-users">
              <NavLink
                to="/admin/membres"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-primary to-red-500 font-medium shadow-lg shadow-red-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`
                }
              >
                <i className="fa-solid fa-users w-4 mr-2"></i>
                Membres
              </NavLink>
              <NavLink
                to="/admin/commissions"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-primary to-red-500 font-medium shadow-lg shadow-red-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`
                }
              >
                <i className="fa-solid fa-people-group w-4 mr-2"></i>
                Commissions
              </NavLink>
            </CollapsibleSection>

            {/* Feedbacks - standalone */}
            <NavLink
              to="/admin/feedbacks"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl mb-2 transition-all ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-primary to-red-500 font-medium shadow-lg shadow-red-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`
              }
            >
              <i className="fa-solid fa-comment-dots w-5 mr-3"></i>
              Feedbacks
            </NavLink>
          </div>
        </nav>

          <div className="px-4 pb-4 border-t border-gray-700 pt-4 flex-shrink-0 space-y-2">
            <NavLink
              to="/"
              onClick={onClose}
              className="flex items-center px-4 py-3 rounded-xl transition-all text-gray-300 hover:text-white hover:bg-gray-700/50 bg-gradient-to-r from-accent/20 to-blue-600/20 border border-accent/30"
            >
              <i className="fa-solid fa-user w-5 mr-3"></i>
              Espace Membre
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 rounded-xl transition-all text-gray-300 hover:text-white hover:bg-red-600/20 border border-red-600/30"
            >
              <i className="fa-solid fa-sign-out-alt w-5 mr-3"></i>
              Se déconnecter
            </button>
          </div>
      </div>
    </>
  )
}

export default AdminSidebar

