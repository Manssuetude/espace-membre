import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const NotFound = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8 sm:p-12 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-exclamation-triangle text-red-600 text-3xl"></i>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Page non trouvée</h2>
        <p className="text-gray-600 mb-8">Désolé, la page que vous recherchez n'existe pas ou a été déplacée.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isAuthenticated ? (
            <>
              <Link
                to={user?.role === "admin" || user?.role === "super_admin" ? "/admin" : "/"}
                className="px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <i className="fa-solid fa-home mr-2"></i>
                Retour à l'accueil
              </Link>
              <Link
                to={user?.role === "admin" || user?.role === "super_admin" ? "/admin/sessions" : "/sessions"}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Retour
              </Link>
            </>
          ) : (
            <Link
              to="/auth/login"
              className="px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <i className="fa-solid fa-sign-in-alt mr-2"></i>
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
