import { useState } from "react";
import {
  useThemeWindowStatus,
  useOpenThemeWindow,
  useExtendThemeWindow,
  useCloseThemeWindow,
  usePendingThemes,
  useThemes,
  useLinkedThemes,
  useUpdateTheme,
} from "../../services/hooks/useThemes";
import { formatDate as formatDateUtil } from "../../utils/dateUtils";
import ThemeActionCards from "../../components/admin/ThemeActionCards";
import PendingThemesList from "../../components/admin/PendingThemesList";
import ValidatedThemesList from "../../components/admin/ValidatedThemesList";
import WindowPropositionsSidebar from "../../components/admin/WindowPropositionsSidebar";
import AddressedThemesSidebar from "../../components/admin/AddressedThemesSidebar";
import ProposalWindowModal from "../../components/admin/ProposalWindowModal";
import AddThemeModal from "../../components/admin/AddThemeModal";
import CreatePollModal from "../../components/admin/CreatePollModal";
import ManageWindowModal from "../../components/admin/ManageWindowModal";
import { Theme } from "../../types/theme";

// Defensive fallback for endpoints that may still return snake_case fields
type ThemeWithSnakeCaseFallback = Theme & {
  submitted_by?: Theme["submittedBy"];
  submitted_at?: string | null;
  session_count?: number;
  last_session_date?: string | null;
  next_session_date?: string | null;
};

const Themes = () => {
  const { data: windowStatus, isLoading: windowLoading } = useThemeWindowStatus();
  const { data: pendingThemesData, isLoading: pendingLoading } = usePendingThemes();
  const { data: approvedThemesData } = useThemes({ status: "approved", limit: 100 });
  const { data: linkedThemesData } = useLinkedThemes();
  const openWindow = useOpenThemeWindow();
  const extendWindow = useExtendThemeWindow();
  const closeWindow = useCloseThemeWindow();
  const updateTheme = useUpdateTheme();

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showAddThemeModal, setShowAddThemeModal] = useState(false);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [showManageWindowModal, setShowManageWindowModal] = useState(false);
  const [windowDuration, setWindowDuration] = useState("");
  const [currentWindowId, setCurrentWindowId] = useState<string | null>(null);

  const isWindowOpen = windowStatus?.isOpen || false;
  const daysRemaining = windowStatus?.daysRemaining || 0;
  const windowCloseDate = windowStatus?.endDate
    ? new Date(windowStatus.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : "";

  // Format themes for components
  const formatDate = (dateString: string | null) => {
    return formatDateUtil(dateString, { includeTime: false, showRelative: true });
  };

  const pendingThemes = ((pendingThemesData || []) as ThemeWithSnakeCaseFallback[]).map((theme) => {
    // Handle both camelCase and snake_case from API
    const submittedBy = theme.submittedBy || theme.submitted_by;
    const submittedAt = theme.submittedAt || theme.submitted_at;

    return {
      id: theme.id,
      title: theme.title,
      description: theme.description,
      author: submittedBy?.name || "Auteur inconnu",
      days: submittedAt
        ? Math.ceil((new Date().getTime() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    };
  });

  const formatSessionDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  const addressedThemes = ((linkedThemesData || []) as ThemeWithSnakeCaseFallback[]).map((theme) => {
    // Handle both camelCase and snake_case from API
    const sessionCount = theme.sessionCount || theme.session_count || 0;
    const lastSessionDate = theme.lastSessionDate || theme.last_session_date || null;
    const nextSessionDate = theme.nextSessionDate || theme.next_session_date || null;

    return {
      id: theme.id,
      title: theme.title,
      lastSession: formatSessionDate(lastSessionDate),
      nextSession: formatSessionDate(nextSessionDate),
      sessions: sessionCount,
    };
  });

  // Get IDs of themes that already have sessions
  const themesWithSessionsIds = new Set(addressedThemes.map((theme) => theme.id));

  // Filter out themes that already have sessions
  const validatedThemes = (approvedThemesData?.data || [])
    .filter((theme) => !themesWithSessionsIds.has(theme.id))
    .map((theme) => ({
      id: theme.id,
      title: theme.title,
      proposedBy: theme.submittedBy?.name || "Auteur inconnu",
      when: formatDate(theme.submittedAt),
    }));

  const handleOpenWindow = (duration: string) => {
    const days = parseInt(duration);
    if (days > 0) {
      openWindow.mutate(
        { duration: days },
        {
          onSuccess: () => {
            setShowProposalModal(false);
            setWindowDuration("");
          },
        },
      );
    }
  };

  const handleExtendWindow = (duration: string) => {
    if (!currentWindowId) return;
    const days = parseInt(duration);
    if (days > 0) {
      extendWindow.mutate(
        { windowId: currentWindowId, data: { additionalDays: days } },
        {
          onSuccess: () => {
            setShowManageWindowModal(false);
            setWindowDuration("");
          },
        },
      );
    }
  };

  const handleCloseWindow = () => {
    if (!currentWindowId) return;
    closeWindow.mutate(currentWindowId, {
      onSuccess: () => {
        setShowManageWindowModal(false);
        setCurrentWindowId(null);
      },
    });
  };

  const handleCreatePoll = () => {
    // Close window if open when creating poll
    if (isWindowOpen && currentWindowId) {
      closeWindow.mutate(currentWindowId);
    }
    setShowCreatePollModal(false);
  };

  const handleApproveTheme = (themeId: string) => {
    updateTheme.mutate({
      id: themeId,
      data: { status: "approved" },
    });
  };

  const handleRejectTheme = (themeId: string) => {
    updateTheme.mutate({
      id: themeId,
      data: { status: "rejected" },
    });
  };

  if (windowLoading || pendingLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  return (
    <div>
      <ThemeActionCards
        isWindowOpen={isWindowOpen}
        daysRemaining={daysRemaining}
        onOpenWindow={() => setShowProposalModal(true)}
        onAddTheme={() => setShowAddThemeModal(true)}
        onCreatePoll={() => setShowCreatePollModal(true)}
        onManageWindow={() => {
          // Get current window ID from status if available
          // Note: The API doesn't return window ID in status, so we'll need to handle this differently
          // For now, we'll use a placeholder - in production, you might need to fetch active windows
          setCurrentWindowId("current"); // This should be the actual window ID
          setShowManageWindowModal(true);
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Two sections */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
          <PendingThemesList
            themes={pendingThemes}
            onApprove={handleApproveTheme}
            onReject={handleRejectTheme}
            isLoading={updateTheme.isPending}
          />
          <ValidatedThemesList themes={validatedThemes} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {isWindowOpen && (
            <WindowPropositionsSidebar
              isWindowOpen={isWindowOpen}
              windowCloseDate={windowCloseDate}
              daysRemaining={daysRemaining}
              onManageWindow={() => {
                setCurrentWindowId("current");
                setShowManageWindowModal(true);
              }}
              onCloseWindow={handleCloseWindow}
            />
          )}
          <AddressedThemesSidebar themes={addressedThemes} />
        </div>
      </div>

      <ProposalWindowModal
        isOpen={showProposalModal}
        onClose={() => {
          setShowProposalModal(false);
          setWindowDuration("");
        }}
        windowDuration={windowDuration}
        onDurationChange={setWindowDuration}
        onOpen={handleOpenWindow}
      />

      <AddThemeModal isOpen={showAddThemeModal} onClose={() => setShowAddThemeModal(false)} />

      <CreatePollModal
        isOpen={showCreatePollModal}
        onClose={() => setShowCreatePollModal(false)}
        isWindowOpen={isWindowOpen}
        onCreatePoll={handleCreatePoll}
      />

      <ManageWindowModal
        isOpen={showManageWindowModal}
        onClose={() => {
          setShowManageWindowModal(false);
          setWindowDuration("");
        }}
        windowCloseDate={windowCloseDate}
        daysRemaining={daysRemaining}
        windowDuration={windowDuration}
        onDurationChange={setWindowDuration}
        onExtend={handleExtendWindow}
        onCloseWindow={() => {
          handleCloseWindow();
          setShowManageWindowModal(false);
        }}
      />
    </div>
  );
};

export default Themes;
