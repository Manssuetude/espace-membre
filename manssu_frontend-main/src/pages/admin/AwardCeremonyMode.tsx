import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCeremony, useAwardSettings } from "../../services/hooks/useAwards";
import PublishResultsModal from "../../components/awards/PublishResultsModal";
import { getErrorMessage } from "../../utils/errorUtils";

type Stage = "intro" | "finalists" | "suspense" | "reveal";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const AwardCeremonyMode = () => {
  const navigate = useNavigate();
  const { data: categories, isLoading, isError, error } = useCeremony();
  const { data: settings } = useAwardSettings();

  const [categoryIndex, setCategoryIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("intro");
  const [finalistCount, setFinalistCount] = useState(0);
  const [showEnd, setShowEnd] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [confirmingExit, setConfirmingExit] = useState(false);

  const category = categories?.[categoryIndex];

  // Auto-advance from "suspense" to "reveal" after ~1.5s
  useEffect(() => {
    if (stage !== "suspense") return;
    const timeout = setTimeout(() => setStage("reveal"), prefersReducedMotion() ? 200 : 1500);
    return () => clearTimeout(timeout);
  }, [stage]);

  const goNext = useCallback(() => {
    if (!categories || !category) return;
    if (stage === "intro") {
      setStage("finalists");
      setFinalistCount(1);
      return;
    }
    if (stage === "finalists") {
      if (finalistCount < category.finalists.length) {
        setFinalistCount((n) => n + 1);
      } else {
        setStage("suspense");
      }
      return;
    }
    if (stage === "suspense") {
      setStage("reveal");
      return;
    }
    // stage === "reveal" -> next category, or end
    if (categoryIndex < categories.length - 1) {
      setCategoryIndex((i) => i + 1);
      setStage("intro");
      setFinalistCount(0);
    } else {
      setShowEnd(true);
    }
  }, [categories, category, stage, finalistCount, categoryIndex]);

  const goPrev = useCallback(() => {
    if (showEnd) {
      setShowEnd(false);
      setStage("reveal");
      return;
    }
    if (stage === "finalists" && finalistCount > 1) {
      setFinalistCount((n) => n - 1);
      return;
    }
    if (stage === "finalists" && finalistCount <= 1) {
      setStage("intro");
      return;
    }
    if (stage === "suspense") {
      setStage("finalists");
      setFinalistCount(category?.finalists.length ?? 0);
      return;
    }
    if (stage === "reveal") {
      setStage("suspense");
      return;
    }
    if (stage === "intro" && categoryIndex > 0) {
      setCategoryIndex((i) => i - 1);
      setStage("reveal");
    }
  }, [showEnd, stage, finalistCount, category, categoryIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        setConfirmingExit(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const handleFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-award-ink flex items-center justify-center">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-award-gold"></i>
      </div>
    );
  }

  if (isError) {
    const message = getErrorMessage(error, "Une égalité reste non tranchée.");
    return (
      <div className="fixed inset-0 bg-award-ink flex items-center justify-center p-6">
        <div className="text-center text-white max-w-md">
          <p className="mb-3">{message}</p>
          <Link to="/admin/awards/ceremonie/preparation" className="text-award-gold underline">
            Aller à la préparation
          </Link>
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0 || !category) {
    return (
      <div className="fixed inset-0 bg-award-ink flex items-center justify-center text-white">
        Aucune catégorie à projeter.
      </div>
    );
  }

  const reduced = prefersReducedMotion();
  const transitionClass = reduced ? "transition-opacity duration-200" : "transition-all duration-500";

  return (
    <div className="fixed inset-0 bg-award-ink text-white flex flex-col font-inter">
      <header className="flex items-center justify-between p-4 text-sm text-white/60">
        <span>Awards Manssuétude {settings?.editionYear}</span>
        <div className="flex items-center gap-3">
          <span>
            Prix {categoryIndex + 1} sur {categories.length}
          </span>
          <button onClick={handleFullscreen} className="text-white/60 hover:text-white">
            <i className="fa-solid fa-expand"></i> Plein écran
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 text-center">
        {showEnd ? (
          <div className={`${transitionClass} space-y-6`}>
            <h1 className="font-fraunces text-4xl font-bold">Merci à toutes et à tous</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-sm">
              {categories.map((c) => (
                <div key={c.id} className="bg-white/5 rounded-xl p-3">
                  <p className="text-white/50">
                    {c.icon} {c.name}
                  </p>
                  <p className="font-medium">{c.winners.map((w) => w.name).join(" & ")}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowPublish(true)}
              className="px-6 py-3 rounded-xl bg-award-gold text-award-ink font-bold"
            >
              Terminer et publier les résultats
            </button>
          </div>
        ) : stage === "intro" ? (
          <div className={`${transitionClass} space-y-4`}>
            <div className="w-32 h-32 mx-auto rounded-full border-4 border-award-gold flex items-center justify-center text-6xl">
              {category.icon}
            </div>
            <p className="text-award-gold-light uppercase tracking-wide text-sm">Prix {categoryIndex + 1}</p>
            <h1 className="font-fraunces text-5xl font-bold">{category.name}</h1>
            {category.description && <p className="text-white/60 max-w-md mx-auto">{category.description}</p>}
          </div>
        ) : stage === "finalists" ? (
          <div className="space-y-6">
            <p className="font-fraunces text-2xl">{category.icon} Les finalistes sont…</p>
            <div className="flex flex-wrap justify-center gap-4">
              {category.finalists.slice(0, finalistCount).map((f) => (
                <div key={f.id} className={`${transitionClass} bg-white/10 rounded-xl px-6 py-4 animate-award-fade-up`}>
                  <p className="font-medium text-lg">{f.name}</p>
                </div>
              ))}
            </div>
          </div>
        ) : stage === "suspense" ? (
          <div className="space-y-4">
            <div
              className={`w-28 h-28 mx-auto rounded-full border-4 border-award-gold flex items-center justify-center text-5xl ${
                reduced ? "" : "animate-award-pulse"
              }`}
            >
              <span className={reduced ? "" : "animate-award-spin-slow inline-block"}>{category.icon}</span>
            </div>
            <p className="font-fraunces text-2xl">Et le prix revient à…</p>
          </div>
        ) : (
          <div className={`${transitionClass} space-y-3`}>
            <p className="text-award-gold-light uppercase tracking-wide text-sm">
              {category.name} · {category.isCoWinner ? "Co-lauréats" : "Lauréat·e"}
            </p>
            <h1 className="font-fraunces text-6xl font-bold text-award-gold">
              {category.winners.map((w) => w.name).join(" & ")}
            </h1>
          </div>
        )}
      </main>

      <footer className="flex items-center justify-between p-4 text-sm text-white/40">
        <button onClick={goPrev} className="px-3 py-2 rounded-lg hover:bg-white/5">
          ← Précédent
        </button>
        <span>flèches du clavier ou télécommande de présentation · Échap pour quitter</span>
        <button onClick={goNext} className="px-3 py-2 rounded-lg hover:bg-white/5">
          Suivant →
        </button>
      </footer>

      {confirmingExit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-award-ink border border-white/10 rounded-2xl p-5 text-center space-y-3">
            <p>Quitter le mode cérémonie ?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmingExit(false)} className="px-4 py-2 rounded-xl bg-white/10 text-sm">
                Annuler
              </button>
              <button
                onClick={() => navigate("/admin/awards")}
                className="px-4 py-2 rounded-xl bg-award-gold text-award-ink text-sm font-medium"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}

      <PublishResultsModal
        open={showPublish}
        onClose={() => setShowPublish(false)}
        emailMode={settings?.emailMode ?? "off"}
      />
    </div>
  );
};

export default AwardCeremonyMode;
