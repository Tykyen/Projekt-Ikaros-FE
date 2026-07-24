/**
 * Spec 25.3 — jediný zdroj pravdy pro veřejný štítek stavu platformy.
 *
 * Přepnutí termínu (např. „beta" → jiný) = změna zde; sjednocuje beta banner
 * i patičku (dřív hardcoded „(beta)" v SiteFooter). Bump `BETA_BANNER_VERSION`
 * ⇒ dismissnutý banner se ukáže znovu VŠEM (dismiss klíč nese verzi — stejný
 * princip jako `LastInfoBar` s `updatedAt`).
 *
 * Tiny modul bez dalších importů (vzor SystemLanding/flag.ts) — ať ho router /
 * layouty / patička berou bez zátěže na bundle.
 */
export const BETA_STAGE_LABEL = 'beta'; // razítko v banneru (rozhodnuto 2026-07-24)
export const BETA_STAGE_SHORT = 'beta'; // do patičky (nahrazuje dřívější „(beta)")
export const BETA_BANNER_VERSION = 'v1'; // bump ⇒ banner znovu všem

/** Dismiss klíč do onboardingStore.dismissed — verzovaný, ať jde sdělení „obnovit". */
export const BETA_BANNER_DISMISS_KEY = `beta-banner:${BETA_BANNER_VERSION}`;
