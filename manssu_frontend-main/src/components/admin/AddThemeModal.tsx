import { useState } from "react";
import { useCreateThemeAdmin } from "../../services/hooks/useThemes";

interface AddThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddThemeModal = ({ isOpen, onClose }: AddThemeModalProps) => {
  const createThemeAdmin = useCreateThemeAdmin();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est obligatoire";
    }
    if (!formData.description.trim()) {
      newErrors.description = "La description est obligatoire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    createThemeAdmin.mutate(
      {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category.trim() || undefined,
      },
      {
        onSuccess: () => {
          setFormData({ title: "", description: "", category: "" });
          setErrors({});
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    setFormData({ title: "", description: "", category: "" });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Ajouter un nouveau thème</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Titre du thème <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Gestion du stress"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: "" });
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm sm:text-base ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Description détaillée du thème..."
              rows={4}
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: "" });
              }}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none text-sm sm:text-base ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
            ></textarea>
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Catégorie (optionnel)</label>
            <input
              type="text"
              placeholder="Ex: Bien-être mental"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm sm:text-base"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:space-y-0 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-sm sm:text-base"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createThemeAdmin.isPending}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-accent to-blue-600 text-white rounded-xl hover:shadow-lg transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {createThemeAdmin.isPending ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Création...
                </>
              ) : (
                "Ajouter"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddThemeModal;
