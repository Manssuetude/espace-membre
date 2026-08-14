import { useState, useEffect, useRef } from 'react'
import { Poll } from '../../types/sondage'

declare global {
  interface Window {
    Plotly?: {
      newPlot: (element: HTMLElement, data: any, layout: any, config: any) => void
    }
  }
}

interface ChartDisplayProps {
  chartType: 'bar' | 'pie'
  chartData: {
    labels: string[]
    values: number[]
    colors?: string[]
  }
}

const ChartDisplay = ({ chartType, chartData }: ChartDisplayProps) => {
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
          title: { text: '', font: { size: 16 } },
          margin: { t: 20, r: 20, b: 20, l: 20 },
          plot_bgcolor: 'transparent',
          paper_bgcolor: 'transparent',
          showlegend: true,
          legend: { orientation: 'h', y: -0.1 }
        }
      } else {
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
          title: { text: '', font: { size: 16 } },
          margin: { t: 20, r: 20, b: 40, l: 40 },
          plot_bgcolor: 'transparent',
          paper_bgcolor: 'transparent',
          xaxis: { showgrid: false },
          yaxis: { showgrid: true, gridcolor: '#e5e7eb' }
        }
      }

      window.Plotly.newPlot(chartRef.current, plotData, layout, {
        responsive: true,
        displayModeBar: false,
        displaylogo: false
      })
    }

    if (window.Plotly) {
      renderChart()
      return
    }

    const existingScript = document.querySelector('script[src="https://cdn.plot.ly/plotly-3.1.1.min.js"]')
    if (existingScript) {
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
      // Cleanup
    }
  }, [chartData, chartType])

  return <div className="h-[300px] mb-4" ref={chartRef}></div>
}

interface CompletedPollsSectionProps {
  polls: Poll[]
  formatDate: (dateStr?: string) => string
}

type ViewType = 'list' | 'histogram' | 'pie'

const CompletedPollsSection = ({ polls, formatDate }: CompletedPollsSectionProps) => {
  const [viewTypes, setViewTypes] = useState<Record<string, ViewType>>({})
  const [expandedPolls, setExpandedPolls] = useState<Record<string, boolean>>({})

  const togglePollExpansion = (pollId: string) => {
    setExpandedPolls(prev => ({
      ...prev,
      [pollId]: !prev[pollId]
    }))
  }

  if (polls.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <i className="fa-solid fa-chart-bar text-accent mr-3"></i>
          Sondages passés et résultats
        </h2>
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-accent/10 to-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-chart-bar text-accent text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">Aucun sondage terminé</p>
          <p className="text-gray-400 text-xs">Les résultats des sondages terminés apparaîtront ici</p>
        </div>
      </div>
    )
  }

  const formatVoteDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getViewType = (pollId: string): ViewType => {
    return viewTypes[pollId] || 'list'
  }

  const setViewType = (pollId: string, viewType: ViewType) => {
    setViewTypes((prev) => ({
      ...prev,
      [pollId]: viewType,
    }))
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
        <i className="fa-solid fa-chart-bar text-accent mr-3"></i>
        Sondages passés et résultats
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {polls.map((poll) => {
          // Use questions array if available, otherwise fallback to legacy format
          const questions = poll.questions && poll.questions.length > 0 
            ? poll.questions 
            : poll.question 
              ? [{
                  id: 'legacy-question',
                  question: poll.question,
                  description: poll.description,
                  orderIndex: 0,
                  singleResponse: poll.singleResponse ?? true,
                  options: poll.options || [],
                  userVote: poll.userVote 
                    ? (Array.isArray(poll.userVote) ? poll.userVote[0] : poll.userVote)
                    : null,
                }]
              : []
          
          const currentView = getViewType(poll.id)
          
          // Determine chart type based on selected view
          let chartType: 'bar' | 'pie' | undefined
          if (currentView === 'histogram') {
            chartType = 'bar'
          } else if (currentView === 'pie') {
            chartType = 'pie'
          }

          return (
            <div key={poll.id} className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex-1">{poll.title}</h3>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setViewType(poll.id, 'list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      currentView === 'list'
                        ? 'bg-gradient-to-r from-accent to-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Vue liste"
                  >
                    <i className="fa-solid fa-list"></i>
                  </button>
                  <button
                    onClick={() => setViewType(poll.id, 'histogram')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      currentView === 'histogram'
                        ? 'bg-gradient-to-r from-accent to-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Vue histogramme"
                  >
                    <i className="fa-solid fa-chart-column"></i>
                  </button>
                  <button
                    onClick={() => setViewType(poll.id, 'pie')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      currentView === 'pie'
                        ? 'bg-gradient-to-r from-accent to-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Vue camembert"
                  >
                    <i className="fa-solid fa-chart-pie"></i>
                  </button>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full ml-2">Terminé</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {poll.totalResponses} participants • Terminé le {formatDate(poll.endDate || poll.createdAt || undefined)}
              </p>

              {/* Display all questions */}
              {questions.length > 0 && (
                <div className="mb-4 space-y-6">
                  {(expandedPolls[poll.id] ? questions : questions.slice(0, 2)).map((question, qIdx) => {
                    // Get the original index from the full questions array
                    const originalIndex = questions.findIndex(q => q.id === question.id)
                    
                    // Chart data for this specific question
                    const questionChartData = {
                      labels: question.options?.map(opt => opt.label) || [],
                      values: question.options?.map(opt => opt.votes || 0) || [],
                      colors: question.options?.map((_, idx) => {
                        const colors = ['#dc2626', '#f97316', '#3b82f6', '#10b981', '#6b7280']
                        return colors[idx % colors.length]
                      }) || [],
                    }

                    // Results for this specific question (only for list view)
                    const questionResults = currentView === 'list' ? question.options?.map(opt => ({
                      label: opt.label,
                      value: opt.percentage || 0,
                      votes: opt.votes || 0,
                    })) || [] : undefined
                    
                    return (
                      <div key={question.id || qIdx} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                        <h4 className="text-base font-semibold text-gray-900 mb-2">
                          {questions.length > 1 && `Question ${originalIndex + 1}: `}
                          {question.question}
                        </h4>
                        {question.description && (
                          <p className="text-sm text-gray-600 mb-3">{question.description}</p>
                        )}
                        
                        {/* User vote for this question */}
                        {(() => {
                          const userVote = question.userVote
                          const userVotesArray = userVote 
                            ? Array.isArray(userVote) 
                              ? userVote 
                              : [userVote]
                            : []
                          
                          if (userVotesArray.length > 0) {
                            return (
                              <div className="px-3 py-2 bg-gradient-to-r from-primary/10 to-red-500/10 rounded-lg border border-primary/20 mb-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center mb-2">
                                      <i className="fa-solid fa-check-circle text-primary mr-2"></i>
                                      <span className="text-sm font-medium text-gray-900">
                                        Votre{userVotesArray.length > 1 ? 's choix' : ' choix'}:
                                      </span>
                                    </div>
                                    <div className="ml-6 space-y-1">
                                      {userVotesArray.map((vote, voteIdx) => (
                                        <div key={voteIdx} className="flex items-center justify-between">
                                          <span className="text-sm text-primary font-semibold">
                                            • {vote.optionLabel}
                                          </span>
                                          {vote.votedAt && (
                                            <span className="text-xs text-gray-500 ml-2">
                                              {formatVoteDate(vote.votedAt)}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          } else {
                            return (
                              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                                <p className="text-xs text-gray-500 text-center">Vous n'avez pas voté pour cette question</p>
                              </div>
                            )
                          }
                        })()}

                        {/* Chart for this question (only for histogram or pie view) */}
                        {chartType && questionChartData && questionChartData.labels.length > 0 && (
                          <div className="mt-4">
                            <ChartDisplay chartType={chartType} chartData={questionChartData} />
                          </div>
                        )}

                        {/* Results list for this question (only for list view) */}
                        {currentView === 'list' && questionResults && questionResults.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {questionResults.map((result, idx) => {
                              const colors = ['#dc2626', '#f97316', '#3b82f6', '#10b981', '#6b7280']
                              const color = colors[idx % colors.length]
                              const percentage = typeof result.value === 'number' ? result.value : 0
                              
                              return (
                                <div key={idx} className="space-y-1.5">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700 font-medium">{result.label}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-600 text-xs">{result.votes} vote{result.votes > 1 ? 's' : ''}</span>
                                      <span className="text-primary font-semibold min-w-[3rem] text-right">{percentage}%</span>
                                    </div>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-300"
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor: color,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {questions.length > 2 && (
                    <button
                      onClick={() => togglePollExpansion(poll.id)}
                      className="w-full mt-4 px-4 py-3 text-sm font-medium text-accent hover:text-accent/80 border border-accent/30 hover:border-accent rounded-xl transition-all flex items-center justify-center"
                    >
                      {expandedPolls[poll.id] ? (
                        <>
                          <i className="fa-solid fa-chevron-up mr-2"></i>
                          Voir moins
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-chevron-down mr-2"></i>
                          Voir tout ({questions.length} questions)
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CompletedPollsSection

