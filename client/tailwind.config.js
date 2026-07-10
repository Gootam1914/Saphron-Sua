/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Saphron saffron/gold identity (primary brand)
        brand: {
          50: '#fff8ed',
          100: '#ffeecc',
          200: '#ffdd99',
          300: '#fbc65a',
          400: '#f4ab2a',
          500: '#e6900f',
          600: '#cc7a06',
          700: '#a55f08',
          800: '#844c0e',
          900: '#6e400f',
        },
        // Warm secondary accent
        saffron: {
          50: '#fff8ed',
          100: '#ffefd3',
          200: '#ffdba5',
          300: '#ffc06d',
          400: '#ff9d33',
          500: '#ff820b',
          600: '#f06606',
          700: '#c74c07',
          800: '#9e3c0e',
          900: '#7f330f',
        },
        // Playful-but-calm accents for the student UI
        grass: '#3fbf7f',
        sky: '#4bb8e8',
        grape: '#8b6ff0',
        sun: '#ffcf4a',
        // Semantic tokens driven by CSS variables so they flip in dark mode.
        surface: 'rgb(var(--surface) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        slatey: 'rgb(var(--slatey) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        kid: ['"Baloo 2"', 'Nunito', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'kid-base': ['1.25rem', { lineHeight: '1.9rem' }],
        'kid-lg': ['1.6rem', { lineHeight: '2.2rem' }],
        'kid-xl': ['2.2rem', { lineHeight: '2.6rem' }],
      },
      borderRadius: {
        xl2: '1.25rem',
        '2xl': '1.5rem',
        blob: '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)',
        soft: '0 8px 24px rgba(16,24,40,.10)',
        pop: '0 12px 32px rgba(204,122,6,.22)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0, transform: 'translateY(4px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'pop-in': { '0%': { opacity: 0, transform: 'scale(.96)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in .25s ease-out',
        'pop-in': 'pop-in .2s ease-out',
      },
    },
  },
  plugins: [],
};
