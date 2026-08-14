interface TimelineItem {
  event: string;
  date: string;
  color: string;
  future?: boolean;
}

interface PollTimelineSidebarProps {
  timeline: TimelineItem[];
}

const PollTimelineSidebar = ({ timeline }: PollTimelineSidebarProps) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Chronologie</h3>
      <div className="space-y-4">
        {timeline.map((item, idx) => (
          <div key={idx} className="flex items-start space-x-3">
            <div
              className={`w-2 h-2 ${
                item.color === "success"
                  ? "bg-success"
                  : item.color === "accent"
                    ? "bg-accent"
                    : item.color === "warning"
                      ? "bg-warning"
                      : "bg-gray-300"
              } rounded-full mt-2`}
            ></div>
            <div>
              <p className={`text-sm font-medium ${item.future ? "text-gray-500" : "text-gray-900"}`}>{item.event}</p>
              <p className={`text-xs ${item.future ? "text-gray-400" : "text-gray-500"}`}>{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PollTimelineSidebar;
