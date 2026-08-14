interface ResourcesSearchProps {
  onProposeClick: () => void;
}

const ResourcesSearch = ({ onProposeClick }: ResourcesSearchProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-80">
          <input
            type="text"
            placeholder="Rechercher une ressource..."
            className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>
      <button
        onClick={onProposeClick}
        className="px-6 py-2.5 bg-gradient-to-r from-primary to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center"
      >
        <i className="fa-solid fa-plus mr-2"></i>
        Proposer une ressource
      </button>
    </div>
  );
};

export default ResourcesSearch;
