// Runs after `astro build`: writes dist/_headers (security + cache headers
// for Cloudflare static assets). The CSP allows images from your media domain.
import { writeFile } from 'node:fs/promises';
import site from '../site.config.mjs';

const media = site.media.baseUrl ? new URL(site.media.baseUrl).origin : '';
const csp = [
  "default-src 'self'",
  `img-src 'self' data: ${media}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'", // Astro islands use small inline bootstrap scripts
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

await writeFile('dist/_headers', `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Strict-Transport-Security: max-age=31536000
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
`);
console.log('✓ wrote dist/_headers');
