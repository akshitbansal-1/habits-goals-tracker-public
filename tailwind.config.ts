import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          card: 'var(--bg-card)',
          border: 'var(--bg-border)',
        },
        // text-primary and text-text-muted use CSS vars directly.
        // These only generate `color:` utilities (not bg/border), so Tailwind
        // won't try to wrap them in rgb() for opacity — they work fine as-is.
        primary: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        // Category accents — static, same in both themes
        accent: {
          meal: '#e8a838',
          skin: '#7eb8a4',
          habit: '#7a9fd4',
        },
        check: '#4caf50',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs:   ['0.8125rem', { lineHeight: '1.25rem' }],   // 13px
        sm:   ['0.9375rem', { lineHeight: '1.5rem' }],    // 15px
        base: ['1.0625rem', { lineHeight: '1.75rem' }],   // 17px
        lg:   ['1.1875rem', { lineHeight: '1.875rem' }],  // 19px
        xl:   ['1.3125rem', { lineHeight: '2rem' }],      // 21px
      },
    },
  },
  plugins: [],
} satisfies Config
