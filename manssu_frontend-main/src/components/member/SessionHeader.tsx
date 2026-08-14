import { Link } from "react-router-dom";

const SessionHeader = () => {
  return (
    <div className="mb-4">
      <Link to="/sessions" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
        <i className="fa-solid fa-arrow-left mr-2"></i>
        Retour aux sessions
      </Link>
    </div>
  );
};

export default SessionHeader;
