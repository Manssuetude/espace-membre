import Dropdown from "../Dropdown";

interface ResourcesFiltersProps {
  statusFilter: string;
  typeFilter: string;
  onStatusFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
}

const ResourcesFilters = ({
  statusFilter,
  typeFilter,
  onStatusFilterChange,
  onTypeFilterChange,
}: ResourcesFiltersProps) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtres et recherche</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher une ressource..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>
        <Dropdown
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          options={[
            { value: "all", label: "Tous les statuts" },
            { value: "pending", label: "En attente" },
            { value: "validated", label: "Validé" },
            { value: "rejected", label: "Rejeté" },
          ]}
        />
        <Dropdown
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          options={[
            { value: "all", label: "Tous les types" },
            { value: "pdf", label: "PDF" },
            { value: "video", label: "Vidéo" },
            { value: "audio", label: "Audio" },
            { value: "link", label: "Lien" },
          ]}
        />
      </div>
    </div>
  );
};

export default ResourcesFilters;
