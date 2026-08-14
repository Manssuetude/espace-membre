import { Link } from "react-router-dom";

const PastResourcesHeader = () => {
  return (
    <div className="flex items-center justify-end space-x-4 mb-6">
      <Link
        to="/admin/ressources"
        className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:border-primary/30 transition-all flex items-center"
      >
        <i className="fa-solid fa-arrow-left mr-2"></i>
        Ressources actuelles
      </Link>
      <button className="bg-gradient-to-r from-accent to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center">
        <i className="fa-solid fa-download mr-2"></i>
        Exporter
      </button>
    </div>
  );
};

export default PastResourcesHeader;
