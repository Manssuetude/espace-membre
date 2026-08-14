import { Attendant } from "../../types/session";

interface ParticipantsSidebarProps {
  attendants?: Attendant[];
  totalRegistered?: number;
  currentUserId?: string;
}

const getAttendantAvatarUrl = (avatar: string | null): string | null => {
  if (!avatar) return null;

  // If avatar is already a full URL, return it
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  // Otherwise, construct the URL
  return `https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/${avatar}`;
};

const getAttendantInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.trim() || "";
  const last = lastName?.trim() || "";

  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  } else if (first) {
    return first[0].toUpperCase();
  } else if (last) {
    return last[0].toUpperCase();
  }

  return "U";
};

const ParticipantsSidebar = ({ attendants = [], totalRegistered, currentUserId }: ParticipantsSidebarProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
        {totalRegistered !== undefined && (
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-lg">
            {totalRegistered} inscrits
          </span>
        )}
      </div>
      {attendants.length === 0 ? (
        <div className="text-center py-8 flex-shrink-0">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fa-solid fa-users text-gray-400 text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm">Aucun participant</p>
          <p className="text-gray-400 text-xs mt-1">Aucun participant inscrit à cette session</p>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
            {attendants.map((attendant) => {
              const isCurrentUser = currentUserId === attendant.id;
              const avatarUrl = getAttendantAvatarUrl(attendant.avatar);
              const initials = getAttendantInitials(attendant.firstName, attendant.lastName);

              return (
                <div key={attendant.id} className="flex items-center space-x-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={attendant.name}
                      className={`w-10 h-10 rounded-full object-cover ring-2 ${isCurrentUser ? "ring-primary/20" : "ring-gray-200"}`}
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ring-2 ${isCurrentUser ? "ring-primary/20 bg-primary/10" : "ring-gray-200 bg-gray-100"}`}
                    >
                      <span className={`text-xs font-semibold ${isCurrentUser ? "text-primary" : "text-gray-600"}`}>
                        {initials}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{attendant.name}</p>
                    <p className="text-xs text-gray-500">{isCurrentUser ? "Vous" : "Membre"}</p>
                  </div>
                  {attendant.attended && (
                    <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded-lg">
                      <i className="fa-solid fa-check mr-1"></i>
                      Présent
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantsSidebar;
