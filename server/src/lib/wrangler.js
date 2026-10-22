// All Cloudflare access goes through the Wrangler CLI, authenticated with your
// own `wrangler login` (OAuth). No API keys or secrets are stored in this project.
import { spawn } from 'node:child_process';
import { SERVER_DIR, site } from './config.js';
import { KEY } from './validate.js';

const BUCKET = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
const win = process.platform === 'win32';
const quote = (a) => (win ? `"${String(a).replace(/"/g, '\\"')}"` : a);

export function bucket() {
  const b = site.media.bucket;
  if (!b || !BUCKET.test(b)) throw new Error('Set media.bucket (your R2 bucket name) in application/site.config.mjs');
  return b;
}

export const assertKey = (key) => {
  if (!KEY.test(key)) throw new Error(`Refusing to touch unexpected key: ${key}`);
};

// Wrangler 4 defaults to a local simulator; every command below must say --remote.
export const putArgs = (b, key, file, type, cache) => {
  assertKey(key);
  return ['r2', 'object', 'put', `${b}/${key}`, '--file', file, '--content-type', type, '--cache-control', cache, '--remote'];
};
export const getArgs = (b, key, file) => { assertKey(key); return ['r2', 'object', 'get', `${b}/${key}`, '--file', file, '--remote']; };
export const deleteArgs = (b, key) => { assertKey(key); return ['r2', 'object', 'delete', `${b}/${key}`, '--remote']; };

export function run(args, { inherit = false } = {}) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, ...(site.media.accountId ? { CLOUDFLARE_ACCOUNT_ID: site.media.accountId } : {}) };
    const child = spawn('pnpm', ['exec', 'wrangler', ...args.map(quote)], {
      cwd: SERVER_DIR, env, shell: win, stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    child.stdout?.on('data', (d) => (out += d));
    child.stderr?.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, out, err }));
  });
}

const failure = (what, r) => new Error(`${what} failed:\n${(r.err || r.out).trim().split('\n').slice(-6).join('\n')}`);

export async function login() { return run(['login'], { inherit: true }); }

export async function whoami() {
  const r = await run(['whoami']);
  const text = `${r.out}\n${r.err}`;
  if (/not authenticated/i.test(text)) throw new Error('Not logged in to Cloudflare. Run: pnpm content login');
  if (r.code !== 0) throw failure('wrangler whoami', r);
  return r.out.trim();
}

export async function putFile(key, file, type, cache) {
  const r = await run(putArgs(bucket(), key, file, type, cache));
  if (r.code !== 0) throw failure(`Uploading ${key}`, r);
}

/** Returns true if the object was downloaded, false if it doesn't exist. */
export async function getFile(key, file) {
  const r = await run(getArgs(bucket(), key, file));
  if (r.code === 0) return true;
  if (/authenticat|log ?in|permission|forbidden/i.test(`${r.out}${r.err}`)) throw failure(`Reading ${key}`, r);
  return false;
}

export async function deleteKey(key) {
  const r = await run(deleteArgs(bucket(), key));
  if (r.code !== 0) throw failure(`Deleting ${key}`, r);
}

export async function bucketInfo() {
  const r = await run(['r2', 'bucket', 'info', bucket()]);
  if (r.code !== 0) throw failure('wrangler r2 bucket info', r);
  return r.out.trim();
}
