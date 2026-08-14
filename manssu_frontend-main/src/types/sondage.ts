export interface UserVote {
  optionId: string;
  optionLabel: string;
  votedAt: string | null;
}

export interface PollQuestion {
  id: string;
  question: string;
  description: string | null;
  orderIndex: number;
  singleResponse: boolean;
  options: PollOption[];
  userVote: UserVote | UserVote[] | null; // Single object for single response, array for multiple choice
}

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "active" | "completed";
  totalResponses: number;
  totalMembers: number;
  participation: number | null;
  resultsVisibility: "realtime" | "hidden";
  anonymous: boolean;
  singleResponse: boolean;
  startDate: string;
  endDate: string | null;
  daysLeft: number | null;
  questions: PollQuestion[];
  voters?: PollVoter[];
  // Legacy fields for backward compatibility (deprecated, use questions array instead)
  question?: string;
  options?: PollOption[] | null;
  userVote?: UserVote | UserVote[] | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PollVoterOption {
  optionId: string;
  optionLabel: string;
  votedAt: string;
}

export interface PollVoterQuestion {
  questionId: string;
  question: string;
  options: PollVoterOption[];
}

export interface PollVoter {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  avatar: string | null;
  questions: PollVoterQuestion[];
  // Legacy field for backward compatibility (deprecated)
  options?: PollVoterOption[];
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
  percentage: number;
  color: string;
  orderIndex: number;
}

export interface PollResult {
  poll: Poll;
  distribution: {
    optionId: string;
    votes: number;
    percentage: number;
  }[];
  participants: PollParticipant[];
  timeline: PollTimelineEvent[];
}

export interface PollParticipant {
  id: string;
  name: string;
  avatar?: string;
  choice: string;
  choiceColor?: string;
  date: string;
  status: "Voté" | "En attente";
}

export interface PollTimelineEvent {
  event: string;
  date: string;
  color: "success" | "accent" | "warning" | "gray";
  future?: boolean;
}

export interface CreatePollRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  resultsVisibility?: "realtime" | "hidden";
  anonymous?: boolean;
  sessionId?: string;
  questions: Array<{
    question: string;
    description?: string;
    singleResponse: boolean;
    orderIndex?: number;
    options: Array<{
      label: string;
      orderIndex?: number;
    }>;
  }>;
  // Legacy fields for backward compatibility (deprecated, use questions array instead)
  question?: string;
  options?: Array<{
    label: string;
    color?: "primary" | "accent" | "secondary" | "success";
  }>;
  singleResponse?: boolean;
}

export interface UpdatePollRequest {
  title?: string;
  description?: string;
  status?: "draft" | "active" | "completed";
  resultsVisibility?: "realtime" | "hidden";
  endDate?: string;
  // Legacy field for backward compatibility (deprecated)
  question?: string;
}

export interface VoteRequest {
  // New format: votes per question
  // For single response polls: { questionId, optionId }
  // For multiple choice polls: { questionId, optionIds: [...] }
  votes?: Array<{
    questionId: string;
    optionId?: string; // For single response polls
    optionIds?: string[]; // For multiple choice polls
  }>;
  // Legacy format for backward compatibility (deprecated)
  optionId?: string;
  optionIds?: string[];
}
