/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-mantine-color-scheme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        serif: ['Lora Variable', 'serif'],
      },
    },
  },
  plugins: [require('tailwindcss-motion'), require('@tailwindcss/typography')],
};
