import { useState, useRef, useEffect } from 'react'

interface SearchableDropdownOption {
  value: string
  label: string
}

interface SearchableDropdownProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SearchableDropdownOption[]
  placeholder?: string
  required?: boolean
  className?: string
  error?: string
  allowCustom?: boolean // Allow entering custom text not in options
}

const SearchableDropdown = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Rechercher...',
  required = false,
  className = '',
  error,
  allowCustom = true,
}: SearchableDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(options)
    }
  }, [searchTerm, options])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    setIsOpen(true)
    if (allowCustom) {
      onChange(newValue)
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    setSearchTerm(selectedOption?.label || value || '')
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-primary ml-1">*</span>}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (selectedOption?.label || value || '')}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all bg-gray-50 focus:bg-white text-sm sm:text-base ${
            error
              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
          }`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400 text-sm`}></i>
        </div>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                    value === option.value ? 'bg-primary/10 text-primary font-medium' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm">Aucun résultat</div>
            )}
          </div>
        )}
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

export default SearchableDropdown

