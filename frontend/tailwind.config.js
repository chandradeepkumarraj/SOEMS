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
          DEFAULT: '#2563eb', // Trust Blue
          light: '#60a5fa',
          dark: '#1d4ed8',
        },
        accent: {
          DEFAULT: '#7c3aed', // Intelligence Purple
          light: '#a78bfa',
          dark: '#5b21b6',
        },
        slate: {
          950: '#020617', // Deep Focus
        },
        surface: {
          light: '#ffffff',
          dark: '#0f172a',
        },
        cyber: {
          dark: '#0a0e27',
          blue: '#0047AB',
          cyan: '#00A3E0',
          purple: '#7c3aed',
          pink: '#ff006e',
          green: '#00ff88',
        },
        success: '#10b981',
        successDark: '#059669',
        successLight: '#d1fae5',
        error: '#f43f5e',
        errorDark: '#e11d48',
        errorLight: '#ffe4e6',
        warning: '#f59e0b',
        warningDark: '#d97706',
        warningLight: '#fef3c7',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 163, 224, 0.5)',
        'glow-cyan-lg': '0 0 40px rgba(0, 163, 224, 0.8)',
        'glow-blue': '0 0 30px rgba(0, 71, 171, 0.4)',
        'glow-pink': '0 0 25px rgba(255, 0, 110, 0.3)',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'tilt-slow': 'tilt 10s infinite linear',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        tilt: {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(0.5deg)' },
          '75%': { transform: 'rotate(-0.5deg)' },
        }
      }
    },
  },
  plugins: [],
}
