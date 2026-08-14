import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MemberLayout from "./components/layouts/MemberLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import BlockGuestRoute from "./components/BlockGuestRoute";
import Login from "./pages/auth/Login";
import VerifyOTP from "./pages/auth/VerifyOTP";
import InvitationPage from "./pages/auth/InvitationPage";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/member/Dashboard";
import Sessions from "./pages/member/Sessions";
import SessionDetail from "./pages/member/SessionDetail";
import Sondages from "./pages/member/Sondages";
import Feedback from "./pages/member/Feedback";
import ProposerTheme from "./pages/member/ProposerTheme";
import Ressources from "./pages/member/Ressources";
import Profil from "./pages/member/Profil";
import MemberQuestionnaires from "./pages/member/Questionnaires";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSessions from "./pages/admin/Sessions";
import AdminSessionDetail from "./pages/admin/SessionDetail";
import CreateSession from "./pages/admin/CreateSession";
import AdminSondages from "./pages/admin/Sondages";
import SondageDetail from "./pages/admin/SondageDetail";
import CreateSondage from "./pages/admin/CreateSondage";
import Themes from "./pages/admin/Themes";
import AdminRessources from "./pages/admin/Ressources";
import PastResources from "./pages/admin/PastResources";
import AddResource from "./pages/admin/AddResource";
import Membres from "./pages/admin/Membres";
import MemberDetail from "./pages/admin/MemberDetail";
import Feedbacks from "./pages/admin/Feedbacks";
import Valeurs from "./pages/member/Valeurs";
import Reglement from "./pages/member/Reglement";
import MembresPage from "./pages/member/Membres";
import MemberFormats from "./pages/member/Formats";
import AdminFormats from "./pages/admin/Formats";
import QuestionnaireDetail from "./pages/member/QuestionnaireDetail";
import UnansweredQuestionnairesModal from "./components/UnansweredQuestionnairesModal";
import SuspendedUserModal from "./components/SuspendedUserModal";
import Questionnaires from "./pages/admin/Questionnaires";
import QuestionnaireResponses from "./pages/admin/QuestionnaireResponses";
import MemberCommissions from "./pages/member/Commissions";
import MemberCommissionDetail from "./pages/member/CommissionDetail";
import Bibliotheque from "./pages/member/Bibliotheque";
import BibliothequeBookDetail from "./pages/member/BibliothequeBookDetail";
import BibliothequeLoanDetail from "./pages/member/BibliothequeLoanDetail";
import AdminCommissions from "./pages/admin/Commissions";
import AdminCommissionDetail from "./pages/admin/CommissionDetail";

function App() {
  return (
    <Router>
      <UnansweredQuestionnairesModal />
      <SuspendedUserModal />
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/verify-otp" element={<VerifyOTP />} />
        <Route path="/invitation/:code" element={<InvitationPage />} />

        {/* Redirect /themes to /proposer-theme */}
        <Route
          path="/themes"
          element={
            <ProtectedRoute requiredRole="member">
              <BlockGuestRoute>
                <Navigate to="/proposer-theme" replace />
              </BlockGuestRoute>
            </ProtectedRoute>
          }
        />

        {/* Member Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute requiredRole="member">
              <MemberLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <BlockGuestRoute>
                <Dashboard />
              </BlockGuestRoute>
            }
          />
          <Route path="sessions" element={<Sessions />} />
          <Route path="sessions/:id" element={<SessionDetail />} />
          <Route
            path="sondages"
            element={
              <BlockGuestRoute>
                <Sondages />
              </BlockGuestRoute>
            }
          />
          <Route
            path="questionnaires"
            element={
              <BlockGuestRoute>
                <MemberQuestionnaires />
              </BlockGuestRoute>
            }
          />
          <Route
            path="feedback"
            element={
              <BlockGuestRoute>
                <Feedback />
              </BlockGuestRoute>
            }
          />
          <Route
            path="proposer-theme"
            element={
              <BlockGuestRoute>
                <ProposerTheme />
              </BlockGuestRoute>
            }
          />
          <Route path="ressources" element={<Ressources />} />
          <Route path="profil" element={<Profil />} />
          <Route path="formats" element={<MemberFormats />} />
          {/* Association routes */}
          <Route path="association/valeurs" element={<Valeurs />} />
          <Route path="association/reglement" element={<Reglement />} />
          <Route path="association/membres" element={<MembresPage />} />
          <Route path="association/commissions" element={<MemberCommissions />} />
          <Route path="association/commissions/:id" element={<MemberCommissionDetail />} />
          <Route
            path="association/bibliotheque"
            element={
              <BlockGuestRoute>
                <Bibliotheque />
              </BlockGuestRoute>
            }
          />
          <Route
            path="association/bibliotheque/books/:id"
            element={
              <BlockGuestRoute>
                <BibliothequeBookDetail />
              </BlockGuestRoute>
            }
          />
          <Route
            path="association/bibliotheque/loans/:id"
            element={
              <BlockGuestRoute>
                <BibliothequeLoanDetail />
              </BlockGuestRoute>
            }
          />
          <Route
            path="questionnaires/:id"
            element={
              <BlockGuestRoute>
                <QuestionnaireDetail />
              </BlockGuestRoute>
            }
          />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="sessions" element={<AdminSessions />} />
          <Route path="sessions/create" element={<CreateSession />} />
          <Route path="sessions/:id" element={<AdminSessionDetail />} />
          <Route path="sondages" element={<AdminSondages />} />
          <Route path="sondages/create" element={<CreateSondage />} />
          <Route path="sondages/:id" element={<SondageDetail />} />
          <Route path="themes" element={<Themes />} />
          <Route path="ressources" element={<AdminRessources />} />
          <Route path="ressources/past" element={<PastResources />} />
          <Route path="ressources/add" element={<AddResource />} />
          <Route path="membres" element={<Membres />} />
          <Route path="membres/:id" element={<MemberDetail />} />
          <Route path="feedbacks" element={<Feedbacks />} />
          {/* Activités routes */}
          <Route path="activites/formats" element={<AdminFormats />} />
          <Route path="questionnaires" element={<Questionnaires />} />
          <Route path="questionnaires/:id/responses" element={<QuestionnaireResponses />} />
          <Route path="commissions" element={<AdminCommissions />} />
          <Route path="commissions/:id" element={<AdminCommissionDetail />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
