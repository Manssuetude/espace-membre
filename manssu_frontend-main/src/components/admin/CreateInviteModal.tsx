import { useState, useMemo, useEffect } from "react";
import FormInput from "../FormInput";
import Dropdown from "../Dropdown";
import { useCreateInvite } from "../../services/hooks/useInvitations";
import { useSessions } from "../../services/hooks/useSessions";

interface CreateInviteModalProps {
  isOpen: boolean;
  sessionId?: string; // Optional - if provided, session is pre-selected
  sessionTitle?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateInviteModal = ({
  isOpen,
  sessionId: initialSessionId,
  sessionTitle,
  onClose,
  onSuccess,
}: CreateInviteModalProps) => {
  const [email, setEmail] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createInvite = useCreateInvite();

  // Fetch sessions for dropdown
  const { data: sessionsData } = useSessions({
    status: "upcoming",
    limit: 100,
  });

  // Initialize selectedSessionId when modal opens or initialSessionId changes
  useEffect(() => {
    if (isOpen) {
      setSelectedSessionId(initialSessionId || "");
    }
  }, [isOpen, initialSessionId]);

  const sessionOptions = useMemo(() => {
    return (sessionsData?.data || []).map((session) => ({
      value: session.id,
      label: `${session.title}${session.date ? ` - ${new Date(session.date).toLocaleDateString("fr-FR")}` : ""}`,
    }));
  }, [sessionsData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!email.trim()) {
      setErrors({ email: "L'email est requis" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors({ email: "Format d'email invalide" });
      return;
    }

    if (!selectedSessionId) {
      setErrors({ sessionId: "Veuillez sélectionner une session" });
      return;
    }

    try {
      await createInvite.mutateAsync({
        email: email.trim(),
        sessionId: selectedSessionId,
      });
      setEmail("");
      setSelectedSessionId(initialSessionId || "");
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleClose = () => {
    setEmail("");
    setSelectedSessionId(initialSessionId || "");
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Ajouter un invité</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {initialSessionId && sessionTitle ? (
          <div className="mb-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Session:</p>
            <p className="text-sm font-semibold text-primary">{sessionTitle}</p>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Session <span className="text-primary">*</span>
            </label>
            <Dropdown
              options={sessionOptions}
              value={selectedSessionId}
              onChange={(e) => {
                setSelectedSessionId(e.target.value);
                if (errors.sessionId) {
                  setErrors((prev) => ({ ...prev, sessionId: "" }));
                }
              }}
              placeholder="Sélectionner une session"
            />
            {errors.sessionId && <p className="text-red-500 text-xs mt-1">{errors.sessionId}</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Email de l'invité"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors((prev) => ({ ...prev, email: "" }));
              }
            }}
            error={errors.email}
            placeholder="invite@example.com"
            required
          />

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createInvite.isPending}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createInvite.isPending ? (
                <span className="flex items-center justify-center">
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Envoi...
                </span>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane mr-2"></i>
                  Envoyer l'invitation
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <i className="fa-solid fa-info-circle mr-2 text-blue-500"></i>
            Un email avec le lien d'invitation sera automatiquement envoyé à l'adresse indiquée. L'invitation expire
            dans 7 jours.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateInviteModal;
