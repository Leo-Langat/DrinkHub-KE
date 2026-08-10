/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#2563EB', // Primary Blue
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          900: '#0F172A',
        },
      },
    },
  },
  plugins: [],
};
