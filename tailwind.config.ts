import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'zendesk-green': '#2F4538',
        'zendesk-lime': '#D4FF5E',
        'zendesk-green-light': '#3d5749',
        'zendesk-green-dark': '#243529',
      },
    },
  },
  plugins: [],
}
export default config
