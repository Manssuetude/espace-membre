interface StatCardProps {
  label: string
  value: string | number
  icon: string
  color: 'primary' | 'accent' | 'secondary' | 'success'
}

const colorClasses = {
  primary: 'from-primary/10 to-red-500/10 text-primary',
  accent: 'from-accent/10 to-blue-600/10 text-accent',
  secondary: 'from-secondary/10 to-orange-600/10 text-secondary',
  success: 'from-success/10 to-emerald-600/10 text-success',
}

const StatCard = ({ label, value, icon, color }: StatCardProps) => {
  return (
    <div className="bg-white/90 backdrop-blur-xl p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/20 transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <i className={`fa-solid ${icon} text-xl`}></i>
        </div>
      </div>
    </div>
  )
}

export default StatCard

