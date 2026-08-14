interface PollOption {
  id: number;
  label: string;
}

interface PollPreviewProps {
  responseType: string;
  options: PollOption[];
  visibility: string;
}

const PollPreview = ({ responseType, options, visibility }: PollPreviewProps) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-accent to-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
          4
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Aperçu et publication</h2>
          <p className="text-gray-600 text-sm">Vérifiez votre sondage avant de le publier</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Résumé de configuration</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Type de réponse:</span>
              <span className="font-medium">{responseType === "single" ? "Choix unique" : "Choix multiples"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre d'options:</span>
              <span className="font-medium">{options.length} options</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Visibilité:</span>
              <span className="font-medium">{visibility === "realtime" ? "Temps réel" : "Masqués jusqu'à la fin"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollPreview;
