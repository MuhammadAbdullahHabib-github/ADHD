/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      keyframes: {
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        fadeInScale: 'fadeInScale 0.3s ease-in-out',
      },
    },
  },
  darkMode: "class",
}
