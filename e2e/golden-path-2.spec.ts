/**
 * 27.1 ZLATÁ CESTA ② (FE) — postava → deník → chat → hod.
 *
 * Ověřuje průchodnost UI (proti mock-API): otevření postavy a jejího deníku,
 * odeslání zprávy do chatu a hod kostkou, který skončí zprávou v chatu.
 * Netestuje BE dopočet hodu (to dělá BE golden-path-2), ale že UI řetěz drží.
 */
import { test, expect } from '@playwright/test';
import { mockBackend } from './mock-api';
import { login } from './steps';
import { TEST_WORLD, TEST_CHARACTER } from './fixtures';

test('② postava → deník → chat → hod kostkou', async ({ page }) => {
  await mockBackend(page);
  await login(page);

  // 1. Postava → tab Deník (PJ/vlastník ho vidí).
  await page.goto(`/svet/${TEST_WORLD.slug}/${TEST_CHARACTER.slug}`);
  const diaryTab = page.getByRole('tab', { name: 'Deník' });
  await expect(diaryTab).toBeVisible({ timeout: 15_000 });
  await diaryTab.click();
  await expect(diaryTab).toHaveAttribute('aria-selected', 'true');

  // 2. Chat → odeslat zprávu.
  await page.goto(`/svet/${TEST_WORLD.slug}/chat`);
  const composer = page.getByPlaceholder('Napiš depeši…');
  await expect(composer).toBeVisible({ timeout: 15_000 });
  await composer.fill('Vstupujeme do jeskyně.');
  await page.getByRole('button', { name: 'Odeslat' }).click();
  await expect(page.getByText('Vstupujeme do jeskyně.')).toBeVisible();

  // 3. Hod kostkou → picker → k6 (label 'k6' = klíč d6). Overlay animace (~5 s),
  //    pak trvalá zpráva „Hod Kostkou" v chatu.
  await page.getByRole('button', { name: 'Hod kostkou' }).click();
  const k6 = page.getByTitle('Hodit k6');
  await expect(k6).toBeVisible({ timeout: 10_000 });
  await k6.click();
  // Výsledek hodu se objeví v chatu jako zpráva „součet hodu: …" (dice overlay
  // ~5 s, pak optimistic insert do chatu).
  await expect(page.getByText(/součet hodu/i).first()).toBeVisible({
    timeout: 20_000,
  });
});
