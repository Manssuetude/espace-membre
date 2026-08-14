interface PollStatsSidebarProps {
  totalResponses: number;
  totalMembers: number;
  participation: number;
  activeMembers: number;
  inactiveMembers: number;
}

const PollStatsSidebar = ({
  totalResponses,
  totalMembers,
  participation,
  activeMembers,
  inactiveMembers,
}: PollStatsSidebarProps) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques de participation</h3>
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-accent mb-1">{totalResponses}</div>
          <div className="text-sm text-gray-600">Réponses reçues</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-accent to-blue-600 h-3 rounded-full"
            style={{ width: `${Math.round(participation)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{Math.round(participation)}% de participation</span>
          <span>
            {totalResponses}/{totalMembers} membres
          </span>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Membres actifs</span>
            <span className="font-semibold text-gray-900">{activeMembers}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Membres inactifs</span>
            <span className="font-semibold text-gray-900">{inactiveMembers}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total membres</span>
            <span className="font-semibold text-gray-900">{totalMembers}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollStatsSidebar;
