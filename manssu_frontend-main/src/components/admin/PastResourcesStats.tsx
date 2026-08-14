interface PastResourcesStatsProps {
  totalSessions: number;
  totalResources: number;
}

const PastResourcesStats = ({ totalSessions, totalResources }: PastResourcesStatsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/50 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-600 text-sm font-medium">Sessions réalisées</p>
            <p className="text-3xl font-bold text-blue-900">{totalSessions}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-calendar-check text-white text-xl"></i>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200/50 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-600 text-sm font-medium">Total ressources</p>
            <p className="text-3xl font-bold text-green-900">{totalResources}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-folder text-white text-xl"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PastResourcesStats;
