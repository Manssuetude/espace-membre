import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCeremonyPreparation, useSaveCeremonyPreparation } from "../../services/hooks/useAwards";
import { useAwardFont } from "../../components/awards/useAwardFont";
import { PreparationCategoryItem, TieBreakResolution } from "../../types/award";

const AwardCeremonyPreparation = () => {
  useAwardFont();
  const navigate = useNavigate();
  const { data: preparation, isLoading, isError } = useCeremonyPreparation();
  const saveCeremonyPreparation = useSaveCeremonyPreparation();

  const [order, setOrder] = useState<string[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, TieBreakResolution>>({});
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    if (!preparation) return;
    setOrder(preparation.map((c) => c.id));
    const initial: Record<string, TieBreakResolution> = {};
    preparation.forEach((c) => {
      if (c.resolution) initial[c.id] = c.resolution;
    });
    setResolutions(initial);
  }, [preparation]);

  const byId = (preparation || []).reduce<Record<string, PreparationCategoryItem>>((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {});

  const move = (id: string, delta: number) => {
    setOrder((prev) => {
      const index = prev.indexOf(id);
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setOrder((prev) => {
      const next = prev.filter((id) => id !== dragId);
      const targetIndex = next.indexOf(targetId);
      next.splice(targetIndex, 0, dragId);
      return next;
    });
    setDragId(null);
  };

  const ties = order.map((id) => byId[id]).filter((c) => c?.tie);
  const unresolvedCount = ties.filter((c) => !resolutions[c.id]).length;

  const handleSave = (andLaunch: boolean) => {
    saveCeremonyPreparation.mutate(
      { order, resolutions },
      {
        onSuccess: () => {
          if (andLaunch) navigate("/admin/awards/ceremonie");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-primary"></i>
      </div>
    );
  }

  if (isError || !preparation || preparation.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Aucune catégorie n'est en attente de cérémonie (le vote doit être clos).</p>
        <Link to="/admin/awards" className="text-primary text-sm font-medium mt-3 inline-block">
          ← Pilotage des Awards
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/awards" className="text-sm text-gray-500 hover:text-gray-700">
        ← Pilotage des Awards
      </Link>
      <h1 className="font-fraunces text-2xl font-bold text-gray-900">Préparer la cérémonie</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">1. Trancher les égalités</h2>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${unresolvedCount > 0 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}
            >
              {unresolvedCount > 0 ? `${unresolvedCount} à trancher` : "Tranchée"}
            </span>
          </div>
          {ties.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune égalité.</p>
          ) : (
            <div className="space-y-4">
              {ties.map((category) => {
                const topVotes = Math.max(...category.candidates.map((c) => c.votes));
                const tied = category.candidates.filter((c) => c.votes === topVotes);
                const resolution = resolutions[category.id];
                return (
                  <div key={category.id} className="bg-warning/5 border border-warning/30 rounded-xl p-3">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {category.icon} {category.name}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {tied.map((c) => c.name).join(" et ")} : {topVotes} vote{topVotes > 1 ? "s" : ""} chacun
                    </p>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={resolution?.mode === "co_winners"}
                          onChange={() =>
                            setResolutions((prev) => ({ ...prev, [category.id]: { mode: "co_winners" } }))
                          }
                        />
                        Co-lauréats
                      </label>
                      {tied.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            checked={resolution?.mode === "winner" && resolution.candidateId === c.id}
                            onChange={() =>
                              setResolutions((prev) => ({
                                ...prev,
                                [category.id]: { mode: "winner", candidateId: c.id },
                              }))
                            }
                          />
                          Désigner {c.name}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-1">2. Ordre de passage</h2>
          <p className="text-xs text-gray-500 mb-3">
            Glissez les prix, ou utilisez les flèches. Le dernier prix clôt la cérémonie.
          </p>
          <ol className="space-y-1.5">
            {order.map((id, index) => {
              const category = byId[id];
              if (!category) return null;
              const isLast = index === order.length - 1;
              return (
                <li
                  key={id}
                  draggable
                  onDragStart={() => setDragId(id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
                    isLast ? "bg-award-cream-light border-award-gold" : "bg-white border-gray-200"
                  }`}
                >
                  <i className="fa-solid fa-grip-vertical text-gray-300 cursor-grab"></i>
                  <span className="text-gray-400 w-5">{index + 1}</span>
                  <span>{category.icon}</span>
                  <span className="flex-1 truncate">{category.name}</span>
                  <button
                    aria-label="Monter"
                    onClick={() => move(id, -1)}
                    disabled={index === 0}
                    className="text-gray-400 disabled:opacity-30 px-1"
                  >
                    <i className="fa-solid fa-chevron-up"></i>
                  </button>
                  <button
                    aria-label="Descendre"
                    onClick={() => move(id, 1)}
                    disabled={isLast}
                    className="text-gray-400 disabled:opacity-30 px-1"
                  >
                    <i className="fa-solid fa-chevron-down"></i>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <p className="text-sm text-gray-600">
          {unresolvedCount > 0
            ? "Tranchez l'égalité avant de lancer la cérémonie."
            : "Tout est prêt. Les membres ne voient encore rien."}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saveCeremonyPreparation.isPending}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium"
          >
            Enregistrer
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={unresolvedCount > 0 || saveCeremonyPreparation.isPending}
            className="px-4 py-2 rounded-xl bg-award-ink text-award-gold-light text-sm font-medium disabled:opacity-40"
          >
            Lancer le mode cérémonie
          </button>
        </div>
      </div>
    </div>
  );
};

export default AwardCeremonyPreparation;
