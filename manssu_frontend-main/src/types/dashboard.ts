export interface DashboardStats {
  activeMembers: number;
  sessionsCompleted: number;
  newResources: number;
  participationRate: number;
}

export interface ThemeWindow {
  isOpen: boolean;
  closesAt?: string | null;
  daysUntilClose?: number | null;
}

export interface MemberDashboardData {
  stats: DashboardStats;
  upcomingSessions: Session[];
  activePolls: Poll[];
  recentResources: Resource[];
  themeWindow: ThemeWindow;
}

export interface AdminDashboardData {
  stats: {
    pendingThemes: number;
    pendingResources: number;
    recentFeedbacks: number;
    totalMembers: number;
  };
  pendingThemes: Array<{
    id: string;
    title: string;
    proposedBy: {
      id: string;
      name: string;
      avatar: string | null;
    };
    createdAt: string;
    daysAgo?: number;
  }>;
  activePolls: Poll[];
  pendingResources: Array<{
    id: string;
    title: string;
    type: string;
    submittedBy: {
      id: string;
      name: string;
    };
    createdAt: string;
    daysAgo?: number;
  }>;
  recentFeedbacks: Feedback[];
  upcomingSessions: Session[];
}

// Re-export types needed
import { Session } from "./session";
import { Poll } from "./sondage";
import { Resource } from "./resource";
import { Feedback } from "./feedback";
