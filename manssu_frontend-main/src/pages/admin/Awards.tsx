import { useState } from "react";
import {
  useAwardCategories,
  useAwardSettings,
  useCloseAllNominations,
  useReopenAllNominations,
  usePublishResults,
  usePublishAllResults,
  useUpdateAwardCategory,
  useAwardSettingsUpdate,
  useResetAllAwards,
} from "../../services/hooks/useAwards";
import { AwardCategory } from "../../types/award";
import { CurationPanel } from "../../components/awards/AwardShared";
import { AWARD_STATUS_BADGES } from "../../utils/awardStatus";

// Converts a "yyyy-MM-ddTHH:mm" datetime-local value to/from an ISO string for the API
const toInputValue = (iso: string | null | undefined) => (iso ? iso.slice(0, 16) : "");

const CategoryEditForm = ({ category, onDone }: { category: AwardCategory; onDone: () => void }) => {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || "");
  const [icon, setIcon] = useState(category.icon || "");
  const updateCategory = useUpdateAwardCategory();

  const handleSave = () => {
    updateCategory.mutate({ id: category.id, data: { name, description, icon } }, { onSuccess: onDone });
  };

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      <input
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="Emoji"
        className="w-20 px-3 py-2 border border-gray-300 rounded-xl text-sm text-center"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom de la catégorie"
        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={updateCategory.isPending}
          className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Enregistrer
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

const AdminAwards = () => {
  const { data: categories, isLoading } = useAwardCategories();
  const { data: settings } = useAwardSettings();
  const closeAllNominations = useCloseAllNominations();
  const reopenAllNominations = useReopenAllNominations();
  const publishResults = usePublishResults();
  const publishAllResults = usePublishAllResults();
  const updateSettings = useAwardSettingsUpdate();
  const resetAll = useResetAllAwards();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nominationStart, setNominationStart] = useState("");
  const [nominationEnd, setNominationEnd] = useState("");
  const [voteStart, setVoteStart] = useState("");
  const [voteEnd, setVoteEnd] = useState("");

  const currentNominationStart = nominationStart || toInputValue(settings?.nominationStartAt);
  const currentNominationEnd = nominationEnd || toInputValue(settings?.nominationEndAt);
  const currentVoteStart = voteStart || toInputValue(settings?.voteStartAt);
  const currentVoteEnd = voteEnd || toInputValue(settings?.voteEndAt);

  const handleSaveSettings = () => {
    updateSettings.mutate({
      nominationStartAt: currentNominationStart ? new Date(currentNominationStart).toISOString() : undefined,
      nominationEndAt: currentNominationEnd ? new Date(currentNominationEnd).toISOString() : undefined,
      voteStartAt: currentVoteStart ? new Date(currentVoteStart).toISOString() : undefined,
      voteEndAt: currentVoteEnd ? new Date(currentVoteEnd).toISOString() : undefined,
    });
  };

  const handleResetAll = () => {
    if (
      window.confirm(
        "Réinitialiser tout le processus Awards ? Toutes les propositions, listes finales et votes seront définitivement supprimés, et les catégories repartiront de zéro. Cette action est irréversible.",
      )
    ) {
      resetAll.mutate();
    }
  };

  const hasClosedVotes = categories?.some((c) => c.status === "vote_closed") ?? false;
  const openNominationsCount = categories?.filter((c) => c.status === "nomination").length ?? 0;
  const reopenableCount = categories?.filter((c) => c.status === "curation").length ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Fenêtre de nomination (globale)</h2>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Début des nominations</label>
              <input
                type="datetime-local"
                value={currentNominationStart}
                onChange={(e) => setNominationStart(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fin des nominations</label>
              <input
                type="datetime-local"
                value={currentNominationEnd}
                onChange={(e) => setNominationEnd(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Tant que cette fenêtre n'est pas définie, ou que le début n'est pas encore passé, les catégories encore en
            nomination restent totalement invisibles pour les membres.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h2 className="font-bold text-gray-900 mb-3">Fenêtre de vote (globale)</h2>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Début du vote</label>
              <input
                type="datetime-local"
                value={currentVoteStart}
                onChange={(e) => setVoteStart(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fin du vote</label>
              <input
                type="datetime-local"
                value={currentVoteEnd}
                onChange={(e) => setVoteEnd(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Un rappel par e-mail est envoyé automatiquement 24h avant la fin du vote.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={updateSettings.isPending}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Enregistrer
        </button>
      </div>

      <div className="bg-red-50 rounded-2xl border border-red-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-bold text-red-700">Zone dangereuse</h2>
          <p className="text-xs text-red-600 mt-1">
            Supprime toutes les propositions, listes finales et votes, et remet les 12 catégories à zéro. Irréversible.
          </p>
        </div>
        <button
          onClick={handleResetAll}
          disabled={resetAll.isPending}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          <i className="fa-solid fa-triangle-exclamation mr-2"></i>
          Réinitialiser tout le processus
        </button>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        {openNominationsCount > 0 ? (
          <button
            onClick={() => closeAllNominations.mutate()}
            disabled={closeAllNominations.isPending}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-warning text-white text-sm font-medium disabled:opacity-40 hover:bg-warning/90 transition-colors"
          >
            <i className="fa-solid fa-lock mr-2"></i>
            Clôturer toutes les nominations ({openNominationsCount})
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
        <button
          onClick={() => publishAllResults.mutate()}
          disabled={!hasClosedVotes || publishAllResults.isPending}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-success text-white text-sm font-medium disabled:opacity-40 hover:bg-success/90 transition-colors"
        >
          <i className="fa-solid fa-bullhorn mr-2"></i>
          Publier tous les résultats
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories?.map((category) => {
          const badge = AWARD_STATUS_BADGES[category.status];
          const isExpanded = expandedId === category.id;
          const isEditing = editingId === category.id;

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

              {isEditing ? (
                <CategoryEditForm category={category} onDone={() => setEditingId(null)} />
              ) : (
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => setEditingId(category.id)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                  >
                    <i className="fa-solid fa-pen mr-1"></i>
                    Modifier
                  </button>

                  {category.status === "curation" && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : category.id)}
                      className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                    >
                      {isExpanded ? "Masquer les propositions" : "Voir les propositions"}
                    </button>
                  )}

                  {category.status === "vote_closed" && (
                    <button
                      onClick={() => publishResults.mutate(category.id)}
                      disabled={publishResults.isPending}
                      className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors"
                    >
                      Publier les résultats
                    </button>
                  )}
                </div>
              )}

              {category.status === "curation" && isExpanded && <CurationPanel category={category} />}

              {category.status === "results_published" && category.candidates && (
                <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                  {[...category.candidates]
                    .sort((a, b) => b.votes - a.votes)
                    .map((candidate, index) => (
                      <div key={candidate.id} className="flex items-center justify-between text-sm">
                        <span className={index === 0 ? "font-bold text-gray-900" : "text-gray-600"}>
                          {index === 0 && "🏆 "}
                          {candidate.name}
                        </span>
                        <span className="text-gray-500">
                          {candidate.votes} vote{candidate.votes > 1 ? "s" : ""} ({candidate.percentage}%)
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminAwards;
