import { useState } from "react";
import {
  useQuestionnaires,
  useCreateQuestionnaire,
  useUpdateQuestionnaire,
  useDeleteQuestionnaire,
} from "../../services/hooks/useQuestionnaires";
import { useNavigate } from "react-router-dom";
import { Questionnaire, QuestionnaireQuestionType } from "../../types/questionnaire";
import Dropdown from "../../components/Dropdown";
import Pagination from "../../components/Pagination";

interface NewQuestionForm {
  question: string;
  description: string;
  type: QuestionnaireQuestionType;
  required: boolean;
  options: string[];
}

const Questionnaires = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "closed">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);
  const [questions, setQuestions] = useState<NewQuestionForm[]>([
    {
      question: "",
      description: "",
      type: "single_choice",
      required: true,
      options: [""],
    },
  ]);

  const { data: questionnairesData, isLoading } = useQuestionnaires({
    status: statusFilter,
    page: currentPage,
    limit: pageSize,
  });

  const createQuestionnaire = useCreateQuestionnaire();
  const updateQuestionnaire = useUpdateQuestionnaire();
  const deleteQuestionnaire = useDeleteQuestionnaire();

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as "all" | "draft" | "published" | "closed");
    setCurrentPage(1);
  };

  const handleQuestionChange = <K extends keyof NewQuestionForm>(
    index: number,
    field: K,
    value: NewQuestionForm[K],
  ) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const opts = [...copy[qIndex].options];
      opts[optIndex] = value;
      copy[qIndex] = {
        ...copy[qIndex],
        options: opts,
      };
      return copy;
    });
  };

  const addOption = (qIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = {
        ...copy[qIndex],
        options: [...copy[qIndex].options, ""],
      };
      return copy;
    });
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        description: "",
        type: "single_choice",
        required: false,
        options: [""],
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If we are editing an existing questionnaire (metadata only)
    if (editingQuestionnaire) {
      if (!title.trim()) {
        return;
      }

      updateQuestionnaire.mutate(
        {
          id: editingQuestionnaire.id,
          data: {
            title: title.trim(),
            description: description || null,
          },
        },
        {
          onSuccess: () => {
            setEditingQuestionnaire(null);
            setTitle("");
            setDescription("");
          },
        },
      );
      return;
    }

    // Creation mode: create full questionnaire with questions
    const payload = {
      title,
      description: description || undefined,
      questions: questions
        .filter((q) => q.question.trim().length > 0)
        .map((q, index) => ({
          question: q.question,
          description: q.description || undefined,
          type: q.type,
          required: q.required,
          orderIndex: index,
          options:
            q.type === "single_choice" || q.type === "multiple_choice"
              ? q.options
                  .filter((opt) => opt.trim().length > 0)
                  .map((opt) => ({
                    label: opt,
                  }))
              : undefined,
        })),
    };

    if (!payload.title.trim() || payload.questions.length === 0) {
      return;
    }

    createQuestionnaire.mutate(payload, {
      onSuccess: () => {
        setTitle("");
        setDescription("");
        setQuestions([
          {
            question: "",
            description: "",
            type: "single_choice",
            required: true,
            options: [""],
          },
        ]);
      },
    });
  };

  const questionnaires = questionnairesData?.data || [];

  const handleChangeStatus = (id: string, status: "draft" | "published" | "closed") => {
    updateQuestionnaire.mutate({
      id,
      data: { status },
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer le questionnaire "${title}" ?\n\nCette action est définitive et supprimera toutes les réponses associées.`,
      )
    ) {
      return;
    }
    deleteQuestionnaire.mutate(id);
  };

  const handleEdit = (q: Questionnaire) => {
    if (q.status !== "draft") {
      return;
    }
    setEditingQuestionnaire(q);
    setTitle(q.title);
    setDescription(q.description || "");
  };

  const handleCancelEdit = () => {
    setEditingQuestionnaire(null);
    setTitle("");
    setDescription("");
  };

  return (
    <div className="space-y-8">
      {/* Header + Filter */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <i className="fa-solid fa-clipboard-list text-primary"></i>
              Questionnaires
            </h2>
            <p className="text-sm text-gray-500">
              Créez des questionnaires pour collecter des réponses détaillées auprès des membres.
            </p>
          </div>
          <div className="w-full lg:w-auto">
            <Dropdown
              value={statusFilter}
              onChange={handleStatusFilterChange}
              options={[
                { value: "all", label: "Tous les statuts" },
                { value: "draft", label: "Brouillons" },
                { value: "published", label: "Publiés" },
                { value: "closed", label: "Clôturés" },
              ]}
              className="min-w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Content: list + create form */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* List */}
        <div className="xl:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <i className="fa-solid fa-list text-primary"></i>
                Liste des questionnaires
              </h3>
              {questionnairesData && (
                <span className="text-sm text-gray-500">
                  {questionnairesData.total} questionnaire{questionnairesData.total > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[200px]">
                  <i className="fa-solid fa-spinner fa-spin text-3xl text-primary"></i>
                </div>
              ) : questionnaires.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                  <i className="fa-solid fa-clipboard-question text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-600 mb-1">Aucun questionnaire trouvé</p>
                  <p className="text-sm text-gray-500">
                    Créez votre premier questionnaire à l&apos;aide du formulaire à droite.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questionnaires.map((q) => (
                    <div
                      key={q.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary/40 hover:shadow-md transition-all"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900">{q.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                          {typeof q.totalResponses === "number" && (
                            <span className="inline-flex items-center gap-1">
                              <i className="fa-solid fa-user-check"></i>
                              {q.totalResponses} réponse{q.totalResponses > 1 ? "s" : ""}
                            </span>
                          )}
                          {typeof q.editWindowMinutes === "number" && (
                            <span className="inline-flex items-center gap-1">
                              <i className="fa-solid fa-clock"></i>
                              Fenêtre d&apos;édition: {q.editWindowMinutes} min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            q.status === "published"
                              ? "bg-green-100 text-green-800"
                              : q.status === "closed"
                                ? "bg-gray-200 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {q.status === "published" ? "Publié" : q.status === "closed" ? "Clôturé" : "Brouillon"}
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1 justify-end">
                          {q.status === "draft" && (
                            <button
                              type="button"
                              onClick={() => handleEdit(q)}
                              className="px-3 py-1 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-all"
                            >
                              <i className="fa-solid fa-pen mr-1"></i>
                              Modifier
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/questionnaires/${q.id}/responses`)}
                            className="px-3 py-1 rounded-lg text-xs font-medium border border-blue-300 text-blue-700 bg-white hover:bg-blue-50 transition-all"
                          >
                            <i className="fa-solid fa-eye mr-1"></i>
                            Voir les réponses
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChangeStatus(q.id, "draft")}
                            disabled={updateQuestionnaire.isPending && updateQuestionnaire.variables?.id === q.id}
                            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                              q.status === "draft"
                                ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                                : "bg-white border-gray-200 text-gray-600 hover:border-yellow-400 hover:text-yellow-800"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Brouillon
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChangeStatus(q.id, "published")}
                            disabled={updateQuestionnaire.isPending && updateQuestionnaire.variables?.id === q.id}
                            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                              q.status === "published"
                                ? "bg-green-100 border-green-300 text-green-800"
                                : "bg-white border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-800"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Publier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChangeStatus(q.id, "closed")}
                            disabled={
                              q.status !== "published" ||
                              (updateQuestionnaire.isPending && updateQuestionnaire.variables?.id === q.id)
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                              q.status === "closed"
                                ? "bg-gray-200 border-gray-400 text-gray-800"
                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-500 hover:text-gray-800"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Clôturer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(q.id, q.title)}
                            disabled={deleteQuestionnaire.isPending}
                            className="px-3 py-1 rounded-lg text-xs font-medium border border-red-300 text-red-600 bg-white hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <i className="fa-solid fa-trash mr-1"></i>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {questionnairesData && questionnairesData.totalPages > 1 && (
              <div className="px-6 pb-6">
                <Pagination
                  currentPage={questionnairesData.page}
                  totalPages={questionnairesData.totalPages}
                  total={questionnairesData.total}
                  limit={questionnairesData.limit}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </div>

        {/* Create form */}
        <div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <i className="fa-solid fa-plus-circle text-primary"></i>
                {editingQuestionnaire ? "Modifier le questionnaire" : "Créer un questionnaire"}
              </h3>
              {editingQuestionnaire && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <i className="fa-solid fa-xmark mr-1"></i>
                  Annuler la modification
                </button>
              )}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Titre du questionnaire"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[80px]"
                  placeholder="Décrivez l'objectif du questionnaire"
                />
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <i className="fa-solid fa-question-circle text-primary"></i>
                  Questions
                </h4>
                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="border border-gray-200 rounded-xl p-3 space-y-3 bg-gray-50/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">Question #{qIndex + 1}</span>
                      <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => handleQuestionChange(qIndex, "required", e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary/20"
                        />
                        Obligatoire
                      </label>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleQuestionChange(qIndex, "question", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                        placeholder="Intitulé de la question"
                        required={qIndex === 0}
                      />
                    </div>

                    <div>
                      <textarea
                        value={q.description}
                        onChange={(e) => handleQuestionChange(qIndex, "description", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm min-h-[60px]"
                        placeholder="Description ou aide (optionnel)"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type de question</label>
                        <Dropdown
                          value={q.type}
                          onChange={(e) =>
                            handleQuestionChange(qIndex, "type", e.target.value as QuestionnaireQuestionType)
                          }
                          options={[
                            { value: "single_choice", label: "Choix unique" },
                            { value: "multiple_choice", label: "Choix multiple" },
                            { value: "text", label: "Texte libre" },
                            { value: "rating", label: "Note (1-5)" },
                            { value: "number", label: "Nombre" },
                            { value: "date", label: "Date" },
                          ]}
                          className="text-sm"
                          label=""
                        />
                      </div>
                    </div>

                    {(q.type === "single_choice" || q.type === "multiple_choice") && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-medium text-gray-700">Options de réponse</label>
                          <button
                            type="button"
                            onClick={() => addOption(qIndex)}
                            className="text-primary text-xs font-medium hover:underline"
                          >
                            <i className="fa-solid fa-plus mr-1"></i>
                            Ajouter une option
                          </button>
                        </div>
                        <div className="space-y-2">
                          {q.options.map((opt, optIndex) => (
                            <input
                              key={optIndex}
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                              placeholder={`Option ${optIndex + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="inline-flex items-center text-primary text-xs font-medium hover:underline"
                  >
                    <i className="fa-solid fa-plus mr-1"></i>
                    Ajouter une question
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={createQuestionnaire.isPending || updateQuestionnaire.isPending}
                className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-red-500 text-white font-semibold shadow-md hover:shadow-lg hover:from-primary/90 hover:to-red-500/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createQuestionnaire.isPending || updateQuestionnaire.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    {editingQuestionnaire ? "Mise à jour en cours..." : "Création en cours..."}
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk mr-2"></i>
                    {editingQuestionnaire ? "Mettre à jour le questionnaire" : "Créer le questionnaire"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questionnaires;
