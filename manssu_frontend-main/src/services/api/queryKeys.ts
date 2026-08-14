// Query keys for React Query cache management
export const queryKeys = {
  // Auth
  auth: ["auth"] as const,
  user: ["user"] as const,

  // Sessions
  sessions: ["sessions"] as const,
  session: (id: string) => ["sessions", id] as const,
  sessionGroups: (id: string) => ["sessions", id, "groups"] as const,

  // Sondages
  sondages: ["sondages"] as const,
  sondage: (id: string) => ["sondages", id] as const,
  sondageResults: (id: string) => ["sondages", id, "results"] as const,

  // Themes
  themes: ["themes"] as const,
  theme: (id: string) => ["themes", id] as const,
  pendingThemes: ["themes", "pending"] as const,
  linkedThemes: ["themes", "linked"] as const,
  unlinkedThemes: ["themes", "unlinked"] as const,
  themeWindowStatus: ["themes", "window", "status"] as const,

  // Resources
  resources: ["resources"] as const,
  resource: (id: string) => ["resources", id] as const,
  pastResources: ["resources", "past"] as const,
  resourceSessionsHistory: ["resources", "sessions", "history"] as const,

  // Members
  members: ["members"] as const,
  member: (id: string) => ["members", id] as const,

  // Feedback
  feedbacks: ["feedbacks"] as const,
  feedback: (id: string) => ["feedbacks", id] as const,

  // Dashboard
  memberDashboard: ["dashboard", "member"] as const,
  adminDashboard: ["dashboard", "admin"] as const,

  // Profile
  profile: ["profile"] as const,

  // Locations
  locations: ["locations"] as const,
  location: (id: string) => ["locations", id] as const,

  // Invitations
  invites: ["invites"] as const,
  invite: (id: string) => ["invites", id] as const,
  validateInvite: (code: string) => ["invites", "validate", code] as const,
  invitationRequests: ["invites", "requests"] as const,
  invitationRequest: (id: string) => ["invites", "requests", id] as const,

  // Activity Templates (Formats)
  activityTemplates: ["activity-templates"] as const,
  activityTemplate: (id: string) => ["activity-templates", id] as const,

  // Questionnaires
  questionnaires: ["questionnaires"] as const,
  questionnaire: (id: string) => ["questionnaires", id] as const,

  // Commissions
  commissions: ["commissions"] as const,
  commission: (id: string) => ["commissions", id] as const,
  commissionApplications: (id: string) => ["commissions", id, "applications"] as const,
  myCommissions: ["commissions", "me"] as const,
  myCommissionApplications: ["commissions", "me", "applications"] as const,

  // Library (Bibliotheque)
  libraryBooks: ["library", "books"] as const,
  libraryMyBooks: ["library", "books", "mine"] as const,
  libraryBook: (id: string) => ["library", "books", id] as const,
  libraryBookRequestsRoot: ["library", "requests"] as const,
  libraryBookRequests: (bookId: string) => ["library", "books", bookId, "requests"] as const,
  libraryMyLoans: ["library", "loans", "me"] as const,
  libraryLoan: (id: string) => ["library", "loans", id] as const,
  libraryWishlist: ["library", "wishlist", "me"] as const,
  libraryNotifications: ["library", "notifications"] as const,
};
