import { useEffect, useState } from "react";
import { splitDuration } from "../../utils/awardWindow";

interface AwardCountdownProps {
  target: Date | null;
  label: string;
  compact?: boolean;
}

/** 3-box day/hour/minute countdown, accessible as a timer, recalculated every minute. */
const AwardCountdown = ({ target, label, compact = false }: AwardCountdownProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!target) return null;
  const ms = target.getTime() - now.getTime();
  const { days, hours, minutes } = splitDuration(Math.max(0, ms));
  const ariaLabel = `${label} : ${days} jours, ${hours} heures, ${minutes} minutes`;

  return (
    <div role="timer" aria-label={ariaLabel} className={compact ? "flex items-center gap-2" : "flex flex-col gap-2"}>
      {!compact && <p className="text-xs text-white/70">{label}</p>}
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[
          { value: days, unit: "j" },
          { value: hours, unit: "h" },
          { value: minutes, unit: "min" },
        ].map(({ value, unit }) => (
          <div key={unit} className="flex items-baseline gap-1 bg-white/10 rounded-lg px-2 py-1">
            <span className={compact ? "text-sm font-bold text-white" : "text-lg font-bold text-white"}>
              {String(value).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-white/70">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AwardCountdown;
