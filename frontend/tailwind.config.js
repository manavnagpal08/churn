/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warmWhite: '#FFFFFF',
        softIvory: '#FFFDF7',
        nearBlack: '#171717',
        accentYellow: '#FFD43B',
        accentRed: '#EF4444',
        secondaryRed: '#C92A2A',
        appBorder: '#EAE7DF',
        mutedText: '#777777',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
