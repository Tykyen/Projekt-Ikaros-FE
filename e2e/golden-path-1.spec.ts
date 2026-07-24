/**
 * 27.1 ZLATÁ CESTA ① (FE) — pozvánka → členství → postava.
 *
 * Ověřuje průchodnost UI (proti mock-API): přijetí pozvací pozvánky přesměruje
 * do světa a odtud jde založit postavu wizardem. Netestuje BE logiku (to dělá
 * BE golden-path-1), ale že klik po kliku nenarazí na rozbitý routing/guard/
 * lazy chunk.
 */
import { test, expect } from '@playwright/test';
import { mockBackend } from './mock-api';
import { login } from './steps';
import { TEST_WORLD } from './fixtures';

test('① pozvánka → vstup do světa → tvorba postavy', async ({ page }) => {
  await mockBackend(page);
  await login(page);

  // 1. Pozvací odkaz — InvitePage na mountu auto-accept → redirect do světa.
  await page.goto('/invite/golden-token-1');
  await expect(page).toHaveURL(new RegExp(`/svet/${TEST_WORLD.slug}`), {
    timeout: 15_000,
  });

  // 2. Adresář postav → spustit tvorbu (PJ vidí „Nová postava", prázdný adresář
  //    „Vytvořit postavu").
  await page.goto(`/svet/${TEST_WORLD.slug}/postavy`);
  await page
    .getByRole('button', { name: /Nová postava|Vytvořit postavu/ })
    .first()
    .click();

  // 3. Wizard „Co chceš vytvořit?" → Postava hráče (PC) → editor postavy.
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Co chceš vytvořit?')).toBeVisible();
  await dialog.getByRole('button', { name: /Postava hráče/ }).click();
  await expect(page).toHaveURL(/nova-stranka\?type=PostavaHrace/);
});
