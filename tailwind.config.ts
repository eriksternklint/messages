import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // "Notion-Zen" palette — monochrome, high whitespace, calm.
        zen: {
          bg: '#ffffff',
          surface: '#fafafa',
          border: '#ededed',
          ink: '#1a1a1a',
          muted: '#6b6b6b',
          subtle: '#9a9a9a',
          accent: '#2e2e2e',
        },
      },
    },
  },
  plugins: [],
};

export default config;
