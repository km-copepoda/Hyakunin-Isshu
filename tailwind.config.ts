import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Hiragino Mincho ProN', 'Yu Mincho', 'serif'],
      },
      keyframes: {
        'fill-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(251,191,36,0.45)' },
          '50%': { boxShadow: '0 0 24px 8px rgba(251,191,36,0.85), 0 0 48px 14px rgba(251,191,36,0.25)' },
        },
        'float-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fill-in': 'fill-in 0.4s ease-out forwards',
        'glow-pulse': 'glow-pulse 1.6s ease-in-out infinite',
        'float-up': 'float-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
