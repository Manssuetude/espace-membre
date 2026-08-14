import { useState, useMemo } from 'react'
import { useSessions } from '../../services/hooks/useSessions'
import { useResources } from '../../services/hooks/useResources'
import { translateResourceType } from '../../utils/resourceUtils'
import PastResourcesHeader from '../../components/admin/PastResourcesHeader'
import PastResourcesStats from '../../components/admin/PastResourcesStats'
import PastResourcesFilters from '../../components/admin/PastResourcesFilters'
import PastResourcesSessionCard from '../../components/admin/PastResourcesSessionCard'

const PastResources = () => {
  const [yearFilter, setYearFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch past sessions
  const { data: sessionsData, isLoading: isLoadingSessions } = useSessions({ status: 'completed', limit: 100 })
  const pastSessions = sessionsData?.data || []

  // Fetch all resources
  const { data: resourcesData, isLoading: isLoadingResources } = useResources({ limit: 100 })
  const allResources = resourcesData?.data || []

  // Get available years and months from sessions
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    pastSessions.forEach((session) => {
      if (session.date) {
        const year = new Date(session.date).getFullYear().toString()
        years.add(year)
      }
    })
    return Array.from(years).sort().reverse()
  }, [pastSessions])

  // Transform sessions with resources
  const sessionsWithResources = useMemo(() => {
    return pastSessions
      .map((session): {
        id: string
        title: string
        date: string
        participants: number
        resourcesCount: number
        icon: string
        color: string
        resources: Array<{
          title: string
          type: string
          size: string
          icon: string
          color: string
          description: string | null
          link: string
        }>
      } | null => {
        const sessionResources = allResources.filter((resource) => resource.sessionId === session.id)

        // Filter by type if needed
        const filteredResources = typeFilter !== 'all'
          ? sessionResources.filter((resource) => {
              const resourceType = resource.type.toLowerCase()
              if (typeFilter === 'pdf') return resourceType === 'file'
              if (typeFilter === 'video') return resourceType === 'video'
              if (typeFilter === 'audio') return resourceType === 'audio'
              if (typeFilter === 'link') return resourceType === 'folder'
              return true
            })
          : sessionResources

        // Filter by year
        if (yearFilter !== 'all' && session.date) {
          const sessionYear = new Date(session.date).getFullYear().toString()
          if (sessionYear !== yearFilter) return null
        }

        // Filter by month
        if (monthFilter !== 'all' && session.date) {
          const sessionMonth = new Date(session.date).toLocaleDateString('fr-FR', { month: 'long' }).toLowerCase()
          const monthMap: Record<string, string> = {
            'janvier': 'january',
            'février': 'february',
            'mars': 'march',
            'avril': 'april',
            'mai': 'may',
            'juin': 'june',
            'juillet': 'july',
            'août': 'august',
            'septembre': 'september',
            'octobre': 'october',
            'novembre': 'november',
            'décembre': 'december',
          }
          const normalizedMonth = monthMap[sessionMonth] || sessionMonth
          if (normalizedMonth !== monthFilter) return null
        }

        // Filter by search term
        if (searchTerm && !session.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          return null
        }

        // Only include sessions with resources
        if (filteredResources.length === 0) return null

        // Format date
        const formattedDate = session.date
          ? (() => {
              const date = new Date(session.date)
              const day = date.getDate()
              const monthNames = [
                'Janvier',
                'Février',
                'Mars',
                'Avril',
                'Mai',
                'Juin',
                'Juillet',
                'Août',
                'Septembre',
                'Octobre',
                'Novembre',
                'Décembre',
              ]
              const month = monthNames[date.getMonth()]
              return `${day} ${month} ${date.getFullYear()}`
            })()
          : 'Date inconnue'

        // Get icon and color based on theme or type
        const getSessionIcon = () => {
          if (session.theme) {
            const themeLower = session.theme.toLowerCase()
            if (themeLower.includes('méditation') || themeLower.includes('pleine conscience')) return 'fa-brain'
            if (themeLower.includes('stress') || themeLower.includes('exercice')) return 'fa-dumbbell'
            if (themeLower.includes('sommeil')) return 'fa-moon'
          }
          return 'fa-calendar-check'
        }

        const getSessionColor = () => {
          if (session.theme) {
            const themeLower = session.theme.toLowerCase()
            if (themeLower.includes('méditation') || themeLower.includes('pleine conscience')) return 'green'
            if (themeLower.includes('stress') || themeLower.includes('exercice')) return 'orange'
            if (themeLower.includes('sommeil')) return 'purple'
          }
          return 'green'
        }

        // Transform resources
        const transformedResources = filteredResources.map((resource) => {
          // Get icon based on type
          const getIcon = (type: string) => {
            switch (type) {
              case 'file':
                return 'fa-file-pdf'
              case 'video':
                return 'fa-video'
              case 'audio':
                return 'fa-headphones'
              case 'folder':
                return 'fa-link'
              default:
                return 'fa-file'
            }
          }

          // Get color based on type
          const getColor = (type: string) => {
            switch (type) {
              case 'file':
                return 'red'
              case 'video':
                return 'blue'
              case 'audio':
                return 'purple'
              case 'folder':
                return 'yellow'
              default:
                return 'blue'
            }
          }

          // Format size
          let size = ''
          if (resource.fileSize) {
            const sizeMB = (resource.fileSize / (1024 * 1024)).toFixed(1)
            size = `${sizeMB} MB`
          } else if (resource.type === 'video' || resource.type === 'audio') {
            size = 'N/A'
          } else if (resource.type === 'folder') {
            size = 'Dossier'
          }

          return {
            title: resource.title,
            type: translateResourceType(resource.type),
            size,
            icon: getIcon(resource.type),
            color: getColor(resource.type),
            description: resource.description || null,
            link: resource.link,
          }
        })

        return {
          id: session.id,
          title: session.title,
          date: formattedDate,
          participants: session.registered || 0,
          resourcesCount: transformedResources.length,
          icon: getSessionIcon(),
          color: getSessionColor(),
          resources: transformedResources,
        }
      })
      .filter((session) => session !== null)
  }, [pastSessions, allResources, yearFilter, monthFilter, typeFilter, searchTerm])

  // Calculate stats
  const stats = useMemo(() => {
    const totalSessions = sessionsWithResources.length
    const totalResources = sessionsWithResources.reduce((sum, session) => sum + session.resourcesCount, 0)

    return {
      totalSessions,
      totalResources,
    }
  }, [sessionsWithResources])

  if (isLoadingSessions || isLoadingResources) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    )
  }

  return (
    <div>
      <PastResourcesHeader />
      <PastResourcesStats
        totalSessions={stats.totalSessions}
        totalResources={stats.totalResources}
      />
      <PastResourcesFilters
        yearFilter={yearFilter}
        monthFilter={monthFilter}
        typeFilter={typeFilter}
        onYearFilterChange={setYearFilter}
        onMonthFilterChange={setMonthFilter}
        onTypeFilterChange={setTypeFilter}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        availableYears={availableYears}
      />
      {sessionsWithResources.length === 0 ? (
        <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg border border-gray-200/50">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-folder-open text-gray-400 text-2xl"></i>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">Aucune session passée avec ressources</p>
          <p className="text-gray-400 text-xs">Aucune ressource n'est disponible pour les sessions passées</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sessionsWithResources.map((session) => (
            <PastResourcesSessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}

export default PastResources

