/**
 * 14.5 — FE E2E smoke (jediný happy-path). Cíl: ověřit, že hlavní cesta
 * aplikací naběhne bez runtime crashe (rozbitý lazy chunk, router, guard,
 * PIXI init mapy) — věci, které tsc ani unit testy nezachytí. BE je mockovaný
 * (viz mock-api.ts), takže test je rychlý a deterministický.
 */
import { test, expect } from '@playwright/test';
import { mockBackend } from './mock-api';
import { TEST_WORLD } from './fixtures';

test('login → seznam světů → vstup do světa → taktická mapa', async ({
  page,
}) => {
  await mockBackend(page);

  // 1. Login přes UI (modal na úvodníku přes ?openLogin=1). Kroky scopujeme do
  //    dialogu — „Přihlásit se" je i v headeru, „Heslo" matchne i toggle.
  await page.goto('/?openLogin=1');
  const loginDialog = page.getByLabel('Přihlášení');
  await loginDialog.getByLabel('E-mail nebo přezdívka').fill('hrac@test.cz');
  await loginDialog.getByLabel('Heslo', { exact: true }).fill('Heslo123!');
  await loginDialog.getByRole('button', { name: 'Přihlásit se' }).click();

  // Po loginu se modal zavře (atom loginModalOpen=false).
  await expect(loginDialog).toBeHidden();

  // 2. Seznam světů → karta testovacího světa (odkaz na /svet/:slug).
  await page.goto('/ikaros/vesmiry');
  const worldLink = page
    .locator(`a[href="/svet/${TEST_WORLD.slug}"]`)
    .first();
  await expect(worldLink).toBeVisible();

  // 3. Vstup do světa.
  await worldLink.click();
  await expect(page).toHaveURL(new RegExp(`/svet/${TEST_WORLD.slug}$`));

  // 4. Taktická mapa. memberOnly guard pustí jen membera (mock = PJ); kdyby
  //    neprošel, redirectne na index světa → URL test by selhal.
  await page.goto(`/svet/${TEST_WORLD.slug}/takticka-mapa`);
  await expect(page).toHaveURL(/takticka-mapa/);

  const viewport = page.getByTestId('tactical-map-viewport');
  await expect(viewport).toBeVisible();
  // PIXI <Application> mountuje <canvas> po načtení scény → nejsilnější důkaz,
  // že se mapa vyrenderovala a PixiJS init nespadl.
  await expect(viewport.locator('canvas')).toBeVisible({ timeout: 15_000 });
});
