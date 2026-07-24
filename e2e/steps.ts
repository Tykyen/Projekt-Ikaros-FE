import { type Page, expect } from '@playwright/test';

/**
 * 27.1 golden — společný login přes UI modal (?openLogin=1). Kopíruje kroky
 * ze smoke.spec.ts; scopováno do dialogu, ať „Přihlásit se"/„Heslo" nematchne
 * elementy v headeru. Po úspěchu se modal zavře (atom loginModalOpen=false).
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/?openLogin=1');
  const dialog = page.getByLabel('Přihlášení');
  await dialog.getByLabel('E-mail nebo přezdívka').fill('hrac@test.cz');
  await dialog.getByLabel('Heslo', { exact: true }).fill('Heslo123!');
  await dialog.getByRole('button', { name: 'Přihlásit se' }).click();
  await expect(dialog).toBeHidden();
}
