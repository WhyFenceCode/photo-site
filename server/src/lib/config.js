import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../../../application/site.config.mjs';

export const SERVER_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const ROOT_DIR = resolve(SERVER_DIR, '..');
// Local drafts (git-ignored). Override with STAGING_DIR if you like.
export const STAGING = resolve(SERVER_DIR, process.env.STAGING_DIR || '.staging');
export { site };
