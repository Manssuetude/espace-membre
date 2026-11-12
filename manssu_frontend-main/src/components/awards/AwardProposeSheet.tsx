import { useEffect, useState } from "react";
import SearchableDropdown from "../SearchableDropdown";

interface AwardProposeSheetProps {
  open: boolean;
  onClose: () => void;
  categoryName: string;
  categoryDescription?: string | null;
  targetLabel: string; // "Rechercher un membre..." / "Rechercher une commission..."
  options: { value: string; label: string }[];
  myNominations: { id: string; name: string }[];
  onPropose: (id: string) => void;
  onRemove: (id: string) => void;
  isPending: boolean;
}

/** Mobile bottom sheet to propose a candidate, matching the "feuille qui monte du bas" from the mockups. */
const AwardProposeSheet = ({
  open,
  onClose,
  categoryName,
  categoryDescription,
  targetLabel,
  options,
  myNominations,
  onPropose,
  onRemove,
  isPending,
}: AwardProposeSheetProps) => {
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (open) setSelected("");
  }, [open]);

  if (!open) return null;

  const availableOptions = options.filter((o) => !myNominations.some((n) => n.id === o.value));

  const handlePropose = () => {
    if (!selected) return;
    onPropose(selected);
    setSelected("");
  };

  return (
    <div
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={`Proposer pour ${categoryName}`}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-5 pb-8 max-h-[80vh] overflow-y-auto transition-transform duration-300">
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>
        <h3 className="font-fraunces text-lg font-bold text-gray-900">{categoryName}</h3>
        {categoryDescription && <p className="text-sm text-gray-500 mt-1">{categoryDescription}</p>}
        <div className="mb-3" />

        {myNominations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {myNominations.map((n) => (
              <span
                key={n.id}
                className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {n.name}
                <button
                  onClick={() => onRemove(n.id)}
                  aria-label={`Retirer ${n.name}`}
                  className="hover:text-primary/70"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </span>
            ))}
          </div>
        )}

        <SearchableDropdown
          value={selected}
          onChange={setSelected}
          options={availableOptions}
          placeholder={targetLabel}
          allowCustom={false}
        />
        <button
          onClick={handlePropose}
          disabled={!selected || isPending}
          className="w-full mt-3 py-3 min-h-[44px] rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40"
        >
          Proposer
        </button>
        <p className="text-xs text-gray-400 mt-3 text-center">Vos propositions restent privées.</p>
      </div>
    </div>
  );
};

export default AwardProposeSheet;
