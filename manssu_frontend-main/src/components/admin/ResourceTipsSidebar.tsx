const ResourceTipsSidebar = () => {
  const tips = [
    "Utilisez un titre descriptif et accrocheur",
    "Décrivez clairement l'objectif et l'utilité",
    "Choisissez la bonne catégorie pour faciliter la recherche",
    "Ajoutez des tags pertinents",
  ]

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
        <i className="fa-solid fa-lightbulb text-warning mr-2"></i>
        Conseils
      </h3>
      <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex items-start space-x-2 sm:space-x-3">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
            <p className="text-gray-700">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResourceTipsSidebar

