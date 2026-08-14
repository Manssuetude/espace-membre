const FeedbackTipsSidebar = () => {
  const tips = [
    { icon: 'fa-lightbulb', text: 'Soyez spécifique et constructif dans vos commentaires', color: 'secondary' },
    { icon: 'fa-target', text: 'Proposez des solutions quand vous identifiez un problème', color: 'accent' },
    { icon: 'fa-heart', text: "N'hésitez pas à partager vos expériences positives", color: 'primary' },
  ]

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Conseils pour un bon feedback</h3>
      <div className="space-y-3">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex items-start">
            <i className={`fa-solid ${tip.icon} text-${tip.color} mt-1 mr-3`}></i>
            <p className="text-sm text-gray-600">{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeedbackTipsSidebar

