import { useState } from "react";
import { AwardCategory, AwardNominationInfo, AwardTargetType } from "../../types/award";
import {
  useAwardNominationStats,
  useBuildShortlist,
  useCreateAwardCategory,
  useUpdateAwardCategory,
  useDeleteAwardCategory,
} from "../../services/hooks/useAwards";

export const CategoryEditForm = ({ category, onDone }: { category: AwardCategory; onDone: () => void }) => {
  const [name, setName] = useState(category.name || "");
  const [description, setDescription] = useState(category.description || "");
  const [icon, setIcon] = useState(category.icon || "");
  const updateCategory = useUpdateAwardCategory();

  const handleSave = () => {
    updateCategory.mutate({ id: category.id, data: { name, description, icon } }, { onSuccess: onDone });
  };

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      <input
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        placeholder="Emoji"
        className="w-20 px-3 py-2 border border-gray-300 rounded-xl text-sm text-center"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom de la catégorie"
        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={updateCategory.isPending}
          className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Enregistrer
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export const CategoryCreateForm = ({ onDone }: { onDone: () => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [targetType, setTargetType] = useState<AwardTargetType>("member");
  const createCategory = useCreateAwardCategory();

  const handleCreate = () => {
    if (!name.trim()) return;
    createCategory.mutate({ name, description, icon, targetType }, { onSuccess: onDone });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-primary/30 p-5 space-y-2">
      <h3 className="font-bold text-gray-900 mb-1">Nouvelle catégorie</h3>
      <div className="flex gap-2">
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="Emoji"
          className="w-20 px-3 py-2 border border-gray-300 rounded-xl text-sm text-center"
        />
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value as AwardTargetType)}
          className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
        >
          <option value="member">Membre</option>
          <option value="commission">Commission</option>
        </select>
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom de la catégorie (ex: Monsieur/Madame Discours)"
        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={!name.trim() || createCategory.isPending}
          className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          Créer
        </button>
        <button
          onClick={onDone}
          className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export const DeleteCategoryButton = ({ category }: { category: AwardCategory }) => {
  const deleteCategory = useDeleteAwardCategory();

  const handleDelete = () => {
    if (
      window.confirm(
        `Supprimer la catégorie "${category.name || "sans nom"}" ? Toutes ses propositions, candidats et votes seront définitivement supprimés. Cette action est irréversible.`,
      )
    ) {
      deleteCategory.mutate(category.id);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleteCategory.isPending}
      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
    >
      <i className="fa-solid fa-trash mr-1"></i>
      Supprimer
    </button>
  );
};

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
