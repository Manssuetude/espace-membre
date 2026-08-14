import { Poll } from "../../types/sondage";
import ActivePollCard from "./ActivePollCard";

interface ActivePollsSectionProps {
  polls: Poll[];
  selectedOptions: Record<string, Record<string, string | string[]>>; // { pollId: { questionId: optionId | optionIds[] } }
  onSelectOption: (pollId: string, questionId: string, optionId: string, singleResponse: boolean) => void;
  onVote: (pollId: string) => void;
  isVoting: boolean;
  getColorForOption: (index: number) => "primary" | "accent" | "secondary";
}

const ActivePollsSection = ({
  polls,
  selectedOptions,
  onSelectOption,
  onVote,
  isVoting,
  getColorForOption,
}: ActivePollsSectionProps) => {
  if (polls.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <i className="fa-solid fa-poll text-primary mr-3"></i>
          Sondage en cours
        </h2>
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-square-poll-vertical text-primary text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">Aucun sondage actif pour le moment</p>
          <p className="text-gray-400 text-xs">Les nouveaux sondages apparaîtront ici</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <i className="fa-solid fa-poll text-primary mr-3"></i>
        Sondage{polls.length > 1 ? "s" : ""} en cours
      </h2>

      {polls.map((poll) => (
        <ActivePollCard
          key={poll.id}
          poll={poll}
          selectedOptions={selectedOptions[poll.id] || {}}
          onSelectOption={onSelectOption}
          onVote={onVote}
          isVoting={isVoting}
          getColorForOption={getColorForOption}
        />
      ))}
    </div>
  );
};

export default ActivePollsSection;
