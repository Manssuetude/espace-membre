import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useAwardCategories,
  useAwardSettings,
  useNominate,
  useRemoveNomination,
  useVoteAward,
  useIsAwardCurator,
} from "../../services/hooks/useAwards";
import { useMembers } from "../../services/hooks/useMembers";
import { useCommissions } from "../../services/hooks/useCommissions";
import { AwardCategory } from "../../types/award";
import SearchableDropdown from "../../components/SearchableDropdown";
import { formatDateWithTime } from "../../utils/dateUtils";
import { AWARD_STATUS_BADGES } from "../../utils/awardStatus";

const Awards = () => {
  const { data: categories, isLoading } = useAwardCategories();
  const { data: settings } = useAwardSettings();
  const { data: membersData } = useMembers({ status: "active", limit: 100 });
  const { data: commissionsData } = useCommissions({ status: "active", limit: 100 });

  const { data: isCurator } = useIsAwardCurator();

  const nominate = useNominate();
  const removeNomination = useRemoveNomination();
  const vote = useVoteAward();

  const [nominationSelections, setNominationSelections] = useState<Record<string, string>>({});
  const [voteSelections, setVoteSelections] = useState<Record<string, string>>({});

  const members = membersData?.data || [];
  const commissions = commissionsData?.data || [];

  const handleNominate = (category: AwardCategory) => {
    const selectedId = nominationSelections[category.id];
    if (!selectedId) return;
    nominate.mutate(
      {
        categoryId: category.id,
        data:
          category.targetType === "member" ? { nominatedUserId: selectedId } : { nominatedCommissionId: selectedId },
      },
      { onSuccess: () => setNominationSelections((prev) => ({ ...prev, [category.id]: "" })) },
    );
  };

  const handleVote = (category: AwardCategory) => {
    const candidateId = voteSelections[category.id];
    if (!candidateId) return;
    vote.mutate({ categoryId: category.id, data: { candidateId } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <i className="fa-solid fa-trophy text-2xl"></i>
          <h1 className="text-xl font-bold">Awards Manssuétude</h1>
        </div>
        <p className="text-white/90 text-sm">
          Proposez vos candidats dans chaque catégorie, puis votez une fois la liste finale publiée.
        </p>
        {settings?.voteStartAt && settings?.voteEndAt && (
          <p className="text-white/80 text-xs mt-3">
            Vote du {formatDateWithTime(settings.voteStartAt)} au {formatDateWithTime(settings.voteEndAt)}
          </p>
        )}
      </div>

      {isCurator && (
        <Link
          to="/awards/curation"
          className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-accent/30 p-4 hover:border-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-list-check text-accent text-xl"></i>
            <div>
              <p className="font-medium text-gray-900 text-sm">Espace vie asso</p>
              <p className="text-xs text-gray-500">Clôturer les nominations et valider la liste finale par catégorie</p>
            </div>
          </div>
          <i className="fa-solid fa-chevron-right text-gray-400"></i>
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories?.map((category) => {
          const badge = AWARD_STATUS_BADGES[category.status];
          const options =
            category.targetType === "member"
              ? members.map((m) => ({ value: m.id, label: m.name }))
              : commissions.map((c) => ({ value: c.id, label: c.name }));

          return (
            <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{category.icon || "🏆"}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">{category.name}</h3>
                    {category.description && <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${badge.className}`}>
                  {badge.label}
                </span>
              </div>

              {/* Nomination phase */}
              {category.status === "nomination" && (
                <div className="mt-3 space-y-2">
                  {category.myNominations.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {category.myNominations.map((nom) => {
                        const nomineeId = nom.nominatedUserId || nom.nominatedCommissionId || "";
                        return (
                          <span
                            key={nomineeId}
                            className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full"
                          >
                            {nom.name}
                            <button
                              onClick={() => removeNomination.mutate({ categoryId: category.id, nomineeId })}
                              disabled={removeNomination.isPending}
                              className="hover:text-primary/70"
                              aria-label={`Retirer ${nom.name}`}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Vous n'avez pas encore proposé de candidat.</p>
                  )}
                  <SearchableDropdown
                    value={nominationSelections[category.id] ?? ""}
                    onChange={(value) => setNominationSelections((prev) => ({ ...prev, [category.id]: value }))}
                    options={options.filter(
                      (o) =>
                        !category.myNominations.some((n) => (n.nominatedUserId || n.nominatedCommissionId) === o.value),
                    )}
                    placeholder={
                      category.targetType === "member" ? "Rechercher un membre..." : "Rechercher une commission..."
                    }
                    allowCustom={false}
                  />
                  <button
                    onClick={() => handleNominate(category)}
                    disabled={!nominationSelections[category.id] || nominate.isPending}
                    className="w-full py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
                  >
                    Ajouter une proposition
                  </button>
                </div>
              )}

              {/* Curation phase */}
              {(category.status === "curation" || category.status === "vote_scheduled") && (
                <p className="text-sm text-gray-500 mt-3">
                  🗳️ Le vote arrive bientôt, préparez vos candidats !
                  {category.status === "vote_scheduled" && settings?.voteStartAt
                    ? ` Ouverture le ${formatDateWithTime(settings.voteStartAt)}.`
                    : ""}
                </p>
              )}

              {/* Vote open */}
              {category.status === "vote_open" && (
                <div className="mt-3 space-y-2">
                  {category.myVote ? (
                    <p className="text-sm text-success font-medium">
                      <i className="fa-solid fa-check-circle mr-1"></i>
                      Vous avez voté dans cette catégorie
                    </p>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        {category.candidates?.map((candidate) => (
                          <button
                            key={candidate.id}
                            onClick={() => setVoteSelections((prev) => ({ ...prev, [category.id]: candidate.id }))}
                            className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-all ${
                              voteSelections[category.id] === candidate.id
                                ? "border-primary bg-primary/5 font-medium text-primary"
                                : "border-gray-200 text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            {candidate.name}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleVote(category)}
                        disabled={!voteSelections[category.id] || vote.isPending}
                        className="w-full py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
                      >
                        Voter
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Vote closed, awaiting publication */}
              {category.status === "vote_closed" && (
                <p className="text-sm text-gray-500 mt-3">Vote clôturé, résultats à venir.</p>
              )}

              {/* Results published */}
              {category.status === "results_published" && category.candidates && (
                <div className="mt-3 space-y-2">
                  {[...category.candidates]
                    .sort((a, b) => b.votes - a.votes)
                    .map((candidate, index) => (
                      <div key={candidate.id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className={index === 0 ? "font-bold text-gray-900" : "text-gray-600"}>
                            {index === 0 && "🏆 "}
                            {candidate.name}
                          </span>
                          <span className="text-gray-500">
                            {candidate.votes} vote{candidate.votes > 1 ? "s" : ""} ({candidate.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${index === 0 ? "bg-primary" : "bg-gray-300"}`}
                            style={{ width: `${candidate.percentage}%` }}
                          />
                        </div>
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

export default Awards;
