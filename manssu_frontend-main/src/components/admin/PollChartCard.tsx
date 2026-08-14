import { useEffect, useRef } from "react";

interface PollOption {
  label: string;
  votes: number;
  percentage: number;
  color?: string;
}

interface PollChartCardProps {
  options: PollOption[];
  questionTitle?: string;
}

const PollChartCard = ({ options, questionTitle }: PollChartCardProps) => {
  const voteChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Plotly dynamically
    const script = document.createElement("script");
    script.src = "https://cdn.plot.ly/plotly-3.1.1.min.js";
    script.async = true;
    script.onload = () => {
      if (window.Plotly && voteChartRef.current) {
        // Color mapping
        const colorMap: { [key: string]: string } = {
          primary: "#ef4444",
          accent: "#3b82f6",
          success: "#10b981",
          secondary: "#f97316",
          blue: "#3b82f6",
          green: "#10b981",
          orange: "#f97316",
        };

        const defaultColors = ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899"];

        // Vote Distribution Pie Chart
        const voteData = [
          {
            type: "pie",
            labels: options.map((opt) => opt.label),
            values: options.map((opt) => opt.votes),
            marker: {
              colors: options.map((opt, idx) =>
                opt.color && colorMap[opt.color] ? colorMap[opt.color] : defaultColors[idx % defaultColors.length],
              ),
            },
            textinfo: "label+percent",
            textposition: "outside",
            hovertemplate: "<b>%{label}</b><br>Votes: %{value}<br>Pourcentage: %{percent}<extra></extra>",
          },
        ];

        const voteLayout = {
          title: {
            text: "",
            font: { size: 16 },
          },
          margin: { t: 20, r: 20, b: 20, l: 20 },
          plot_bgcolor: "transparent",
          paper_bgcolor: "transparent",
          showlegend: true,
          legend: {
            orientation: "h",
            y: -0.1,
          },
        };

        window.Plotly.newPlot(voteChartRef.current, voteData, voteLayout, {
          responsive: true,
          displayModeBar: false,
          displaylogo: false,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [options]);

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {questionTitle ? `Répartition des votes - ${questionTitle}` : "Répartition des votes"}
      </h3>
      <div ref={voteChartRef} style={{ height: "400px" }}></div>
    </div>
  );
};

export default PollChartCard;
