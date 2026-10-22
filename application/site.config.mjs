// ─────────────────────────────────────────────────────────────────────────────
// Everything personal or site-specific lives here. Edit this file, rebuild, done.
// ─────────────────────────────────────────────────────────────────────────────
export const site = {
  lang: 'en',
  url: 'https://example.com', // your public site URL (no trailing slash)
  name: 'Elena Marsh',
  role: 'Photographer',
  description: 'Analogue photography by Elena Marsh.',

  contact: {
    email: 'hello@example.com',
    instagram: '', // optional, e.g. 'https://instagram.com/yourname'
  },

  media: {
    // Public URL of your R2 bucket's custom domain, e.g. 'https://media.example.com'.
    // Leave empty to run with built-in placeholder content.
    baseUrl: '',
    // Name of the R2 bucket the content tool uploads to (not secret).
    bucket: '',
    // Optional: only needed if your Cloudflare login has more than one account.
    accountId: '',
  },

  home: {
    maxFeatured: 3, // 1–3. The layout adapts to the number of featured collections.
  },

  labels: {
    home: 'Home',
    collections: 'Collections',
    contact: 'Contact',
    legal: 'Legal',
    archiveTag: 'Archive',
    archiveTitle: 'All collections',
    close: 'Close',
    previous: 'Previous',
    next: 'Next',
    skip: 'Skip to content',
  },

  // Colours. "mute" is tuned to meet WCAG AA contrast on its background.
  theme: {
    light: { paper: '#ece8e0', ink: '#1f1d1a', mute: '#6b655b', line: '#d6d0c4' },
    dark: { paper: '#1b1a18', ink: '#e6e1d6', mute: '#8b857a', line: '#33312d' },
  },

  // Used by the /legal pages.
  legal: {
    owner: 'Elena Marsh',
    jurisdiction: 'Your Province/State, Country',
    updated: '22 October 2026',
    copyrightStartYear: 2023,
  },
};

export default site;
