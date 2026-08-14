interface FeedbackCategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const FeedbackCategorySelector = ({ selectedCategory, onCategoryChange }: FeedbackCategorySelectorProps) => {
  const categories = [
    { value: "association", icon: "fa-heart", label: "Association", desc: "Organisation générale", color: "primary" },
    { value: "sessions", icon: "fa-calendar-days", label: "Sessions", desc: "Contenu et animation", color: "accent" },
    {
      value: "plateforme",
      icon: "fa-desktop",
      label: "Plateforme",
      desc: "Interface et fonctionnalités",
      color: "secondary",
    },
    { value: "autre", icon: "fa-ellipsis", label: "Autre", desc: "Suggestions diverses", color: "warning" },
  ];

  const getSelectedClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) {
      return "border-gray-200 hover:border-gray-300 bg-white";
    }

    switch (color) {
      case "primary":
        return "border-primary/50 bg-primary/5 shadow-md shadow-primary/10";
      case "accent":
        return "border-accent/50 bg-accent/5 shadow-md shadow-accent/10";
      case "secondary":
        return "border-secondary/50 bg-secondary/5 shadow-md shadow-secondary/10";
      case "warning":
        return "border-warning/50 bg-warning/5 shadow-md shadow-warning/10";
      default:
        return "border-gray-200 hover:border-gray-300 bg-white";
    }
  };

  const getIconColorClass = (color: string) => {
    switch (color) {
      case "primary":
        return "text-primary";
      case "accent":
        return "text-accent";
      case "secondary":
        return "text-secondary";
      case "warning":
        return "text-warning";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">Catégorie</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <label key={cat.value} className="relative cursor-pointer">
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={isSelected}
                className="sr-only"
                onChange={(e) => onCategoryChange(e.target.value)}
              />
              <div className={`p-4 border-2 rounded-xl transition-all ${getSelectedClasses(cat.color, isSelected)}`}>
                <div className="flex items-center">
                  <i className={`fa-solid ${cat.icon} ${getIconColorClass(cat.color)} text-lg mr-3`}></i>
                  <span className={`font-medium ${isSelected ? "text-gray-900" : "text-gray-900"}`}>{cat.label}</span>
                  {isSelected && <i className="fa-solid fa-check-circle ml-auto text-primary"></i>}
                </div>
                <p className="text-sm text-gray-600 mt-1">{cat.desc}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default FeedbackCategorySelector;
