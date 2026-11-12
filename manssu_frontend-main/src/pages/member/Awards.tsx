import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useAwardCategories,
  useAwardSettings,
  useNominate,
  useRemoveNomination,
  useVoteAward,
  useIsAwardManager,
} from "../../services/hooks/useAwards";
import { useAuth } from "../../contexts/AuthContext";
import { useMembers } from "../../services/hooks/useMembers";
import { useCommissions } from "../../services/hooks/useCommissions";
import { AwardCategory } from "../../types/award";
import SearchableDropdown from "../../components/SearchableDropdown";
import AwardCountdown from "../../components/awards/AwardCountdown";
import AwardProposeSheet from "../../components/awards/AwardProposeSheet";
import AwardWinnerCard from "../../components/awards/AwardWinnerCard";
import { useAwardFont } from "../../components/awards/useAwardFont";
import { parseApiDate, formatWindowDate } from "../../utils/awardWindow";
import { AWARD_EDITION_PHASE_LABELS, AWARD_EDITION_STEP_INDEX, computeEditionPhase } from "../../utils/awardStatus";

const STEPS = ["Nominations", "Sélection des finalistes", "Vote", "Cérémonie", "Palmarès"];

const CeremonyLine = ({ settings }: { settings: ReturnType<typeof useAwardSettings>["data"] }) => {
  if (!settings?.ceremonySession) return null;
  const session = settings.ceremonySession;
  return (
    <p className="text-sm text-award-gold-light">
      Cérémonie : {session.title}
      {session.location ? ` · ${session.location}` : ""}
      {" — "}
      <Link to={`/sessions/${session.id}`} className="underline hover:text-award-gold">
        voir la séance
      </Link>
    </p>
  );
};

const Awards = () => {
  useAwardFont();
  const { data: categories, isLoading } = useAwardCategories();
  const { data: settings } = useAwardSettings();
  const { data: isManager } = useIsAwardManager();
  const { data: membersData } = useMembers({ status: "active", limit: 100 });
  const { data: commissionsData } = useCommissions({ status: "active", limit: 100 });

  const nominate = useNominate();
  const removeNomination = useRemoveNomination();
  const vote = useVoteAward();

  const [nominationSelections, setNominationSelections] = useState<Record<string, string>>({});
  const [voteSelections, setVoteSelections] = useState<Record<string, string>>({});
  const [confirmingVote, setConfirmingVote] = useState<string | null>(null);
  const [sheetCategoryId, setSheetCategoryId] = useState<string | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [hasOfferedReplay, setHasOfferedReplay] = useState(true);

  const { user } = useAuth();
  // A member can't propose themselves (also enforced by the API).
  const members = (membersData?.data || []).filter((m) => m.id !== user?.id);
  const commissions = commissionsData?.data || [];

  const hasPublished = categories?.some((c) => c.status === "results_published") ?? false;
  const phase = useMemo(() => computeEditionPhase(settings, hasPublished), [settings, hasPublished]);

  useEffect(() => {
    if (phase !== "published") return;
    try {
      const seen = localStorage.getItem("awards-palmares-seen");
      setHasOfferedReplay(!!seen);
      if (!seen) localStorage.setItem("awards-palmares-seen", "1");
    } catch {
      setHasOfferedReplay(true);
    }
  }, [phase]);

  const sortedForReplay = useMemo(
    () => [...(categories || [])].sort((a, b) => a.ceremonyOrder - b.ceremonyOrder),
    [categories],
  );

  useEffect(() => {
    if (!replaying) return;
    if (replayIndex >= sortedForReplay.length) {
      setReplaying(false);
      return;
    }
    const timeout = setTimeout(() => setReplayIndex((i) => i + 1), 1500);
    return () => clearTimeout(timeout);
  }, [replaying, replayIndex, sortedForReplay.length]);

  const handleNominate = (category: AwardCategory, nomineeId: string) => {
    nominate.mutate(
      {
        categoryId: category.id,
        data: category.targetType === "member" ? { nominatedUserId: nomineeId } : { nominatedCommissionId: nomineeId },
      },
      { onSuccess: () => setNominationSelections((prev) => ({ ...prev, [category.id]: "" })) },
    );
  };

  const confirmVote = (category: AwardCategory) => {
    const candidateId = voteSelections[category.id];
    if (!candidateId) return;
    vote.mutate({ categoryId: category.id, data: { candidateId } }, { onSuccess: () => setConfirmingVote(null) });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
      </div>
    );
  }

  const year = settings?.editionYear;

  // ------------------------------------------------------------------
  // Not started
  // ------------------------------------------------------------------
  if (phase === "not_started") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        <i className="fa-solid fa-trophy text-4xl text-gray-300 mb-3"></i>
        <p className="text-gray-500">Les Awards arrivent bientôt.</p>
      </div>
    );
  }

  const showStepper = phase !== "teasing";
  const stepIndex = AWARD_EDITION_STEP_INDEX[phase];

  return (
    <div className="space-y-6">
      {isManager && (
        <Link
          to="/admin/awards"
          className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-accent/30 p-4 hover:border-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-sliders text-accent text-xl"></i>
            <p className="font-medium text-gray-900 text-sm">Organiser les Awards</p>
          </div>
          <i className="fa-solid fa-chevron-right text-gray-400"></i>
        </Link>
      )}

      {/* ---------------- Teasing hero (merged header + countdown) ---------------- */}
      {phase === "teasing" && (
        <div className="bg-award-ink rounded-2xl p-6 sm:p-8 text-white shadow-lg space-y-4">
          <div>
            <p className="text-xs text-award-gold-light uppercase tracking-wide">
              Édition {year} · {AWARD_EDITION_PHASE_LABELS[phase]}
            </p>
            <h1 className="font-fraunces text-3xl sm:text-4xl font-bold mt-2">Les Awards arrivent</h1>
            <p className="text-white/70 text-sm mt-2 max-w-md">
              {categories?.length ?? 0} prix pour célébrer celles et ceux qui ont marqué l'année. Un nouveau prix est
              dévoilé ici régulièrement. Les nominations ouvriront ensuite.
            </p>
          </div>
          <AwardCountdown target={parseApiDate(settings?.nominationStartAt)} label="Ouverture des nominations dans" />
          <CeremonyLine settings={settings} />
        </div>
      )}

      {/* Common ceremony-flavored header */}
      {phase !== "teasing" && (
        <div className="bg-award-ink rounded-2xl p-6 text-white shadow-lg space-y-3">
          <div>
            <p className="text-xs text-award-gold-light uppercase tracking-wide">
              Édition {year} {showStepper && `· Étape ${stepIndex} sur 5`}
            </p>
            <h1 className="font-fraunces text-2xl font-bold mt-1">{AWARD_EDITION_PHASE_LABELS[phase]}</h1>
          </div>
          {showStepper && (
            <div className="hidden md:flex items-center gap-2 pt-2 border-t border-white/10">
              {STEPS.map((step, i) => (
                <div
                  key={step}
                  className={`flex-1 text-center text-xs py-2 border-t-2 ${
                    i + 1 === stepIndex
                      ? "border-award-gold text-award-gold-light font-medium"
                      : "border-white/10 text-white/40"
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          )}
          <CeremonyLine settings={settings} />
        </div>
      )}

      {/* ---------------- Teasing ---------------- */}
      {phase === "teasing" && (
        <>
          <p className="text-sm text-gray-500">
            {categories?.filter((c) => c.revealed).length ?? 0} prix dévoilés sur {categories?.length ?? 0}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {categories?.map((category) => (
              <div
                key={category.id}
                className={
                  category.revealed
                    ? "bg-award-cream-light border-2 border-award-gold rounded-2xl p-4 relative"
                    : "bg-award-ink/90 border border-white/10 rounded-2xl p-4 text-white"
                }
              >
                {category.isNew && (
                  <span className="absolute -top-2 -right-2 bg-award-gold text-award-ink text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Nouveau
                  </span>
                )}
                {category.revealed ? (
                  <>
                    <span className="text-3xl">{category.icon}</span>
                    <h3 className="font-fraunces font-bold text-gray-900 mt-2">{category.name}</h3>
                    {category.description && <p className="text-xs text-gray-500 mt-1">{category.description}</p>}
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lock text-award-gold-light text-xl"></i>
                    <p className="text-sm font-medium mt-2">Prix n°{category.revealNumber}</p>
                    {category.revealAt && (
                      <p className="text-xs text-white/50 mt-1">
                        Dévoilé le {formatWindowDate(parseApiDate(category.revealAt)!)}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---------------- Nomination ---------------- */}
      {phase === "nomination" && (
        <>
          <p className="text-sm text-gray-500">
            Vous avez proposé dans {categories?.filter((c) => c.myNominations.length > 0).length ?? 0} prix sur{" "}
            {categories?.length ?? 0}. Vos propositions restent privées.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories?.map((category) => {
              const options =
                category.targetType === "member"
                  ? members.map((m) => ({ value: m.id, label: m.name }))
                  : commissions.map((c) => ({ value: c.id, label: c.name }));
              return (
                <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="font-fraunces font-bold text-gray-900">{category.name}</h3>
                      {category.description && <p className="text-sm text-gray-500 mt-1">{category.description}</p>}
                      {category.myNominations.length > 0 && (
                        <span className="text-xs text-success font-medium">
                          {category.myNominations.length} proposition(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {category.myNominations.map((n) => {
                      const id = n.nominatedUserId || n.nominatedCommissionId || "";
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full"
                        >
                          {n.name}
                          <button
                            onClick={() => removeNomination.mutate({ categoryId: category.id, nomineeId: id })}
                            aria-label={`Retirer ${n.name}`}
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  {/* Desktop inline form */}
                  <div className="hidden md:block space-y-2">
                    <SearchableDropdown
                      value={nominationSelections[category.id] ?? ""}
                      onChange={(value) => setNominationSelections((prev) => ({ ...prev, [category.id]: value }))}
                      options={options.filter(
                        (o) =>
                          !category.myNominations.some(
                            (n) => (n.nominatedUserId || n.nominatedCommissionId) === o.value,
                          ),
                      )}
                      placeholder={
                        category.targetType === "member" ? "Rechercher un membre..." : "Rechercher une commission..."
                      }
                      allowCustom={false}
                    />
                    <button
                      onClick={() =>
                        nominationSelections[category.id] && handleNominate(category, nominationSelections[category.id])
                      }
                      disabled={!nominationSelections[category.id] || nominate.isPending}
                      className="w-full py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40"
                    >
                      Proposer
                    </button>
                  </div>

                  {/* Mobile: open the bottom sheet */}
                  <button
                    onClick={() => setSheetCategoryId(category.id)}
                    className="md:hidden w-full py-3 min-h-[44px] rounded-xl bg-primary text-white text-sm font-medium"
                  >
                    Proposer
                  </button>
                </div>
              );
            })}
          </div>

          {categories?.map((category) => {
            const options =
              category.targetType === "member"
                ? members.map((m) => ({ value: m.id, label: m.name }))
                : commissions.map((c) => ({ value: c.id, label: c.name }));
            return (
              <AwardProposeSheet
                key={category.id}
                open={sheetCategoryId === category.id}
                onClose={() => setSheetCategoryId(null)}
                categoryName={category.name || ""}
                categoryDescription={category.description}
                targetLabel={
                  category.targetType === "member" ? "Rechercher un membre..." : "Rechercher une commission..."
                }
                options={options}
                myNominations={category.myNominations.map((n) => ({
                  id: n.nominatedUserId || n.nominatedCommissionId || "",
                  name: n.name,
                }))}
                onPropose={(id) => handleNominate(category, id)}
                onRemove={(id) => removeNomination.mutate({ categoryId: category.id, nomineeId: id })}
                isPending={nominate.isPending}
              />
            );
          })}
        </>
      )}

      {/* ---------------- Selection ---------------- */}
      {phase === "selection" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <i className="fa-solid fa-list-check text-3xl text-gray-300 mb-3"></i>
          <p className="text-gray-600">
            Les organisateurs choisissent les finalistes.
            {settings?.voteStartAt && ` Le vote ouvre le ${formatWindowDate(parseApiDate(settings.voteStartAt)!)}.`}
          </p>
        </div>
      )}

      {/* ---------------- Vote ---------------- */}
      {phase === "vote" && (
        <>
          <p className="text-sm text-gray-500">
            {categories?.filter((c) => c.myVote).length ?? 0} / {categories?.length ?? 0} votés · scores cachés jusqu'à
            la cérémonie
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories?.map((category) => (
              <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="font-fraunces font-bold text-gray-900">{category.name}</h3>
                      {category.description && <p className="text-sm text-gray-500 mt-1">{category.description}</p>}
                    </div>
                  </div>
                  {category.myVote && (
                    <span className="text-success text-xs font-medium flex items-center gap-1">
                      <i className="fa-solid fa-check-circle"></i> Voté
                    </span>
                  )}
                </div>

                {category.myVote ? (
                  <p className="text-sm text-gray-500">Vote enregistré.</p>
                ) : confirmingVote === category.id ? (
                  <div role="alertdialog" className="border-2 border-award-gold rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-gray-900">
                      Confirmer votre vote pour{" "}
                      {category.finalists?.find((f) => f.id === voteSelections[category.id])?.name} ?
                    </p>
                    <p className="text-xs text-gray-500">Votre vote est définitif.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmVote(category)}
                        className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setConfirmingVote(null)}
                        className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium"
                      >
                        Revenir
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5" role="radiogroup" aria-label={`Finalistes pour ${category.name}`}>
                      {category.finalists?.map((candidate) => (
                        <button
                          key={candidate.id}
                          role="radio"
                          aria-checked={voteSelections[category.id] === candidate.id}
                          onClick={() => setVoteSelections((prev) => ({ ...prev, [category.id]: candidate.id }))}
                          className={`w-full min-h-[44px] text-left px-3 py-2 rounded-xl border text-sm transition-all ${
                            voteSelections[category.id] === candidate.id
                              ? "border-primary bg-primary/5 font-medium text-primary"
                              : "border-gray-200 text-gray-700"
                          }`}
                        >
                          {candidate.name}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setConfirmingVote(category.id)}
                      disabled={!voteSelections[category.id]}
                      className="w-full mt-3 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40"
                    >
                      Valider mon vote
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---------------- Ceremony pending: "Les nominés" ---------------- */}
      {phase === "ceremony_pending" && (
        <>
          <AwardCountdown
            target={settings?.ceremonySession ? parseApiDate(settings.ceremonySession.date) : null}
            label="Cérémonie dans"
          />
          <p className="text-white/80 text-sm -mt-2">Les lauréats seront dévoilés pendant la cérémonie.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...(categories || [])]
              .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
              .map((category) => (
                <div key={category.id} className="bg-award-ink rounded-2xl p-5 text-white border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{category.icon}</span>
                    <div>
                      <h3 className="font-fraunces font-medium">{category.name}</h3>
                      {category.description && <p className="text-xs text-white/60 mt-1">{category.description}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-white/60">{category.finalists?.map((f) => f.name).join(" · ")}</p>
                </div>
              ))}
          </div>
        </>
      )}

      {/* ---------------- Published: "Le palmarès" ---------------- */}
      {phase === "published" && (
        <>
          {!hasOfferedReplay && !replaying && (
            <div className="bg-award-cream-light border border-award-gold rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-700">Vous n'étiez pas à la séance ?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setReplaying(true);
                    setReplayIndex(0);
                  }}
                  className="px-4 py-2 rounded-xl bg-award-gold text-award-ink text-sm font-medium"
                >
                  Revivre la cérémonie
                </button>
              </div>
            </div>
          )}
          {replaying && (
            <button onClick={() => setReplaying(false)} className="text-sm text-gray-500 underline">
              Passer
            </button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedForReplay.map((category, index) => {
              const revealed = !replaying || index < replayIndex;
              return (
                <AwardWinnerCard
                  key={category.id}
                  category={{
                    id: category.id,
                    name: category.name || "",
                    description: category.description,
                    icon: category.icon,
                    isCoWinner: category.isCoWinner,
                    winners: (category.winners || []).map((w) => ({ id: w.id, name: w.name })),
                    finalists: (category.finalists || []).map((f) => ({ id: f.id, name: f.name })),
                  }}
                  revealed={revealed}
                  animate={replaying}
                />
              );
            })}
          </div>
          <p className="text-xs text-gray-400 text-center">
            Les lauréats ont reçu un badge permanent sur leur profil. Aucun score n'est affiché.
          </p>
        </>
      )}
    </div>
  );
};

export default Awards;
