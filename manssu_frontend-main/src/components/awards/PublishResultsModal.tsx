import { useState } from "react";
import { Link } from "react-router-dom";
import { useCeremonyPreparation, usePublishAllResults } from "../../services/hooks/useAwards";
import { AwardEmailMode } from "../../types/award";

const EMAIL_STATUS: Record<AwardEmailMode, string> = {
  off: "Aucun e-mail ne sera envoyé.",
  test: "Un e-mail de test sera envoyé aux super admins uniquement.",
  on: "Un e-mail sera envoyé à tous les membres actifs.",
};

interface PublishResultsModalProps {
  open: boolean;
  onClose: () => void;
  emailMode: AwardEmailMode;
}

const PublishResultsModal = ({ open, onClose, emailMode }: PublishResultsModalProps) => {
  const { data: preparation, isLoading } = useCeremonyPreparation(open);
  const publishAllResults = usePublishAllResults();
  const [result, setResult] = useState<{ publishedCount: number; badgesAwarded: number } | null>(null);

  if (!open) return null;

  const unresolved = (preparation || []).filter((c) => c.tie && !c.resolution);
  const ready = (preparation || []).length - unresolved.length;
  const badgesEstimate = (preparation || []).reduce((sum, c) => {
    if (c.resolution?.mode === "co_winners") return sum + 2;
    if (c.resolution) return sum + 1;
    return sum;
  }, 0);

  const handlePublish = () => {
    publishAllResults.mutate(undefined, {
      onSuccess: (response) =>
        setResult({ publishedCount: response.data.publishedCount, badgesAwarded: response.data.badgesAwarded }),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <p className="text-xs text-award-gold-text uppercase tracking-wide">Après la cérémonie</p>
        <h2 className="font-fraunces text-xl font-bold text-gray-900 mt-1 mb-4">Publier les résultats</h2>

        {result ? (
          <>
            <p className="text-sm text-gray-700">
              {result.publishedCount} prix publié(s), {result.badgesAwarded} badge(s) attribué(s).
            </p>
            <Link to="/awards" className="text-primary text-sm font-medium mt-3 inline-block">
              Voir le palmarès côté membres →
            </Link>
          </>
        ) : isLoading ? (
          <p className="text-sm text-gray-400">Chargement...</p>
        ) : (
          <>
            <ul className="text-sm text-gray-700 space-y-1.5 mb-4">
              <li>
                <i className="fa-solid fa-circle-check text-success mr-2"></i>
                {ready} prix prêt(s)
              </li>
              <li>
                <i className="fa-solid fa-circle-check text-success mr-2"></i>~{badgesEstimate} badge(s) à attribuer,
                édition en cours
              </li>
              <li className="text-gray-500">
                <i className="fa-solid fa-envelope mr-2"></i>
                {EMAIL_STATUS[emailMode]}
              </li>
            </ul>
            <p className="text-xs text-red-500 mb-4">Cette action ne peut pas être annulée.</p>

            {unresolved.length > 0 ? (
              <div className="bg-warning/10 text-warning text-sm rounded-xl p-3">
                {unresolved.length} égalité(s) non tranchée(s).{" "}
                <Link to="/admin/awards/ceremonie/preparation" className="underline font-medium">
                  Aller à la préparation
                </Link>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium"
                >
                  Plus tard
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishAllResults.isPending}
                  className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40"
                >
                  Publier les résultats
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PublishResultsModal;
