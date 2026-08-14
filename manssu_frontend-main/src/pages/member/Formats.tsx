import { useNavigate } from "react-router-dom";
import { useActivityTemplates } from "../../services/hooks/useActivityTemplates";
import { ActivityTemplate } from "../../types/format";

// Helper to convert Tailwind gradient class to display format
const getGradientClass = (color?: string): string => {
  if (!color) return "bg-gradient-to-br from-gray-400 to-gray-500";
  // If it's already a Tailwind class, use it
  if (color.startsWith("from-")) {
    return `bg-gradient-to-br ${color}`;
  }
  // Otherwise, it might be a hex color or other format - use a default
  return "bg-gradient-to-br from-gray-400 to-gray-500";
};

const Formats = () => {
  const navigate = useNavigate();
  const { data: templatesData, isLoading, error } = useActivityTemplates({ limit: 100 });

  const templates = templatesData?.data || [];

  const formatDuration = (duration?: string) => {
    if (!duration) return "N/A";
    return duration;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <p className="text-gray-600">Erreur lors du chargement des formats</p>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <i className="fa-solid fa-shapes text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">Aucun format trouvé</p>
          </div>
        </div>
        <div className="flex justify-center pt-8">
          <button
            onClick={() => navigate("/feedback")}
            className="px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all font-medium flex items-center gap-2"
          >
            <i className="fa-solid fa-lightbulb"></i>
            Une suggestion?
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template: ActivityTemplate) => {
          const gradientClass = getGradientClass(template.color);
          // Handle icon format - API might return with or without "fa-" prefix
          const iconClass = template.icon
            ? template.icon.startsWith("fa-")
              ? template.icon
              : `fa-${template.icon}`
            : "fa-question-circle";

          return (
            <div
              key={template.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
            >
              {/* Header with gradient */}
              <div className={`${gradientClass} p-6 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    {template.icon && (
                      <div
                        className={`w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        <i className={`fa-solid ${iconClass} text-3xl text-white`}></i>
                      </div>
                    )}
                    {template.duration && (
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/30">
                        <span className="text-white text-sm font-medium flex items-center gap-1.5">
                          <i className="fa-solid fa-clock text-xs"></i>
                          {formatDuration(template.duration)}
                        </span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{template.title}</h2>
                  {template.description && (
                    <p className="text-white/90 text-sm leading-relaxed mt-2">{template.description}</p>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="space-y-6 flex-1">
                  {/* Rules */}
                  {template.rules && template.rules.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <i className="fa-solid fa-list-check text-primary"></i>
                        Règles spécifiques
                      </h3>
                      <ul className="space-y-2">
                        {template.rules.map((rule, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <i className={`fa-solid fa-circle-check text-green-600 mt-1 text-xs flex-shrink-0`}></i>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Examples */}
                  {template.examples && template.examples.length > 0 && (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-lightbulb text-yellow-500"></i>
                        Exemples de thèmes
                      </h3>
                      <ul className="space-y-1.5">
                        {template.examples.map((example, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                            <i className="fa-solid fa-arrow-right text-primary mt-0.5 text-xs"></i>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestion Button */}
      <div className="flex justify-center pt-8">
        <button
          onClick={() => navigate("/feedback")}
          className="px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all font-medium flex items-center gap-2"
        >
          <i className="fa-solid fa-lightbulb"></i>
          Une suggestion?
        </button>
      </div>
    </div>
  );
};

export default Formats;
