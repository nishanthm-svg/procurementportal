/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0ea5e9', light: '#38bdf8', dark: '#0284c7' },
        success: { DEFAULT: '#12a362', light: '#e8f8f0' },
        danger:  { DEFAULT: '#d93843', light: '#fde8ea' },
        warning: { DEFAULT: '#d4850c', light: '#fef4e6' },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
