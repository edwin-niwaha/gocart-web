import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: '#e5e7eb',
        muted: '#f3f4f6',
        card: '#ffffff',
        foreground: '#111827',
        primary: '#111827'
      }
    }
  },
  plugins: []
};

export default config;
