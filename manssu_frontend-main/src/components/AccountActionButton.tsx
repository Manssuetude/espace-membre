interface AccountActionButtonProps {
  icon: string
  label: string
  onClick: () => void
  variant?: 'default' | 'warning' | 'danger'
}

const AccountActionButton = ({ icon, label, onClick, variant = 'default' }: AccountActionButtonProps) => {
  const variantClasses = {
    default: 'text-gray-700 hover:bg-gray-50',
    warning: 'text-warning hover:bg-warning/10',
    danger: 'text-red-600 hover:bg-red-50',
  }

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 text-left rounded-xl transition-all ${variantClasses[variant]}`}
    >
      <i className={`fa-solid ${icon} mr-3 ${variant === 'danger' ? 'text-red-600' : variant === 'warning' ? 'text-warning' : 'text-accent'}`}></i>
      {label}
    </button>
  )
}

export default AccountActionButton

