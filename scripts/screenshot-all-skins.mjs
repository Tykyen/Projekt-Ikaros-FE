/**
 * Screenshot všech 21 skinů — desktop viewport, fullPage, uložit do
 * ~/Downloads/projekt-ikaros-skins/<skinId>.png
 *
 * Vyžaduje běžící dev server na localhost:5173.
 *
 * Pustit: node scripts/screenshot-all-skins.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import os from 'node:os';

const URL = 'http://localhost:5173';
const OUT_DIR = path.join(os.homedir(), 'Downloads', 'projekt-ikaros-skins');

const VIEWPORT = { width: 1920, height: 1080 };

// All 21 themes per src/themes/types.ts
const THEMES = [
  'modre-nebe',
  'zlaty-standard',
  'sci-fi',
  'bila',
  'vesmirna-lod',
  'priroda',
  'pergamen',
  'nemrtvi',
  'ctyri-zivly',
  'vesmirna-bitva',
  'hospoda',
  'severske-runy',
  'indiane',
  'africke',
  'arabsky-svet',
  'kyberpunk',
  'postapo',
  'temna-cerven',
  'magie',
  'mesic',
  'slunce',
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Output: ${OUT_DIR}`);

  const browser = await chromium.launch({ headless: true });

  for (const themeId of THEMES) {
    const ctx = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();

    // Nastavit theme přes localStorage před page load
    await page.addInitScript((id) => {
      try { window.localStorage.setItem('ikaros.theme', JSON.stringify(id)); } catch (e) {}
    }, themeId);

    try {
      await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Wait for fonts, decorations, animations to settle
      await page.waitForTimeout(2500);

      const filePath = path.join(OUT_DIR, `${themeId}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`✓ ${themeId}.png`);
    } catch (err) {
      console.error(`✗ ${themeId}: ${err.message}`);
    } finally {
      await ctx.close();
    }
  }

  await browser.close();
  console.log(`\nDone. ${THEMES.length} screenshots uloženy v: ${OUT_DIR}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
