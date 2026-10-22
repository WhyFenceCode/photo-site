# Publishing the website

The site is built to static files and deployed with Wrangler as **Workers static assets**
(`application/wrangler.jsonc` has no Worker script). Requests for static assets are free and unlimited on Cloudflare.

## 1. Before the first deploy

Edit `application/site.config.mjs`:

- [ ] `url` — your real public URL (used for canonical links)
- [ ] `name`, `role`, `description`, `contact.email`
- [ ] `legal.owner`, `legal.jurisdiction`, `legal.updated`, `legal.copyrightStartYear`
- [ ] `media.baseUrl` — your bucket's public domain, once it exists ([publishing the bucket](publishing-the-bucket.md))
- [ ] optional: colours under `theme`, text under `labels`, `home.maxFeatured`

Have the `/legal` pages reviewed for your jurisdiction (they are templates, not legal advice).

## 2. Check it locally

```bash
pnpm build && pnpm preview      # production build at http://localhost:4321
pnpm test && pnpm test:e2e      # see testing.md
```

## 3. Log in to Cloudflare (once per computer)

```bash
pnpm content login
```
This runs `wrangler login` (browser approval). The same login is used for site deploys and for uploading to R2.

## 4. Deploy

```bash
pnpm deploy:site
```
This runs the build (including `dist/_headers`, which sets the security and cache headers) and `wrangler deploy`.
The first run creates a Worker named by `name` in `application/wrangler.jsonc` and prints a `*.workers.dev` URL.

> Use `pnpm deploy:site`, not `pnpm deploy` (that's a different pnpm command).

## 5. Use your own domain

Your domain must be on Cloudflare. Either use the dashboard (Workers & Pages → your Worker → Settings →
Domains & Routes → *Add custom domain*), or uncomment `routes` in `wrangler.jsonc`:

```jsonc
"routes": [{ "pattern": "www.example.com", "custom_domain": true }]
```
then run `pnpm deploy:site` again. Make sure `url` in `site.config.mjs` matches.

## 6. Verify

```bash
curl -I https://www.example.com/
```
Look for `content-security-policy`, `x-content-type-options`, `strict-transport-security`. Then open the site and check
that images load (if they don't, the media domain in `media.baseUrl` and in the CSP don't match, or the bucket
isn't public yet).

## Every time content changes

The site reads `catalog.json` **when it is built**. After `pnpm content publish`, run `pnpm deploy:site` again
(the publish command offers to do this). Config or text changes also need a redeploy.

## Rolling back

Dashboard → Workers & Pages → your Worker → *Deployments* lets you roll back to a previous version.
Content (photos) is versioned separately in the bucket; see [updating images](updating-images.md).

## Automating (optional)

Deploying from CI needs an API token instead of an interactive login. Create one at
Dashboard → My Profile → API Tokens using the *Edit Cloudflare Workers* template, store it as the CI secrets
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, and run `pnpm install --frozen-lockfile && pnpm deploy:site`.
Keep that token out of this repo and out of your shell history.
