import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import site from '../../site.config.mjs';

// Astro islands lose their `ssr` attribute once React has hydrated them.
const hydrated = (page: Page) => expect(page.locator('astro-island[ssr]')).toHaveCount(0);

test.describe('home', () => {
  test('shows the name and 1–3 featured collections', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(new RegExp(site.name));
    const featured = page.locator('a.cell:not(.archive)');
    expect(await featured.count()).toBeGreaterThanOrEqual(1);
    expect(await featured.count()).toBeLessThanOrEqual(3);
    await expect(page.getByRole('link', { name: new RegExp(site.labels.archiveTitle) })).toBeVisible();
  });

  test('clicking the middle of the home page goes to collections', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    await page.locator('.logo').click(); // clicks the centre of the name block
    await expect(page).toHaveURL(/\/collections\/?$/);
  });

  test('desktop: hovering a collection reveals its details', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hover is a desktop interaction');
    await page.goto('/');
    await hydrated(page);
    const first = page.locator('a.cell:not(.archive)').first();
    await first.hover();
    await expect(first.locator('.info h3')).toHaveCSS('opacity', '1');
  });

  test('mobile: collections are stacked and nothing overflows sideways', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile layout only');
    await page.goto('/');
    const cells = page.locator('a.cell');
    const a = await cells.nth(0).boundingBox();
    const b = await cells.nth(1).boundingBox();
    expect(b!.y).toBeGreaterThan(a!.y + a!.height - 1);
    expect(Math.abs(a!.x - b!.x)).toBeLessThan(2);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(cells.nth(0).locator('.info h3')).toHaveCSS('opacity', '1'); // visible without hover
  });
});

test.describe('collections', () => {
  test('lists collections and opens one', async ({ page }) => {
    await page.goto('/collections');
    const cards = page.locator('.lc a');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    await cards.first().click();
    await expect(page).toHaveURL(/\/collections\/[a-z0-9-]+\/?$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('viewer: keyboard navigation and Escape', async ({ page }) => {
    await page.goto('/collections');
    await page.locator('.lc a').first().click();
    await hydrated(page);
    const count = page.locator('.count');
    const total = ((await count.textContent()) ?? '').split('/')[1].trim();
    test.skip(Number(total) < 2, 'needs at least two photos');
    await expect(count).toContainText(`01 / ${total}`);
    await page.keyboard.press('ArrowRight');
    await expect(count).toContainText(`02 / ${total}`);
    await page.keyboard.press('ArrowLeft');
    await expect(count).toContainText(`01 / ${total}`);
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/collections\/?$/);
  });

  test('viewer: next button and live-region announcement', async ({ page }) => {
    await page.goto('/collections');
    await page.locator('.lc a').first().click();
    await hydrated(page);
    await page.getByRole('button', { name: site.labels.next, exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Photograph 2 of');
  });
});

test.describe('legal', () => {
  for (const path of ['/legal', '/legal/privacy', '/legal/copyright', '/legal/terms', '/legal/accessibility']) {
    test(`${path} renders with a heading and the site contact`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('link', { name: site.labels.collections }).first()).toBeVisible();
    });
  }

  test('unknown pages show the 404 page', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });
});

test.describe('accessibility (axe, WCAG 2.x A/AA)', () => {
  for (const path of ['/', '/collections', '/legal', '/legal/privacy']) {
    test(`no automatic violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
    });
  }

  test('no automatic violations on a collection page', async ({ page }) => {
    await page.goto('/collections');
    await page.locator('.lc a').first().click();
    await hydrated(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });

  test('keyboard focus is visible on the skip link', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: site.labels.skip })).toBeFocused();
    await expect(page.getByRole('link', { name: site.labels.skip })).toBeVisible();
  });
});
