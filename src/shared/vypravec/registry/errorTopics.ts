/**
 * Spec 26.5 (D9) — chybové topiky Tier 0 (06 §5.1c): 2. linie „PROČ + co dál".
 * 1. linie (friendly hláška v místě chyby) ZŮSTÁVÁ — Vypravěč doplňuje
 * vysvětlení až při OPAKOVANÉM zákysu (2× týž kód na téže routě za session).
 * Mluvčího určuje scope zobrazení (platforma = Ishida, svět = Joe) — text je
 * psaný tak, aby seděl oběma (style-guide 02 §2: věcně, bez humoru v chybě).
 */

export interface ChybovyTopik {
  /** dismiss klíč (persistovaný — zavřené se nikdy neopakuje). */
  id: string;
  text: string;
  akce?: { label: string; to: string };
}

/** Mapa BE error kódů (parseApiErrorCode) → topik. */
export const CHYBOVE_TOPIKY: Record<string, ChybovyTopik> = {
  LIMIT_REACHED: {
    id: 'err.limit-reached',
    text: 'Narazil jsi na strop tvorby — přesné číslo říká hláška u akce. Limity drží platformu zdravou; pokud tě reálně blokují, ozvi se správcům.',
    akce: { label: 'Kontakt', to: '/kontakt' },
  },
  WORLD_MEMBERSHIP_QUOTA_REACHED: {
    id: 'err.world-quota-free',
    text: 'Bez Podporovatele můžeš být ve třech světech naráz. Uvolni místo odchodem z některého světa, nebo se podívej, co dává podpora.',
    akce: { label: 'Podporovatelé', to: '/ikaros/podporovatele' },
  },
  WORLD_QUOTA_REACHED: {
    id: 'err.world-quota',
    text: 'Máš 30 aktivních světů — víc účet nepojme. Starý svět můžeš smazat v jeho Nastavení, nebo se domluv se správci.',
    akce: { label: 'Kontakt', to: '/kontakt' },
  },
  REJECTED_RECENTLY: {
    id: 'err.rejected-recently',
    text: 'Po odmítnuté žádosti o přátelství běží 7denní pauza. Druhá strana ti ale může poslat žádost sama kdykoli. (Žádostí o vstup do světa se pauza netýká.)',
  },
  SOLE_PJ_BLOCK: {
    id: 'err.sole-pj',
    text: 'Účet teď smazat nejde — jsi jediný PJ svého světa a svět nesmí osiřet. Jmenuj v něm Pomocného PJ (Nastavení → Členové), pak to půjde.',
  },
  WORLD_OWNER_CANNOT_LEAVE: {
    id: 'err.owner-leave',
    text: 'Vlastník svět neopouští — nejdřív ho předej. Předání najdeš v Nastavení světa, záložka Členství.',
  },
  INSUFFICIENT_FUNDS: {
    id: 'err.funds',
    text: 'Účet postavy tenhle nákup nekryje. Zůstatek vidíš ve Financích postavy; doplnit ho může PJ.',
  },
  USERNAME_CHANGE_VIA_REQUEST: {
    id: 'err.username-request',
    text: 'Přezdívka se mění žádostí (Profil → Bezpečnost), kterou schvaluje správa; poté běží 30denní pauza.',
    akce: { label: 'Otevřít profil', to: '/ikaros/profil' },
  },
  FINANCE_NOT_APPLICABLE: {
    id: 'err.npc-finance',
    text: 'NPC nemá Finance — to není chyba. Plný inventář mají jen postavy hráčů; NPC je kulisa vyprávění.',
  },
  INVENTORY_NOT_APPLICABLE: {
    id: 'err.npc-vybava',
    text: 'NPC nemá Výbavu — to není chyba. Plný inventář mají jen postavy hráčů; NPC je kulisa vyprávění.',
  },
  NOT_SUPPORTER: {
    id: 'err.supporter',
    text: 'Tahle funkce patří Podporovatelům — díky nim platforma běží. Co všechno dává a jak se přidat, najdeš na stránce Podporovatelé.',
    akce: { label: 'Podporovatelé', to: '/ikaros/podporovatele' },
  },
  SESSION_REVOKED: {
    id: 'err.session',
    text: 'Tvoje relace byla odvolána — nejspíš přihlášení jinde nebo změna hesla. Přihlas se znovu, nic se neztratilo.',
  },
};

/** Fallbacky podle HTTP status (bez konkrétního kódu). */
export const CHYBOVE_STATUSY: Record<number, ChybovyTopik> = {
  403: {
    id: 'err.403',
    text: 'Tahle sekce vyžaduje vyšší oprávnění — ve světě roli od PJ, na platformě třeba Podporovatele nebo správce. Pokud ji potřebuješ, ozvi se tomu, kdo ji uděluje.',
  },
  404: {
    id: 'err.404',
    text: 'Tenhle obsah neexistuje, nebo je v soukromém světě. Pokud čekáš, že tu má být — přihlas se, nebo požádej o vstup.',
  },
};

export function najdiChybovyTopik(
  code: string | null,
  status: number | null,
): ChybovyTopik | null {
  if (code && CHYBOVE_TOPIKY[code]) return CHYBOVE_TOPIKY[code];
  if (status && CHYBOVE_STATUSY[status]) return CHYBOVE_STATUSY[status];
  return null;
}
