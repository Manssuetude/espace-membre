import { LibraryWishlistItem } from "../../../types/bibliotheque";

interface LibraryWishlistTabProps {
  wishlistItems: LibraryWishlistItem[];
  loadingWishlist: boolean;
  newWishlistForm: {
    title: string;
    author: string;
    category: string;
    comment: string;
  };
  isCreating: boolean;
  onNewWishlistFieldChange: (field: "title" | "author" | "category" | "comment", value: string) => void;
  onCreateWishlist: () => void;
  onToggleWishlistItem: (itemId: string, isActive: boolean) => void;
  onDeleteWishlistItem: (itemId: string) => void;
}

const LibraryWishlistTab = ({
  wishlistItems,
  loadingWishlist,
  newWishlistForm,
  isCreating,
  onNewWishlistFieldChange,
  onCreateWishlist,
  onToggleWishlistItem,
  onDeleteWishlistItem,
}: LibraryWishlistTabProps) => {
  return (
    <section className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Ajouter un souhait</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreateWishlist();
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              required
              value={newWishlistForm.title}
              onChange={(e) => onNewWishlistFieldChange("title", e.target.value)}
              placeholder="Titre"
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
            />
            <input
              value={newWishlistForm.author}
              onChange={(e) => onNewWishlistFieldChange("author", e.target.value)}
              placeholder="Auteur"
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
            />
            <input
              value={newWishlistForm.category}
              onChange={(e) => onNewWishlistFieldChange("category", e.target.value)}
              placeholder="Catégorie"
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
            />
          </div>
          <textarea
            value={newWishlistForm.comment}
            onChange={(e) => onNewWishlistFieldChange("comment", e.target.value)}
            placeholder="Commentaire"
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm min-h-[70px]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="px-3 py-2 rounded-lg text-sm bg-gradient-to-r from-primary to-red-500 text-white disabled:opacity-60"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Mes souhaits</h2>
        {loadingWishlist ? (
          <div className="flex justify-center py-8">
            <i className="fa-solid fa-spinner fa-spin text-primary"></i>
          </div>
        ) : wishlistItems.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun souhait pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {wishlistItems.map((item) => (
              <div key={item.id} className="p-3 rounded-xl border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600">
                      {item.author || "Auteur inconnu"} • {item.category || "Sans catégorie"}
                    </p>
                    {item.comment && <p className="text-xs text-gray-500 mt-1">{item.comment}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onToggleWishlistItem(item.id, item.isActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        item.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {item.isActive ? "Actif" : "Inactif"}
                    </button>
                    <button
                      onClick={() => onDeleteWishlistItem(item.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 text-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LibraryWishlistTab;
