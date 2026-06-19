/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          tinto:        '#180000',
          'tinto-suave':'#2a0a08',
          coral:        '#e8342c',
          'coral-dark': '#c42d25',
          papel:        '#fcfcfc',
          crema:        '#fff7f4',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
