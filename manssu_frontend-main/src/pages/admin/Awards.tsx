import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  useAwardCategories,
  useAwardSettings,
  useCloseAllNominations,
  useReopenAllNominations,
  useDistributeReveals,
  useAwardSettingsUpdate,
  useResetAllAwards,
} from "../../services/hooks/useAwards";
import { useSessions } from "../../services/hooks/useSessions";
import {
  CurationPanel,
  CategoryEditForm,
  CategoryCreateForm,
  DeleteCategoryButton,
} from "../../components/awards/AwardShared";
import { useAwardFont } from "../../components/awards/useAwardFont";
import PublishResultsModal from "../../components/awards/PublishResultsModal";
import { AWARD_STATUS_BADGES, AWARD_EDITION_PHASE_LABELS, computeEditionPhase } from "../../utils/awardStatus";
import { toLocalInputValue, parseApiDate } from "../../utils/awardWindow";
import { AwardEmailMode } from "../../types/award";

const toInputValue = (iso: string | null | undefined) => toLocalInputValue(parseApiDate(iso));

const EMAIL_MODE_LABELS: Record<AwardEmailMode, string> = {
  off: "Aucun e-mail n'est envoyé",
  test: "Envoyés aux super admins uniquement, objet préfixé [TEST]",
  on: "Les membres actifs recevront les e-mails",
};

const AdminAwards = () => {
  useAwardFont();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories, isLoading } = useAwardCategories();
  const { data: settings } = useAwardSettings();
  const closeAllNominations = useCloseAllNominations();
  const reopenAllNominations = useReopenAllNominations();
  const distributeReveals = useDistributeReveals();
  const updateSettings = useAwardSettingsUpdate();
  const resetAll = useResetAllAwards();
  const { data: sessionsData } = useSessions({ status: "upcoming", limit: 50 });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);

  const [editionYear, setEditionYear] = useState("");
  const [teasingStart, setTeasingStart] = useState("");
  const [nominationStart, setNominationStart] = useState("");
  const [nominationEnd, setNominationEnd] = useState("");
  const [voteStart, setVoteStart] = useState("");
  const [voteEnd, setVoteEnd] = useState("");
  const [ceremonySessionId, setCeremonySessionId] = useState("");

  const currentEditionYear = editionYear || String(settings?.editionYear ?? new Date().getFullYear());
  const currentTeasingStart = teasingStart || toInputValue(settings?.teasingStartAt);
  const currentNominationStart = nominationStart || toInputValue(settings?.nominationStartAt);
  const currentNominationEnd = nominationEnd || toInputValue(settings?.nominationEndAt);
  const currentVoteStart = voteStart || toInputValue(settings?.voteStartAt);
  const currentVoteEnd = voteEnd || toInputValue(settings?.voteEndAt);
  const currentCeremonySessionId = ceremonySessionId || settings?.ceremonySession?.id || "";

  const hasPublished = categories?.some((c) => c.status === "results_published") ?? false;
  const phase = computeEditionPhase(settings, hasPublished);

  const openNominationsCount = categories?.filter((c) => c.status === "nomination").length ?? 0;
  const reopenableCount = categories?.filter((c) => c.status === "curation").length ?? 0;
  const awaitingCeremonyCount = categories?.filter((c) => c.status === "awaiting_ceremony").length ?? 0;
  const revealedCount = categories?.filter((c) => c.revealed).length ?? 0;
  const totalCategories = categories?.length ?? 0;

  const handleSaveCalendar = () => {
    updateSettings.mutate({
      editionYear: Number(currentEditionYear),
      teasingStartAt: currentTeasingStart ? new Date(currentTeasingStart).toISOString() : undefined,
      nominationStartAt: currentNominationStart ? new Date(currentNominationStart).toISOString() : undefined,
      nominationEndAt: currentNominationEnd ? new Date(currentNominationEnd).toISOString() : undefined,
      voteStartAt: currentVoteStart ? new Date(currentVoteStart).toISOString() : undefined,
      voteEndAt: currentVoteEnd ? new Date(currentVoteEnd).toISOString() : undefined,
      ceremonySessionId: currentCeremonySessionId || undefined,
    });
  };

  const handleEmailModeChange = (mode: AwardEmailMode) => {
    if (mode === "on" && !window.confirm("Les membres actifs recevront de vrais e-mails. Continuer ?")) return;
    updateSettings.mutate({ emailMode: mode });
  };

  const handleResetAll = () => {
    if (resetConfirmText.trim().toUpperCase() !== "RÉINITIALISER") return;
    resetAll.mutate(undefined, { onSuccess: () => setResetConfirmText("") });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
      </div>
    );
  }

  const nextAction = (() => {
    switch (phase) {
      case "teasing":
        return `${revealedCount} prix révélés sur ${totalCategories}.`;
      case "nomination":
        return "Rien à faire avant la clôture des nominations.";
      case "selection":
        return reopenableCount > 0
          ? `${reopenableCount} prix n'ont pas encore de liste finale.`
          : "Toutes les listes finales sont prêtes.";
      case "vote":
        return "Le vote se termine avant la séance de la cérémonie.";
      case "ceremony_pending":
        return awaitingCeremonyCount > 0
          ? `Préparez la cérémonie : ${awaitingCeremonyCount} prix en attente.`
          : "Lancez le mode cérémonie pendant la séance, puis publiez.";
      default:
        return null;
    }
  })();

  return (
    <div className="space-y-6">
      <div className="bg-award-cream-light border border-award-gold/40 rounded-2xl p-4">
        <p className="text-xs text-award-gold-text uppercase tracking-wide">Édition {settings?.editionYear}</p>
        <h2 className="font-fraunces font-bold text-gray-900">{AWARD_EDITION_PHASE_LABELS[phase]}</h2>
        {nextAction && <p className="text-sm text-gray-600 mt-1">{nextAction}</p>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Calendrier</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Édition (année)</label>
              <input
                type="number"
                value={currentEditionYear}
                onChange={(e) => setEditionYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Séance de la cérémonie</label>
              <select
                value={currentCeremonySessionId}
                onChange={(e) => setCeremonySessionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              >
                <option value="">— Choisir une séance —</option>
                {sessionsData?.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.date})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Début du teasing</label>
              <input
                type="datetime-local"
                value={currentTeasingStart}
                onChange={(e) => setTeasingStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Début des nominations</label>
              <input
                type="datetime-local"
                value={currentNominationStart}
                onChange={(e) => setNominationStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fin des nominations</label>
              <input
                type="datetime-local"
                value={currentNominationEnd}
                onChange={(e) => setNominationEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Début du vote</label>
              <input
                type="datetime-local"
                value={currentVoteStart}
                onChange={(e) => setVoteStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fin du vote</label>
              <input
                type="datetime-local"
                value={currentVoteEnd}
                onChange={(e) => setVoteEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Les dates pilotent les phases. Le vote doit se terminer avant la séance de la cérémonie.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSaveCalendar}
            disabled={updateSettings.isPending}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Enregistrer le calendrier
          </button>
          {openNominationsCount > 0 ? (
            <button
              onClick={() => closeAllNominations.mutate()}
              disabled={closeAllNominations.isPending}
              className="px-4 py-2 rounded-xl bg-warning text-white text-sm font-medium disabled:opacity-40"
            >
              Clôturer toutes les nominations ({openNominationsCount})
            </button>
          ) : (
            <button
              onClick={() => reopenAllNominations.mutate()}
              disabled={reopenableCount === 0 || reopenAllNominations.isPending}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium disabled:opacity-40"
            >
              Rouvrir toutes les nominations {reopenableCount > 0 ? `(${reopenableCount})` : ""}
            </button>
          )}
          <button
            onClick={() => distributeReveals.mutate()}
            disabled={distributeReveals.isPending}
            className="px-4 py-2 rounded-xl bg-accent/10 text-accent text-sm font-medium disabled:opacity-40"
          >
            Répartir les révélations
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 mb-3">E-mails aux membres</h2>
        <div role="radiogroup" aria-label="Mode d'envoi des e-mails" className="flex gap-2 mb-2">
          {(["off", "test", "on"] as AwardEmailMode[]).map((mode) => (
            <button
              key={mode}
              role="radio"
              aria-checked={settings?.emailMode === mode}
              onClick={() => handleEmailModeChange(mode)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                settings?.emailMode === mode
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {mode === "off" ? "Désactivés" : mode === "test" ? "Test" : "Activés"}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mb-2">{EMAIL_MODE_LABELS[settings?.emailMode ?? "off"]}</p>
        <ul className="text-xs text-gray-400 list-disc list-inside space-y-0.5">
          <li>Les Awards arrivent (début du teasing)</li>
          <li>Ouverture des nominations</li>
          <li>Ouverture du vote</li>
          <li>Rappel la veille de la clôture du vote</li>
          <li>Résultats publiés</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Nouvelle catégorie
        </button>
      </div>

      {isCreating && <CategoryCreateForm onDone={() => setIsCreating(false)} />}

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="p-3">Prix</th>
              <th className="p-3">Révélation</th>
              <th className="p-3">Type</th>
              <th className="p-3">Propositions</th>
              <th className="p-3">Finalistes</th>
              <th className="p-3">État</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories?.map((category) => {
              const badge = AWARD_STATUS_BADGES[category.status];
              const isExpanded = expandedId === category.id;
              const isEditing = editingId === category.id;
              return (
                <>
                  <tr key={category.id} className="border-b border-gray-50">
                    <td className="p-3 whitespace-nowrap">
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </td>
                    <td className="p-3 whitespace-nowrap text-xs text-gray-500">
                      {category.revealAt ? new Date(category.revealAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="p-3 whitespace-nowrap text-xs">
                      {category.targetType === "member" ? "Membre" : "Commission"}
                    </td>
                    <td className="p-3 whitespace-nowrap">{category.nominationCount}</td>
                    <td className="p-3 whitespace-nowrap">{category.candidates?.length ?? 0}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setEditingId(isEditing ? null : category.id)}
                          className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium"
                        >
                          Modifier
                        </button>
                        <DeleteCategoryButton category={category} />
                        {category.status === "curation" && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : category.id)}
                            className="px-2 py-1 rounded-lg bg-accent/10 text-accent text-xs font-medium"
                          >
                            {isExpanded ? "Masquer" : "Liste finale"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isEditing && (
                    <tr>
                      <td colSpan={7} className="p-3 bg-gray-50">
                        <CategoryEditForm category={category} onDone={() => setEditingId(null)} />
                      </td>
                    </tr>
                  )}
                  {isExpanded && category.status === "curation" && (
                    <tr>
                      <td colSpan={7} className="p-3 bg-gray-50">
                        <CurationPanel category={category} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-award-cream-light border border-award-gold rounded-2xl p-5 space-y-3">
        <h2 className="font-fraunces font-bold text-gray-900">
          Cérémonie des Awards {settings?.ceremonySession ? `· ${settings.ceremonySession.title}` : ""}
        </h2>
        {awaitingCeremonyCount === 0 ? (
          <p className="text-sm text-gray-600">Disponible une fois le vote clos pour au moins un prix.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => navigate("/admin/awards/ceremonie/preparation")}
              className="p-4 rounded-xl bg-white border border-award-gold/40 text-left"
            >
              <p className="font-medium text-gray-900 text-sm">1. Préparer la cérémonie</p>
              <p className="text-xs text-gray-500">Égalités et ordre de passage</p>
            </button>
            <button
              onClick={() => navigate("/admin/awards/ceremonie")}
              className="p-4 rounded-xl bg-award-ink text-award-gold-light text-left"
            >
              <p className="font-medium text-sm">2. Lancer le mode cérémonie</p>
              <p className="text-xs opacity-70">Plein écran, pendant la séance</p>
            </button>
            <button
              onClick={() => setShowPublishModal(true)}
              className="p-4 rounded-xl bg-primary text-white text-left"
            >
              <p className="font-medium text-sm">3. Publier les résultats</p>
              <p className="text-xs opacity-80">Après la cérémonie</p>
            </button>
          </div>
        )}
      </div>

      <PublishResultsModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        emailMode={settings?.emailMode ?? "off"}
      />

      {user?.role === "super_admin" && (
        <details className="bg-red-50 rounded-2xl border border-red-200 p-5">
          <summary className="font-bold text-red-700 cursor-pointer">Zone dangereuse</summary>
          <p className="text-xs text-red-600 mt-2 mb-3">
            Remet l'édition {settings?.editionYear} à zéro ({totalCategories} catégories) : propositions, listes
            finales, votes, ordre de passage, dates de révélation. Les badges déjà attribués sont conservés.
            Irréversible.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="Tapez RÉINITIALISER"
              className="px-3 py-2 border border-red-300 rounded-xl text-sm flex-1"
            />
            <button
              onClick={handleResetAll}
              disabled={resetConfirmText.trim().toUpperCase() !== "RÉINITIALISER" || resetAll.isPending}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium disabled:opacity-40"
            >
              Réinitialiser l'édition
            </button>
          </div>
        </details>
      )}
    </div>
  );
};

export default AdminAwards;
