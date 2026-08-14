interface SecurityButtonProps {
  title: string;
  subtitle: string;
  status?: "active" | "inactive";
  onClick: () => void;
  color?: "accent" | "success";
}

const SecurityButton = ({ title, subtitle, status, onClick, color = "accent" }: SecurityButtonProps) => {
  const colorClasses = {
    accent: "from-accent/10 to-blue-600/10 border-accent/20",
    success: "from-success/10 to-emerald-600/10 border-success/20",
  };

  const iconColorClass = color === "accent" ? "text-accent" : "text-success";

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 bg-gradient-to-r ${colorClasses[color]} border rounded-xl text-left hover:shadow-lg transition-all group`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className={`text-sm mt-1 ${status === "active" ? "text-success" : "text-gray-600"}`}>{subtitle}</p>
        </div>
        {status === "active" ? (
          <i className="fa-solid fa-check-circle text-success"></i>
        ) : (
          <i
            className={`fa-solid fa-chevron-right ${iconColorClass} group-hover:translate-x-1 transition-transform`}
          ></i>
        )}
      </div>
    </button>
  );
};

export default SecurityButton;
