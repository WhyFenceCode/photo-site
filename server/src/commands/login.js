import * as p from '@clack/prompts';
import { login, whoami } from '../lib/wrangler.js';

export default async function loginCommand() {
  p.intro('Log in to Cloudflare (Wrangler)');
  p.log.info('Your browser will open so you can approve access. Nothing is saved in this project.');
  await login();
  p.note(await whoami(), 'Logged in as');
  p.outro('Next: pnpm content check');
}
