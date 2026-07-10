/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Calm, professional SaaS palette (parent/admin)
        brand: {
          50: '#eef4ff',
          100: '#dce7ff',
          200: '#bcd0ff',
          300: '#8fb0ff',
          400: '#5c86fb',
          500: '#3a63f0',
          600: '#2848d6',
          700: '#2138ad',
          800: '#20328a',
          900: '#1f306e',
        },
        // Warm secondary used for accents / rewards
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
        ink: '#1f2733',
        slatey: '#5b6472',
        surface: '#f6f8fc',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        // Rounded, friendly face for the student experience
        kid: ['"Baloo 2"', 'Nunito', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Larger baseline sizes reused across the student UI
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
        soft: '0 8px 24px rgba(16,24,40,.08)',
        pop: '0 12px 32px rgba(58,99,240,.18)',
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
