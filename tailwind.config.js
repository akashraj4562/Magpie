/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', 'surface-2': 'var(--surface-2)',
        line: 'var(--line)', 'line-strong': 'var(--line-strong)',
        text: 'var(--text)', dim: 'var(--dim)', mute: 'var(--mute)',
        accent: 'var(--accent)', 'accent-bg': 'var(--accent-bg)',
        auto: 'var(--auto)', review: 'var(--review)', escalate: 'var(--escalate)',
        'review-bg': 'var(--review-bg)', 'escalate-bg': 'var(--escalate-bg)',
        pos: 'var(--pos)', neg: 'var(--neg)', onetap: 'var(--onetap)', projected: 'var(--projected)',
      },
    },
  },
  plugins: [],
};
