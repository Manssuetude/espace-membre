import { Theme } from "../../types/theme";

interface ProposedThemesListProps {
  themes: Theme[];
}

const ProposedThemesList = ({ themes }: ProposedThemesListProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  if (themes.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thèmes proposés</h3>
        <p className="text-gray-500 text-sm text-center py-4">Aucun thème proposé pour le moment</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Thèmes proposés</h3>
      <div className="space-y-3">
        {themes.map((theme) => (
          <div key={theme.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-900 flex-1">{theme.title}</span>
            {theme.submittedAt && <span className="text-xs text-gray-500 ml-4">{formatDate(theme.submittedAt)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProposedThemesList;
