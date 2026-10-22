# Updating images and metadata

Your drafts live in `server/.staging/` (git-ignored): one `collection.json` per collection plus the generated
image sizes. **Publishing** uploads new files and a fresh `catalog.json`; **deploying** rebuilds the site from it.

```
edit/add/remove  →  pnpm content publish  →  pnpm deploy:site
```

## Add photos
```bash
pnpm content add-photo        # choose the collection, then a file or a whole folder
```
For each photo it asks for alt text (required), title, caption, film, camera, lens, date, location, then creates
AVIF and WebP sizes (480 / 960 / 1600 / 2400px, never upscaled). It remembers your last answers as suggestions.
New photos are appended to the end of the collection.

## Replace a photo with a retouched version
Re-exporting creates a different file, so it's a new photo:
1. `pnpm content add-photo` with the new export.
2. `pnpm content remove-photo` for the old one.
3. If order matters, move the new entry in `collection.json` (see below).
4. `pnpm content publish --prune`, then `pnpm deploy:site`.

Adding the *identical* file again is detected and skipped.

## Fix text or metadata (alt text, film, caption, location…)
Open `server/.staging/collections/<slug>/collection.json`, edit, save, then publish and deploy. No images are
re-uploaded for metadata-only changes.

| Field | Level | Notes |
|---|---|---|
| `title`, `description`, `year`, `featured`, `order` | collection | `order` sets list order and the order of featured cards on the home page |
| `defaults.film` / `camera` / `lens` | collection | used by photos that don't set their own |
| `cover` | collection | id of the cover photo (or use `pnpm content cover`) |
| `alt` | photo | **required**; describe the photo for people who can't see it |
| `title`, `caption`, `film`, `camera`, `lens`, `date`, `location` | photo | per-photo values override collection defaults; `date` is `YYYY`, `YYYY-MM` or `YYYY-MM-DD` |
| `id`, `width`, `height`, `color`, `files` | photo | generated; don't edit |

Mixing film stocks: set a default film on the collection and give the exceptions their own `film`.

## Reorder photos
Reorder the objects in the `photos` array of `collection.json`. Order in the file is order on the site.

## Change the cover, or what's featured on the home page
```bash
pnpm content cover       # pick the cover photo for a collection
pnpm content feature     # choose 1–3 collections for the home page
pnpm content list        # see collections and what's featured (★)
```

## Remove a photo or a collection
```bash
pnpm content remove-photo
pnpm content publish --prune      # also deletes the now-unused files from the bucket
```
To remove a whole collection, delete its folder `server/.staging/collections/<slug>/` and publish with `--prune`.

`--prune` deletes online files permanently. Use `publish --dry-run --prune` first to see the count.

## Work from another computer, or after losing your drafts
```bash
pnpm install
pnpm content login
pnpm content pull        # downloads published metadata into local drafts
```
`pull` restores metadata only; the images stay online and publish keeps using them. To *replace* an image you'll need
the original file again.

## Checklist after any change
- [ ] `pnpm content list` looks right (1–3 featured ★)
- [ ] `pnpm content publish --dry-run` shows what you expect
- [ ] `pnpm content publish`
- [ ] `pnpm deploy:site` (the publish command can do this for you)
- [ ] Check the live site, including one photo's alt text and the new order

## Good to know
- Don't edit `catalog.json` in the bucket by hand; it is regenerated from your drafts on every publish.
- Because file names contain a hash, a visitor's browser can cache images forever safely; changed images always get new URLs.
- Original photos are never uploaded, only the generated sizes. Keep your originals backed up elsewhere.
