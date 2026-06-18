# 00 — Přehled funkcí platformy Projekt Ikaros

> **Účel:** Hloubková, **kódem ověřená** inventura všeho, co platforma dnes umí. Slouží jako podklad pro budoucí uživatelský průvodce (návody) a pro strategii rozšiřování. Každé tvrzení bylo ověřeno přímo ve zdrojovém kódu FE i BE — ne odhadem.
>
> **Snímek k:** 2026-06-18 · **Repozitáře:** FE `Projekt-ikaros-FE` (React/TS), BE `Projekt-ikaros/backend` (NestJS).
>
> ⚠️ Toto je stav kódu, ne marketingový popis. Kde se název funkce rozchází s realitou, je to označeno v sekci „Nesrovnalosti & dluhy" na konci každé kapitoly.

---

## Jak číst

Každá funkce má jednotnou strukturu:

- **Co to je** — k čemu slouží (1–2 věty).
- **Kde** — route + umístění v menu/UI.
- **Kdo** — kdo vidí / kdo edituje; role gating ověřený na **FE i BE** (FE samo nestačí, BE je autoritativní).
- **Co jde dělat** — všechny reálné akce.
- **Hranice / co neumí** — limity a chybějící části (vstup pro plánování expanze).
- **Zvláštnosti** — důležité chování, pasti, real-time/WS závislosti.
- **Stav** — ✅ funguje · 🚧 částečné · ⚠️ stub / mrtvé.
- **Kód** — odkazy `soubor:řádek` na FE i BE.

### Legenda stavů

| Symbol | Význam |
|---|---|
| ✅ | Funkce reálně funguje FE↔BE, ověřeno v kódu. |
| 🚧 | Částečně hotové — chybí část (typicky FE bez BE nebo naopak, nebo nedotažený edge case). |
| ⚠️ | Stub / mrtvá routa / vydávané za hotové, ale fakticky neběží. |

---

## Role model (závazný slovník)

### Globální role (UserRole) — platforma

| Role | Hodnota | Stručně |
|---|---|---|
| Superadmin | 1 | Plná moc nad platformou (jediný smí obnovit opuštěný svět, mazat kategorie). |
| Admin | 2 | Platformová správa (uživatelé, moderace účtů, smazané světy, search index). |
| Ikarus | 9 | Běžný registrovaný uživatel. |
| SpravceClanku | 10 | Schvaluje a spravuje články. |
| SpravceGalerie | 11 | Schvaluje a spravuje galerii. |
| SpravceDiskuzi | 12 | Moderuje diskuze. |

+ **Granulární admin práva (D-033):** `canManageAdmins`, `canModerateContent`, `canEditPlatformPages` — viz kap. 08 (pozn.: `canEditPlatformPages` je dnes mrtvý flag).

> ⚠️ **Drift:** FE enum drží 6 rolí, **BE enum stále nese legacy world role (3–8)** — viz kap. 08.

### Světové role (WorldRole) — uvnitř každého světa zvlášť

| Role | Hodnota | Stručně |
|---|---|---|
| Zadatel | 0 | Požádal o vstup, čeká na schválení. |
| Ctenar | 1 | Čte obsah světa. |
| Hrac | 2 | Hraje — má postavu, vidí timeline/počasí/akce. |
| Korektor | 3 | Smí editovat data světa (např. téma, šablony tabulek). |
| PomocnyPJ | 4 | Pomocný vypravěč — většina správy obsahu (stránky, kalendáře, chat, postavy). |
| PJ | 5 | Vypravěč = vlastník světa; plná governance (nastavení, mazání, předání, role). |

> **R-20 governance:** platformový Admin/Superadmin **nemá moc uvnitř světa** — governance patří PJ. Jediná výjimka = obnova opuštěného soft-smazaného světa (30denní okno). Detail viz kap. 09.

---

## Průřezové koncepty (platí napříč kapitolami)

- **Autoritativní BE:** FE guardy jsou jen UX; o přístupu rozhoduje BE (`assertAccess`, `assertMember`, `@Roles`, `canAdminWorld`…). Pozor: FE pustí Sa/Admin do světa „nahlédnout", ale BE write akce je dle R-20 odmítne.
- **Real-time (WebSocket):** identita ze socketu (JWT `client.data.userId`), ne z payloadu. World-level eventy chodí jako leak-safe signál `world:{id}` → klient si refetchne filtrovaný GET. Ruční `room:join` nutně s reconnect re-join.
- **Per-system schémata:** postavy i bestie mají staty dle herního systému světa; schémata jsou canonical na FE → exportují se do BE, kde je validace v soft-mode (chybí-li schema, důvěřuje FE). 13+ herních systémů.
- **Témata / skiny:** `:root` vlastní buď globální ThemeProvider, nebo WorldLayout (per-svět téma) přes gate atom — nikdy ne třetí aplikátor.
- **AKJ chráněné záložky:** obsah na stránkách lze zamknout podle „clearance" + „grant"; zamčené záložky se hráči ukazují jako 🔒 (jméno + úroveň, bez obsahu), po přístupu 🔓 + obsah.
- **Soft-delete:** mazání světa = 30denní recovery; řada entit má koš místo tvrdého smazání.

---

## Mapa kapitol

### Platforma (Ikaros)

| # | Kapitola | Hlavní routy |
|---|---|---|
| [01](01-ucet-prihlaseni-bezpecnost.md) | Účet, přihlášení & bezpečnost | login, `/reset-password`, `/email-verify`, 2FA, self-delete |
| [02](02-profil-uzivatele-pratelstvi.md) | Profil, uživatelé & přátelství | `/ikaros/profil`, `/ikaros/uzivatel/:id`, `/ikaros/uzivatele` |
| [03](03-uvodnik-objevovani-svetu.md) | Úvodník & objevování světů | `/`, `/ikaros/vesmiry`, `/ikaros/vytvorit-svet` |
| [04](04-komunitni-obsah.md) | Komunitní obsah | `/ikaros/clanky`, `/galerie`, `/diskuze`, `/novinky` |
| [05](05-komunikace-platformy.md) | Komunikace platformy | `/chat`, `/chat/rozcesti`, `/ikaros/posta`, push |
| [06](06-akce-oblibene.md) | Akce & oblíbené | `/ikaros/akce`, `/ikaros/oblibene` |
| [07](07-napoveda-podminky.md) | Nápověda & podmínky | `/ikaros/napoveda`, `/podminky` |
| [08](08-platformova-administrace.md) | Platformová administrace | `/admin`, `/admin/dungeon-builder`, `/ikaros/admin/emotes` |

### Svět (`/svet/:worldSlug`)

| # | Kapitola | Hlavní routy |
|---|---|---|
| [09](09-svet-vstup-clenstvi.md) | Svět: vstup, dashboard, členství & role | index, `/hraci`, `/skupina/:groupKey` |
| [10](10-nastaveni-hlavni-lista.md) | Nastavení světa & hlavní lišta | `/nastaveni`, `/admin/headline` |
| [11](11-stranky-wiki-informace.md) | Stránky, wiki & informace | `/stranky`, `/:slug`, `/edit/:slug`, `/pravidla` |
| [12](12-postavy-bestiar-ekonomika.md) | Postavy, bestiář & ekonomika | `/postavy`, `/moje-postava`, `/bestiar`, `/obchod`, `/prevodnik-men` |
| [13](13-komunikace-sveta.md) | Komunikace světa | `/chat`, `/novinky` |
| [14](14-mapy-nastroje-hry.md) | Mapy & nástroje hry | `/mapa`, `/mapy`, `/takticka-mapa`, `/zvuky`, `/denik-pj` |
| [15](15-cas-pribeh.md) | Čas & příběh | `/kalendar`, `/timeline`, `/pocasi`, `/akce`, `/pavucina`, `/scenare` |

---

## Kde hledat nesrovnalosti

Každá kapitola končí sekcí **„⚠️ Nesrovnalosti & dluhy (k ověření)"** — soupis míst, kde se kód rozchází s názvem/očekáváním (mrtvé routy, stuby, FE bez BE, drift FE↔BE). Tyto body jsou nejcennější vstup pro plánování dalších etap: ukazují, co vypadá hotově, ale není, a kde jsou díry k zaplnění.
