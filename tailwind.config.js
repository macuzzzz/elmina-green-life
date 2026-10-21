/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
        display: ['"Baloo 2"', 'Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        leaf: { 50: '#effaf1', 100: '#d8f3dd', 400: '#4cbf6a', 500: '#2fa452', 600: '#228640', 700: '#1d6a35' },
        brick: { 400: '#d0714a', 500: '#b85a35' },
        charcoal: { 700: '#3a3f47', 800: '#2b2f35', 900: '#1d2025' },
        sos: { 500: '#e5322d', 600: '#cc2420', 700: '#a91b18' },
        tool: { 500: '#2f7cf6', 600: '#1f66dd' },
      },
      boxShadow: {
        panel: '0 8px 24px -6px rgba(20, 30, 40, 0.25), 0 2px 6px rgba(20, 30, 40, 0.08)',
        pop: '0 12px 32px -8px rgba(20, 30, 40, 0.35)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        sosPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(229,50,45,0.55)' },
          '50%': { boxShadow: '0 0 0 10px rgba(229,50,45,0)' },
        },
      },
      animation: {
        sosPulse: 'sosPulse 2s ease-in-out infinite',
        pop: 'pop 0.45s cubic-bezier(.2,1.4,.4,1) both',
      },
    },
  },
  plugins: [],
};
