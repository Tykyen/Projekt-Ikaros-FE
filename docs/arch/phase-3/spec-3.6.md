# Spec 3.6 — Stránka Nápověda (`/ikaros/napoveda`)

**Status:** Draft — čeká na schválení
**Rozsah:** FE (statická obsahová stránka + jedna feature komponenta) — středně velké
**Repo:** `Projekt-ikaros-FE`, větev `feat/krok-3.6-napoveda`
**Velikost:** odhad ~6–8 souborů / ~700–900 ř. (z toho ~70 % obsah)
**Autor:** PJ + Claude
**Datum:** 2026-05-12
**Souvisí:** [spec-1.4.md](../phase-1/spec-1.4.md) (role-aware UI), [TermsPage](../../../src/features/ikaros/pages/TermsPage.tsx) (vzor pro statickou stránku)

---

## 1. Cíl

Vytvořit přístupnou, dobře strukturovanou **nápovědu** na `/ikaros/napoveda`, která hráči (i nepřihlášenému) řekne **co umí stránky teď** a **jaké role / oprávnění existují**. Slouží jako orientační bod pro nové návštěvníky, příručka pro stávající uživatele a referenční dokument pro role admin/PJ/správce.

---

## 2. Kontext / motivace

- V navigaci je položka „Nápověda" ([IkarosLayout.tsx:61](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L61)) i v public routách ([router.tsx:99](../../../src/app/router.tsx#L99)), ale obsah je 1řádkový stub: `[stub] Nápověda`.
- Platforma po krocích 1.1–1.4 už má reálnou funkčnost (auth, profil, adresář, role hierarchii, ban/delete, theme switcher, audit log) — uživatel bez nápovědy netuší, kam jít a co může.
- Roadmap má krok 3.6 (Nápověda) plánovaný až po 3.1–3.5. Krok je **vytahován dopředu** na žádost autora — nepřináší závislost na 2.x/3.x featurech, jen dokumentuje stávající stav.
- Cílem **není** nahrazovat tutorialy herních systémů ani onboarding tour — to patří do pozdějších fází.

---

## 3. Audit současného stavu

### Existující artefakty

- [HelpPage.tsx](../../../src/features/ikaros/pages/HelpPage.tsx) — 3 ř. stub, žádné styly.
- [TermsPage.tsx](../../../src/features/ikaros/pages/TermsPage.tsx) + [TermsPage.module.css](../../../src/features/ikaros/pages/TermsPage.module.css) — funkční vzor: max-width 720, hierarchie `h1`/`h2`/`p`/`ul`, theme tokeny, mobil break.
- Routing: `/ikaros/napoveda` veřejná ([router.tsx:99](../../../src/app/router.tsx#L99)) — anon i logged-in přístup.
- Navigace odkazuje sidebar → „Nápověda" ([IkarosLayout.tsx:61](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L61)).

### Co je v platformě reálně funkční (k dokumentaci)

| # | Oblast | Stránka | Funkční? | Roadmap |
|---|--------|---------|----------|---------|
| 1 | Hlavička / navigace | layout | ✅ | 0.2 |
| 2 | Theme (21 motivů) | switcher v hlavičce + v Administraci | ✅ | 1.0 |
| 3 | Registrace | modal v hlavičce | ✅ | 1.2 |
| 4 | Login | modal v hlavičce | ✅ | 1.1 |
| 5 | Reaktivace smazaného účtu | modal po login | ✅ | 1.3c |
| 6 | Úvodník | `/` | ✅ částečně (kostra) | 2.1 |
| 7 | Nápověda | `/ikaros/napoveda` | 🚧 stub (tento spec) | 3.6 |
| 8 | Podmínky použití | `/podminky` | ✅ placeholder text | 1.2 |
| 9 | Profil | `/ikaros/profil` (7 sekcí) | ✅ | 1.3a/b/c |
| 10 | Adresář uživatelů | `/ikaros/uzivatele` (taby) | ✅ | 1.4 |
| 11 | Veřejný profil | `/ikaros/uzivatel/:id` | ✅ | 1.4 |
| 12 | Bezpečnost | sekce v profilu (heslo, username request) | ✅ | 1.3b |
| 13 | Účet (smazání) | sekce v profilu | ✅ | 1.3c |
| 14 | Admin akce (ban, role, audit) | adresář + audit tab | ✅ | 1.3b/c |
| 15 | Žádosti o username | Zpracovat tab | ✅ | 1.4 |
| 16 | Vesmíry | stub | ❌ | 2.2 |
| 17 | Vytvořit svět | stub | ❌ | 2.3 |
| 18 | Detail světa + join | stub | ❌ | 2.4 |
| 19 | Články | stub | ❌ | 3.2 |
| 20 | Galerie | stub | ❌ | 3.3 |
| 21 | Diskuze | stub | ❌ | 3.4 |
| 22 | Pošta | stub | ❌ | 3.5 |
| 23 | Hospoda (globální chat) | stub | ❌ | 4.x |
| 24 | Přátelé + queue typ friend_request | placeholder v adresáři | ❌ | 1.8 |
| 25 | Presence (online indikátor) | — | ❌ | 1.5 |
| 26 | Reset hesla | — | ❌ | 1.7 |
| 27 | Celá světová vrstva | stuby | ❌ | 5+ |

### Role v systému

- **Globální** ([shared/types/index.ts:1–13](../../../src/shared/types/index.ts#L1-L13)): `Superadmin (1)`, `Admin (2)`, `PJ (3)`, `Korektor (4)`, `Hrac (5)`, `Ctenar (6)`, `Zadatel (7)`, `Ikarus (9)`, `SpravceClanku (10)`, `SpravceGalerie (11)`, `SpravceDiskuzi (12)`.
- **Granular admin permissions** ([shared/types/index.ts:21–31](../../../src/shared/types/index.ts#L21-L31)): `canManageAdmins`, `canModerateContent`, `canEditPlatformPages` — nastavuje jen Superadmin (D-033).
- **Světové** ([shared/types/index.ts:261–267](../../../src/shared/types/index.ts#L261-L267)): `PJ (3)`, `PomocnyPJ (2)`, `Korektor (1)`, `Hrac (0)`, `Pending (-1)`.

Reálně využívané (a tedy dokumentovatelné): Superadmin, Admin, Hrac, světové PJ/PomocnyPJ/Hrac/Pending. Ostatní (Korektor/Ctenar/Zadatel/Ikarus + světoví správci článků/galerie/diskuzí) existují v enumu, ale BE/FE je zatím skoro nepoužívá — viz §5 *Out of scope*.

---

## 4. Návrh řešení

### 4.1 Layout — top tabs + scroll content

5 horních tabů (URL state `?sekce=...`), pod nimi obsah jako delší článek s `h2` sekcemi a vnitřními anchory. Důvod:

- Stránka má 5 různorodých sekcí pro různá publika (nový anon × admin × hráč × FAQ) — tabs snadno orientují.
- Tab pattern už máme zaveden v `UsersPage` (1.4), reuse vizuálního jazyka.
- TermsPage čistá linear varianta by zde nestačila — content je 4× delší a smíchaný.

**Tabs:**

| # | Tab | URL `?sekce=` | Cílí na |
|---|-----|---------------|---------|
| 1 | Začni tady | `start` (default) | Nový anon / nově registrovaný hráč |
| 2 | Stránky | `stranky` | Každý — „co kde najdu" |
| 3 | Účet & profil | `ucet` | Registrovaný hráč |
| 4 | Role & oprávnění | `role` | Admin / PJ / kdo přemýšlí o roli |
| 5 | FAQ | `faq` | Quick odpovědi |

### 4.2 Obsah jednotlivých tabů (zkrácený výtah)

#### Tab „Začni tady"
- Co je Projekt Ikaros (2 odst.) — komunitní platforma pro RPG světy, kosmický „adresář" světů hraných různými skupinami
- Co vidíš jako **nepřihlášený**: úvodník, vesmíry (jen veřejné), články/galerii/diskuze (v budoucnu), nápovědu, podmínky
- Co odemkne **registrace**: profil, vlastní postava, vesmíry tvé (Moje světy), Pošta, Hospoda (chat), Administrace v pravém panelu
- Jak se zaregistrovat (krok-za-krokem: tlačítko Registrace → modal → e-mail/přezdívka/heslo → souhlas s podmínkami → instant login)
- Jak změnit vzhled — Theme switcher v hlavičce / v Administraci (pravý panel) → 21 motivů, volba se ukládá k účtu
- Orientace v rozhraní:
  - **Hlavička:** logo + zaměnitelné tlačítka (Přihlásit/Registrace anon × Pošta/Avatar/Odhlásit logged-in) + Theme switcher
  - **Levý sidebar:** Navigace + Vesmíry + Chat
  - **Hlavní panel:** obsah aktuální stránky
  - **Pravý panel (jen logged-in):** Administrace (Uživatelé/Přátelé + Theme switcher), Moje světy, Moje diskuze, Oblíbené

#### Tab „Stránky"

Pro každou stránku: **název**, **adresa**, **kdo má přístup**, **co tam funguje teď**, **co je v přípravě**. Vizuálně rozdělené **✅ Funguje** vs **🚧 Připravujeme** tagem.

Konkrétní položky (zkrácený seznam — plný v plánu):
- ✅ Úvodník (`/`), Nápověda (`/ikaros/napoveda`), Podmínky (`/podminky`)
- ✅ Profil (`/ikaros/profil`), Uživatelé (`/ikaros/uzivatele`), Veřejný profil (`/ikaros/uzivatel/:id`)
- 🚧 Vesmíry, Vytvořit svět, Detail světa (Fáze 2)
- 🚧 Články, Galerie, Diskuze, Pošta (Fáze 3)
- 🚧 Hospoda — globální chat (Fáze 4)
- 🚧 Přátelé (Fáze 1.8), Reset hesla (1.7), Presence (1.5)
- 🚧 Světová vrstva (chat, postavy, mapy, kalendář, kampaně) (Fáze 5+)

Připravujeme: jen **jednovětný popis**, žádné detaily ani screenshoty. Cíl: uživatel ví že to přijde, ale nehledá to dnes.

#### Tab „Účet & profil"

Plný popis 7 sekcí profilu (paralelně s 1.3a/b/c implementací):
1. **Header karta** — avatar, přezdívka, město, datum založení, posl. přihlášení, barva chatu, motiv
2. **Něco o mně** — bio, max 1000 znaků
3. **Postava v Rozcestí** — herní jméno, bio, samostatný avatar
4. **Moje světy** — read-only seznam
5. **Komunitní stopa** — Moje diskuze / články / galerie (zatím placeholder)
6. **Bezpečnost** — změna hesla (vyžaduje staré), žádost o změnu přezdívky (cooldown 30 dní, schvaluje admin), email (read-only do 1.7)
7. **Účet** — smazání účtu (30denní hold, reaktivace přihlášením, auto-povýšení Pomocného PJ pokud jsi jediný PJ světa)

Dále: jak funguje **default avatar** (muž/žena/bytost při neuploadnutém), **tombstone** (smazaný účet zachová obsah, ale autora překryje šablonou).

#### Tab „Role & oprávnění"

**Globální role:**

| Role | Kdo to je | Co může |
|------|-----------|---------|
| Superadmin | Zakladatel platformy (Tyky) | Vše. Jediný kdo nastavuje Admin role + granular permissions. |
| Admin | Důvěryhodný moderátor | Adresář uživatelů, ban/unban, role-change (s hierarchií), schvalování žádostí o změnu přezdívky, čtení audit logu, moderační smazání účtu. |
| PJ | Game master ve svém světě | Globálně standardní hráč. Plné pravomoci uvnitř svého světa. |
| Hrac | Standardní hráč | Vlastní profil, vlastní postava, účast v diskuzích/chatu (až bude). |

V přípravě (zmíníme jednovětou poznámkou): SpravceClanku/Galerie/Diskuzi (fáze 3.x), Korektor (definice později).

**Hierarchie:** Superadmin > Admin (s `canManageAdmins`) > Admin > ostatní. Admin nemůže nastavovat Admin role bez `canManageAdmins`.

**Akční matice (admin akce × cílová role):**

|                     | Sebe | Hrac | PJ | Admin | Superadmin |
|---------------------|------|------|----|----|-----------|
| Ban / unban         | ✕ | ✓ (Admin+) | ✓ (Admin+) | ✓ jen Superadmin | ✕ |
| Změna role          | ✕ | ✓ (Admin+) | ✓ (Admin+) | ✓ s `canManageAdmins` | ✕ |
| Moderační smazání   | ✕ | ✓ (Admin+) | ✓ (Admin+) | ✓ s `canManageAdmins` | ✕ |
| Granular permissions| ✕ | — | — | ✓ jen Superadmin | ✕ |

**Světové role** (uvnitř každého světa zvlášť):

| Role | Co může |
|------|---------|
| PJ | Vlastník světa, plná správa. Když smaže účet jako jediný PJ světa, Pomocný PJ se automaticky povýší. |
| PomocnyPJ | Zastupuje PJ. Auto-promoce při smazání PJ. |
| Korektor | Korektura textů. (Detail v rámci fáze 5+.) |
| Hrac | Hraje. |
| Pending | Čeká na schválení žádosti o vstup do uzavřeného světa. (Fáze 2.4.) |

#### Tab „FAQ"

Krátké QA páry. Návrh otázek:
- Jak změnit přezdívku? → profil → Bezpečnost → tlačítko žádosti, schválí admin do několika dní; cooldown 30 dní mezi schválenými změnami.
- Co když zapomenu heslo? → Reset hesla zatím není (přijde v kroku 1.7). Pokud ho potřebuješ teď, ozvi se administrátorovi.
- Jak smazat účet? → profil → Účet → Smazat. Účet je 30 dní v hold-stavu, můžeš se kdykoli vrátit přihlášením. Po 30 dnech proběhne anonymizace (tvé příspěvky zůstanou, autor se přepíše „Smazaný účet").
- Co je tombstone? → Smazaný účet ponechává obsah v platformě, ale autor je nahrazen šedým „Smazaný účet" se škrtnutým avatarem.
- Co je „Zpracovat" v adresáři? → univerzální fronta čekajících akcí (žádosti o změnu přezdívky, později žádosti o přátelství, vstup do světa, schvalování článků/obrázků/diskuzí).
- Co znamená Motiv (theme)? → globální vzhled Ikaru. 21 variant, každá samostatný „skin". Volba se ukládá k účtu (anon má dočasnou volbu v prohlížeči).
- Můžu jako Admin banovat jiného Admina? → Ne, jen Superadmin smí ban/role-change jinému adminovi.
- Existuje mobilní verze? → Stránka je responsivní. Sidebar se na mobilu skrývá do drawer menu (hamburger).
- Kde nahlásit problém? → e-mail na zakladatele (tykytanjunior@gmail.com).

### 4.3 Komponenta a soubory

```
src/features/ikaros/pages/HelpPage/
├── HelpPage.tsx            # tab state + routing přes ?sekce=
├── HelpPage.module.css     # tabs + obsah + responsive
├── sections/
│   ├── StartSection.tsx
│   ├── PagesSection.tsx
│   ├── AccountSection.tsx
│   ├── RolesSection.tsx
│   └── FaqSection.tsx
└── helpers.ts              # tab key parsing
```

Důvod adresáře: 5 sekcí každá ~100–200 ř. obsahu → jeden monolit = 800+ ř. Rozdělené sekce snáz se updatují a každá je čistě prezentační.

### 4.4 Vizuální / theme integrace

- **Žádné nové theme tokeny** — celá stránka jen reuse:
  - `--text` / `--text-strong` / `--text-muted` / `--surface-2` / `--accent` / `--warning`
- **Reusable patterns:**
  - Tabs — stejný vizuál jako `UsersPage` (1.4): horizontální nav s underline na aktivním
  - Sekce — `h2` upper-case (jako Terms)
  - „Funguje / Připravujeme" tagy — pill s `--accent` / `--text-muted`
  - Tabulky rolí — jednoduchá `<table>` s `--surface-2` zebra, scrolovatelná na mobilu (`overflow-x: auto`)
- **CornerOrnament:** ne (stejně jako TermsPage — long-form content).
- **Theme audit:** po dokončení obsahu spustit `frontend-design` skill jako audit — viz workflow.

### 4.5 Mobil

- Tabs: na mobilu < 640 px se přepínají na **horizontálně scrollovatelný** pásek (nezalamovat).
- Tabulky rolí: `overflow-x: auto`, header sticky-left pro řádkové popisky.
- Max-width 800 px (oproti TermsPage 720) — kvůli tabulkám.

---

## 5. Out of scope

- **Tutoriály herních mechanik** (D&D, DrD, Matrix kostky…) — řeší fáze 5+.
- **Onboarding tour** (interaktivní průvodce poprvé) — případně fáze 13.
- **Hledání v nápovědě** — text není dlouhý, sekce jsou dobře rozdělené, fulltext zatím nepotřebujeme.
- **i18n / EN verze** — projekt je česky-only, žádný překladač.
- **Popis rolí Korektor / Ctenar / Zadatel / Ikarus** — zatím nedefinované v BE/FE. Zmínit jen jednovětě „v přípravě".
- **Popis SpravceClanku / Galerie / Diskuzi v detailu** — odložit do fáze 3.x kdy budou reálně dělat něco.
- **Změna obsahu jiných stránek** (Terms, layout, profil) — jen čtený zdroj.
- **Wiki-style editovatelnost** — statický kód, žádný admin editor (případně fáze 12).

---

## 6. Acceptance kritéria

1. ✅ `/ikaros/napoveda` zobrazuje 5 tabů: Začni tady (default), Stránky, Účet & profil, Role & oprávnění, FAQ.
2. ✅ Switch tabů aktualizuje URL `?sekce=...` (back/forward funguje).
3. ✅ Tab „Stránky" obsahuje každou skutečně existující stránku platformy (viz §3 audit), s jasným ✅/🚧 stavem.
4. ✅ Tab „Role & oprávnění" obsahuje globální role tabulku + akční matici + světové role tabulku.
5. ✅ Stránka funguje **pro anon i logged-in** (anon nesmí dostat 401/redirect).
6. ✅ Žádné hardcoded barvy — vše přes `var(--*)` tokeny (`lint:colors` projde).
7. ✅ Responzivní: na 360 px se obsah neoříznul, tabulky scrolují, tabs scrollují.
8. ✅ Žádný 21 themů nemá rozbitý vzhled — vizuální smoke přes Storybook gallery (frontend-design audit).
9. ✅ TS bez errors, `lint`, `test:run`, `build` projde.
10. ✅ Odkazy z nápovědy na stránky (`/ikaros/profil`, `/ikaros/uzivatele`, ...) jsou klikatelné `<Link>` z react-router.

---

## 7. Test plán

**Automated:**
- `HelpPage.spec.tsx` — render 5 tabů, switch tab → URL update, click section anchor → scroll.
- Snapshot 5 sekcí (smoke že obsah existuje).
- `lint`, `lint:colors`, `test:run`, `build`.

**Manuální smoke:**
- Otevři `/ikaros/napoveda` anon → vidí 5 tabů, žádný redirect.
- Otevři přihlášený jako Hrac → identický view, žádné chybějící informace.
- Otevři jako Admin/Superadmin → identický view (admin sekce čte jako reference, ne action).
- Switch všech 5 tabů → URL `?sekce=` se mění.
- Mobile 360 px → tabs scrollovatelné, tabulky scrollovatelné.
- Procházet 21 motivů přes Theme switcher → žádný motiv nerozbije layout (frontend-design audit).
- Refresh na `?sekce=role` → načte rovnou tab Role.

---

## 8. Riziko & rollback

| Riziko | Pravděp. | Mitigace |
|--------|----------|----------|
| Obsah rychle zastará (přidá se feature, nápověda se nezaktualizuje) | Vysoká | Sekce „Stránky" má jasný ✅/🚧 vizuál — chybějící update se snadno všimne při review. Do PR check listu fáze 1.5/1.7/1.8/2.x/3.x přidat „aktualizovat HelpPage". (D-NEW.) |
| Tabulky rolí na mobilu nečitelné | Střední | `overflow-x: auto` + sticky první sloupec. Otestovat na 360 px. |
| Téma rozbije ornament/typografii | Nízká | Žádné dekorace, žádné fixní px barev. Frontend-design audit před PR. |
| Anon vidí příliš implementační detaily (např. „D-001") | Nízká | Striktní textový review — žádné kódy dluhů, jen uživatelské formulace. |

**Rollback:** vrátit `HelpPage.tsx` na stub (3 řádky). Žádné jiné soubory nemění. Bezpečný rollback.

---

## 9. Otázky k autorovi

Delegováno na agenta, autor předem zvolil:

- ✅ **Tab pattern** místo lineární scroll-only stránky.
- ✅ **Anon i logged-in** vidí stejný obsah (žádné gating).
- ✅ **Nedokumentovat nedefinované role** (Ctenar/Zadatel/Ikarus/Korektor) — jen krátká poznámka „v přípravě".
- ✅ **Připravované stránky** zmínit jen jednou větou se štítkem 🚧.
- ✅ **Žádné nové theme tokeny** ani CornerOrnament — long-form text.
- ✅ **Generický text** ale s `<Link>` na konkrétní stránky pro logged-in (anon vidí stejný link → klikne → redirect na login modal podle `requireAuth`).
- ✅ **Reset hesla v FAQ** přiznáme jako neimplementované + kontakt na admina.

---

**Po schválení specu navazuje:**
1. `frontend-design` audit (vizuální review, návrh sekcí + tabů v rámci 21 motivů).
2. `plan-3.6.md` — přesné CLI / file diffs / pořadí souborů.
3. Implementace.
