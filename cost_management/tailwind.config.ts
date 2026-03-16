import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dunamis: {
          50: '#f5f5ea',
          100: '#ebe9d8',
          200: '#d9d5b5',
          300: '#c7c08f',
          400: '#b3a868',
          500: '#96884f',
          600: '#776d40',
          700: '#5a5332',
          800: '#3f3a24',
          900: '#272318'
        },
        fern: {
          50: '#eef7ef',
          100: '#d6ebd7',
          200: '#b0d8b3',
          300: '#82bc89',
          400: '#5ba063',
          500: '#3f844a',
          600: '#2f6639',
          700: '#244f2d',
          800: '#1b3b21',
          900: '#122717'
        }
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Manrope', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 20px 40px rgba(27,59,33,0.15)'
      },
      keyframes: {
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        riseIn: 'riseIn 500ms ease-out both'
      }
    }
  },
  plugins: []
} satisfies Config;
