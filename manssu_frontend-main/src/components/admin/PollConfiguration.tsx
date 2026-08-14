interface PollConfigurationProps {
  startDate: string;
  endDate: string;
  visibility: string;
  anonymous?: boolean;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onVisibilityChange: (value: string) => void;
  onAnonymousChange?: (value: boolean) => void;
}

const PollConfiguration = ({
  startDate,
  endDate,
  visibility,
  anonymous = false,
  onStartDateChange,
  onEndDateChange,
  onVisibilityChange,
  onAnonymousChange,
}: PollConfigurationProps) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-accent to-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
          3
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Configuration</h2>
          <p className="text-gray-600 text-sm">Paramètres avancés et options de publication</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Timing Settings */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fa-solid fa-clock text-accent mr-2"></i>
            Paramètres temporels
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Date de début *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Date de clôture</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Visibility Settings */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fa-solid fa-eye text-accent mr-2"></i>
            Visibilité des résultats
          </h3>
          <div className="space-y-4">
            <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-white transition-all">
              <input
                type="radio"
                name="visibility"
                value="realtime"
                checked={visibility === "realtime"}
                onChange={(e) => onVisibilityChange(e.target.value)}
                className="mt-1"
              />
              <div>
                <p className="font-semibold text-gray-900">Visibles en temps réel</p>
                <p className="text-sm text-gray-600">Les participants peuvent voir les résultats pendant le sondage</p>
              </div>
            </label>
            <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-white transition-all">
              <input
                type="radio"
                name="visibility"
                value="hidden"
                checked={visibility === "hidden"}
                onChange={(e) => onVisibilityChange(e.target.value)}
                className="mt-1"
              />
              <div>
                <p className="font-semibold text-gray-900">Masqués jusqu'à la fin</p>
                <p className="text-sm text-gray-600">Les résultats sont révélés uniquement après la clôture</p>
              </div>
            </label>
          </div>
        </div>

        {/* Anonymous Settings */}
        {onAnonymousChange && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fa-solid fa-user-secret text-accent mr-2"></i>
              Confidentialité
            </h3>
            <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-white transition-all">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => onAnonymousChange(e.target.checked)}
                className="mt-1"
              />
              <div>
                <p className="font-semibold text-gray-900">Sondage anonyme</p>
                <p className="text-sm text-gray-600">
                  Les votes seront anonymes et les noms des participants ne seront pas affichés
                </p>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollConfiguration;
