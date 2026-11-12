import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useIsAwardManager } from "../services/hooks/useAwards";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "member" | "admin";
  /** Also admits a non-admin Awards manager (Vie asso) on an admin-gated route. */
  allowAwardManager?: boolean;
}

const ProtectedRoute = ({ children, requiredRole, allowAwardManager }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const { data: isManager, isLoading: isManagerLoading } = useIsAwardManager({
    enabled: !!allowAwardManager && isAuthenticated && !isAdmin,
  });

  if (isLoading || (requiredRole === "admin" && allowAwardManager && !isAdmin && isManagerLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requiredRole === "admin") {
    const permitted = isAdmin || (allowAwardManager && isManager);
    if (!permitted) {
      return <Navigate to="/" replace />;
    }
  }
  // requiredRole === "member": all authenticated users (members, admins, super_admins, guests) pass.

  return <>{children}</>;
};

export default ProtectedRoute;
