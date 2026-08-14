const ThemeStatsSidebar = () => {
  const stats = [
    { icon: "fa-lightbulb", label: "Total propositions", value: "42", color: "accent" },
    { icon: "fa-check-circle", label: "Validées", value: "38", color: "success" },
    { icon: "fa-clock", label: "En attente", value: "4", color: "warning" },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
      <div className="space-y-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl"
          >
            <div className="flex items-center">
              <div className={`w-10 h-10 bg-${stat.color}/10 rounded-lg flex items-center justify-center mr-3`}>
                <i className={`fa-solid ${stat.icon} text-${stat.color}`}></i>
              </div>
              <span className="text-sm text-gray-700">{stat.label}</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeStatsSidebar;
