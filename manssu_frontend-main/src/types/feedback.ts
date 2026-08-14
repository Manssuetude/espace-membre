export interface Feedback {
  id: string;
  category: string;
  type: string;
  subject: string;
  message: string;
  anonymous: boolean;
  submittedBy: string | null;
  submittedAt: string | null;
  status: "new" | "read" | "resolved";
  rating: number | null;
  sessionId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateFeedbackRequest {
  category: string;
  type: string;
  subject: string;
  message: string;
  anonymous?: boolean;
  sessionId?: string;
  rating?: number;
}

export interface UpdateFeedbackRequest {
  status: "new" | "read" | "resolved";
}
