import { Resource } from "./resource";
import { Poll } from "./sondage";
import { Location } from "./location";

export interface Attendant {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  avatar: string | null;
  attended: boolean;
}

export interface SessionRating {
  userId: string;
  userName: string;
  rating: number;
  comment: string | null;
  attended: boolean;
  ratedAt: string;
}

export interface UserRating {
  rating: number;
  comment: string | null;
  attended: boolean;
}

export interface Session {
  id: string;
  title: string;
  description: string | null;
  theme: string | null;
  type: "workshop" | "conference" | "group" | "individual";
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  duration: string | null;
  locationId: string | null;
  location: Location | null;
  isOnline: boolean;
  maxParticipants: number;
  registered: number;
  isRegistered?: boolean;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  objectives: string[];
  attendanceRate: number | null;
  averageGrade: number | null;
  attended?: boolean;
  attendants?: Attendant[];
  workGroups?: WorkGroup[];
  resources?: Resource[];
  polls?: Poll[];
  ratings?: SessionRating[];
  totalRatings?: number;
  userRating?: UserRating | null;
  ratingReminderSent?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WorkGroup {
  id: string;
  name: string;
  letter: string;
  color: "primary" | "accent" | "secondary" | "success";
  members: GroupMember[];
  sessionId: string;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  isLeader?: boolean;
}

export interface CreateSessionRequest {
  title: string;
  description?: string;
  theme?: string;
  type: "workshop" | "conference" | "group" | "individual";
  date?: string;
  startTime?: string;
  endTime?: string;
  locationId?: string;
  isOnline: boolean;
  maxParticipants: number;
  objectives?: string[];
}

export interface UpdateSessionRequest extends Partial<CreateSessionRequest> {
  status?: Session["status"];
}

export interface CreateGroupRequest {
  numberOfGroups: number;
  isRandom?: boolean;
  assignments?: { [memberId: string]: number };
}

export interface SessionRegistrationRequest {
  sessionId: string;
}
