import { useMembers } from "../../services/hooks/useMembers";

const MembersStats = () => {
  const { data: membersData, isLoading } = useMembers();

  const stats = membersData?.stats || {
    totalMembers: 0,
    activeMembers: 0,
    administrators: 0,
    inactive: 0,
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse"
          >
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all group">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Total membres</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-red-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-users text-primary text-2xl"></i>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-success/20 transition-all group">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Membres actifs</p>
            <p className="text-3xl font-bold text-gray-900">{stats.activeMembers}</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-success/10 to-emerald-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-user-check text-success text-2xl"></i>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-secondary/20 transition-all group">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Administrateurs</p>
            <p className="text-3xl font-bold text-gray-900">{stats.administrators}</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-secondary/10 to-orange-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-user-shield text-secondary text-2xl"></i>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-warning/20 transition-all group">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Inactifs</p>
            <p className="text-3xl font-bold text-gray-900">{stats.inactive}</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-warning/10 to-yellow-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-user-slash text-warning text-2xl"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersStats;
