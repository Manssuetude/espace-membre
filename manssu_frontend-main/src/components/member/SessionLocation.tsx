import { Location } from "../../types/location";

interface SessionLocationProps {
  location?: Location | null;
  isOnline: boolean;
  latitude?: number;
  longitude?: number;
}

const SessionLocation = ({ location, isOnline, latitude, longitude }: SessionLocationProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <i className="fa-solid fa-location-dot text-primary mr-3"></i>
        Localisation
      </h3>
      <div className="space-y-4">
        {!location ? (
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-map-marker-alt text-gray-400 text-xl"></i>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">non défini</p>
            </div>
          </div>
        ) : isOnline ? (
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent/10 to-blue-50 border border-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-video text-accent text-xl"></i>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Session en ligne</p>
              <p className="text-gray-600 text-sm">Le lien de connexion sera envoyé par email</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary/10 to-orange-50 border border-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-building text-secondary text-xl"></i>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1 break-words">{location.address || "non défini"}</p>
              </div>
            </div>
            {location.instructions && (
              <div className="bg-gradient-to-r from-accent/5 to-blue-50 border border-accent/20 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <i className="fa-solid fa-circle-info text-accent mt-1"></i>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Accès</p>
                    <p className="whitespace-pre-line">{location.instructions}</p>
                  </div>
                </div>
              </div>
            )}
            {location.googlePlaceId && (latitude || location.latitude) && (longitude || location.longitude) && (
              <button
                onClick={() => {
                  const lat = latitude ?? location.latitude;
                  const lng = longitude ?? location.longitude;
                  if (lat && lng) {
                    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
                  }
                }}
                className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:border-primary/30 transition-all flex items-center justify-center"
              >
                <i className="fa-solid fa-map-location-dot mr-2"></i>
                Voir sur Google Maps
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SessionLocation;
