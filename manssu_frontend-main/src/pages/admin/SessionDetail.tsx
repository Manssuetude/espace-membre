import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSession, useUpdateSession, useDeleteSession, useRemindRatings } from "../../services/hooks/useSessions";
import { useThemes } from "../../services/hooks/useThemes";
import { useLocations, useCreateLocation, useUpdateLocation } from "../../services/hooks/useLocations";
import { usePageTitle } from "../../contexts/PageTitleContext";
import { formatTimeWithoutSeconds } from "../../utils/resourceUtils";
import SessionOverview from "../../components/admin/SessionOverview";
import WorkGroups from "../../components/admin/WorkGroups";
import SessionResources from "../../components/admin/SessionResources";
import SessionPolls from "../../components/admin/SessionPolls";
import SessionNotes from "../../components/admin/SessionNotes";
import SessionAttendants from "../../components/admin/SessionAttendants";
import EditSessionModal from "../../components/admin/EditSessionModal";
import CreateGroupModal from "../../components/admin/CreateGroupModal";

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [numberOfGroups, setNumberOfGroups] = useState(2);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [groupAssignments, setGroupAssignments] = useState<{ [memberId: string]: number | null }>({});

  const [editFormData, setEditFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    locationId: "",
    locationName: "",
    location: "",
    instructions: "",
    theme: "",
    description: "",
    googlePlaceId: "",
    longitude: 0,
    latitude: 0,
  });
  const [editObjectives, setEditObjectives] = useState<string[]>([]);
  const [locationMode, setLocationMode] = useState<"select" | "create" | "update">("select");

  const { data: session, isLoading: sessionLoading } = useSession(id || "");
  const { data: themesData } = useThemes({ status: "approved" });
  const { data: locationsData } = useLocations();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();
  const remindRatings = useRemindRatings();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const { setPageTitle } = usePageTitle();

  // Update page title when session data is loaded
  useEffect(() => {
    if (session) {
      const subtitle = session.date
        ? (() => {
            const sessionDate = new Date(session.date);
            const weekdayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
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
            return `${weekdayNames[sessionDate.getDay()]} ${sessionDate.getDate()} ${monthNames[sessionDate.getMonth()]} ${sessionDate.getFullYear()}`;
          })()
        : "Session";
      setPageTitle(session.title, subtitle);
    }

    // Cleanup: reset page title when component unmounts
    return () => {
      setPageTitle(null, null);
    };
  }, [session, setPageTitle]);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Session non trouvée</p>
        <Link to="/admin/sessions" className="text-primary hover:text-primary/80 font-medium">
          Retour aux sessions
        </Link>
      </div>
    );
  }

  const formattedDate = session.date
    ? (() => {
        const sessionDate = new Date(session.date);
        const weekdayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
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
        return `${weekdayNames[sessionDate.getDay()]} ${sessionDate.getDate()} ${monthNames[sessionDate.getMonth()]} ${sessionDate.getFullYear()}`;
      })()
    : "non défini";
  const formattedTime =
    session.startTime && session.endTime
      ? `${formatTimeWithoutSeconds(session.startTime)} - ${formatTimeWithoutSeconds(session.endTime)}${session.duration ? ` (${session.duration})` : ""}`
      : "non défini";

  const themeOptions =
    themesData?.data?.map((theme) => ({
      value: theme.title,
      label: theme.title,
    })) || [];

  const locationOptions =
    locationsData?.data?.map((loc) => ({
      value: loc.id,
      label: loc.name ? `${loc.name} - ${loc.address}` : loc.address,
    })) || [];

  const selectedLocation = locationsData?.data?.find((loc) => loc.id === editFormData.locationId);

  const handleOpenEditModal = () => {
    setEditFormData({
      title: session.title || "",
      date: session.date || "",
      startTime: session.startTime || "",
      endTime: session.endTime || "",
      locationId: session.locationId || "",
      locationName: session.location?.name || "",
      location: session.location?.address || "",
      instructions: session.location?.instructions || "",
      theme: session.theme || "",
      description: session.description || "",
      googlePlaceId: session.location?.googlePlaceId || "",
      longitude: session.location?.longitude || 0,
      latitude: session.location?.latitude || 0,
    });
    setEditObjectives(session.objectives || []);
    setLocationMode(session.locationId ? "select" : "create");
    setShowEditModal(true);
  };

  const handleLocationSelect = (locationId: string) => {
    const location = locationsData?.data?.find((loc) => loc.id === locationId);
    if (location) {
      setEditFormData({
        ...editFormData,
        locationId: location.id,
        locationName: location.name || "",
        location: location.address,
        instructions: location.instructions || "",
        googlePlaceId: location.googlePlaceId,
        longitude: location.longitude,
        latitude: location.latitude,
      });
      setLocationMode("select");
    }
  };

  const handleCreateLocation = () => {
    if (!editFormData.location.trim()) {
      toast.error("Veuillez entrer une adresse");
      return;
    }

    if (!editFormData.googlePlaceId) {
      toast.error("Veuillez sélectionner une adresse depuis les suggestions");
      return;
    }

    createLocation.mutate(
      {
        name: editFormData.locationName.trim() || undefined,
        address: editFormData.location,
        instructions: editFormData.instructions || undefined,
        googlePlaceId: editFormData.googlePlaceId,
        longitude: editFormData.longitude,
        latitude: editFormData.latitude,
      },
      {
        onSuccess: (response) => {
          if (response.data) {
            setEditFormData({
              ...editFormData,
              locationId: response.data.id,
            });
            setLocationMode("select");
          }
        },
      },
    );
  };

  const handleUpdateLocation = () => {
    if (!editFormData.locationId) {
      toast.error("Aucun lieu sélectionné");
      return;
    }

    if (!editFormData.googlePlaceId) {
      toast.error("Veuillez sélectionner une adresse depuis les suggestions");
      return;
    }

    updateLocation.mutate(
      {
        id: editFormData.locationId,
        data: {
          name: editFormData.locationName.trim() || undefined,
          address: editFormData.location,
          instructions: editFormData.instructions || undefined,
          googlePlaceId: editFormData.googlePlaceId,
          longitude: editFormData.longitude,
          latitude: editFormData.latitude,
        },
      },
      {
        onSuccess: () => {
          setLocationMode("select");
        },
      },
    );
  };

  const handleSaveEdit = () => {
    updateSession.mutate(
      {
        id: id || "",
        data: {
          title: editFormData.title.trim() || undefined,
          date: editFormData.date || undefined,
          startTime: editFormData.startTime || undefined,
          endTime: editFormData.endTime || undefined,
          locationId: editFormData.locationId || undefined,
          theme: editFormData.theme || undefined,
          description: editFormData.description.trim() || undefined,
          objectives: editObjectives.length > 0 ? editObjectives : undefined,
        },
      },
      {
        onSuccess: () => {
          setShowEditModal(false);
        },
      },
    );
  };

  const handleDeleteSession = () => {
    if (!id) return;

    deleteSession.mutate(id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        navigate("/admin/sessions");
      },
    });
  };

  const handleCancelSession = () => {
    if (!id) return;

    if (window.confirm("Êtes-vous sûr de vouloir annuler cette session ?")) {
      updateSession.mutate({
        id: id,
        data: {
          status: "cancelled",
        },
      });
    }
  };

  const handleRemindRatings = () => {
    if (!id) return;

    if (window.confirm("Êtes-vous sûr de vouloir envoyer un rappel de notation aux participants ?")) {
      remindRatings.mutate(id);
    }
  };

  // Convert attendants to participants format for CreateGroupModal
  const allParticipants = (session.attendants || []).map((attendant) => ({
    id: attendant.id,
    name: attendant.name,
    avatar: attendant.avatar || "",
  }));

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <SessionOverview
            session={session}
            formattedDate={formattedDate}
            formattedTime={formattedTime}
            onEditClick={handleOpenEditModal}
            onDeleteClick={() => setShowDeleteModal(true)}
            onCancelClick={handleCancelSession}
          />
          <WorkGroups session={session} onCreateGroupsClick={() => setShowCreateGroupModal(true)} />
          <SessionResources resources={session.resources || []} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <SessionAttendants attendants={session.attendants || []} sessionId={session.id} sessionDate={session.date} />
          <SessionPolls polls={session.polls || []} />
          <SessionNotes
            ratings={session.ratings || []}
            totalRatings={session.totalRatings || 0}
            sessionId={session.id}
            ratingReminderSent={session.ratingReminderSent}
            onRemindRatings={handleRemindRatings}
            isReminding={remindRatings.isPending}
          />
        </div>
      </div>

      <EditSessionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        editFormData={editFormData}
        onFormDataChange={(data) => setEditFormData({ ...editFormData, ...data })}
        objectives={editObjectives}
        onObjectivesChange={setEditObjectives}
        locationMode={locationMode}
        onLocationModeChange={setLocationMode}
        themeOptions={themeOptions}
        locationOptions={locationOptions}
        locationsData={locationsData}
        selectedLocation={selectedLocation}
        onLocationSelect={handleLocationSelect}
        onCreateLocation={handleCreateLocation}
        onUpdateLocation={handleUpdateLocation}
        onSave={handleSaveEdit}
        createLocation={createLocation}
        updateLocation={updateLocation}
        updateSession={updateSession}
      />

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        sessionId={id || ""}
        numberOfGroups={numberOfGroups}
        onNumberOfGroupsChange={setNumberOfGroups}
        isRandomMode={isRandomMode}
        onRandomModeChange={setIsRandomMode}
        groupAssignments={groupAssignments}
        onGroupAssignmentsChange={setGroupAssignments}
        allParticipants={allParticipants}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal ? (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Supprimer la session</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-trash text-red-500 text-2xl"></i>
              </div>
              <p className="text-gray-700 text-center mb-2">
                Êtes-vous sûr de vouloir supprimer la session <strong>"{session.title}"</strong> ?
              </p>
              <p className="text-gray-500 text-sm text-center">
                Cette action est irréversible et supprimera toutes les données associées à cette session.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3 sm:space-y-0">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteSession.isPending}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={deleteSession.isPending}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteSession.isPending ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Suppression...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-trash mr-2"></i>
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SessionDetail;
