import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMembers, useCreateMember, useDeleteMember, useSuspendMember, useUnsuspendMember, useUpdateMember } from '../../services/hooks/useMembers'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'
import { Member } from '../../types/member'
import MembersStats from '../../components/admin/MembersStats'
import MembersFilters from '../../components/admin/MembersFilters'
import MembersTable from '../../components/admin/MembersTable'
import AddMemberModal from '../../components/admin/AddMemberModal'
import EditMemberModal from '../../components/admin/EditMemberModal'
import CreateInviteModal from '../../components/admin/CreateInviteModal'
import InvitationsList from '../../components/admin/InvitationsList'
import InvitationRequestsList from '../../components/admin/InvitationRequestsList'
import Pagination from '../../components/Pagination'

const Membres = () => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [roleFilter, setRoleFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCreateInviteModal, setShowCreateInviteModal] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '' as 'member' | 'admin' | 'super admin' | '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: membersData, isLoading } = useMembers({
    search: searchQuery || undefined,
    page: currentPage,
    limit: pageSize,
  })

  const createMember = useCreateMember()
  const deleteMember = useDeleteMember()
  const suspendMember = useSuspendMember()
  const unsuspendMember = useUnsuspendMember()
  const updateMember = useUpdateMember()
  
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: undefined as 'member' | 'admin' | 'super_admin' | 'guest' | undefined,
  })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  // Filter members by role on client side
  const members = (membersData?.data || []).filter((member) => {
    if (roleFilter === 'all') return true
    if (roleFilter === 'member') return member.role === 'member'
    if (roleFilter === 'admins') return member.role === 'admin'
    if (roleFilter === 'super admins') return member.role === 'super admin'
    return true
  })

  // Reset to page 1 when filters change
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleSuspendMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir suspendre ${memberName} ?`)) {
      suspendMember.mutate(memberId)
    }
  }

  const handleUnsuspendMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir réactiver ${memberName} ?`)) {
      unsuspendMember.mutate(memberId)
    }
  }

  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${memberName} ?\n\nCette action est permanente et ne peut pas être annulée. Toutes les données associées seront supprimées.`)) {
      deleteMember.mutate(memberId)
    }
  }

  const handleViewMember = (memberId: string) => {
    navigate(`/admin/membres/${memberId}`)
  }

  const handleEditMember = (member: Member) => {
    setSelectedMember(member)
    setEditFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role === 'super admin' ? 'super_admin' : member.role,
    })
    setEditErrors({})
    setShowEditModal(true)
  }

  const validateEditForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!editFormData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire'
    }
    if (!editFormData.lastName.trim()) {
      newErrors.lastName = 'Le nom est obligatoire'
    }
    if (!editFormData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      newErrors.email = 'Veuillez entrer une adresse email valide'
    }

    setEditErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMember) return
    
    if (!validateEditForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire')
      return
    }

    updateMember.mutate(
      {
        id: selectedMember.id,
        data: {
          firstName: editFormData.firstName,
          lastName: editFormData.lastName,
          email: editFormData.email,
          role: editFormData.role,
        },
      },
      {
        onSuccess: () => {
          setShowEditModal(false)
          setSelectedMember(null)
          setEditFormData({ firstName: '', lastName: '', email: '', role: undefined })
          setEditErrors({})
        },
      }
    )
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedMember(null)
    setEditFormData({ firstName: '', lastName: '', email: '', role: undefined })
    setEditErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est obligatoire'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Veuillez entrer une adresse email valide'
    }
    if (!formData.role) {
      newErrors.role = 'Le rôle est obligatoire'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire')
      return
    }

    createMember.mutate(
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role as 'member' | 'admin' | 'super admin',
      },
      {
        onSuccess: () => {
          setShowAddModal(false)
          setFormData({ firstName: '', lastName: '', email: '', role: '' })
          setErrors({})
        },
      }
    )
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setFormData({ firstName: '', lastName: '', email: '', role: '' })
    setErrors({})
  }

  return (
    <div>
      <MembersStats />
      <MembersFilters
        searchQuery={searchQuery}
        roleFilter={roleFilter}
        onSearchChange={handleSearchChange}
        onRoleFilterChange={handleRoleFilterChange}
        onAddClick={() => setShowAddModal(true)}
      />
      <MembersTable
        members={members}
        isLoading={isLoading}
        currentUser={currentUser}
        onViewMember={handleViewMember}
        onEditMember={handleEditMember}
        onSuspendMember={handleSuspendMember}
        onUnsuspendMember={handleUnsuspendMember}
        onDeleteMember={handleDeleteMember}
        isSuspending={suspendMember.isPending}
        isUnsuspending={unsuspendMember.isPending}
        isDeleting={deleteMember.isPending}
      />
      {membersData && membersData.totalPages > 1 && (
        <Pagination
          currentPage={membersData.page}
          totalPages={membersData.totalPages}
          total={membersData.total}
          limit={membersData.limit}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Invitation Requests Section */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Demandes d'invitation</h2>
        <InvitationRequestsList />
      </div>

      {/* Invitations Section */}
      <div className="mt-6 sm:mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Invitations</h2>
          <button
            onClick={() => setShowCreateInviteModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-primary to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            Ajouter un invité
          </button>
        </div>
        <InvitationsList showSessionTitle={true} />
      </div>

      <AddMemberModal
        isOpen={showAddModal}
        formData={formData}
        errors={errors}
        isLoading={createMember.isPending}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onFormDataChange={(data) => setFormData({ ...formData, ...data })}
        onErrorClear={(field) => {
          if (errors[field]) {
            const newErrors = { ...errors }
            delete newErrors[field]
            setErrors(newErrors)
          }
        }}
      />
      <EditMemberModal
        isOpen={showEditModal}
        member={selectedMember}
        currentUser={currentUser}
        formData={editFormData}
        errors={editErrors}
        isLoading={updateMember.isPending}
        onClose={handleCloseEditModal}
        onSubmit={handleEditSubmit}
        onFormDataChange={(data) => setEditFormData({ ...editFormData, ...data })}
        onErrorClear={(field) => {
          if (editErrors[field]) {
            const newErrors = { ...editErrors }
            delete newErrors[field]
            setEditErrors(newErrors)
          }
        }}
      />
      <CreateInviteModal
        isOpen={showCreateInviteModal}
        onClose={() => setShowCreateInviteModal(false)}
        onSuccess={() => {
          // Modal will close automatically, list will refresh via query invalidation
        }}
      />
    </div>
  )
}

export default Membres

