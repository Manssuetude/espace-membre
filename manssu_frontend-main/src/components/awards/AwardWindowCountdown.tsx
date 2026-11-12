import { useEffect, useState } from "react";
import {
  EXTENSION_PRESETS,
  extensionError,
  formatWindowDate,
  splitDuration,
  toLocalInputValue,
} from "../../utils/awardWindow";

interface Props {
  // "les nominations" / "le vote" — used in the texts.
  subject: string;
  start: Date;
  end: Date;
  // Latest allowed end (nomination window cannot run into the vote window).
  limit?: Date | null;
  isPending: boolean;
  onExtend: (newEnd: Date) => void;
  // Called once when the countdown reaches zero, so the parent switches back to the date fields.
  onElapsed: () => void;
}

// Replaces the start/end fields while a window is running: live countdown to the end,
// plus quick extensions (+1 h, +1 day…) or a custom later end date.
export const AwardWindowCountdown = ({ subject, start, end, limit = null, isPending, onExtend, onElapsed }: Props) => {
  const [now, setNow] = useState(() => new Date());
  const [customEnd, setCustomEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = end.getTime() - now.getTime();
  useEffect(() => {
    if (remaining <= 0) onElapsed();
  }, [remaining <= 0, onElapsed]); // eslint-disable-line react-hooks/exhaustive-deps

  const { days, hours, minutes, seconds } = splitDuration(remaining);
  const endsSoon = remaining < 3_600_000;

  const extendTo = (newEnd: Date) => {
    const reason = extensionError(end, newEnd, limit);
    setError(reason);
    if (reason) return;
    if (window.confirm(`Prolonger ${subject} jusqu'au ${formatWindowDate(newEnd)} ?`)) {
      onExtend(newEnd);
      setCustomEnd("");
    }
  };

  const units = [
    { value: days, label: "j" },
    { value: hours, label: "h" },
    { value: minutes, label: "min" },
    { value: seconds, label: "s" },
  ];

  return (
    <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" aria-hidden="true"></span>
          En cours
        </span>
        <span className="text-xs text-gray-500">depuis le {formatWindowDate(start)}</span>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">Temps restant</p>
        <div
          className="flex flex-wrap gap-2"
          role="timer"
          aria-live="off"
          aria-label={`Fin le ${formatWindowDate(end)}`}
        >
          {units.map((unit) => (
            <div
              key={unit.label}
              className={`min-w-[64px] rounded-xl bg-white border px-3 py-2 text-center ${
                endsSoon ? "border-primary/40" : "border-gray-200"
              }`}
            >
              <span className={`block text-2xl font-bold tabular-nums ${endsSoon ? "text-primary" : "text-gray-900"}`}>
                {String(unit.value).padStart(2, "0")}
              </span>
              <span className="text-xs text-gray-500">{unit.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Se termine le {formatWindowDate(end)}</p>
      </div>

      <div className="border-t border-success/20 pt-3">
        <p className="text-xs font-medium text-gray-700 mb-2">Prolonger la fenêtre</p>
        <div className="flex flex-wrap gap-2">
          {EXTENSION_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={isPending}
              onClick={() => extendTo(new Date(end.getTime() + preset.ms))}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:border-success hover:text-success transition-colors disabled:opacity-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ou jusqu'au</label>
            <input
              type="datetime-local"
              value={customEnd}
              min={toLocalInputValue(end)}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
            />
          </div>
          <button
            type="button"
            disabled={isPending || !customEnd}
            onClick={() => extendTo(new Date(customEnd))}
            className="px-4 py-2 rounded-xl bg-success text-white text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-50"
          >
            Prolonger
          </button>
        </div>
        {error && <p className="text-xs text-primary mt-2">{error}</p>}
      </div>
    </div>
  );
};
