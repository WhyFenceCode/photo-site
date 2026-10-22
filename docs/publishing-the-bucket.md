# Publishing to the R2 bucket

Photos and metadata live in a Cloudflare R2 bucket. Visitors load images **straight from R2 through your custom
domain**. No Worker sits in between, so there are no Worker request costs. The content tool uploads with
**Wrangler**, using your own `wrangler login`; no API keys are stored in this project.

## One-time setup

### 1. Log in
```bash
pnpm install
pnpm content login        # opens your browser; approve Wrangler
```
If your Cloudflare login has several accounts, put the right one in `media.accountId` in
`application/site.config.mjs`.

### 2. Create the bucket
Enable R2 in the dashboard first (Cloudflare may ask for a payment method; a free tier applies, so check
current limits on the R2 pricing page). Then either click *Create bucket* in the dashboard or:
```bash
pnpm --filter server exec wrangler r2 bucket create photos-media
```
Pick a lowercase name (letters, numbers, hyphens). Leave public access **off** for now.

### 3. Give the bucket a public domain
Dashboard → R2 → your bucket → *Settings* → *Custom Domains* → add `media.yourdomain.com`
(the domain must be on Cloudflare). Don't use the `r2.dev` URL in production: it's rate-limited and meant for testing.
Responses are then served and cached by Cloudflare's CDN. No CORS setup is needed (images load through `<img>`).

### 4. Tell the project about it
In `application/site.config.mjs`:
```js
media: {
  baseUrl: 'https://media.yourdomain.com',
  bucket: 'photos-media',
  accountId: '',   // only if you have several Cloudflare accounts
},
```

### 5. Check everything
```bash
pnpm content check
```
It confirms your login, that the bucket is reachable, and what the public URL returns
(a 404 for `catalog.json` is normal before your first publish).

## Publishing content

```bash
pnpm content new-collection
pnpm content add-photo
pnpm content publish --dry-run      # shows what would be uploaded; changes nothing
pnpm content publish                # uploads, then offers to deploy the site
```

What `publish` does, in order:
1. Validates every collection (alt text on every photo, dates, files present, **1–3 featured collections**).
2. Confirms you're logged in and the bucket is set.
3. Downloads the currently published `catalog.json` to learn what's already online. Wrangler can't list a bucket,
   so this is how it avoids re-uploading unchanged files.
4. Asks for confirmation, then uploads only new files (`photos/<collection>/<id>/<width>.avif|webp`) with long-lived
   immutable cache headers. File names contain a hash of the original, so they never change.
5. Uploads `catalog.json` **last** (`Cache-Control: no-cache`), so the live site never points at files that aren't there yet.
6. With `--prune`, deletes files that the previous catalog referenced but the new one doesn't.

Flags: `--dry-run`, `--prune`, `--yes` (skip confirmations).

Uploads run one Wrangler process per file, so a big first publish takes a few minutes. Later publishes only send new files.

**How much will it upload?** `publish` (and `publish --dry-run`) prints the number of new files and their total size, with a
line per collection, before asking you to confirm. The confirmation question includes the size too.

## How much is in the bucket?

```bash
pnpm content size
```
Shows each collection's size on this computer, how much hasn't been published yet, and the object count and total size
Cloudflare reports for the bucket (read with `wrangler r2 bucket info`). If the bucket total is much larger than your
drafts, leftover files from removed photos are probably in there: run `pnpm content publish --prune`. Without a Wrangler
login it still shows the local numbers. Sizes use decimal units (1 MB = 1,000,000 bytes).

## Verify

```bash
curl -I https://media.yourdomain.com/catalog.json     # 200, cache-control: no-cache
```
Open one image URL from the catalog; it should return `image/avif` or `image/webp` with `cache-control: ... immutable`.
Then deploy the site ([publishing the site](publishing-the-site.md)).

## Security model

* **No secrets in the project.** Authentication is Wrangler's OAuth login. Wrangler keeps its token in its own
  per-user config directory, outside this repo. Nothing sensitive can be committed by accident.
* **Trade-off, stated plainly:** a Wrangler login carries Wrangler's general scopes for your Cloudflare account, which is broader
  than a single-bucket API token. It is tied to you, is refreshable and revocable (`pnpm --filter server exec wrangler logout`),
  and never lives on disk in this project. Log out on shared computers.
* **The tool can only write expected keys** (`catalog.json` and `photos/<slug>/<id>/<width>.avif|webp`); anything else is refused.
* **Every Wrangler call uses `--remote`.** Wrangler 4 otherwise targets a local simulator; a test enforces this.
* **EXIF/GPS data is stripped** from every image before upload.
* Keep the bucket's public access limited to the custom domain; the bucket is not listable by visitors.
* For automation you'd use a bucket-scoped API token via `CLOUDFLARE_API_TOKEN` in your CI's secret store instead of an interactive login.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Not logged in to Cloudflare` | `pnpm content login` |
| `Set media.bucket …` | add the bucket name to `site.config.mjs` |
| Wrangler asks you to choose an account / fails with several accounts | set `media.accountId` |
| `catalog.json` is 404 at the public URL | publish once; check the custom domain is active and points at this bucket |
| New content doesn't show on the site | redeploy the site (`pnpm deploy:site`); if `catalog.json` looks stale, purge it in the Cloudflare cache |
| Upload interrupted | run `publish` again; it's safe. Files from an interrupted run that no catalog references aren't cleaned by `--prune` (delete them in the dashboard if you care) |
| Slow uploads | expected: one Wrangler process per file; only new files are sent |