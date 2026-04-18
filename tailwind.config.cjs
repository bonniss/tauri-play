/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-mantine-color-scheme="dark"]'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    fontFamily: {
      serif: ['Lora Variable', 'serif'],
    },
    extend: {},
  },
  plugins: [require('tailwindcss-motion'), require('@tailwindcss/typography')],
};
