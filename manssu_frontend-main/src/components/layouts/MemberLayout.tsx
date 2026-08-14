import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Tableau de bord", subtitle: "Bienvenue dans votre espace membre" },
  "/sessions": { title: "Sessions", subtitle: "Gérez vos sessions à venir et consultez l'historique" },
  "/sondages": { title: "Sondages", subtitle: "Participez aux sondages et consultez les résultats" },
  "/questionnaires": { title: "Questionnaires", subtitle: "Répondez à vos questionnaires et consultez vos réponses" },
  "/feedback": { title: "Feedback", subtitle: "Partagez vos commentaires et suggestions" },
  "/proposer-theme": { title: "Proposer un thème", subtitle: "Partagez vos idées pour les prochaines sessions" },
  "/ressources": { title: "Ressources", subtitle: "Accédez à toutes les ressources partagées" },
  "/profil": { title: "Mon Profil", subtitle: "Gérez vos informations personnelles" },
  "/association/valeurs": { title: "Valeurs", subtitle: "Les valeurs et principes de Manssuétude" },
  "/association/reglement": { title: "Règlement", subtitle: "Règlement intérieur de l'association" },
  "/association/membres": { title: "Membres", subtitle: "Annuaire des membres de l'association" },
  "/association/bibliotheque": { title: "Bibliothèque", subtitle: "Partage et emprunt de livres entre membres" },
};

// Helper to get page info for nested routes
const getPageInfo = (pathname: string) => {
  // Check exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }
  // Check for session detail
  if (pathname.startsWith("/sessions/")) {
    return { title: "Détail de la session", subtitle: "Informations détaillées sur la session" };
  }
  if (pathname.startsWith("/association/bibliotheque/books/")) {
    return { title: "Livre", subtitle: "Détails du livre et gestion des demandes" };
  }
  if (pathname.startsWith("/association/bibliotheque/loans/")) {
    return { title: "Prêt", subtitle: "Détails et cycle de prêt" };
  }
  // Default
  return { title: "Manssuétude", subtitle: "Espace membre" };
};

const MemberLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  const pageInfo = getPageInfo(pathname);

  return (
    <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 font-inter min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 min-h-screen">
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-8 pt-28 lg:pt-28">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MemberLayout;
