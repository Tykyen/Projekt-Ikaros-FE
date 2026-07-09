/**
 * Spec 20B (Fáze B2) — zrcadlo generických report & moderace enumů z BE
 * (`backend/src/modules/moderation/enums/moderation.enums.ts`). Stringové
 * hodnoty jsou KONTRAKT — musí sedět 1:1 s BE, proto se NEimportuje z BE
 * (oddělená repa), ale ručně zrcadlí. UI labely jsou české.
 */

// ─── Typ nahlašitelného cíle (11 ploch) ──────────────────────────────────

export type ReportTargetType =
  | 'article'
  | 'gallery'
  | 'profile'
  | 'nabor'
  | 'bestie'
  | 'discussion_post'
  | 'page'
  | 'character_diary'
  | 'world_news'
  | 'chat_message'
  | 'mail_message';

export const REPORT_TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  article: 'Článek',
  gallery: 'Obrázek v galerii',
  profile: 'Profil uživatele',
  nabor: 'Nábor',
  bestie: 'Bestie',
  discussion_post: 'Příspěvek v diskuzi',
  page: 'Stránka světa',
  character_diary: 'Deník postavy',
  world_news: 'Novinka světa',
  chat_message: 'Zpráva v chatu',
  mail_message: 'Zpráva v poště',
};

// ─── Kategorie hlášení (DSA čl. 16) ───────────────────────────────────────

export type ReportCategory =
  | 'copyright'
  | 'personal_data'
  | 'harassment'
  | 'minor_safety'
  | 'illegal'
  | 'spam'
  | 'other';

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  copyright: 'Autorská práva',
  personal_data: 'Osobní údaje',
  harassment: 'Obtěžování',
  minor_safety: 'Ohrožení nezletilých',
  illegal: 'Nezákonný obsah',
  spam: 'Spam',
  other: 'Jiné',
};

/** Pořadí kategorií v selectu (drží se pořadí BE enumu). */
export const REPORT_CATEGORY_ORDER: ReportCategory[] = [
  'copyright',
  'personal_data',
  'harassment',
  'minor_safety',
  'illegal',
  'spam',
  'other',
];

/**
 * Kategorie s nízkou bariérou hlášení — e-mail oznamovatele NENÍ povinný
 * (ohrožení nezletilých / CSAM, spec 20B §B2). BE tuto kategorii navíc
 * povolí resolvnout jen Adminovi.
 */
export const LOW_BARRIER_CATEGORIES: ReportCategory[] = ['minor_safety'];

// ─── Moderační akce M0–M7 (provozní matice) ───────────────────────────────

export type ModerationAction =
  | 'M0_none'
  | 'M1_notice'
  | 'M2_hide_part'
  | 'M3_hide_temp'
  | 'M4_remove'
  | 'M5_restrict'
  | 'M6_terminate'
  | 'M7_escalate';

export const MODERATION_ACTION_LABELS: Record<ModerationAction, string> = {
  M0_none: 'Bez zásahu',
  M1_notice: 'Upozornění',
  M2_hide_part: 'Skrýt část',
  M3_hide_temp: 'Dočasně skrýt',
  M4_remove: 'Odstranit',
  M5_restrict: 'Omezit účet',
  M6_terminate: 'Ukončit účet',
  M7_escalate: 'Eskalace mimo platformu',
};

export const MODERATION_ACTION_DESCRIPTIONS: Record<ModerationAction, string> = {
  M0_none: 'Obsah je v pořádku, žádný zásah.',
  M1_notice: 'Autor dostane upozornění, obsah zůstává.',
  M2_hide_part: 'Skryje se závadná část obsahu.',
  M3_hide_temp: 'Obsah se dočasně skryje do prošetření.',
  M4_remove: 'Obsah se trvale odstraní.',
  M5_restrict: 'Účet autora se omezí (jen Admin/Superadmin).',
  M6_terminate: 'Účet autora se ukončí (jen Admin/Superadmin).',
  M7_escalate: 'Předání mimo platformu — orgány činné (jen Admin/Superadmin).',
};

export const MODERATION_ACTION_ORDER: ModerationAction[] = [
  'M0_none',
  'M1_notice',
  'M2_hide_part',
  'M3_hide_temp',
  'M4_remove',
  'M5_restrict',
  'M6_terminate',
  'M7_escalate',
];

/**
 * Account-level akce (M5–M7) — BE je povolí jen Superadmin/Admin. FE je
 * u ne-admina z výběru skryje (a BE je gate stejně vynutí přes 403).
 */
export const ACCOUNT_LEVEL_ACTIONS: ModerationAction[] = [
  'M5_restrict',
  'M6_terminate',
  'M7_escalate',
];

export function isAccountLevelAction(action: ModerationAction): boolean {
  return ACCOUNT_LEVEL_ACTIONS.includes(action);
}
