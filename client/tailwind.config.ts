import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            h1: { fontWeight: '600', letterSpacing: '-0.02em' },
            h2: { fontWeight: '600', letterSpacing: '-0.01em' },
            h3: { fontWeight: '600' },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
            blockquote: {
              fontWeight: '400',
              fontStyle: 'normal',
              quotes: 'none',
            },
            table: { fontSize: '0.875em' },
            th: { fontWeight: '600' },
          },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config;
