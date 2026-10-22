// ─────────────────────────────────────────────────────────────────────────────
// Everything  site-specific lives here. Edit this file, rebuild, done.
// ─────────────────────────────────────────────────────────────────────────────

export const site = {
  lang: 'en',
  url: 'https://photos.torstenyoung.com', // your public site URL (no trailing slash)
  name: 'Torsten Young',
  role: 'Photographer',
  description: 'Photography by Torsten Young.',

  contact: {
    email: 'contact.photos@torstenyoung.com',
    instagram: '', // optional, e.g. 'https://instagram.com/yourname'
  },

  media: {
    // Public URL of your R2 bucket's custom domain, e.g. 'https://media.example.com'.
    // Leave empty to run with built-in placeholder content.
    baseUrl: 'https://media.photos.torstenyoung.com',
    // Name of the R2 bucket the content tool uploads to (not secret).
    bucket: 'photos-media',
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
    owner: 'Torsten Young',
    jurisdiction: 'Canada',
    updated: '22 October 2026',
    copyrightStartYear: 2025,
  },
};

export default site;