import { useState } from "react";
import { AwardCategory, AwardNominationInfo } from "../../types/award";
import { useAwardNominationStats, useBuildShortlist } from "../../services/hooks/useAwards";

export const CurationPanel = ({ category }: { category: AwardCategory }) => {
  const { data: stats, isLoading } = useAwardNominationStats(category.id);
  const buildShortlist = useBuildShortlist();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (item: AwardNominationInfo) => {
    const key = item.nominatedUserId || item.nominatedCommissionId || "";
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleValidate = () => {
    const candidates = (stats || [])
      .filter((item) => selected.has(item.nominatedUserId || item.nominatedCommissionId || ""))
      .map((item) =>
        item.nominatedUserId
          ? { nominatedUserId: item.nominatedUserId }
          : { nominatedCommissionId: item.nominatedCommissionId as string },
      );
    buildShortlist.mutate({ categoryId: category.id, data: { candidates } });
  };

  if (isLoading) return <p className="text-sm text-gray-400 mt-3">Chargement des propositions...</p>;
  if (!stats || stats.length === 0) return <p className="text-sm text-gray-400 mt-3">Aucune proposition reçue.</p>;

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      {stats.map((item) => {
        const key = item.nominatedUserId || item.nominatedCommissionId || "";
        return (
          <label
            key={key}
            className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 px-3 py-2 rounded-xl border border-gray-200 cursor-pointer hover:border-gray-300"
          >
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="checkbox"
                checked={selected.has(key)}
                onChange={() => toggle(item)}
                className="accent-primary shrink-0"
              />
              <span className="text-sm font-medium text-gray-900 break-words">{item.name}</span>
            </div>
            <span className="text-xs text-gray-500 break-words">
              {item.count} proposition{item.count > 1 ? "s" : ""}
              {item.proposedBy.length > 0 && ` (${item.proposedBy.join(", ")})`}
            </span>
          </label>
        );
      })}
      <button
        onClick={handleValidate}
        disabled={selected.size === 0 || buildShortlist.isPending}
        className="w-full py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
      >
        Valider la liste finale ({selected.size})
      </button>
    </div>
  );
};
