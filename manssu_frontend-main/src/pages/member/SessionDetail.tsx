import { useParams } from "react-router-dom";
import { useSession } from "../../services/hooks/useSessions";
import { useAuth } from "../../contexts/AuthContext";
import SessionHeader from "../../components/member/SessionHeader";
import ParticipationCard from "../../components/member/ParticipationCard";
import SessionOverview from "../../components/member/SessionOverview";
import SessionDescription from "../../components/member/SessionDescription";
import SessionLocation from "../../components/member/SessionLocation";
import SessionPoll from "../../components/member/SessionPoll";
import SessionResources from "../../components/member/SessionResources";
import QuickActionsSidebar from "../../components/member/QuickActionsSidebar";
import ParticipantsSidebar from "../../components/member/ParticipantsSidebar";
import SessionStatsSidebar from "../../components/member/SessionStatsSidebar";
import SessionRatingForm from "../../components/member/SessionRatingForm";
import SessionUserRating from "../../components/member/SessionUserRating";
import SessionRatings from "../../components/member/SessionRatings";

const SessionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: session, isLoading } = useSession(id || "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <SessionHeader />
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Session non trouvée</p>
        </div>
      </div>
    );
  }

  const formattedDate = session.date
    ? (() => {
        const sessionDate = new Date(session.date);
        const day = sessionDate.getDate();
        const monthNames = [
          "Janvier",
          "Février",
          "Mars",
          "Avril",
          "Mai",
          "Juin",
          "Juillet",
          "Août",
          "Septembre",
          "Octobre",
          "Novembre",
          "Décembre",
        ];
        const month = monthNames[sessionDate.getMonth()];
        return `${day} ${month} ${sessionDate.getFullYear()}`;
      })()
    : "non défini";

  // Check if session is past (completed status or date is in the past)
  const isPastSession = session.status === "completed" || (session.date ? new Date(session.date) < new Date() : false);

  return (
    <div>
      <SessionHeader />
      <ParticipationCard isMobile={true} isRegistered={session.isRegistered} isPastSession={isPastSession} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          <SessionOverview
            title={session.title}
            theme={session.theme ?? undefined}
            formattedDate={formattedDate}
            startTime={session.startTime ?? undefined}
            endTime={session.endTime ?? undefined}
            registered={session.registered}
            maxParticipants={session.maxParticipants}
            isRegistered={session.isRegistered}
            status={session.status}
          />
          <SessionDescription description={session.description} objectives={session.objectives} />
          <SessionLocation location={session.location} isOnline={session.isOnline} />
          <SessionPoll polls={session.polls || []} />
          <SessionResources resources={session.resources || []} />
        </div>

        <div className="space-y-6 order-1 lg:order-2">
          <ParticipationCard isMobile={false} isRegistered={session.isRegistered} isPastSession={isPastSession} />
          {!isPastSession && (
            <QuickActionsSidebar
              title={session.title}
              date={session.date}
              startTime={session.startTime}
              endTime={session.endTime}
              location={session.location}
              description={session.description}
              sessionId={session.id}
            />
          )}
          <ParticipantsSidebar
            attendants={session.attendants}
            totalRegistered={session.registered}
            currentUserId={user?.id}
          />
          <SessionStatsSidebar
            attendanceRate={session.attendanceRate ?? undefined}
            averageGrade={session.averageGrade ?? undefined}
          />
          {isPastSession && session.ratings && session.ratings.length > 0 && (
            <SessionRatings ratings={session.ratings} totalRatings={session.totalRatings || 0} />
          )}
          {isPastSession &&
            session.isRegistered &&
            session.attended === true &&
            (session.userRating ? (
              <SessionUserRating userRating={session.userRating} />
            ) : (
              <SessionRatingForm sessionId={session.id} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
