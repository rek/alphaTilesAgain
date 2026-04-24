/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./apps/home/index.html",
    "./apps/home/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
      }
    },
  },
  plugins: [],
}
