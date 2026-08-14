interface SessionDescriptionProps {
  description?: string | null
  objectives?: string[]
}

const SessionDescription = ({ description, objectives }: SessionDescriptionProps) => {
  const hasContent = description || (objectives && objectives.length > 0)
  
  if (!hasContent) {
    return null
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <i className="fa-solid fa-file-lines text-primary mr-3"></i>
        Description détaillée
      </h3>
      <div className="space-y-4 text-gray-700">
        {description && (
          <p className="whitespace-pre-line">{description}</p>
        )}
        {objectives && objectives.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Au programme :</h4>
            <ul className="space-y-2">
              {objectives.map((objective, index) => (
                <li key={index} className="flex items-start">
                  <i className="fa-solid fa-check text-primary mr-2 mt-1 flex-shrink-0"></i>
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionDescription

