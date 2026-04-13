import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // "Notion-Zen" palette — warm off-white surfaces, charcoal ink,
        // subtle shadows. Tuned to feel like Notion's pages inside a
        // Slack-like shell.
        zen: {
          bg: '#ffffff',
          canvas: '#f7f6f3', // warm Notion page background
          surface: '#f1efec', // soft hover layer
          hover: '#ececea', // active/selected row
          border: '#e9e7e2', // hairline divider
          strong: '#d8d5cf', // stronger divider
          ink: '#191918', // primary text
          muted: '#5f5e5a', // secondary text
          subtle: '#9b9a95', // placeholder / meta
          accent: '#2383e2', // Notion blue — used sparingly
          accentSoft: '#eaf3fc', // accent background tint
          success: '#448361',
          warn: '#cb912f',
        },
      },
      boxShadow: {
        'zen-pop':
          '0 1px 3px rgba(15, 15, 15, 0.05), 0 10px 30px rgba(15, 15, 15, 0.08)',
        'zen-soft': '0 1px 2px rgba(15, 15, 15, 0.04)',
      },
      borderRadius: {
        zen: '8px',
      },
      keyframes: {
        'zen-fade': {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'zen-pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'zen-fade': 'zen-fade 160ms ease-out',
        'zen-pop-in': 'zen-pop-in 140ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
