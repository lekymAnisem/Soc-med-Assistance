/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#050505',
        ink: '#0a0a0a',
        smoke: '#101010',
        mist: '#f2f2f0',
        ash: '#9a9a94',
        signal: '#d8ff3e',
      },
      fontFamily: {
        display: ['"Unica One"', 'ui-sans-serif', 'system-ui'],
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.35em',
      },
    },
  },
  plugins: [],
}
