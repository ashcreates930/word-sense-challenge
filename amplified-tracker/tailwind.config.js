/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        plum: {
          DEFAULT: '#260F24',
          light: '#3d1a3a',
          dark: '#1a0a18',
        },
        gold: {
          DEFAULT: '#C9922A',
          light: '#d9a84a',
          dark: '#a97520',
        },
        cream: {
          DEFAULT: '#F5EFE0',
          dark: '#ebe3cc',
        },
      },
      fontFamily: {
        bebas: ['"Bebas Neue"', 'cursive'],
        playfair: ['"Playfair Display"', 'serif'],
        dm: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
