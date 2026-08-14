import { useState } from 'react'
import { useThemeWindowStatus, useCreateTheme, useThemes } from '../../services/hooks/useThemes'
import WindowClosedBanner from '../../components/member/WindowClosedBanner'
import WindowClosedContent from '../../components/member/WindowClosedContent'
import WindowOpenBanner from '../../components/member/WindowOpenBanner'
import ThemeProposalForm from '../../components/member/ThemeProposalForm'
import ProposedThemesList from '../../components/member/ProposedThemesList'
import MyPropositionsSidebar from '../../components/member/MyPropositionsSidebar'

const ProposerTheme = () => {
  const { data: windowStatus, isLoading: windowLoading } = useThemeWindowStatus()
  const { data: approvedThemes } = useThemes({ status: 'approved', limit: 10 })
  const createTheme = useCreateTheme()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!windowStatus?.isOpen) {
      return
    }

    createTheme.mutate(
      {
        title: formData.title,
        description: formData.description,
        category: formData.category || undefined,
      },
      {
        onSuccess: () => {
          setFormData({ title: '', description: '', category: '' })
        },
      }
    )
  }

  // Get user proposals from window status (only for current active window)
  const myPropositions = windowStatus?.userProposals || []

  // Calculate proposals used in current window (all proposals count toward the limit)
  const proposalsUsed = myPropositions.length

  if (windowLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
      </div>
    )
  }

  if (!windowStatus?.isOpen) {
    return (
      <div>
        <WindowClosedBanner nextOpeningDate={windowStatus?.nextOpeningDate || null} />
        <WindowClosedContent />
      </div>
    )
  }

  return (
    <div>
      <WindowOpenBanner
        daysRemaining={windowStatus.daysRemaining || 0}
        startDate={windowStatus.startDate}
        endDate={windowStatus.endDate}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ThemeProposalForm
            formData={formData}
            onFormDataChange={setFormData}
            onSubmit={handleSubmit}
            isLoading={createTheme.isPending}
            proposalsUsed={proposalsUsed}
          />
        </div>
        <div className="space-y-6">
          <MyPropositionsSidebar themes={myPropositions} />
          <ProposedThemesList themes={approvedThemes?.data || []} />
        </div>
      </div>
    </div>
  )
}

export default ProposerTheme

