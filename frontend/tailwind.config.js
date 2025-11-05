/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#b3b3b3',
          400: '#999999',
          500: '#666666',
          600: '#4d4d4d',
          700: '#333333',
          800: '#1a1a1a',
          900: '#101820', // Dark charcoal
          950: '#0a0c10', // Deeper charcoal
        },
        accent: {
          50: '#fffef0',
          100: '#fffce0',
          200: '#fff9c2',
          300: '#fff6a3',
          400: '#fff385',
          500: '#FEE715', // Bright yellow
          600: '#e5d013',
          700: '#ccb911',
          800: '#b3a20f',
          900: '#998b0d',
        },
        highlight: {
          50: '#fff5f5',
          100: '#ffe5e5',
          200: '#ffcccc',
          300: '#ffb3b3',
          400: '#ff9999',
          500: '#F96167', // Light red/coral
          600: '#e05056',
          700: '#c74045',
          800: '#ae3034',
          900: '#952023',
        },
        secondary: {
          50: '#fffef8',
          100: '#fffdf0',
          200: '#fffbe0',
          300: '#fff9d1',
          400: '#fff7c1',
          500: '#F9E795', // Pastel yellow
          600: '#e0d086',
          700: '#c7b977',
          800: '#aea268',
          900: '#958b59',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
