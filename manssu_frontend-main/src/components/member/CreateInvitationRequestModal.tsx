import { useState, useMemo, useEffect } from "react";
import FormInput from "../FormInput";
import Dropdown from "../Dropdown";
import { useCreateInvitationRequest } from "../../services/hooks/useInvitations";
import { useSessions } from "../../services/hooks/useSessions";

interface CreateInvitationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateInvitationRequestModal = ({ isOpen, onClose, onSuccess }: CreateInvitationRequestModalProps) => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [reason, setReason] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createInvitationRequest = useCreateInvitationRequest();

  // Fetch upcoming sessions for dropdown
  const { data: sessionsData } = useSessions({
    status: "upcoming",
    limit: 100,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setFullName("");
      setReason("");
      setSelectedSessionId("");
      setErrors({});
    }
  }, [isOpen]);

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

    if (!fullName.trim()) {
      setErrors({ fullName: "Le nom complet est requis" });
      return;
    }

    if (fullName.trim().length < 1 || fullName.trim().length > 200) {
      setErrors({ fullName: "Le nom complet doit contenir entre 1 et 200 caractères" });
      return;
    }

    if (!reason.trim()) {
      setErrors({ reason: "La raison est requise" });
      return;
    }

    if (!selectedSessionId) {
      setErrors({ sessionId: "Veuillez sélectionner une session" });
      return;
    }

    try {
      await createInvitationRequest.mutateAsync({
        email: email.trim(),
        fullName: fullName.trim(),
        reason: reason.trim(),
        sessionId: selectedSessionId,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleClose = () => {
    setEmail("");
    setFullName("");
    setReason("");
    setSelectedSessionId("");
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Inviter un membre</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <i className="fa-solid fa-info-circle text-blue-600 mr-2 mt-0.5"></i>
            <p className="text-sm text-blue-800">
              Votre demande sera examinée par un administrateur. Vous serez notifié une fois qu'elle aura été traitée.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Email de l'invité"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="invite@example.com"
            required
          />

          <FormInput
            label="Nom complet"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
            placeholder="Jean Dupont"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session <span className="text-red-500">*</span>
            </label>
            <Dropdown
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              options={sessionOptions}
              placeholder="Sélectionner une session"
              error={errors.sessionId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison de l'invitation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Expliquez pourquoi vous souhaitez inviter cette personne..."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border transition-all bg-gray-50 focus:bg-white appearance-none ${
                errors.reason
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-primary focus:ring-primary"
              } focus:outline-none focus:ring-2 focus:ring-opacity-20 resize-none`}
            />
            {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createInvitationRequest.isPending}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createInvitationRequest.isPending ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Envoi...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane mr-2"></i>
                  Envoyer la demande
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvitationRequestModal;
