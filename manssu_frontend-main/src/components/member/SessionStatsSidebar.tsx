interface SessionStatsSidebarProps {
  attendanceRate?: number;
  averageGrade?: number;
}

const SessionStatsSidebar = ({ attendanceRate, averageGrade }: SessionStatsSidebarProps) => {
  if (attendanceRate === undefined && averageGrade === undefined) {
    return null;
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
      <div className="space-y-4">
        {attendanceRate !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-user-check text-primary"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Taux de présence</p>
                <p className="text-lg font-semibold text-gray-900">{attendanceRate}%</p>
              </div>
            </div>
          </div>
        )}
        {averageGrade !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-star text-warning"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">Note moyenne</p>
                <p className="text-lg font-semibold text-gray-900">{averageGrade.toFixed(1)}/5</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionStatsSidebar;
