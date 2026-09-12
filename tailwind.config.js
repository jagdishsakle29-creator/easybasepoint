/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0B1528',
          dark: '#111827',
          orange: '#FF6B00',
          orangeLight: '#FFF5EB',
          orangeHover: '#E55F00',
          gold: '#F59E0B',
          blueBg: '#F4F7FC',
          cardBorder: 'rgba(255, 255, 255, 0.7)',
        }
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(11, 21, 40, 0.06)',
        'soft-lg': '0 14px 40px rgba(11, 21, 40, 0.09)',
        'orange-glow': '0 10px 25px -3px rgba(255, 107, 0, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
