import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'sonner'

// Check if we're in production (app host/URL uses https)
const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token and log requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log request to console (only in development)
    if (!isProduction) {
      console.log('🚀 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        headers: config.headers,
        data: config.data,
        params: config.params,
      })
    }
    
    return config
  },
  (error: AxiosError) => {
    if (!isProduction) {
      console.error('❌ API Request Error:', error)
    }
    return Promise.reject(error)
  }
)

// Helper function to extract error message from various error formats
const extractErrorMessage = (data: any): string => {
  // FastAPI validation errors (422) - array of error objects
  if (Array.isArray(data?.detail)) {
    const errors = data.detail.map((err: any) => {
      if (typeof err === 'string') return err
      if (err.msg) return `${err.loc?.join('.') || 'Field'}: ${err.msg}`
      return JSON.stringify(err)
    })
    return errors.join(', ')
  }
  
  // Single detail string
  if (typeof data?.detail === 'string') {
    return data.detail
  }
  
  // Message field
  if (typeof data?.message === 'string') {
    return data.message
  }
  
  // Default
  return 'Une erreur est survenue'
}

// Response interceptor - Handle errors globally and log responses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response to console (only in development)
    if (!isProduction) {
      console.log('✅ API Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        method: response.config.method?.toUpperCase(),
        data: response.data,
        headers: response.headers,
      })
    }
    
    return response
  },
  (error: AxiosError) => {
    // Log error response to console (only in development)
    if (!isProduction) {
      console.error('❌ API Error Response:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        data: error.response?.data,
        message: error.message,
      })
    }
    
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as any

      // Handle specific error cases
      if (status === 400) {
        // Bad Request - show detail message from API
        const message = extractErrorMessage(data)
        toast.error(message)
      } else if (status === 401) {
        // Unauthorized - clear auth and redirect to login
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/auth/login'
      } else if (status === 403) {
        // Forbidden - silently handle without notification
      } else if (status === 404) {
        toast.error('Ressource non trouvée.')
      } else if (status === 422) {
        // Validation Error - FastAPI returns array of validation errors
        const message = extractErrorMessage(data)
        toast.error(message)
      } else if (status === 500) {
        toast.error('Erreur serveur. Veuillez réessayer plus tard.')
      } else {
        // Show error message from API or default message
        const message = extractErrorMessage(data)
        toast.error(message)
      }
    } else if (error.request) {
      // Network error
      toast.error('Erreur de connexion. Vérifiez votre connexion internet.')
    } else {
      // Request setup error
      toast.error('Erreur lors de la requête.')
    }

    return Promise.reject(error)
  }
)

export default apiClient

