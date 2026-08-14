import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  useAcceptLibraryRequest,
  useCancelLibraryRequest,
  useCreateLibraryLoan,
  useDeleteLibraryBook,
  useExpireLibraryRequest,
  useLibraryBook,
  useLibraryBookRequests,
  useRequestLibraryBook,
  useUpdateLibraryBook,
  useUpdateLibraryBookAvailability,
} from "../../services/hooks/useLibrary";
import { LibraryBookCategory, LibraryBookRequest } from "../../types/bibliotheque";
import {
  LIBRARY_BOOK_CATEGORY_OPTIONS,
  getLibraryCategoryLabel,
  getLibraryStatusLabel,
} from "../../utils/libraryUtils";
import Dropdown from "../../components/Dropdown";

const statusColorMap: Record<string, string> = {
  available: "bg-green-100 text-green-700 border border-green-200",
  loaned: "bg-amber-100 text-amber-700 border border-amber-200",
  paused: "bg-gray-200 text-gray-700 border border-gray-300",
  queued: "bg-blue-100 text-blue-700 border border-blue-200",
  offered: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  accepted: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  expired: "bg-gray-200 text-gray-700 border border-gray-300",
  cancelled: "bg-red-100 text-red-700 border border-red-200",
  fulfilled: "bg-purple-100 text-purple-700 border border-purple-200",
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Non défini";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getOfferCountdown = (offerExpiresAt?: string | null) => {
  if (!offerExpiresAt) return null;
  const diff = new Date(offerExpiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expiré";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `Expire dans ${hours}h ${minutes}m`;
};

const getBookImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return "/logo.png";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  const backend = import.meta.env.VITE_BACKEND_URL || "";
  const normalized = imageUrl.startsWith("./") ? imageUrl.slice(1) : imageUrl;
  return `${backend}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
};

const getMemberDisplayName = (member?: { name?: string; firstName?: string; lastName?: string; email?: string }) => {
  return member?.name || `${member?.firstName || ""} ${member?.lastName || ""}`.trim() || member?.email || "Membre";
};

const getAvailabilityModeLabel = (mode?: string | null) => {
  if (!mode) return null;
  const labels: Record<string, string> = {
    always: "Toujours disponible",
    from_date: "Disponible à partir d’une date",
    paused: "En pause",
  };
  return labels[mode] || mode;
};

interface EditBookFormState {
  title: string;
  author: string;
  category: LibraryBookCategory | "";
  description: string;
  language: string;
  defaultLoanDays: number;
  pageCount: number | "";
  image: File | null;
}

const BibliothequeBookDetail = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dueDaysByRequest, setDueDaysByRequest] = useState<Record<string, number>>({});
  const [showEditForm, setShowEditForm] = useState(false);
  const [editBookForm, setEditBookForm] = useState<EditBookFormState>({
    title: "",
    author: "",
    category: "",
    description: "",
    language: "FR",
    defaultLoanDays: 21,
    pageCount: "",
    image: null,
  });

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const { data: book, isLoading: loadingBook } = useLibraryBook(id);
  const isOwner = book?.ownerId === user?.id;

  const { data: requests, isLoading: loadingRequests } = useLibraryBookRequests(id, Boolean(isOwner));

  const requestBookMutation = useRequestLibraryBook();
  const acceptRequestMutation = useAcceptLibraryRequest();
  const cancelRequestMutation = useCancelLibraryRequest();
  const expireRequestMutation = useExpireLibraryRequest();
  const createLoanMutation = useCreateLibraryLoan();
  const updateBookAvailabilityMutation = useUpdateLibraryBookAvailability();
  const updateBookMutation = useUpdateLibraryBook();
  const deleteBookMutation = useDeleteLibraryBook();

  const sortedRequests = useMemo(() => {
    return [...(requests || [])].sort(
      (a: LibraryBookRequest, b: LibraryBookRequest) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [requests]);

  const myRequests = useMemo(() => {
    if (!user?.id) return [] as LibraryBookRequest[];
    return sortedRequests.filter((request) => (request.borrowerId || request.requesterId) === user.id);
  }, [sortedRequests, user?.id]);

  const visibleRequests = isOwner ? sortedRequests : myRequests;

  if (loadingBook) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <p className="text-gray-700">Livre introuvable.</p>
        <Link to="/association/bibliotheque" className="text-primary text-sm mt-3 inline-block">
          Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  const ownerDisplayName = getMemberDisplayName(book.owner);
  const availabilityModeLabel = getAvailabilityModeLabel(book.availabilityMode);
  const shouldShowAvailabilityMode = Boolean(availabilityModeLabel);
  const shouldShowCondition = Boolean(book.condition);
  const shouldShowAvailableFrom = Boolean(book.availableFrom);

  const handleOpenEditForm = () => {
    setEditBookForm({
      title: book.title || "",
      author: book.author || "",
      category: book.category || "",
      description: book.description || "",
      language: book.language || "FR",
      defaultLoanDays: book.defaultLoanDays || 21,
      pageCount: book.pageCount ?? "",
      image: null,
    });
    setShowEditForm(true);
  };

  const handleUpdateBook = () => {
    if (!editBookForm.title.trim() || !editBookForm.author.trim()) return;
    updateBookMutation.mutate(
      {
        bookId: book.id,
        data: {
          title: editBookForm.title.trim(),
          author: editBookForm.author.trim(),
          category: editBookForm.category || undefined,
          description: editBookForm.description.trim() || undefined,
          language: editBookForm.language.trim() || undefined,
          defaultLoanDays: editBookForm.defaultLoanDays,
          pageCount: editBookForm.pageCount === "" ? undefined : Number(editBookForm.pageCount),
          image: editBookForm.image || undefined,
        },
      },
      {
        onSuccess: () => setShowEditForm(false),
      },
    );
  };

  const handleDeleteBook = () => {
    if (!window.confirm("Supprimer ce livre ? Cette action est définitive.")) return;
    deleteBookMutation.mutate(book.id, {
      onSuccess: () => navigate("/association/bibliotheque"),
    });
  };

  return (
    <div className="space-y-6">
      <Link to="/association/bibliotheque" className="inline-flex items-center text-sm text-primary hover:underline">
        <i className="fa-solid fa-arrow-left mr-2"></i>
        Retour à la bibliothèque
      </Link>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-[260px,minmax(0,1fr)] gap-4 items-start">
          <aside className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm aspect-[3/4] bg-slate-100">
              <img src={getBookImageUrl(book.imageUrl)} alt={book.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3">
                <h1 className="text-lg font-bold text-white line-clamp-2 drop-shadow">{book.title}</h1>
                <p className="text-xs text-white/90 line-clamp-1">{book.author}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-500">
              <p>Ajouté le {formatDateTime(book.createdAt)}</p>
              <p className="mt-1">Mis à jour le {formatDateTime(book.updatedAt)}</p>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{book.title}</h2>
                  <p className="text-base text-gray-600 mt-1">{book.author}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Propriétaire: <span className="font-medium text-gray-700">{ownerDisplayName}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {book.status !== "available" && (
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColorMap[book.status] || "bg-gray-100 text-gray-700"}`}
                    >
                      {getLibraryStatusLabel(book.status)}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    {getLibraryCategoryLabel(book.category)}
                  </span>
                  {book.isAvailableNow && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                      Disponible maintenant
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {!isOwner && (
                  <button
                    onClick={() => requestBookMutation.mutate(book.id)}
                    disabled={requestBookMutation.isPending}
                    className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-accent to-blue-600 text-white disabled:opacity-60"
                  >
                    <i className="fa-solid fa-hand mr-2"></i>
                    {book.isAvailableNow ? "Demander ce livre" : "S'inscrire en liste d'attente"}
                  </button>
                )}

                {isOwner && (
                  <>
                    <button
                      onClick={() =>
                        updateBookAvailabilityMutation.mutate({
                          bookId: book.id,
                          data: {
                            availabilityMode: book.availabilityMode === "paused" ? "always" : "paused",
                            availableFrom: null,
                            status: book.availabilityMode === "paused" ? "available" : "paused",
                          },
                        })
                      }
                      className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700"
                    >
                      <i className={`fa-solid ${book.availabilityMode === "paused" ? "fa-play" : "fa-pause"} mr-2`}></i>
                      {book.availabilityMode === "paused" ? "Reprendre" : "Mettre en pause"}
                    </button>
                    <button
                      onClick={handleOpenEditForm}
                      className="px-4 py-2 rounded-lg text-sm bg-blue-100 text-blue-700"
                    >
                      <i className="fa-solid fa-pen mr-2"></i>
                      Modifier
                    </button>
                    <button onClick={handleDeleteBook} className="px-4 py-2 rounded-lg text-sm bg-red-100 text-red-700">
                      <i className="fa-solid fa-trash mr-2"></i>
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h2 className="font-semibold text-gray-900 mb-2">À propos du livre</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {book.description || "Aucune description fournie."}
              </p>
              {book.comment && <p className="text-sm text-gray-600 mt-3 italic">Note: {book.comment}</p>}
            </div>

            {showEditForm && isOwner && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleUpdateBook();
                }}
                className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-blue-900">Modifier le livre</h3>
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="text-xs text-blue-700 hover:underline"
                  >
                    Fermer
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={editBookForm.title}
                    onChange={(event) => setEditBookForm((prev) => ({ ...prev, title: event.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    placeholder="Titre"
                    required
                  />
                  <input
                    value={editBookForm.author}
                    onChange={(event) => setEditBookForm((prev) => ({ ...prev, author: event.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    placeholder="Auteur"
                    required
                  />
                  <Dropdown
                    options={LIBRARY_BOOK_CATEGORY_OPTIONS}
                    value={editBookForm.category}
                    onChange={(event) =>
                      setEditBookForm((prev) => ({
                        ...prev,
                        category: (event.target.value as LibraryBookCategory | "") || "",
                      }))
                    }
                    placeholder="Catégorie"
                    className="w-full"
                  />
                  <input
                    value={editBookForm.language}
                    onChange={(event) => setEditBookForm((prev) => ({ ...prev, language: event.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    placeholder="Langue"
                  />
                  <input
                    type="number"
                    min={7}
                    max={90}
                    value={editBookForm.defaultLoanDays}
                    onChange={(event) =>
                      setEditBookForm((prev) => ({
                        ...prev,
                        defaultLoanDays: Math.max(7, Math.min(90, Number(event.target.value) || 21)),
                      }))
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    placeholder="Durée de prêt"
                  />
                  <input
                    type="number"
                    min={1}
                    value={editBookForm.pageCount}
                    onChange={(event) =>
                      setEditBookForm((prev) => ({
                        ...prev,
                        pageCount: event.target.value === "" ? "" : Number(event.target.value),
                      }))
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    placeholder="Nombre de pages"
                  />
                </div>

                <textarea
                  value={editBookForm.description}
                  onChange={(event) => setEditBookForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-h-[96px]"
                  placeholder="Description"
                />

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setEditBookForm((prev) => ({ ...prev, image: event.target.files?.[0] || null }))}
                  className="w-full text-sm text-gray-600"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg text-sm bg-blue-600 text-white disabled:opacity-60"
                    disabled={updateBookMutation.isPending}
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-gray-200 bg-white">
                <p className="text-xs text-gray-500">Langue</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{book.language || "N/A"}</p>
              </div>
              <div className="p-3 rounded-xl border border-gray-200 bg-white">
                <p className="text-xs text-gray-500">Pages</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{book.pageCount || "N/A"}</p>
              </div>
              <div className="p-3 rounded-xl border border-gray-200 bg-white">
                <p className="text-xs text-gray-500">Durée de prêt</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{book.defaultLoanDays || 21} jours</p>
              </div>
              {shouldShowAvailabilityMode && (
                <div className="p-3 rounded-xl border border-gray-200 bg-white">
                  <p className="text-xs text-gray-500">Disponibilité</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{availabilityModeLabel}</p>
                </div>
              )}
              {shouldShowCondition && (
                <div className="p-3 rounded-xl border border-gray-200 bg-white">
                  <p className="text-xs text-gray-500">Condition</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{book.condition}</p>
                </div>
              )}
              {shouldShowAvailableFrom && (
                <div className="p-3 rounded-xl border border-gray-200 bg-white">
                  <p className="text-xs text-gray-500">Disponible à partir de</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatDateTime(book.availableFrom)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {isOwner && (
        <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">File des demandes</h2>

          {loadingRequests ? (
            <div className="flex justify-center py-8">
              <i className="fa-solid fa-spinner fa-spin text-primary"></i>
            </div>
          ) : visibleRequests.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune demande pour ce livre.</p>
          ) : (
            <div className="space-y-3">
              {visibleRequests.map((request) => {
                const countdown = getOfferCountdown(request.offerExpiresAt);
                const requestOwnerId = request.ownerId || request.owner?.id || request.book?.ownerId;
                const canCreateLoan = request.status === "accepted" && (isOwner || requestOwnerId === user?.id);
                const isRequester = (request.borrowerId || request.requesterId) === user?.id;
                const dueDays = dueDaysByRequest[request.id] || book.defaultLoanDays || 21;
                const borrowerName = getMemberDisplayName(request.borrower || request.requester);

                return (
                  <div key={request.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{borrowerName}</p>
                        <p className="text-xs text-gray-500">Demande le {formatDateTime(request.createdAt)}</p>
                        {countdown && <p className="text-xs text-amber-700 mt-1">{countdown}</p>}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColorMap[request.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {getLibraryStatusLabel(request.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 items-center">
                      {request.status === "offered" && isRequester && (
                        <button
                          onClick={() => acceptRequestMutation.mutate(request.id)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-green-100 text-green-700"
                        >
                          Accepter l'offre
                        </button>
                      )}

                      {(isRequester || isOwner || isAdmin) &&
                        ["queued", "offered", "accepted"].includes(request.status) && (
                          <button
                            onClick={() => cancelRequestMutation.mutate(request.id)}
                            className="px-3 py-1.5 rounded-lg text-xs bg-red-100 text-red-700"
                          >
                            Annuler
                          </button>
                        )}

                      {isAdmin && ["queued", "offered"].includes(request.status) && (
                        <button
                          onClick={() => expireRequestMutation.mutate(request.id)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-gray-200 text-gray-700"
                        >
                          Forcer expiration
                        </button>
                      )}

                      {canCreateLoan && (
                        <>
                          <label className="text-xs text-gray-600">Durée (échéance finalisée à l'activation)</label>
                          <input
                            type="number"
                            min={7}
                            max={90}
                            value={dueDays}
                            onChange={(e) =>
                              setDueDaysByRequest((prev) => ({
                                ...prev,
                                [request.id]: Math.max(7, Math.min(90, Number(e.target.value) || 21)),
                              }))
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                          <button
                            onClick={() =>
                              createLoanMutation.mutate({
                                requestId: request.id,
                                data: { plannedStartAt: new Date().toISOString(), dueDays },
                              })
                            }
                            className="px-3 py-1.5 rounded-lg text-xs bg-indigo-100 text-indigo-700"
                          >
                            Créer prêt
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default BibliothequeBookDetail;
