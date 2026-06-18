export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#000000',  // Pure black
          900: '#0a0a0a',  // Near black
          800: '#1a1a1a',  // Dark grey
          700: '#2a2a2a',  // Medium dark grey
          600: '#3a3a3a',  // Grey
          500: '#4a4a4a',  // Medium grey
        },
        silver: {
          DEFAULT: '#c0c0c0',
          light: '#d4d4d4',
          dark: '#a0a0a0',
        },
        accent: {
          500: '#c0c0c0', // Silver
          400: '#e0e0e0', // Light silver
          300: '#ffffff', // White
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'fade-in': 'fadeIn 1s ease-out forwards',
        'fade-in-up': 'fadeInUp 1s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(192, 192, 192, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(192, 192, 192, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
