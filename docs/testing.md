# Testing locally

Three layers, all runnable on your machine with no Cloudflare account or network access
(after the first `pnpm install`).

| Layer | Tool | Covers | Command |
|---|---|---|---|
| Site unit/component tests | Vitest + Testing Library (jsdom) | content loading & defaults, home grid layouts and hover, collection viewer (buttons, arrow keys, Escape, per-photo film, live announcements) | `pnpm --filter application test` |
| Content-tool tests | Node's built-in test runner | slug/date/key validation, image pipeline (sizes, EXIF stripping, orientation), Wrangler arguments always use `--remote` | `pnpm --filter server test` |
| End-to-end + accessibility | Playwright + axe-core | the *built* site in Chromium on desktop and a phone-sized viewport | `pnpm test:e2e` |

## Everyday

```bash
pnpm install
pnpm test                 # unit tests for both packages
pnpm --filter application test:watch    # re-run site tests on save
```

The site unit tests mock `site.config.mjs` and always use the built-in sample content, so they pass
whatever `media.baseUrl` you've set.

## End-to-end and accessibility tests

One-time browser download:

```bash
pnpm --filter application exec playwright install chromium
# Linux may also need system libraries:  ... playwright install --with-deps chromium
```

Then:

```bash
pnpm test:e2e                                   # builds the site, serves it on :4322, runs everything
pnpm --filter application test:e2e:ui           # interactive runner with time-travel debugging
pnpm --filter application exec playwright test --project=mobile      # phone viewport only
pnpm --filter application exec playwright show-report                # open the HTML report afterwards
```

Playwright starts the server for you (`pnpm build && pnpm preview --port 4322`). If you already have one
running on that port it is reused.

What they check: the home page shows 1–3 featured collections; **clicking the centre name block goes to
Collections**; hover reveals details on desktop; the mobile layout stacks and never scrolls sideways; the
collection viewer works with keys (←, →, Esc) and buttons and announces changes; every `/legal` page and
the 404 render; **axe-core reports no WCAG 2.x A/AA violations** on the home, collections, a collection and
legal pages; the skip link takes focus first.

> **Content note:** the end-to-end tests read whichever content the site is configured with
> (placeholder content if `media.baseUrl` is empty, otherwise your published catalog). They are written to
> work with any collection that has at least one photo; the keyboard test skips itself for single-photo
> collections. Contrast over photographs can't be judged automatically; check by eye.

## Testing the content tool

Pure logic and the image pipeline are covered by `pnpm --filter server test` (it creates throw-away images in a
temp folder). To try the interactive prompts without touching your real drafts:

```bash
STAGING_DIR=/tmp/gallery-play pnpm content new-collection
STAGING_DIR=/tmp/gallery-play pnpm content add-photo      # point it at any JPEG
STAGING_DIR=/tmp/gallery-play pnpm content list
```
`publish --dry-run` still needs a Wrangler login and a bucket name, because it reads the published catalog;
it uploads nothing.

## Manual checklist before a release

- [ ] `pnpm test` and `pnpm test:e2e` pass.
- [ ] `pnpm check` (Astro type-check) reports no errors.
- [ ] `pnpm build && pnpm preview`: click through home → collections → a collection → back.
- [ ] Keyboard only: Tab through every page; focus is always visible; the skip link works.
- [ ] Screen reader spot-check (VoiceOver / NVDA): collection links read their title; photos read their alt text.
- [ ] Phone (or browser device mode): swipe between photos; text on home cards is readable.
- [ ] OS dark mode on and off; "reduce motion" on (animations should stop).
- [ ] Lighthouse (Chrome DevTools) on `/` and a collection page.
- [ ] Open `dist/_headers` after a build and confirm your media domain appears in the `img-src` policy.

## CI (optional)

```yaml
# .github/workflows/test.yml
name: test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm --filter application exec playwright install --with-deps chromium
      - run: pnpm test:e2e
```
(Run `pnpm install` once locally and commit `pnpm-lock.yaml` first.)

## Troubleshooting

* **`Executable doesn't exist` from Playwright** → run the `playwright install chromium` step above.
* **Port 4322 in use** → stop the other process or change `PORT` in `application/playwright.config.ts`.
* **axe reports a violation** → the message names the rule and element count; fix the markup/colour, don't disable the rule.
* **Unit tests try to reach the network** → they shouldn't; make sure the `vi.mock('../../site.config.mjs', …)` block is at the top of the test file.
