import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import AdminSidebar from '../AdminSidebar'
import Header from '../Header'
import { usePageTitle } from '../../contexts/PageTitleContext'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/admin': { title: 'Tableau de bord administrateur', subtitle: 'Gérez votre association efficacement' },
  '/admin/sessions': { title: 'Gestion des Sessions', subtitle: 'Organisez et gérez les sessions de votre association' },
  '/admin/sondages': { title: 'Gestion des Sondages', subtitle: 'Créez et gérez les sondages de votre association' },
  '/admin/themes': { title: 'Gestion des thèmes', subtitle: 'Gérez les propositions et validez les nouveaux thèmes' },
  '/admin/ressources': { title: 'Gestion des Ressources', subtitle: 'Organisez et validez les ressources partagées' },
  '/admin/ressources/past': { title: 'Ressources des sessions passées', subtitle: 'Consultez les ressources utilisées lors des sessions précédentes' },
  '/admin/membres': { title: 'Gestion des Membres', subtitle: 'Gérez les membres de votre association' },
  '/admin/feedbacks': { title: 'Gestion des Feedbacks', subtitle: 'Consultez et analysez les retours des membres' },
  '/admin/activites/formats': { title: 'Gestion des Formats', subtitle: 'Gérez les formats d\'activités utilisés dans les séances' },
  '/admin/questionnaires': { title: 'Gestion des Questionnaires', subtitle: 'Créez et gérez les questionnaires à remplir par les membres' },
}

// Helper to get page info for nested routes
const getPageInfo = (pathname: string) => {
  // Check exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname]
  }
  // Check for nested routes
  if (pathname.startsWith('/admin/sessions/') && pathname !== '/admin/sessions/create') {
    // Return default - will be overridden by usePageTitle if set
    return { title: 'Détail de la session', subtitle: 'Informations sur la session' }
  }
  if (pathname.startsWith('/admin/sondages/') && pathname !== '/admin/sondages/create') {
    return { title: 'Sélection du thème de la prochaine session', subtitle: 'Sondage actif depuis le 15 novembre 2024' }
  }
  if (pathname === '/admin/sessions/create') {
    return { title: 'Créer une session', subtitle: 'Créez une nouvelle session pour votre association' }
  }
  if (pathname === '/admin/sondages/create') {
    return { title: 'Créer un sondage', subtitle: 'Créez un nouveau sondage pour votre association' }
  }
  if (pathname === '/admin/ressources/add') {
    return { title: 'Ajouter une ressource', subtitle: 'Ajoutez une nouvelle ressource à votre association' }
  }
  // Default
  return { title: 'Manssuétude', subtitle: 'Tableau admin' }
}

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const pathname = location.pathname
  const { title: dynamicTitle, subtitle: dynamicSubtitle } = usePageTitle()
  const defaultPageInfo = getPageInfo(pathname)
  
  // Use dynamic title/subtitle if set, otherwise use default
  const pageInfo = {
    title: dynamicTitle || defaultPageInfo.title,
    subtitle: dynamicSubtitle || defaultPageInfo.subtitle,
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 font-inter min-h-screen">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 min-h-screen">
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-8 pt-28 lg:pt-28">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

