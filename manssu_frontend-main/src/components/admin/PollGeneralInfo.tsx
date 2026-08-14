import FormInput from "../FormInput";

interface PollGeneralInfoProps {
  title: string;
  description: string;
  question: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onQuestionChange: (value: string) => void;
}

const PollGeneralInfo = ({
  title,
  description,
  question,
  onTitleChange,
  onDescriptionChange,
  onQuestionChange,
}: PollGeneralInfoProps) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-accent to-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
          1
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Informations générales</h2>
          <p className="text-gray-600 text-sm">Définissez les informations de base de votre sondage</p>
        </div>
      </div>

      <div className="space-y-6">
        <FormInput
          label="Titre du sondage *"
          placeholder="Ex: Sélection du thème de la prochaine session"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />

        <FormInput
          label="Description (optionnelle)"
          placeholder="Décrivez brièvement l'objectif de ce sondage..."
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />

        <FormInput
          label="Question principale *"
          placeholder="Posez votre question ici..."
          rows={4}
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default PollGeneralInfo;
