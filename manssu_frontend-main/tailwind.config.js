/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'fraunces': ['Fraunces', 'serif'],
      },
      colors: {
        'primary': '#dc2626',
        'secondary': '#f97316',
        'accent': '#3b82f6',
        'warning': '#eab308',
        'success': '#10b981',
        'award': {
          'ink': '#1C1917',
          'gold': '#C9A227',
          'gold-light': '#E7C766',
          'gold-text': '#8A6510',
          'cream': '#FBF3DC',
          'cream-light': '#FFFBEB',
        },
      },
      keyframes: {
        'award-flip': {
          '0%': { transform: 'rotateY(-90deg)', opacity: '0' },
          '100%': { transform: 'rotateY(0deg)', opacity: '1' },
        },
        'award-shine': {
          '0%': { transform: 'translateX(-150%) skewX(-20deg)' },
          '100%': { transform: 'translateX(250%) skewX(-20deg)' },
        },
        'award-confetti': {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
          '100%': { transform: 'translate(var(--award-tx), var(--award-ty)) scale(0)', opacity: '0' },
        },
        'award-fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'award-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
      },
      animation: {
        'award-flip': 'award-flip 0.6s ease-out both',
        'award-shine': 'award-shine 1s ease-in-out 0.5s both',
        'award-confetti': 'award-confetti 1.2s ease-out both',
        'award-fade-up': 'award-fade-up 0.4s ease-out both',
        'award-pulse': 'award-pulse 1.5s ease-in-out infinite',
        'award-spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
}

