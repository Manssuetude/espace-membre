import { useState } from 'react'
import NextSessionResources from '../../components/member/NextSessionResources'
import PastSessionResources from '../../components/member/PastSessionResources'
import ProposeResourceModal from '../../components/member/ProposeResourceModal'

const Ressources = () => {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl font-bold text-gray-900">Ressources</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 bg-gradient-to-r from-primary to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center sm:justify-start"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Proposer une ressource
        </button>
      </div>
      <NextSessionResources />
      <PastSessionResources />
      <ProposeResourceModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}

export default Ressources

