import { Link } from "react-router-dom";
import { useState } from "react";
import {
  useAwardCategories,
  useIsAwardCurator,
  useCloseAllNominations,
  useReopenAllNominations,
} from "../../services/hooks/useAwards";
import { CurationPanel } from "../../components/awards/AwardShared";
import { AWARD_STATUS_BADGES } from "../../utils/awardStatus";

const AwardsCuration = () => {
  const { data: isCurator, isLoading: isLoadingCurator } = useIsAwardCurator();
  const { data: categories, isLoading } = useAwardCategories();
  const closeAllNominations = useCloseAllNominations();
  const reopenAllNominations = useReopenAllNominations();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoadingCurator || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
      </div>
    );
  }

  if (!isCurator) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <i className="fa-solid fa-lock text-3xl text-gray-300 mb-3"></i>
        <p className="text-gray-600">Cette page est réservée à l'équipe de curation des Awards.</p>
        <Link to="/awards" className="text-primary text-sm font-medium mt-3 inline-block">
          Retour aux Awards
        </Link>
      </div>
    );
  }

  const relevantCategories = categories?.filter((c) => c.status === "nomination" || c.status === "curation") || [];
  const openCount = relevantCategories.filter((c) => c.status === "nomination").length;
  const reopenableCount = relevantCategories.filter((c) => c.status === "curation").length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-accent to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <i className="fa-solid fa-list-check text-2xl"></i>
          <h1 className="text-xl font-bold">Curation des Awards</h1>
        </div>
        <p className="text-white/90 text-sm">
          Clôturez les nominations, puis sélectionnez, parmi les propositions reçues, les candidats les plus récurrents
          pour bâtir la liste finale soumise au vote.
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {openCount > 0 ? (
          <button
            onClick={() => closeAllNominations.mutate()}
            disabled={closeAllNominations.isPending}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-warning text-white text-sm font-medium disabled:opacity-40 hover:bg-warning/90 transition-colors"
          >
            <i className="fa-solid fa-lock mr-2"></i>
            Clôturer toutes les nominations ({openCount})
          </button>
        ) : (
          <button
            onClick={() => reopenAllNominations.mutate()}
            disabled={reopenableCount === 0 || reopenAllNominations.isPending}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-200 transition-colors"
          >
            <i className="fa-solid fa-rotate-left mr-2"></i>
            Rouvrir toutes les nominations {reopenableCount > 0 ? `(${reopenableCount})` : ""}
          </button>
        )}
      </div>

      {relevantCategories.length === 0 && (
        <p className="text-sm text-gray-500">Toutes les catégories ont déjà leur liste finale validée.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relevantCategories.map((category) => {
          const badge = AWARD_STATUS_BADGES[category.status];
          const isExpanded = expandedId === category.id;

          return (
            <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{category.icon || "🏆"}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">{category.name}</h3>
                    <p className="text-xs text-gray-400">{category.nominationCount} proposition(s) reçue(s)</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${badge.className}`}>
                  {badge.label}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {category.status === "curation" && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : category.id)}
                    className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                  >
                    {isExpanded ? "Masquer les propositions" : "Voir les propositions"}
                  </button>
                )}
              </div>

              {category.status === "curation" && isExpanded && <CurationPanel category={category} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AwardsCuration;
