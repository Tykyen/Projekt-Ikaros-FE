# Scope registr A/B/C — beta (R3 27.3)

> **Zdroj pravdy pro kód:** `src/shared/scope/scope.ts` (`PREVIEW_FEATURES` / `HIDDEN_FEATURES`).
> Tento soubor = lidsky čitelné zrcadlo. Klasifikace ověřena z navigace (IkarosLayout `PRIMARY_NAV`/`CHAT_ROOMS`, WorldLayout `buildFullWorldNav`) + stavů v `docs/funkce/`.
> **Snímek k:** 2026-07-24 (spec-27.3).

## Pravidlo scope-freeze (Etapa III) 🔒

**Žádná nová velká doména, dokud A-scope není certifikovaný.** Výjimky jen po diskuzi (roadmap3 princip 2 „Certifikovat, ne přidávat"). Nová viditelná plocha se do bety přidává jako **C** (skrytá) nebo **B** (preview), ne rovnou jako A.

## Třídy

| Třída | Význam | Mechanismus | Support |
|---|---|---|---|
| **A** | Beta core — certifikováno (zlaté cesty 27.1), jádro produktu | default viditelné | plný |
| **B** | Funguje, ale okrajové / hloubkové / méně vyzrálé | klasifikace (vizuální štítek dnes nenasazen — viz níže) | best-effort |
| **C** | Experimentální / blokované / niche | skryté za feature flagem (nav hide + route `flagGate`) | žádný (default off) |

> ⚠️ **Vizuální „Preview" štítek SUNDÁN (2026-07-24)** — vzhled zamítnut vlastníkem. Registr A/B/C zůstává jako **klasifikace + freeze pravidlo** (zdroj pravdy `src/shared/scope/scope.ts`); `isPreview` je připravené API pro budoucí redesign štítku. Třída B se dnes v UI nijak vizuálně neodlišuje.

**Scoped, ne destruktivní:** in-world nástroje zavedených PJ se neschovávají flagem. C se používá jen pro už-blokované plochy. Přesun tieru = 1 řádek v `scope.ts`.

## Platforma (IkarosLayout)

| Plocha | Route | Klíč | Třída |
|---|---|---|---|
| Úvodník | `/` | uvodnik | **A** |
| Vytvořit svět | `/ikaros/vytvorit-svet` | vytvorit-svet | **A** |
| Prozkoumat světy | `/ikaros/vesmiry` | — | **A** |
| Putyka (hlavní chat) | `/chat` | hospoda | **A** |
| Pošta / Profil / Přátelé / Notifikace | `/ikaros/*` | — | **A** |
| Podporovatelé | `/ikaros/podporovatele` | podporovatele | **A** |
| Nápověda / Podmínky / Soukromí / Kodex / Kontakt | patička | — | **A** |
| Administrace | `/admin*` | — | **A** (admin-only) |
| Společná tvorba | `/ikaros/tvorba` | `tvorba` | **B** |
| Hledá se / Nábory (LFG) | `/ikaros/nabory` | `nabory` | **B** |
| Voice krčma | `/chat/voice` | `voice` | **B** |
| Fantasy camp | `/chat/camp` | `camp1` | **B** |
| Mystery camp | `/chat/camp2` | `camp2` | **B** |
| Sci-fi camp | `/chat/camp3` | `camp3` | **B** |
| RPG systémy | `/ikaros/systemy` | `systemy` | **C** (licence 25.8) |

## Svět (WorldLayout — in-world nástroje)

| Nástroj | nav `id` | Třída |
|---|---|---|
| Chat světa | (chat) | **A** (zlatá cesta ②) |
| Stránky / Pravidla / Skupiny | esenciál | **A** |
| Postavy / Moje postava | — | **A** (①) |
| Akce (game-events) | `akce` | **A** (④) |
| Taktická mapa | `takticka-mapa` | **A** (③) |
| Bestiář | `bestiar` | **A** (③) |
| Deník PJ | `denik-pj` | **A** |
| Novinky / Hráči / Nastavení | — | **A** |
| Časová osa | `timeline` | **B** |
| Kalendář | `kalendar` | **B** |
| Pavučina | `pavucina` | **B** |
| Mapa vesmíru (3D) | `mapa` | **B** |
| Atlas map | `mapy` | **B** |
| Obchod | `obchod` | **B** |
| Převodník měn | `prevodnik-men` | **B** |
| Storyboard (scénáře) | `scenare` | **B** |
| Generátor počasí | `pocasi` | **B** |
| Zvuková databáze | `zvuky` | **B** |
| Stavitel (podzemí/města) | `dungeon-builder` | **B** |

**Mimo registr** (ne samostatná first-contact plocha): Streamer overlay (režim taktické mapy, ne vstupní bod) · Magický systém / Technologie (seedovaná wiki = obsah) · Oblíbené (zkratky na obsah).

## Navrhované rozšíření (mimo tento zátah)

- **B2 — default-hide B nástrojů v novém světě** přes existující `hiddenNavItems` (BE seed) → skutečné „−20–35 % šíře" pro nový svět bez odebrání funkce. BE zásah → samostatná karta.
- Tvrdé skrytí voice/campů do C = produktové rozhodnutí (přesun 1 řádek: `PREVIEW_FEATURES` → `HIDDEN_FEATURES` + gate).
