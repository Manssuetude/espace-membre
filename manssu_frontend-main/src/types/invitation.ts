export type InviteStatus = "pending" | "used" | "expired" | "cancelled";

export interface Invite {
  id: string;
  code: string;
  email: string;
  sessionId: string;
  sessionTitle: string | null;
  createdBy: string | null;
  createdByName: string | null;
  expiresAt: string;
  status: InviteStatus;
  usedAt: string | null;
  usedBy: string | null;
  usedByName: string | null;
  createdAt: string;
  inviteUrl: string | null;
}

export interface CreateInviteRequest {
  email: string;
  sessionId: string;
}

export interface ValidateInviteResponse {
  valid: boolean;
  email: string | null;
  sessionId: string | null;
  sessionTitle: string | null;
  expiresAt: string | null;
  message: string | null;
}

export interface SendOTPForInviteRequest {
  code: string;
}

export interface GuestRegisterRequest {
  code: string;
  firstName: string;
  lastName: string;
  otp: string;
}

export interface AddSessionToGuestRequest {
  sessionId: string;
}

export type InvitationRequestStatus = "pending" | "approved" | "rejected";

export interface InvitationRequest {
  id: string;
  email: string;
  fullName: string;
  reason: string;
  sessionId: string;
  sessionTitle: string | null;
  requestedBy: string;
  requestedByName: string | null;
  status: InvitationRequestStatus;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationRequestRequest {
  email: string;
  fullName: string;
  reason: string;
  sessionId: string;
}

export interface ReviewInvitationRequestRequest {
  action: "approve" | "reject";
}
