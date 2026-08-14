interface PollOptionProps {
  id: string
  label: string
  votes: number
  totalVotes: number
  selected?: boolean
  color?: 'primary' | 'accent' | 'secondary'
  onSelect?: () => void
  singleResponse?: boolean
  questionId?: string
}

const PollOption = ({ id, label, votes, totalVotes, selected = false, color = 'primary', onSelect, singleResponse = true, questionId }: PollOptionProps) => {
  const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
  const inputType = singleResponse ? 'radio' : 'checkbox'
  const inputName = singleResponse && questionId ? `poll-${questionId}` : id
  
  const colorClasses = {
    primary: {
      border: selected ? 'border-primary/20' : 'border-gray-200 hover:border-primary/40',
      bg: selected ? 'bg-gradient-to-r from-red-50 to-orange-50' : 'bg-white',
      input: 'text-primary',
      progress: 'from-primary to-red-500',
    },
    accent: {
      border: selected ? 'border-accent/20' : 'border-gray-200 hover:border-accent/40',
      bg: selected ? 'bg-gradient-to-r from-blue-50 to-cyan-50' : 'bg-white',
      input: 'text-accent',
      progress: 'from-accent to-blue-600',
    },
    secondary: {
      border: selected ? 'border-secondary/20' : 'border-gray-200 hover:border-secondary/40',
      bg: selected ? 'bg-gradient-to-r from-orange-50 to-amber-50' : 'bg-white',
      input: 'text-secondary',
      progress: 'from-secondary to-orange-600',
    },
  }

  const classes = colorClasses[color]

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onSelect) {
      onSelect()
    }
  }

  return (
    <div
      className={`p-4 border-2 ${classes.border} ${classes.bg} rounded-xl cursor-pointer transition-all`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <input
            type={inputType}
            name={inputName}
            id={id}
            checked={selected}
            onChange={() => {}}
            className={`w-4 h-4 ${classes.input} pointer-events-none`}
            readOnly
            tabIndex={-1}
          />
          <label 
            htmlFor={id} 
            className="ml-3 font-medium text-gray-900 cursor-pointer flex-1 select-none"
          >
            {label}
          </label>
        </div>
        <div className="w-16 h-2 bg-gray-200 rounded-full ml-4">
          <div
            className={`h-2 bg-gradient-to-r ${classes.progress} rounded-full`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default PollOption

