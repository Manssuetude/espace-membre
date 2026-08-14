import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useValidateInvite } from "../../services/hooks/useInvitations";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../utils/errorUtils";

const InvitationPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, sendOTPForInvite, registerGuest } = useAuth();
  const { data: validation, isLoading: isValidating } = useValidateInvite(code || "");

  const [step, setStep] = useState<"info" | "otp">("info");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle invalid invite
  useEffect(() => {
    if (validation && !validation.valid) {
      toast.error(validation.message || "Code d'invitation invalide");
    }
  }, [validation]);

  // Resend timer
  useEffect(() => {
    if (step === "otp") {
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!firstName.trim()) {
      setErrors({ firstName: "Le prénom est requis" });
      return;
    }

    if (!lastName.trim()) {
      setErrors({ lastName: "Le nom est requis" });
      return;
    }

    if (!code) {
      toast.error("Code d'invitation manquant");
      return;
    }

    setIsLoading(true);
    try {
      await sendOTPForInvite(code);
      toast.success("Code OTP envoyé à votre adresse email");
      setStep("otp");
      setResendTimer(60);
      setCanResend(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Erreur lors de l'envoi du code OTP"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Veuillez entrer le code complet à 6 chiffres");
      return;
    }

    if (!code) {
      toast.error("Code d'invitation manquant");
      return;
    }

    setIsLoading(true);
    try {
      await registerGuest(code, firstName.trim(), lastName.trim(), otpString);
      toast.success("Inscription réussie !");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "Erreur lors de l'inscription"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || !code) return;

    setCanResend(false);
    setResendTimer(60);
    try {
      await sendOTPForInvite(code);
      toast.success("Code de vérification renvoyé");
    } catch (error) {
      toast.error(getErrorMessage(error, "Erreur lors de l'envoi du code"));
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 font-inter flex items-center justify-center p-4">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600">Vérification du code d'invitation...</p>
        </div>
      </div>
    );
  }

  if (!validation || !validation.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 font-inter flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-times-circle text-red-500 text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation invalide</h2>
            <p className="text-gray-600 mb-6">{validation?.message || "Ce code d'invitation n'est pas valide"}</p>
            <button
              onClick={() => navigate("/auth/login")}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-red-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 font-inter flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Manssuétude" className="w-16 h-16 object-cover" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Invitation
          </h1>
          <p className="text-gray-600">Vous avez été invité à participer à une session</p>
        </div>

        {/* Session Info Card */}
        {validation.sessionTitle && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-calendar text-white text-xl"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{validation.sessionTitle}</h3>
                <p className="text-sm text-gray-600">
                  <i className="fa-solid fa-envelope mr-2"></i>
                  {validation.email}
                </p>
                {validation.expiresAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    <i className="fa-solid fa-clock mr-1"></i>
                    Expire le {new Date(validation.expiresAt).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Registration Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 sm:p-8">
          {step === "info" ? (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Vos informations</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Prénom <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: "" }));
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50 focus:bg-white ${
                        errors.firstName ? "border-red-500" : "border-gray-300 focus:border-primary"
                      }`}
                      required
                      disabled={isLoading}
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: "" }));
                      }}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-gray-50 focus:bg-white ${
                        errors.lastName ? "border-red-500" : "border-gray-300 focus:border-primary"
                      }`}
                      required
                      disabled={isLoading}
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Envoi en cours...
                  </span>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane mr-2"></i>
                    Recevoir le code de vérification
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Code de vérification</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Entrez le code à 6 chiffres envoyé à <strong>{validation.email}</strong>
                </p>
                <div className="flex justify-center space-x-2 sm:space-x-3" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                      required
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join("").length !== 6}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Inscription...
                  </span>
                ) : (
                  "Finaliser l'inscription"
                )}
              </button>

              <div className="pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-3">Vous n'avez pas reçu le code ?</p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={!canResend}
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {canResend ? "Renvoyer le code" : `Renvoyer dans ${resendTimer}s`}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className="text-sm text-gray-600 hover:text-primary transition-colors"
                >
                  <i className="fa-solid fa-arrow-left mr-2"></i>
                  Retour
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;
