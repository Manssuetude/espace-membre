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
      },
      colors: {
        'primary': '#dc2626',
        'secondary': '#f97316',
        'accent': '#3b82f6',
        'warning': '#eab308',
        'success': '#10b981',
      }
    },
  },
  plugins: [],
}

