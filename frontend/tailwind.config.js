/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neo-Brutalism color palette
        brutal: {
          light: {
            bg: '#FEFEFE',
            surface: '#FFFFFF',
            border: '#000000',
            text: '#000000',
            textMuted: '#666666',
            accent: '#000000',
            accentHover: '#333333',
            success: '#00FF00',
            error: '#FF0000',
            warning: '#FFFF00',
            info: '#0000FF',
          },
          dark: {
            bg: '#0A0A0A',
            surface: '#1A1A1A',
            border: '#FFFFFF',
            text: '#FFFFFF',
            textMuted: '#AAAAAA',
            accent: '#FFFFFF',
            accentHover: '#CCCCCC',
            success: '#00FF00',
            error: '#FF0000',
            warning: '#FFFF00',
            info: '#0000FF',
          },
        },
      },
      boxShadow: {
        'brutal': '8px 8px 0px 0px',
        'brutal-sm': '4px 4px 0px 0px',
        'brutal-lg': '12px 12px 0px 0px',
        'brutal-inset': 'inset 4px 4px 0px 0px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}


