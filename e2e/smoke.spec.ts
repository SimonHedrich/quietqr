import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test, type Page } from '@playwright/test';
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';

const require = createRequire(import.meta.url);
prepareZXingModule({
  overrides: {
    wasmBinary: readFileSync(require.resolve('zxing-wasm/reader/zxing_reader.wasm'))
      .buffer as ArrayBuffer,
  },
  fireImmediately: true,
});

const ORIGIN = new URL(process.env.BASE_URL ?? 'http://localhost:4173').origin;

/** Fails the test on console errors, page errors or any request to another origin. */
function guard(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== ORIGIN)
      problems.push(`external request: ${r.url()}`);
  });
  return () => expect(problems).toEqual([]);
}

/** Decodes a PNG with ZXing. */
async function decodePng(bytes: Buffer): Promise<string | undefined> {
  const [result] = await readBarcodes(new Uint8Array(bytes), { formats: ['QRCode'] });
  return result?.text;
}

const preview = (page: Page) => page.getByRole('img', { name: 'QR code' });

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('loads without errors or external requests and shows the placeholder', async ({ page }) => {
  const check = guard(page);
  await page.goto('/');
  await expect(page.getByText('Enter something to generate your code')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download SVG' })).toBeDisabled();
  check();
});

test('every template produces a code', async ({ page }) => {
  const check = guard(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const toolbar = page.getByRole('toolbar', { name: 'Content type' });
  const fills: [string, string, string][] = [
    ['URL', 'Web address', 'example.com'],
    ['WiFi', 'Network name (SSID)', 'Home'],
    ['Text', 'Text', 'Hello'],
    ['Contact', 'First name', 'Ada'],
    ['Email', 'Recipient', 'a@example.com'],
    ['Phone', 'Phone number', '+49 721 1234'],
    ['SMS', 'Phone number', '+49 170 1234567'],
    ['Location', 'Latitude', '48.1'],
    ['Event', 'Title', 'Party'],
  ];
  for (const [name, field, value] of fills) {
    const chip = toolbar.getByRole('button', { name, exact: true });
    if (await chip.isVisible()) await chip.click();
    else {
      // The "…" chip is named after the active template once one is picked from its menu.
      await toolbar.locator('[aria-haspopup="menu"]').click();
      await page.getByRole('menuitemradio', { name }).click();
    }
    await page.getByRole('textbox', { name: field, exact: true }).fill(value);
    await expect(page.getByText('Enter something to generate your code')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Download SVG' })).toBeEnabled();
  }
  // Values survive switching templates.
  await toolbar.getByRole('button', { name: 'URL', exact: true }).click();
  await expect(page.getByLabel('Web address')).toHaveValue('example.com');
  check();
});

test('template chips and menu work with the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const url = page.getByRole('button', { name: 'URL', exact: true });
  await url.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'WiFi', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Network name (SSID)')).toBeVisible();
  await page.keyboard.press('End');
  const more = page.getByRole('button', { name: 'More types' });
  await expect(more).toBeFocused();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(more).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Title')).toBeVisible();
  // The "…" chip now shows the picked template.
  await expect(page.getByRole('button', { name: /Event/ })).toHaveAttribute('aria-pressed', 'true');
});

test('downloads scan and are named after the template', async ({ page }) => {
  const check = guard(page);
  await page.goto('/');
  await page.getByLabel('Web address').fill('example.com/hello');

  const [svg] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download SVG' }).click(),
  ]);
  expect(svg.suggestedFilename()).toBe('quietqr-url.svg');
  const svgText = readFileSync(await svg.path(), 'utf8');
  expect(svgText).toMatch(/^<\?xml[^>]*>\n<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox/);

  await page.getByLabel('PNG size').selectOption('512');
  const [png] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download PNG' }).click(),
  ]);
  expect(png.suggestedFilename()).toBe('quietqr-url.png');
  const bytes = readFileSync(await png.path());
  expect(bytes.readUInt32BE(16)).toBe(512); // PNG width
  expect(await decodePng(bytes)).toBe('https://example.com/hello');
  check();
});

test('copy image puts a PNG on the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByLabel('Web address').fill('example.com');
  await page.getByRole('button', { name: 'Copy image' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  const types = await page.evaluate(async () => (await navigator.clipboard.read())[0]?.types);
  expect(types).toContain('image/png');
});

test('copy link round trip, then the hash is cleared on edit', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'WiFi', exact: true }).click();
  await page.getByLabel('Network name (SSID)').fill('Café;Net');
  await page.getByLabel('Password', { exact: true }).fill('secret123');
  await page.getByText('Dots').click();
  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.getByRole('button', { name: 'Link copied' })).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(/#v1=[\w-]+$/);
  expect(page.url()).toBe(link);

  const other = await context.newPage();
  await other.goto(link);
  await expect(other.getByLabel('Network name (SSID)')).toHaveValue('Café;Net');
  await expect(other.getByLabel('Password', { exact: true })).toHaveValue('secret123');
  await expect(other.getByRole('radio', { name: 'Dots' })).toBeChecked();
  expect(other.url()).toBe(link);
  await other.getByLabel('Network name (SSID)').fill('Changed');
  await expect.poll(() => other.url()).not.toContain('#');

  // A broken hash is ignored.
  const broken = await context.newPage();
  await broken.goto('/#v1=garbage');
  await expect(broken.getByLabel('Web address')).toHaveValue('');
});

test('style persists across reloads, content does not', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Web address').fill('example.com');
  await page.getByText('Rounded').click();
  await page.getByRole('button', { name: 'Use #1e3a8a' }).click();
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Rounded' })).toBeChecked();
  await expect(page.getByLabel('Foreground hex value')).toHaveValue('#1e3a8a');
  await expect(page.getByLabel('Web address')).toHaveValue('');
  const stored = await page.evaluate(() => JSON.stringify(localStorage));
  expect(stored).not.toContain('example.com');
});

test('logo upload switches Auto to 30 % and can be removed', async ({ page }) => {
  const check = guard(page);
  await page.goto('/');
  await page.getByLabel('Web address').fill('example.com');
  await expect(page.getByText('Auto: 15 %')).toBeVisible();
  // A 1×1 red PNG.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
    'base64',
  );
  await page.locator('input[type="file"]').setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: png,
  });
  await expect(page.getByText('Auto: 30 % (logo)')).toBeVisible();
  await expect(preview(page).locator('image')).toHaveCount(1);
  await page.getByText('7 %').click();
  await expect(page.getByText(/The logo covers too much/)).toBeVisible();
  await page.getByRole('button', { name: 'Remove logo' }).click();
  await expect(preview(page).locator('image')).toHaveCount(0);
  check();
});

test('warnings and capacity error', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await page.getByRole('textbox', { name: 'Text', exact: true }).fill('hello');
  await page.getByLabel('Foreground hex value').fill('#dddddd');
  await expect(page.getByText(/Low contrast/)).toBeVisible();
  await page.getByRole('textbox', { name: 'Text', exact: true }).fill('x'.repeat(3000));
  await expect(page.getByRole('alert')).toContainText('Too much content');
  await expect(page.getByRole('button', { name: 'Download SVG' })).toBeDisabled();
});

test('typing a hex color character by character', async ({ page }) => {
  await page.goto('/');
  const hex = page.getByLabel('Foreground hex value');
  await hex.fill('');
  await hex.pressSequentially('#1e3a8a');
  await expect(hex).toHaveValue('#1e3a8a');
  await expect(page.getByRole('button', { name: 'Use #1e3a8a' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await hex.fill('#abc');
  await hex.blur();
  await expect(hex).toHaveValue('#aabbcc');
});

test('language switch updates the UI and <html lang>', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Language').selectOption('de');
  await expect(page.getByText('Gib etwas ein, um deinen Code zu erzeugen')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});
