import Dropdown from "../Dropdown";

interface PastResourcesFiltersProps {
  yearFilter: string;
  monthFilter: string;
  typeFilter: string;
  onYearFilterChange: (value: string) => void;
  onMonthFilterChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  availableYears: string[];
}

const PastResourcesFilters = ({
  yearFilter,
  monthFilter,
  typeFilter,
  onYearFilterChange,
  onMonthFilterChange,
  onTypeFilterChange,
  searchTerm,
  onSearchChange,
  availableYears,
}: PastResourcesFiltersProps) => {
  const monthOptions = [
    { value: "all", label: "Tous les mois" },
    { value: "january", label: "Janvier" },
    { value: "february", label: "Février" },
    { value: "march", label: "Mars" },
    { value: "april", label: "Avril" },
    { value: "may", label: "Mai" },
    { value: "june", label: "Juin" },
    { value: "july", label: "Juillet" },
    { value: "august", label: "Août" },
    { value: "september", label: "Septembre" },
    { value: "october", label: "Octobre" },
    { value: "november", label: "Novembre" },
    { value: "december", label: "Décembre" },
  ];

  const yearOptions = [
    { value: "all", label: "Toutes les années" },
    ...availableYears.map((year) => ({ value: year, label: year })),
  ];

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtres et recherche</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher une session..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
            />
            <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
        <Dropdown
          label=""
          value={yearFilter}
          onChange={(e) => onYearFilterChange(e.target.value)}
          options={yearOptions}
        />
        <Dropdown
          label=""
          value={monthFilter}
          onChange={(e) => onMonthFilterChange(e.target.value)}
          options={monthOptions}
        />
        <Dropdown
          label=""
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

export default PastResourcesFilters;
