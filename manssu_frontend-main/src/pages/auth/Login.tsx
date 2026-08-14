import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, sendOTP } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";
    navigate(from, { replace: true });
    return null;
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email.trim()) {
      setErrors({ email: "Veuillez entrer votre adresse email" });
      toast.error("Veuillez entrer votre adresse email");
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: "Veuillez entrer une adresse email valide" });
      toast.error("Adresse email invalide");
      return;
    }

    setIsLoading(true);

    try {
      await sendOTP(email);
      toast.success("Code OTP envoyé à votre adresse email");
      // Navigate to OTP verification page
      navigate("/auth/verify-otp", {
        state: {
          email,
        },
      });
    } catch (error) {
      // Error toast is already shown by API client interceptor
      // Just handle the error silently here
      console.error("Send OTP error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 font-inter flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Manssuétude" className="w-16 h-16 object-cover" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Manssuétude
          </h1>
          <p className="text-gray-600">Connectez-vous à votre compte</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse email <span className="text-primary">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({});
                }}
                placeholder="votre.email@exemple.com"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50 focus:bg-white text-sm sm:text-base ${
                  errors.email ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-primary"
                }`}
                required
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <i className="fa-solid fa-exclamation-circle mr-1"></i>
                  {errors.email}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Envoi en cours...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Info Message */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start space-x-2">
              <i className="fa-solid fa-info-circle text-accent mt-0.5"></i>
              <p className="text-xs sm:text-sm text-gray-700">
                Un code de vérification sera envoyé à votre adresse email pour vous connecter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
