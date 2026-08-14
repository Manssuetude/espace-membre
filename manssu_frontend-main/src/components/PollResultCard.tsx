import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    Plotly?: {
      newPlot: (element: HTMLElement, data: any, layout: any, config: any) => void
    }
  }
}

interface PollResultCardProps {
  title: string
  participants: number
  date: string
  chartType?: 'bar' | 'pie' | 'stars'
  chartData?: {
    labels: string[]
    values: number[]
    colors?: string[]
  }
  results?: Array<{ label: string; value: number | string }>
  averageScore?: number
  maxScore?: number
  hideHeader?: boolean
}

const PollResultCard = ({
  title,
  participants,
  date,
  chartType = 'pie',
  chartData,
  results,
  averageScore,
  maxScore = 5,
  hideHeader = false,
}: PollResultCardProps) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartData || !chartRef.current) return

    const renderChart = () => {
      if (!window.Plotly || !chartRef.current) return

      let plotData: any[]
      let layout: any

      if (chartType === 'pie') {
        plotData = [{
          type: 'pie',
          labels: chartData.labels,
          values: chartData.values,
          marker: {
            colors: chartData.colors || ['#3b82f6', '#10b981', '#f97316', '#dc2626', '#6b7280']
          },
          textinfo: 'label',
          textposition: 'outside',
          hovertemplate: '<b>%{label}</b><extra></extra>'
        }]

        layout = {
          title: {
            text: '',
            font: { size: 16 }
          },
          margin: { t: 20, r: 20, b: 20, l: 20 },
          plot_bgcolor: 'transparent',
          paper_bgcolor: 'transparent',
          showlegend: true,
          legend: {
            orientation: 'h',
            y: -0.1
          }
        }
      } else if (chartType === 'bar') {
        plotData = [{
          type: 'bar',
          x: chartData.labels,
          y: chartData.values,
          marker: {
            color: chartData.colors || chartData.labels.map((_, idx) => {
              const colors = ['#dc2626', '#f97316', '#3b82f6']
              return colors[idx % colors.length]
            })
          },
          textposition: 'none',
          hovertemplate: '<b>%{x}</b><extra></extra>'
        }]

        layout = {
          title: {
            text: '',
            font: { size: 16 }
          },
          margin: { t: 20, r: 20, b: 40, l: 40 },
          plot_bgcolor: 'transparent',
          paper_bgcolor: 'transparent',
          xaxis: {
            showgrid: false
          },
          yaxis: {
            showgrid: true,
            gridcolor: '#e5e7eb'
          }
        }
      } else {
        // Stars chart - use bar chart with star labels
        plotData = [{
          type: 'bar',
          x: chartData.labels,
          y: chartData.values,
          marker: {
            color: chartData.colors || ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']
          },
          textposition: 'none',
          hovertemplate: '<b>%{x}</b><extra></extra>'
        }]

        layout = {
          title: {
            text: '',
            font: { size: 16 }
          },
          margin: { t: 20, r: 20, b: 40, l: 40 },
          plot_bgcolor: 'transparent',
          paper_bgcolor: 'transparent',
          xaxis: {
            showgrid: false
          },
          yaxis: {
            showgrid: true,
            gridcolor: '#e5e7eb'
          }
        }
      }

      window.Plotly.newPlot(chartRef.current, plotData, layout, {
        responsive: true,
        displayModeBar: false,
        displaylogo: false
      })
    }

    // Check if Plotly is already loaded
    if (window.Plotly) {
      renderChart()
      return
    }

    // Load Plotly dynamically if not already loaded
    const existingScript = document.querySelector('script[src="https://cdn.plot.ly/plotly-3.1.1.min.js"]')
    if (existingScript) {
      // Script is already loading/loaded, wait for it
      existingScript.addEventListener('load', renderChart)
      return () => {
        existingScript.removeEventListener('load', renderChart)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.plot.ly/plotly-3.1.1.min.js'
    script.async = true
    script.onload = renderChart
    document.body.appendChild(script)

    return () => {
      // Cleanup - don't remove script as other components might use it
    }
  }, [chartData, chartType])

  return (
    <div className={hideHeader ? '' : 'bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6'}>
      {!hideHeader && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{title}</h3>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Terminé</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {participants} participants • Terminé le {date}
          </p>
        </>
      )}

      {/* Chart */}
      {chartData && (
        <div className="h-[300px] mb-4" ref={chartRef}></div>
      )}

      {/* Results list */}
      {results && (
        <div className={averageScore ? 'mt-4' : 'mt-4 space-y-2'}>
          {results.map((result, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-600">{result.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Average score display */}
      {averageScore !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-success/10 to-emerald-500/10 rounded-lg">
            <span className="text-success font-semibold">Note moyenne</span>
            <span className="text-2xl font-bold text-success">
              {averageScore.toFixed(1)}/{maxScore}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PollResultCard

