/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f0f',
          card: '#1a1a1a',
          border: '#2a2a2a',
          hover: '#222222',
          input: '#2a2a2a',
          text: '#aaaaaa',
        },
        accent: {
          cyan: '#00d4ff',
          blue: '#0099ff',
          green: '#00d966',
          red: '#ff3366',
        },
      },
      spacing: {
        '4.5': '1.125rem',
      },
    },
  },
};
