interface Resource {
  title: string;
  type: string;
  size: string;
  icon: string;
  color: string;
  description: string | null;
  link: string;
}

interface PastResourcesSessionCardProps {
  session: {
    id: string;
    title: string;
    date: string;
    participants: number;
    resourcesCount: number;
    icon: string;
    color: string;
    resources: Resource[];
  };
}

const PastResourcesSessionCard = ({ session }: PastResourcesSessionCardProps) => {
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; border: string; icon: string; text: string } } = {
      red: {
        bg: "from-red-50 to-pink-50",
        border: "border-red-200/50",
        icon: "text-red-600",
        text: "text-red-600",
      },
      blue: {
        bg: "from-blue-50 to-indigo-50",
        border: "border-blue-200/50",
        icon: "text-blue-600",
        text: "text-blue-600",
      },
      purple: {
        bg: "from-purple-50 to-violet-50",
        border: "border-purple-200/50",
        icon: "text-purple-600",
        text: "text-purple-600",
      },
      green: {
        bg: "from-green-50 to-emerald-50",
        border: "border-green-200/50",
        icon: "text-green-600",
        text: "text-green-600",
      },
      yellow: {
        bg: "from-yellow-50 to-orange-50",
        border: "border-yellow-200/50",
        icon: "text-yellow-600",
        text: "text-yellow-600",
      },
      orange: {
        bg: "from-orange-50 to-red-50",
        border: "border-orange-200/50",
        icon: "text-orange-600",
        text: "text-orange-600",
      },
      indigo: {
        bg: "from-indigo-50 to-blue-50",
        border: "border-indigo-200/50",
        icon: "text-indigo-600",
        text: "text-indigo-600",
      },
      pink: {
        bg: "from-pink-50 to-rose-50",
        border: "border-pink-200/50",
        icon: "text-pink-600",
        text: "text-pink-600",
      },
    };
    return colorMap[color] || colorMap.blue;
  };

  const getSessionColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; badge: string; text: string } } = {
      green: {
        bg: "from-green-500 to-emerald-600",
        badge: "from-green-100 to-emerald-100 text-green-800",
        text: "text-green-600",
      },
      orange: {
        bg: "from-orange-500 to-red-600",
        badge: "from-orange-100 to-red-100 text-orange-800",
        text: "text-orange-600",
      },
      purple: {
        bg: "from-purple-500 to-violet-600",
        badge: "from-purple-100 to-violet-100 text-purple-800",
        text: "text-purple-600",
      },
    };
    return colorMap[color] || colorMap.green;
  };

  const sessionColors = getSessionColorClasses(session.color);

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{session.title}</h3>
          <p className="text-gray-600">
            {session.date} • {session.participants} participants
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`bg-gradient-to-r ${sessionColors.badge} px-3 py-1 rounded-full text-sm font-medium`}>
            {session.resourcesCount} ressources
          </span>
          <button className="text-gray-500 hover:text-gray-700">
            <i className="fa-solid fa-chevron-down"></i>
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-2 ${session.resources.length === 3 ? "lg:grid-cols-3" : ""} gap-4`}>
        {session.resources.map((resource, idx) => {
          const colors = getColorClasses(resource.color);
          return (
            <div
              key={idx}
              className={`p-4 bg-gradient-to-r ${colors.bg} rounded-xl border ${colors.border} hover:shadow-md transition-all`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${
                    resource.color === "red"
                      ? "from-red-100 to-red-200"
                      : resource.color === "blue"
                        ? "from-blue-100 to-blue-200"
                        : resource.color === "purple"
                          ? "from-purple-100 to-purple-200"
                          : resource.color === "green"
                            ? "from-green-100 to-green-200"
                            : resource.color === "yellow"
                              ? "from-yellow-100 to-yellow-200"
                              : resource.color === "indigo"
                                ? "from-indigo-100 to-indigo-200"
                                : "from-pink-100 to-pink-200"
                  } rounded-lg flex items-center justify-center`}
                >
                  <i className={`fa-solid ${resource.icon} ${colors.icon}`}></i>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">{resource.title}</h5>
                  <p className="text-xs text-gray-500">
                    {resource.description ? resource.description : `${resource.type} • ${resource.size}`}
                  </p>
                </div>
              </div>
              <div className="flex justify-end items-center">
                <a
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <i className="fa-solid fa-eye"></i>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PastResourcesSessionCard;
