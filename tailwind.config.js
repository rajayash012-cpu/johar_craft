/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        jh: {
          brown: '#4A2C20',       // Deep Earth Brown
          terracotta: '#B85C38',  // Terracotta
          clay: '#C8754D',        // Warm Clay
          cream: '#F7F0E3',       // Cream / Off-White
          sand: '#E8D6B8',        // Sand / Muted Ochre
          forest: '#3F5A3D',      // Forest Green
          charcoal: '#29231F',    // Charcoal
        },
        brand: {
          50:  '#FAF4EB',
          100: '#F4E5D3',
          200: '#E8CAAC',
          300: '#DBAC83',
          400: '#CA865E',
          500: '#C8754D',         // Warm Clay
          600: '#B85C38',         // Terracotta (primary action)
          700: '#964525',
          800: '#73351C',
          900: '#4A2C20',         // Deep Earth Brown
          950: '#2C170F',
        },
        earth: {
          50:  '#F7F0E3',         // Cream / Off-white base
          100: '#F0E5D3',
          200: '#E8D6B8',         // Sand
          300: '#D5BE97',
          400: '#BD9E73',
          500: '#A17F55',
          600: '#84623E',
          700: '#674B2F',
          800: '#4A2C20',         // Deep Earth Brown
          900: '#382218',
          950: '#29231F',         // Charcoal text
        },
        forest: {
          50:  '#F0F5F0',
          100: '#E0ECE0',
          200: '#BFD7BE',
          300: '#94BA92',
          400: '#689B66',
          500: '#4E7E4B',
          600: '#3F5A3D',         // Forest Green
          700: '#324730',
          800: '#243423',
          900: '#172216',
        },
        clay: {
          100: '#F9EDE3',
          200: '#F2D8C5',
          300: '#E8BF9E',
          400: '#DA9A6E',
          500: '#C8754D',         // Warm Clay
          600: '#B85C38',         // Terracotta
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'tribal-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23B85C38' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'sohrai-pattern': "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%234A2C20' stroke-width='1.2' stroke-opacity='0.06'%3E%3Cpolygon points='40,10 70,40 40,70 10,40' /%3E%3Cpolygon points='40,22 58,40 40,58 22,40' /%3E%3Cline x1='40' y1='0' x2='40' y2='80' /%3E%3Cline x1='0' y1='40' x2='80' y2='40' /%3E%3C/g%3E%3C/svg%3E\")",
        'khovar-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 Q 15 10, 30 30 T 60 30' fill='none' stroke='%234A2C20' stroke-width='1' stroke-opacity='0.05'/%3E%3Cpath d='M0 45 Q 15 25, 30 45 T 60 45' fill='none' stroke='%23B85C38' stroke-width='1' stroke-opacity='0.05'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
