const FeedbackHeader = () => {
  return (
    <div className="flex items-center mb-6">
      <div className="w-12 h-12 bg-gradient-to-br from-primary to-red-500 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-red-500/30">
        <i className="fa-solid fa-comment-dots text-white text-xl"></i>
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">Nouveau feedback</h2>
        <p className="text-gray-600">Votre avis nous aide à améliorer l'association</p>
      </div>
    </div>
  )
}

export default FeedbackHeader

