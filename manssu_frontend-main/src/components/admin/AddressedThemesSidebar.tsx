import { Link } from "react-router-dom";

interface AddressedTheme {
  title: string;
  lastSession: string;
  nextSession: string;
  sessions: number;
}

interface AddressedThemesSidebarProps {
  themes: AddressedTheme[];
}

const AddressedThemesSidebar = ({ themes }: AddressedThemesSidebarProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <i className="fa-solid fa-list-check text-primary mr-2"></i>
        Thèmes abordés
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {themes.length === 0 ? (
          <div className="text-center py-6">
            <i className="fa-solid fa-list-check text-gray-300 text-3xl mb-2"></i>
            <p className="text-gray-500 text-xs sm:text-sm">Aucun thème abordé pour le moment</p>
          </div>
        ) : (
          themes.map((theme, idx) => (
            <div
              key={idx}
              className="p-3 sm:p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all"
            >
              <h4 className="font-medium text-gray-900 text-xs sm:text-sm mb-2">{theme.title}</h4>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600 mb-3">
                <span className="flex items-center">
                  <i className="fa-solid fa-calendar-check mr-1.5 text-accent"></i>
                  {theme.sessions} session{theme.sessions > 1 ? "s" : ""}
                </span>
                {theme.nextSession && theme.nextSession !== "N/A" && (
                  <span className="flex items-center">
                    <i className="fa-solid fa-calendar-plus mr-1.5 text-primary"></i>
                    Prochaine session: {theme.nextSession}
                  </span>
                )}
                {theme.lastSession && theme.lastSession !== "N/A" && (
                  <span className="flex items-center">
                    <i className="fa-solid fa-calendar mr-1.5 text-gray-400"></i>
                    Dernière session: {theme.lastSession}
                  </span>
                )}
              </div>
              <Link
                to={`/admin/sessions?search=${encodeURIComponent(theme.title)}`}
                className="w-full px-3 sm:px-4 py-2 bg-gradient-to-r from-accent to-blue-600 text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-medium flex items-center justify-center"
              >
                <i className="fa-solid fa-eye mr-2"></i>
                Voir sessions
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AddressedThemesSidebar;
