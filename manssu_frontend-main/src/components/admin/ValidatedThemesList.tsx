interface ValidatedTheme {
  title: string
  proposedBy: string
  when: string
}

interface ValidatedThemesListProps {
  themes: ValidatedTheme[]
}

const ValidatedThemesList = ({ themes }: ValidatedThemesListProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
          <i className="fa-solid fa-check-circle text-success mr-2 sm:mr-3"></i>
          Thèmes validés
        </h3>
        <span className="bg-gradient-to-r from-success to-emerald-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium w-fit">
          {themes.length} thèmes
        </span>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {themes.length === 0 ? (
          <div className="text-center py-8">
            <i className="fa-solid fa-check-circle text-gray-300 text-4xl mb-3"></i>
            <p className="text-gray-500 text-sm">Aucun thème validé pour le moment</p>
          </div>
        ) : (
          themes.map((theme, idx) => (
            <div key={idx} className="p-3 sm:p-5 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-semibold text-gray-900 text-base sm:text-lg mb-2">{theme.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">
                    <span className="flex items-center">
                      <i className="fa-solid fa-user mr-2 text-accent"></i>
                      Proposé par: {theme.proposedBy}
                    </span>
                    <span className="flex items-center">
                      <i className="fa-solid fa-calendar mr-2 text-gray-400"></i>
                      {theme.when}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ValidatedThemesList

