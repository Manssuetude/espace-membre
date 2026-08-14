interface FormInputProps {
  label: string
  type?: string
  value: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  rows?: number
  className?: string
  error?: string
}

const FormInput = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  rows,
  className = '',
  error,
}: FormInputProps) => {
  const baseClasses = `w-full px-4 py-3 rounded-xl border transition-all bg-gray-50 focus:bg-white ${
    error
      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
      : 'border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary'
  }`
  const isTextarea = rows !== undefined

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-primary ml-1">*</span>}
        </label>
      )}
      {isTextarea ? (
        <textarea
          rows={rows}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`${baseClasses} resize-none ${className}`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`${baseClasses} ${className}`}
        />
      )}
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center">
          <i className="fa-solid fa-exclamation-circle mr-1"></i>
          {error}
        </p>
      )}
    </div>
  )
}

export default FormInput

