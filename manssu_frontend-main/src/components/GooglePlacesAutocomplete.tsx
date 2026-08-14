import { useRef, useEffect, useState } from 'react'

// Declare google namespace for TypeScript
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (input: HTMLInputElement, options?: { componentRestrictions?: { country: string[] } }) => {
            addListener: (event: string, callback: () => void) => void
            getPlace: () => {
              formatted_address: string
              place_id: string
              geometry: {
                location: {
                  lat: () => number
                  lng: () => number
                }
              }
            }
          }
          PlaceResult: {
            formatted_address: string
            place_id: string
            geometry: {
              location: {
                lat: () => number
                lng: () => number
              }
            }
          }
        }
      }
    }
  }
}

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (address: string, placeId: string, longitude: number, latitude: number) => void
  placeholder?: string
  className?: string
  error?: string
  onPlaceSelect?: (place: any) => void
}

const GooglePlacesAutocomplete = ({
  value,
  onChange,
  placeholder = 'Rechercher une adresse...',
  className = '',
  error,
  onPlaceSelect,
}: GooglePlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const isSettingPlaceRef = useRef(false)

  useEffect(() => {
    // Load Google Places API script
    const loadGooglePlaces = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true)
        return
      }

      const apiKey = import.meta.env.VITE_REACT_GOOGLE_PLACES_API_KEY || import.meta.env.REACT_GOOGLE_PLACES_API_KEY || import.meta.env.VITE_GOOGLE_PLACES_API_KEY
      if (!apiKey) {
        console.error('Google Places API key not found')
        return
      }

      // Check if script is already loading
      if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
        // Wait for it to load
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            setIsLoaded(true)
            clearInterval(checkInterval)
          }
        }, 100)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fr&region=fr`
      script.async = true
      script.defer = true
      script.onload = () => {
        setIsLoaded(true)
      }
      document.head.appendChild(script)
    }

    loadGooglePlaces()
  }, [])

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return

    // Initialize autocomplete
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: ['fr'] }, // Restrict to France
    })

    autocompleteRef.current = autocomplete

    // Handle place selection
    const handlePlaceChanged = () => {
      const place = autocomplete.getPlace()
      if (place.formatted_address && place.place_id && place.geometry?.location && inputRef.current) {
        // Set flag to prevent onChange from firing with partial text
        isSettingPlaceRef.current = true
        
        // Extract coordinates
        const latitude = place.geometry.location.lat()
        const longitude = place.geometry.location.lng()
        
        // Update parent state with full address, place ID, and coordinates
        onChange(place.formatted_address, place.place_id, longitude, latitude)
        if (onPlaceSelect) {
          onPlaceSelect(place)
        }
        // Reset flag after a short delay
        setTimeout(() => {
          isSettingPlaceRef.current = false
        }, 100)
      }
    }

    autocomplete.addListener('place_changed', handlePlaceChanged)

    return () => {
      // Cleanup is handled automatically by Google Maps API
    }
  }, [isLoaded, onChange, onPlaceSelect])

  return (
    <div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            // Only update if Google Autocomplete is not setting the value
            if (!isSettingPlaceRef.current) {
              // When typing manually, we can't provide placeId, longitude, latitude
              // So we pass empty string and 0,0 for coordinates
              // The validation will catch this when trying to save
              onChange(e.target.value, '', 0, 0)
            }
          }}
          placeholder={placeholder}
          className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all bg-gray-50 focus:bg-white text-sm sm:text-base ${
            error
              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
          } ${className}`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <i className="fa-solid fa-map-marker-alt text-gray-400 text-sm"></i>
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

export default GooglePlacesAutocomplete

