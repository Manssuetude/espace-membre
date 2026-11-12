import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { useProfile, useUpdateProfile } from "../../services/hooks/useProfile";
import { useMyAwardWins } from "../../services/hooks/useUserAwards";
import ProfileHeaderCard from "../../components/ProfileHeaderCard";
import PersonalInfoForm from "../../components/member/PersonalInfoForm";
import ProfileStatsSidebar from "../../components/member/ProfileStatsSidebar";
import AccountActionsSidebar from "../../components/member/AccountActionsSidebar";

const Profil = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: awardWins } = useMyAwardWins();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    country: "",
    bio: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        postalCode: profile.postalCode || "",
        city: profile.city || "",
        country: profile.country || "France",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      address: formData.address,
      postalCode: formData.postalCode,
      city: formData.city,
      country: formData.country,
      bio: formData.bio,
    });
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    toast.success("Déconnexion réussie");
    navigate("/auth/login");
  };

  return (
    <div>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header Card */}
        {profile && (
          <ProfileHeaderCard
            user={profile}
            memberSince={
              profile.memberSince
                ? new Date(profile.memberSince).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
                : "N/A"
            }
            sessionsCount={0}
            status={profile.status === "active" ? "Membre actif" : "Inactif"}
            hasAwardWins={!!awardWins && awardWins.length > 0}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PersonalInfoForm formData={formData} onFormDataChange={setFormData} onSubmit={handleSubmit} />
          </div>
          <div className="space-y-6">
            {awardWins && awardWins.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-trophy text-award-gold-text"></i>
                  Awards remportés
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {awardWins.map((win) => (
                    <div
                      key={win.id}
                      className="flex items-center gap-3 bg-award-cream-light border border-award-gold/30 rounded-xl px-3 py-3"
                    >
                      <span className="w-10 h-10 rounded-full bg-award-gold flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                        {win.awardIcon || "🏆"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{win.awardName}</p>
                        <p className="text-xs text-award-gold-text font-medium">
                          Awards {win.year}
                          {win.isCoWinner && " · Co-lauréat·e"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <ProfileStatsSidebar />
            <AccountActionsSidebar onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profil;
