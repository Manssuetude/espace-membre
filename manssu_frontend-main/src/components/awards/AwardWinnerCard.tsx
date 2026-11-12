import { useEffect, useMemo, useRef, useState } from "react";

interface WinnerCardCategory {
  id: string;
  name: string;
  icon: string | null;
  winners: { id: string; name: string }[];
  finalists: { id: string; name: string }[];
  isCoWinner: boolean;
}

interface AwardWinnerCardProps {
  category: WinnerCardCategory;
  /** If false, renders a dark locked placeholder instead of the winner. */
  revealed: boolean;
  /** Plays the flip/shine/confetti reveal once when the card transitions to revealed=true. */
  animate?: boolean;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const Confetti = ({ wide }: { wide: boolean }) => {
  const particles = useMemo(() => {
    const count = wide ? 28 : 18;
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const distance = 60 + Math.random() * 60;
      return {
        id: i,
        tx: `${Math.cos(angle) * distance}px`,
        ty: `${Math.sin(angle) * distance - 20}px`,
        color: i % 3 === 0 ? "#C9A227" : i % 3 === 1 ? "#E7C766" : "#FFFBEB",
        delay: Math.random() * 0.15,
      };
    });
  }, [wide]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute w-1.5 h-1.5 rounded-full animate-award-confetti"
          style={
            {
              backgroundColor: p.color,
              "--award-tx": p.tx,
              "--award-ty": p.ty,
              animationDelay: `${p.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

const AwardWinnerCard = ({ category, revealed, animate = false }: AwardWinnerCardProps) => {
  const [showEffects, setShowEffects] = useState(false);
  const hasPlayedRef = useRef(false);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (revealed && animate && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      if (!reduced) {
        setShowEffects(true);
        const timeout = setTimeout(() => setShowEffects(false), 1300);
        return () => clearTimeout(timeout);
      }
    }
  }, [revealed, animate, reduced]);

  if (!revealed) {
    return (
      <div className="bg-award-ink rounded-2xl p-5 border border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl opacity-40">{category.icon || "🏆"}</span>
          <h3 className="font-fraunces text-white/70">{category.name}</h3>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-award-cream-light border-2 border-award-gold rounded-2xl p-5 overflow-hidden ${
        animate ? (reduced ? "motion-reduce:animate-award-fade-up" : "animate-award-flip") : ""
      }`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {showEffects && !reduced && (
        <>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-award-shine" />
          </div>
          <Confetti wide={category.isCoWinner} />
        </>
      )}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{category.icon || "🏆"}</span>
        <div>
          <p className="text-xs font-medium text-award-gold-text uppercase tracking-wide">
            {category.name} · {category.isCoWinner ? "Co-lauréats" : "Lauréat·e"}
          </p>
          <h3 className="font-fraunces text-xl font-bold text-gray-900">
            {category.winners.map((w) => w.name).join(" & ")}
          </h3>
        </div>
      </div>
      {category.finalists.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">Finalistes : {category.finalists.map((f) => f.name).join(", ")}</p>
      )}
    </div>
  );
};

export default AwardWinnerCard;
