/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        club: {
          primary: 'var(--primary-color, #DC2626)',
          secondary: 'var(--secondary-color, #991B1B)',
          accent: 'var(--accent-color, #F59E0B)',
          foreground: 'var(--primary-foreground, #FFFFFF)',
        },
        dark: {
          950: '#0F172A',
          900: '#1E293B',
          800: '#334155',
        },
      },
    },
  },
  plugins: [],
};
