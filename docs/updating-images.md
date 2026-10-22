# Updating images and metadata

Your drafts live in `server/.staging/` (git-ignored): one `collection.json` per collection plus the generated
image sizes. **Publishing** uploads new files and a fresh `catalog.json`; **deploying** rebuilds the site from it.

```
edit/add/reorder/remove  →  pnpm content publish  →  pnpm deploy:site
```

## Add photos
```bash
pnpm content add-photo        # choose the collection, then a file or a whole folder
```
For each photo it asks for alt text (required), title, caption, film, camera, lens, date, location, then creates
AVIF and WebP sizes (480 / 960 / 1600 / 2400px, never upscaled). It remembers your last answers as suggestions.
New photos are appended to the end of the collection.

## Edit a photo's details (alt text, title, film, camera, lens, date, location…)
```bash
pnpm content edit-photo
```
Pick the collection, then the photo. Each question is filled in with the photo's current value; press enter to keep it,
or change or clear it. You can edit several photos in a row.

- **Alt text** can't be blank. **Date** must be `YYYY`, `YYYY-MM` or `YYYY-MM-DD`.
- **Film, camera and lens** show the collection default when the photo doesn't have its own value. If you type the same
  value as the default, the photo goes back to inheriting it. If you clear one, the photo uses the default too (a photo
  can't have a blank film when its collection has one).
- Changes save straight away. Nothing is re-uploaded for metadata-only changes: publish only sends the catalog.

Mixing film stocks: set a default film on the collection and give the exceptions their own `film`.

## Reorder photos
```bash
pnpm content reorder
```
Pick the collection, pick the photo to move, then type where it should go: a number (`1` is first), `first` or `last`.
You'll see the current order each time, and can keep moving photos until you say you're done. The order you set is the
order on the site. Reordering doesn't change the cover (use `pnpm content cover`). It only appears for collections
with two or more photos.

## Replace a photo with a retouched version
Re-exporting creates a different file, so it's a new photo:
1. `pnpm content add-photo` with the new export.
2. `pnpm content reorder` to put it where the old one was.
3. `pnpm content remove-photo` for the old one.
4. `pnpm content publish --prune`, then `pnpm deploy:site`.

Adding the *identical* file again is detected and skipped.

## Change collection details
Collection-level fields (title, description, year, defaults, order) don't have a guided command yet. Edit
`server/.staging/collections/<slug>/collection.json` by hand, then publish and deploy.

| Field | Level | Notes |
|---|---|---|
| `title`, `description`, `year`, `featured`, `order` | collection | `order` sets list order and the order of featured cards on the home page |
| `defaults.film` / `camera` / `lens` | collection | used by photos that don't set their own |
| `cover` | collection | id of the cover photo (or use `pnpm content cover`) |

> If the JSON has a typo, the tool skips that collection, so it disappears from `list` and `publish`. Run
> `pnpm content list` after editing to confirm it's still there.

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

## How big is it?
```bash
pnpm content size                 # per-collection sizes, what's still to upload, and the bucket total
pnpm content publish --dry-run    # how much the next publish would upload, and from which collection
```
`size` shows each collection's size on this computer, how much hasn't been published yet, and the object count and total
size that Cloudflare reports for the bucket. It still shows the local numbers if you aren't logged in. Sizes use
decimal units (1 MB = 1,000,000 bytes), like Wrangler.

If the bucket total is much bigger than your drafts, files from photos you removed may be left behind:
`pnpm content publish --prune` clears them.

## Work from another computer, or after losing your drafts
```bash
pnpm install
pnpm content login
pnpm content pull        # downloads published metadata into local drafts
```
`pull` restores metadata only; the images stay online and publish keeps using them. To *replace* an image you'll need
the original file again. Sizes for files that aren't on this computer can't be counted, and the tool says so.

## Checklist after any change
- [ ] `pnpm content list` looks right (1–3 featured ★)
- [ ] `pnpm content publish --dry-run` shows what you expect (including the upload size)
- [ ] `pnpm content publish`
- [ ] `pnpm deploy:site` (the publish command can do this for you)
- [ ] Check the live site, including one photo's alt text and the new order

## Good to know
- Don't edit `catalog.json` in the bucket by hand; it is regenerated from your drafts on every publish.
- Because file names contain a hash, a visitor's browser can cache images forever safely; changed images always get new URLs.
- Original photos are never uploaded, only the generated sizes. Keep your originals backed up elsewhere.