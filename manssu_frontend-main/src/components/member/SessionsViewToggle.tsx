interface SessionsViewToggleProps {
  view: "list" | "calendar";
  onViewChange: (view: "list" | "calendar") => void;
}

const SessionsViewToggle = ({ view, onViewChange }: SessionsViewToggleProps) => {
  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={() => onViewChange("list")}
        className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
          view === "list"
            ? "bg-gradient-to-r from-primary to-red-500 text-white shadow-lg shadow-primary/30"
            : "bg-white text-gray-700 border border-gray-200 hover:border-primary/30"
        }`}
      >
        <i className="fa-solid fa-list mr-2"></i>
        Liste
      </button>
      <button
        onClick={() => onViewChange("calendar")}
        className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
          view === "calendar"
            ? "bg-gradient-to-r from-primary to-red-500 text-white shadow-lg shadow-primary/30"
            : "bg-white text-gray-700 border border-gray-200 hover:border-primary/30"
        }`}
      >
        <i className="fa-solid fa-calendar mr-2"></i>
        Calendrier
      </button>
    </div>
  );
};

export default SessionsViewToggle;
