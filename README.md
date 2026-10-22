# Photography site

Astro + React + Tailwind v4 site (`/application`) and a content tool (`/server`) in one **pnpm** monorepo.
Photos and metadata live in a **Cloudflare R2 bucket, not in this repo**. Everything Cloudflare-related
(uploading, deploying) is authenticated with your own **Wrangler login**, so no API keys are stored anywhere.

```
application/   the website → built to static files, deployed with Wrangler (static assets, no Worker)
server/        CLI: asks about your photos, builds AVIF/WebP sizes, publishes them to R2 via Wrangler
docs/          step-by-step guides (below)
```

## Guides

| I want to…                                   | Read |
|----------------------------------------------|------|
| Run the tests locally                        | [docs/testing.md](docs/testing.md) |
| Publish the website                          | [docs/publishing-the-site.md](docs/publishing-the-site.md) |
| Set up and publish to the R2 bucket          | [docs/publishing-the-bucket.md](docs/publishing-the-bucket.md) |
| Add, replace, fix or remove photos           | [docs/updating-images.md](docs/updating-images.md) |

## Quick start

```bash
corepack enable          # or: npm i -g pnpm   (any pnpm 9+ works)
pnpm install
pnpm dev                 # http://localhost:4321 — shows placeholder content until you connect a bucket
pnpm test                # unit tests (site + content tool)
```

Commands from the repo root:

| Command | What it does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm preview` | develop, build, preview the site |
| `pnpm test` / `pnpm test:e2e` | unit tests / browser + accessibility tests |
| `pnpm content <command>` | the content tool (`new-collection`, `add-photo`, `edit-photo`, `reorder`, `size`, `publish`, `login`, `check`, …) |
| `pnpm deploy:site` | build and deploy the site to Cloudflare |

> Use `pnpm deploy:site`, not `pnpm deploy`: `pnpm deploy` is a different built-in pnpm command.

## Configuration

Personal details and site settings are all in **`application/site.config.mjs`**: name, role, email, site URL,
labels, light/dark colours, legal details, featured limit, and the R2 bucket / public media URL.

## Good to know

* The site is static. It reads the published `catalog.json` **at build time**, so after publishing new content, deploy again.
* Home layout adapts to 1, 2 or 3 featured collections; clicking the name in the centre opens Collections.
* Film, camera, lens, date and location are stored **per photo**; a collection can set defaults that photos inherit.
* The `/legal` pages (privacy, copyright, terms, accessibility) are templates for a content-only site, **not legal advice**.
* `public/robots.txt` blocks common AI-training crawlers. Requires Node 20.12+.