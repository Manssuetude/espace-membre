import { Member } from "../../types/member";

interface MemberStatisticsCardProps {
  member: Member;
}

const MemberStatisticsCard = ({ member }: MemberStatisticsCardProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <i className="fa-solid fa-chart-bar text-accent mr-2"></i>
        Statistiques
      </h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center">
            <i className="fa-solid fa-calendar-check text-primary mr-3"></i>
            <span className="text-sm text-gray-700">Sessions</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{member.sessionsCount || 0}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center">
            <i className="fa-solid fa-comment-dots text-accent mr-3"></i>
            <span className="text-sm text-gray-700">Feedbacks</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{member.feedbacksCount || 0}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center">
            <i className="fa-solid fa-lightbulb text-secondary mr-3"></i>
            <span className="text-sm text-gray-700">Thèmes proposés</span>
          </div>
          <span className="text-lg font-bold text-gray-900">{member.themesCount || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default MemberStatisticsCard;
