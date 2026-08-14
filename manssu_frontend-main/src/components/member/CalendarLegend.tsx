const CalendarLegend = () => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Légende</h3>
      <div className="space-y-3">
        {[
          { color: "from-primary to-red-500", label: "Sessions à venir (inscrit)" },
          { color: "from-accent to-blue-600", label: "Sessions disponibles" },
          { color: "from-gray-300 to-gray-400", label: "Sessions passées" },
          { color: "from-secondary to-orange-600", label: "Sessions complètes" },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center space-x-3">
            <div className={`w-4 h-4 bg-gradient-to-br ${item.color} rounded shadow-sm`}></div>
            <span className="text-sm text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarLegend;
