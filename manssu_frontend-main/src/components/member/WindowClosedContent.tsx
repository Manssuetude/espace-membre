import { Link } from "react-router-dom";

const WindowClosedContent = () => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-12 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
        <i className="fa-solid fa-clock text-gray-400 text-3xl"></i>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">Propositions temporairement fermées</h3>
      <p className="text-gray-600 mb-6 max-w-lg mx-auto leading-relaxed">
        La fenêtre de propositions pour la prochaine session est actuellement fermée.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <Link
          to="/sessions"
          className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold rounded-xl hover:shadow-md transition-all flex items-center justify-center"
        >
          <i className="fa-solid fa-calendar mr-2"></i>
          Voir les sessions
        </Link>
        <Link
          to="/feedback"
          className="px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center"
        >
          <i className="fa-solid fa-comment-dots mr-2"></i>
          Envoyer un feedback
        </Link>
      </div>
    </div>
  );
};

export default WindowClosedContent;
