interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: DropdownOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  error?: string
}

const Dropdown = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  error,
}: DropdownProps) => {
  const baseClasses = `w-full px-4 py-3 pr-10 rounded-xl border transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer ${
    error
      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
      : 'border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'
  }`

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-primary ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${baseClasses} ${className} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <i className="fa-solid fa-chevron-down text-gray-400 text-sm"></i>
        </div>
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center">
          <i className="fa-solid fa-exclamation-circle mr-1"></i>
          {error}
        </p>
      )}
    </div>
  )
}

export default Dropdown
