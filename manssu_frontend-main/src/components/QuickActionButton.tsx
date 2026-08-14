import { Link } from 'react-router-dom'

interface QuickActionButtonProps {
  icon: string
  label: string
  color: 'primary' | 'accent' | 'secondary'
  onClick?: () => void
  to?: string
}

const colorClasses = {
  primary: 'from-primary to-red-500 shadow-primary/30',
  accent: 'from-accent to-blue-600 shadow-accent/30',
  secondary: 'from-secondary to-orange-600 shadow-secondary/30',
}

const QuickActionButton = ({ icon, label, color, onClick, to }: QuickActionButtonProps) => {
  const buttonContent = (
    <>
      <span className="flex items-center">
        <i className={`fa-solid ${icon} mr-3`}></i>
        {label}
      </span>
      <i className="fa-solid fa-arrow-right"></i>
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={`w-full p-4 bg-gradient-to-r ${colorClasses[color]} text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-between`}
      >
        {buttonContent}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 bg-gradient-to-r ${colorClasses[color]} text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-between`}
    >
      {buttonContent}
    </button>
  )
}

export default QuickActionButton

