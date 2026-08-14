interface FeedbackTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

const FeedbackTypeSelector = ({ selectedType, onTypeChange }: FeedbackTypeSelectorProps) => {
  const types = [
    { value: "suggestion", label: "Suggestion", color: "accent" },
    { value: "probleme", label: "Problème", color: "primary" },
    { value: "compliment", label: "Compliment", color: "success" },
  ];

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">Type de feedback</label>
      <div className="flex flex-wrap gap-4">
        {types.map((type) => (
          <label key={type.value} className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="type"
              value={type.value}
              className={`text-${type.color} focus:ring-${type.color}`}
              checked={selectedType === type.value}
              onChange={(e) => onTypeChange(e.target.value)}
            />
            <span className="ml-2 text-gray-700">{type.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default FeedbackTypeSelector;
