import { Component, ReactNode } from 'react'
import { toast } from 'sonner'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    toast.error('Une erreur est survenue. Veuillez rafraîchir la page.')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-slate-100 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Oups !</h2>
            <p className="text-gray-600 mb-6">
              Une erreur inattendue s'est produite. Veuillez rafraîchir la page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-primary to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <i className="fa-solid fa-refresh mr-2"></i>
              Rafraîchir la page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

