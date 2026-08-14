import { Link } from 'react-router-dom'

interface ResourceCardProps {
  icon: string
  title: string
  type: string
  color: 'primary' | 'accent' | 'secondary'
  to?: string
}

const colorClasses = {
  primary: 'from-primary/20 to-red-500/20 text-primary border-primary/30',
  accent: 'from-accent/20 to-blue-600/20 text-accent border-accent/30',
  secondary: 'from-secondary/20 to-orange-600/20 text-secondary border-secondary/30',
}

const ResourceCard = ({ icon, title, type, color, to }: ResourceCardProps) => {
  const hoverBorderClasses = {
    primary: 'hover:border-primary/30',
    accent: 'hover:border-accent/30',
    secondary: 'hover:border-secondary/30',
  }
  
  const cardContent = (
    <div className="flex items-start">
      <div className={`w-10 h-10 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center mr-3`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div className="flex-1">
        <h5 className="font-medium text-gray-900 text-sm">{title}</h5>
        <p className="text-xs text-gray-500 mt-1">{type}</p>
      </div>
    </div>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={`p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 ${hoverBorderClasses[color]} transition-all cursor-pointer block`}
      >
        {cardContent}
      </Link>
    )
  }

  return (
    <div className={`p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 ${hoverBorderClasses[color]} transition-all`}>
      {cardContent}
    </div>
  )
}

export default ResourceCard

