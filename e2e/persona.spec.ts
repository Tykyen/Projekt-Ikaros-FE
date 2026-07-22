/**
 * Spec 26.6 (D11) — E2E smoke onboardingu Vypravěče: čerstvý účet → persona
 * dialog (jediné auto-otevření vůbec) → volba „Chci vést hru" → cesta 26.1
 * se rozběhne (lišta s krokem 1 „Založ svět").
 * BE mock: onboarding vrací {state:null, legacy:false} = jeNovy.
 */
import { test, expect } from '@playwright/test';
import { mockBackend } from './mock-api';

test('čerstvý účet → persona dialog → volba PJ → lišta kroku 1', async ({
  page,
}) => {
  await mockBackend(page);
  // Přepiš onboarding na „čerstvý účet" (poslední route handler vyhrává).
  await page.route('**/users/me/onboarding', (route) => {
    if (route.request().method() !== 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ state: null, legacy: false }),
    });
  });

  // Login přes UI (vzor smoke.spec).
  await page.goto('/?openLogin=1');
  const loginDialog = page.getByLabel('Přihlášení');
  await loginDialog.getByLabel('E-mail nebo přezdívka').fill('hrac@test.cz');
  await loginDialog.getByLabel('Heslo', { exact: true }).fill('Heslo123!');
  await loginDialog.getByRole('button', { name: 'Přihlásit se' }).click();
  await expect(loginDialog).toBeHidden();

  // Persona dialog = auto-otevřený panel s Ishidovým uvítáním (po idle initu).
  await expect(
    page.getByText('Jsem Ishida', { exact: false }),
  ).toBeVisible({ timeout: 15_000 });

  // Volba „Chci vést hru" → panel se zavře, startuje cesta 26.1.
  await page.getByRole('button', { name: /Chci vést hru/ }).click();

  // Lišta kroku: krok 1 „Založ svět" + CTA.
  await expect(page.getByText('Založ svět', { exact: false })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Založit svět' }),
  ).toBeVisible();

  // Persona dialog se po volbě už znovu neotvírá (reload).
  await page.reload();
  await expect(page.getByText('Jsem Ishida')).toBeHidden();
});
