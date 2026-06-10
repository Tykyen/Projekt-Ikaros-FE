# Spec 1.4 — Adresář uživatelů + Veřejný profil

**Datum:** 2026-05-12
**Status:** ✅ Schváleno 2026-05-12
**Roadmap:** `docs/roadmap-fe.md` → Fáze 1 → 1.4
**Závisí na:** 1.3a (rozšířené `/users/me`) ✅, 1.3b (role + admin UI) ✅, 1.3c (tombstone) ✅
**Předchází:** 1.5 (presence — online indikátor v adresáři), 1.8 (Přátelé — tlačítko z veřejného profilu)
**Souvisí s:** D-029 (detail link 1.4 — admin UI dnes vede na `#`), D-040 (tombstone integrace — adresář musí zobrazit smazané korektně)

---

## 1. Cíl

1.4 staví **jednu unifikovanou stránku** `/ikaros/uzivatele` se třemi taby, kde obsah a viditelnost tabů je **role-aware**. Doplňuje **veřejný read-only profil** `/ikaros/uzivatel/:id` pro každého přihlášeného.

### 1.1 Struktura stránky `/ikaros/uzivatele`

Horní taby (zleva doprava):

| Tab            | Obsah                                                                       | Kdo vidí                                  |
| -------------- | --------------------------------------------------------------------------- | ----------------------------------------- |
| **Přátelé**    | grid karet vlastních přátel (naplní se po akceptovaných žádostech)          | **všichni přihlášení** (default neadmin)   |
| **Uživatelé**  | adresář všech uživatelů (karty / tabulka view-toggle, search, filtry)        | **jen Admin / Superadmin** (default admin) |
| **Zpracovat**  | role-specific **inbox akcí** (žádosti / pending content) — **polymorfní**    | **všichni přihlášení**                     |
| **Audit**      | read-only historie admin akcí (přesun z 1.3b)                                | **jen Admin / Superadmin**                 |

Admin/Superadmin vidí **4 taby**, ostatní role **2 taby** (Přátelé + Zpracovat).

### 1.2 Princip „Zpracovat" tabu — univerzální action queue

**Pravidlo platformy:** *Cokoliv, co vyžaduje rozhodnutí příjemce (potvrdit / odmítnout / schválit / přijmout / banovat), jde do Zpracovat tabu této role.* Pošta (3.5) = konverzace a informativní zprávy. **Zpracovat = aktionovatelné žádosti** — fronta s rozhodováním. **Audit log není v Zpracovat** — read-only historie patří do samostatného tabu „Audit" (jen Admin/Superadmin).

Tab Zpracovat je **agregátor heterogenních queue typů**. Každá nová akceptační workflow napříč platformou se sem připojí — žádný separátní notification subsystem.

**Snapshot per role pro 1.4 a navazující fáze:**

| Role               | Položky ve Zpracovat (postupně)                                                                                                       | V 1.4                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Hrac**           | žádosti o přátelství (1.8); žádosti o přidání do uzamčené diskuze (3.4); pozvánky do soukromé diskuze                                  | kostra + placeholder           |
| **PJ**             | žádosti o přátelství (1.8); **žádosti o vstup do světa** vlastního světa (2.4); žádosti o přidání do diskuze v rámci světa (6.x)      | kostra + placeholder           |
| **SpravceClanku**  | pending články ke schválení (3.2)                                                                                                     | kostra + placeholder           |
| **SpravceGalerie** | pending obrázky ke schválení (3.3)                                                                                                    | kostra + placeholder           |
| **SpravceDiskuzi** | hlášené příspěvky / pending diskuze (3.4)                                                                                             | kostra + placeholder           |
| **Admin / Superadmin** | **vše výše** + username requests (z 1.3b) + audit log (D-024) + budoucí: GDPR export requests, ban appeals, deletion-revert requests | **funkční** (přesun z 1.3b)     |

Pravidlo se vztahuje na **všechny role současně** — uživatel se Spravce* rolí má své Spravce queue **a zároveň** osobní queue (žádosti o přátelství). Admin/Superadmin je super-set.

Tab má badge = suma pending napříč všemi sub-sekcemi pro danou roli.

**Architektonický důsledek (pro 1.8/2.4/3.x):** každá nová žádost-typ musí dostat (a) typ záznamu v BE, (b) viditelnost pro správnou roli, (c) renderer karty v Zpracovat tabu. Spec 1.4 staví **kostru kontejneru**, ne queue typy — ty přidávají jejich fáze.

### 1.3 Naplnění tabu Přátelé

Tab Přátelé je **prázdný** dokud uživatel nemá akceptované přátele. Workflow:
1. A pošle žádost B (vstupní bod: budoucí 1.8 — z public profilu, později z chatu/článků)
2. B uvidí žádost ve svém **Zpracovat** tabu
3. B přijme → vznikne přátelství → A i B uvidí toho druhého v **Přátelé** tabu

Plnou logiku staví 1.8. V 1.4 jen kostra (empty state „Zatím nemáš přátele. Jakmile někdo přijme tvou žádost, objeví se tady.").

### 1.3 Veřejný profil

`/ikaros/uzivatel/:id` — read-only zrcadlo vlastního profilu (1.3a) bez citlivých polí (email, lastLoginAt, themeId, chatColor, ban/delete metadata). Dostupný **každému přihlášenému**. Vstupní body z 1.4: karta v Adresáři (admin), karta v Přátelích (každý). Budoucí vstupní body: avatar autora v chatu (4.x), článcích (3.2), galerii (3.3), diskuzích (3.4) — 1.4 jen poskytne route + komponentu, ostatní fáze linkují.

### 1.4 Pravý panel (Administrace)

Kolonka má **adaptivní label podle role**, cíl stejný:

| Role                                                                | Label                  | Cíl                         | Default tab | Počet tabů |
| ------------------------------------------------------------------- | ---------------------- | --------------------------- | ----------- | ---------- |
| Admin / Superadmin                                                  | **„Uživatelé"**        | `/ikaros/uzivatele`         | Uživatelé   | 4          |
| SpravceClanku / SpravceGalerie / SpravceDiskuzi / PJ / Hrac          | **„Přátelé"**          | `/ikaros/uzivatele`         | Přátelé     | 2          |

Volitelně badge u labelu = počet pending položek v Zpracovat (signál „máš tu něco k vyřešení").

---

## 2. Rozsah

### 2.1 V rozsahu 1.4

**BE — nové endpointy:**
- `GET /api/users` — paginovaný adresář (auth + RoleGuard Admin/Superadmin)
  - query: `page` (default 1), `limit` (default 24, max 60), `search`, `sort` (`new` | `abc`), `includeDeleted` (admin only)
  - response: `{ items: PublicUserListItem[], total: number }`
  - default filtrace: vylučuje `isDeleted: true` a `deletionRequestedAt != null`
  - `?includeDeleted=1` → vrací s flagem `pendingDeletion`/`deleted`
- `GET /api/users/:id` — veřejný profil (auth, bez role gate)
  - response: `PublicUserProfile`
  - 404 pro běžné uživatele pokud user neexistuje / `isDeleted` / `deletionRequestedAt`
  - Admin/Superadmin: 200 + flag `pendingDeletion`/`deleted` (moderation lookup)

**Shape `PublicUserListItem` (DTO):**
```ts
{
  id: string;
  username: string;
  displayName: string | null;
  city: string | null;
  avatarUrl: string | null;       // pokud chybí, FE fallback na defaultAvatarType
  defaultAvatarType: 'male' | 'female' | 'being';
  role: UserRole;                 // pro budoucí indikaci PJ/Admin chip
  worldsCount: number;            // agregát z 1.3a
  createdAt: string;              // ISO — „člen od"
  // 1.5: bude doplněno o online: boolean
  // 1.3c admin view only:
  pendingDeletion?: boolean;
  deleted?: boolean;
}
```

**Shape `PublicUserProfile` (DTO):**
```ts
{
  id: string;
  username: string;
  displayName: string | null;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  defaultAvatarType: 'male' | 'female' | 'being';
  characterName: string | null;
  characterBio: string | null;
  characterAvatarUrl: string | null;
  role: UserRole;
  worldsCount: number;
  createdAt: string;
  // EXPLICITNĚ NIKOLIV: email, emailVerified, lastLoginAt, themeId, chatColor,
  // bannedAt, deletionRequestedAt, ban/delete metadata, refresh tokens, …
}
```

**Rozhodnutí o privacy (default veřejné):**
- `username`, `displayName`, `city`, `bio` — veřejné
- avatar + character — veřejné
- `worldsCount` jako číslo (ne seznam světů ani role v nich — to je privacy citlivé, dořeší 5.x)
- `createdAt` jako „člen od" — veřejné
- `chatColor` — **NE** ve veřejném profilu (interní vizuál v chatu, ne profilový atribut)
- `themeId` — **NE** (osobní preference)
- `email`, `lastLoginAt` — **NE**

**FE:**

#### `/ikaros/uzivatele` — sjednocená stránka (3 taby, role-aware)
- Route gated: `requireAuth` (anon → login). **Bez RoleGuard** — každý přihlášený dostane aspoň tab Přátelé.
- Page komponenta: `UsersPage` (refactor stávajícího `AdminUsersPage` z 1.3b — viz §9).
- Top tabs (zleva): **Přátelé** / **Uživatelé** / **Zpracovat** / **Audit** — viditelnost per role (§1.1 tabulka)
- Default tab podle role (viz §1.4 tabulka v §1).
- URL: `?tab=pratele|uzivatele|zpracovat|audit`. Sub-state per tab (search, sort, page) v dalších query params.
- Page title v hlavičce stránky: **dynamický** podle aktivního tabu („Přátelé" / „Uživatelé" / „Zpracovat" / „Audit").

##### Tab „Přátelé" (kostra 1.4, funkčnost 1.8)
- Viditelný pro **všechny role**, default tab pro neadmin.
- V 1.4: **placeholder grid** s hláškou „Seznam přátel bude funkční s krokem 1.8" + miniukázka prázdného state (žádné akce).
- V 1.8: žádosti (příchozí/odeslané), seznam akceptovaných přátel, akce „Přidat", „Přijmout", „Odmítnout", „Odebrat".

##### Tab „Uživatelé" (1.4)
- Viditelný **jen Admin/Superadmin**. Skrytý jinak (žádné 403 — tab proste neexistuje v menu).
- Reuse view-toggle z §3.1: **Karty** (adresářový mód) + **Tabulka** (existující `UsersTable` z 1.3b).
- Search input (debounced 300ms) — placeholder „Hledat podle přezdívky nebo jména…", sdíleno přes oba view módy.
- Sort toggle „Nejnovější / Abecedně" (default Nejnovější) — platí pro Karty view; Tabulka má vlastní column sort.
- Filtry z 1.3b (`UsersFilters` — role, hasPendingRequest) zůstávají dostupné v obou módech.
- Toggle „Zobrazit smazané" (`?includeDeleted=1`) — overlay v kartě / sloupec status v tabulce.
- Grid (Karty mód): desktop ≥1024px 4 sl., tablet 3 sl., mobil 2 sl.
- Karta uživatele — viz §5.1.
- Klik na kartu (mimo kebab) → `/ikaros/uzivatel/:id`.
- Kebab menu na kartě (§3.4) — Otevřít profil / Změnit roli / Banovat / Smazat účet / Otevřít v tabulce (reuse modaly 1.3b).
- Paginace (24 karet / stránka).
- Skeleton / Empty / Error state.

##### Tab „Zpracovat" (1.4 + budoucí rozšíření)
- Viditelný **všem přihlášeným**. Obsah polymorfní podle role (viz §1.2 tabulka).
- **V 1.4 obsah per role:**
  - **Admin / Superadmin:** sekce „Žádosti o username" (přesun z 1.3b „Žádosti" tabu). Aktivní, funkční. **Audit log je samostatný tab** (viz níže).
  - **SpravceClanku / Galerie / Diskuzi:** placeholder „Schvalování / moderace bude dostupné s krokem 3.x". Tab viditelný, prázdný state s hláškou.
  - **PJ:** placeholder „Žádosti o vstup do tvých světů a žádosti o přátelství budou dostupné s 2.4 / 1.8".
  - **Hrac:** placeholder „Žádosti o přátelství budou dostupné s 1.8".
- **Budoucí rozšíření (1.8, 2.4, 3.x):** každá role dostane svůj live queue. Admin/Superadmin je superset (vidí všechno).
- Badge s počtem pending = suma napříč sub-sekcemi pro danou roli.

##### Tab „Audit" (1.4 — přesun z 1.3b)
- Viditelný **jen Admin/Superadmin**.
- Reuse `AuditLogTab` komponenty z 1.3b bez funkčních změn (D-024 audit log).
- Read-only historie admin akcí (role change, ban/unban, delete, username approve/reject, …).
- Filtry: action type, actor, target, paginace.
- **Důvod oddělení od Zpracovat** (audit rozhodnutí §12.1 (b)): Zpracovat = actionable queue, Audit = read-only historie. Princip jednotnosti tabu.

#### `/ikaros/uzivatel/:id` — Veřejný profil (page)
- Route gated: `requireAuth`. Já nebo cizí — stejná URL, ale pokud `id === me.id` zobrazí se banner „Toto je tvůj veřejný profil — upravit můžeš v [Nastavení profilu](/ikaros/profil)".
- Layout zrcadlí 1.3a (`ProfilePage`) bez edit režimu:
  1. **Header karta** (avatar, username, displayName, město, „člen od", worldsCount, role chip)
  2. **Sekce „Něco o mně"** — bio (pokud prázdné → sekce skrytá)
  3. **Sekce „Postava v Rozcestí"** — characterName + characterBio + characterAvatar (pokud prázdné → sekce skrytá)
  4. **Footer akce** (1.4):
     - „Napsat zprávu" — **disabled placeholder** (přijde v 3.5)
     - „Přidat do přátel" — **disabled placeholder** (přijde v 1.8)
     - „Otevřít v administraci" — **jen pro Admin/Superadmin** → link na `/admin/uzivatele?focus=:id` (vyřeší D-029 — nebo zatím no-op s tooltipem, viz §3.4)
- 404 stránka pokud BE vrátí 404 (uživatel neexistuje / je tombstone / pending delete) — reuse `NotFoundPage` s textem „Tento uživatel neexistuje nebo byl odstraněn."
- **Admin výjimka:** pokud admin otevře profil tombstone účtu, ukáže se s overlay banneru „⚠ Účet smazán" / „⚠ Pending mazání" + `<UserAvatar deleted />` z 1.3c.

#### Vstupní body (entry points)
- **Pravý panel ADMINISTRACE — jednotná URL pro všechny role:**
  - Admin/Superadmin: kolonka **„Uživatelé"** → `/ikaros/uzivatele?tab=uzivatele` (default tab Uživatelé)
  - SpravceClanku/Galerie/Diskuzi: kolonka **„Přátelé"** → `/ikaros/uzivatele?tab=pratele`
  - PJ/Hrac: kolonka **„Přátelé"** → `/ikaros/uzivatele?tab=pratele`
- **Hlavička:** beze změny. Header link „PŘÁTELÉ / UŽIVATELÉ" z 1.1 cílí na `/ikaros/uzivatele` (default tab podle role).
- **Veřejný profil** dostupný každému přihlášenému přes `/ikaros/uzivatel/:id` — v 1.4 vstupní body jen z karet (Přátelé tab v 1.8, Uživatelé tab v 1.4). Z chatu/článků atd. linkují budoucí fáze.

### 2.2 Mimo rozsah 1.4

- **User-facing adresář všech uživatelů** — záměrně nepovolen. Běžný uživatel browsing platformy nedostane (privacy decision). Tab „Uživatelé" je skrytý.
- **Plnohodnotná funkčnost tabu Přátelé** — 1.4 staví jen kostru tab + placeholder; logiku přátelských vazeb (žádosti, accept, block) řeší 1.8.
- **Funkční Zpracovat pro Spravce\*** — 1.4 staví jen kostru + placeholder; obsah řeší 3.2 (články), 3.3 (galerie), 3.4 (diskuze).
- **Samostatná URL `/ikaros/pratele`** — sjednoceno do `/ikaros/uzivatele?tab=pratele`. Roadmap 1.8 dostane korekci (Přátelé není samostatná stránka, ale tab).
- **Online indikátor** v kartě/profilu — 1.5 (presence).
- **Tlačítko „Přidat do přátel"** funkční — 1.8.
- **Tlačítko „Napsat zprávu"** funkční — 3.5 (pošta).
- **Filter podle světa** — 5.x.
- **Sort podle aktivity** (poslední přihlášení) — privacy citlivé, odlož.
- **Export seznamu** — odlož.

---

## 3. Otevřená rozhodnutí (k odsouhlasení)

### 3.1 Karty vs. Tabulka uvnitř tabu „Uživatelé"

Stávající tab z 1.3b je tabulka (`UsersTable` — sloupce, bulk checkboxy, řazení, akce). Nový adresář (1.4) = grid karet pro rychlý vizuální lookup. Jsou to dvě prezentace stejných dat.

**Doporučení (A) — view-toggle uvnitř tabu Uživatelé:**
- Segmented control v hlavičce tabu: **`▦ Karty` | `≡ Tabulka`** (default **Karty** — rychlý vizuální lookup, primární use-case dle uživatele „rychle nacházet, aby s nimi mohli pracovat")
- Tabulka zůstává plně funkční pro hromadné akce + řazení sloupců
- Karty = vizuální lookup + per-card kebab (akce reuse modaly z 1.3b)
- Search + filtry sdílené pro oba módy
- URL drží `?view=cards|table`
- **Plus:** jeden zdroj pravdy. **Minus:** dvě prezentační komponenty (čitelný kód, větší soubor).

**Alternativa (B) — nahradit tabulku kartami:** ztrácí bulk akce (regrese 1.3b). NE.

**Alternativa (C) — karty default, tabulka jako sub-tab „Detailní pohled":** funkčně podobné A, ale méně objevitelné.

**Já doporučuji A.**

→ **Otázka:** A / B / C?

### 3.2 Viditelnost role chipu v adresáři

Mám zobrazovat role chip (PJ, Admin, Superadmin, PomocnyPJ) v public kartě, nebo jen username + jméno + město + worldsCount?

- **Pro chip:** transparentní komunita, hráč vidí, kdo je „autorita".
- **Proti:** roste šum, většina je `Hrac` (= žádný chip, OK), ale chip pro PJ/PomocnyPJ je **per-world** — `User.role` v Ikaros vrstvě je platforma-wide, role v konkrétním světě je v WorldMember (5.x). V 1.4 tedy chip ukáže jen platforma-wide role (Admin/Superadmin/SpravceClanku/SpravceGalerie/SpravceDiskuzi).
- **Doporučení:** chip **ANO**, ale jen pokud `role !== Hrac && role !== PJ` (PJ je per-world, v Ikaros vrstvě nedává smysl). To znamená Admin/Superadmin a tři Spravce role.

→ **Otázka:** ANO chip / NE chip / jiný subset rolí?

### 3.3 Default avatar fallback v listu

Když uživatel nemá `avatarUrl`, použijeme `<UserAvatar />` s fallbackem na `defaultAvatarType` (male/female/being) — to už funguje z 1.3a, **bez nového kódu**.

→ Bez otázky, kontinuita s 1.3a.

### 3.4 Per-card rychlé akce + uzavření D-029

V adresářové kartě admin potřebuje rychlou cestu k akcím. Dvě varianty:

- (a) **Kebab menu na kartě** s akcemi: „Otevřít veřejný profil" → `/ikaros/uzivatel/:id`, „Změnit roli", „Banovat", „Smazat účet", „Otevřít v tabulce" → přepne na Tabulka view + focus řádku. Reuse modaly z 1.3b (`AdminBanModal`, `AdminDeleteUserModal`, role dropdown).
- (b) **Jen primární akce „Otevřít profil"** → `/ikaros/uzivatel/:id`, ostatní akce zůstávají v tabulce. Karta je čistě read-only lookup.

D-029 (admin link „detail uživatele dnes vede na `#`") se uzavře v obou variantách:
- (a) přímo přes kebab akce
- (b) přes adresářovou kartu → „Otevřít profil" + na veřejném profilu admin button „Otevřít v tabulce" → admin Uživatelé tab s focus query (`?focus=:id`)

**Doporučení:** (a) — kebab s plnou sadou akcí. Konzistentní s frází uživatele „rychle nacházet uživatele, aby s nimi mohli pracovat" — akce přímo z karty bez přeskoku do tabulky.

→ **Otázka:** (a) / (b)?

### 3.5 Self-profile redirect chování

Když uživatel klikne na svou kartu v adresáři / přejde na `/ikaros/uzivatel/<svoje-id>`:
- (a) zobrazí veřejný profil s informačním bannerem „Toto je tvůj veřejný profil — upravit můžeš v [Nastavení](/ikaros/profil)"
- (b) automaticky redirectne na `/ikaros/profil`

**Doporučení:** (a) — uživatel chce vidět, jak ho vidí ostatní (běžné UX vzor, viz LinkedIn „View as").

→ **Otázka:** (a) / (b)?

### 3.6 URL strategie — sjednocení vs. samostatné `/ikaros/pratele`

Roadmap 1.8 dnes plánuje `/ikaros/pratele` jako samostatnou stránku. Nový framing 1.4 ji sjednocuje do `/ikaros/uzivatele?tab=pratele`.

- (a) **Sjednotit** — jen `/ikaros/uzivatele`, query `?tab=...`. Roadmap 1.8 koriguje (Přátelé = funkčnost tabu, ne stránka).
- (b) **Alias** — obě URL platí, `/ikaros/pratele` redirect na `/ikaros/uzivatele?tab=pratele`. Zachovává mentální model „mám stránku přátel".
- (c) **Dvě stránky** — `/ikaros/pratele` zůstane samostatná stránka (1.8), `/ikaros/uzivatele` má jen Uživatelé + Zpracovat taby (jen pro role co je vidí). Vrátí 403 pro role co nemají žádný tab.

**Doporučení:** (a) — jediný kanonický URL. Pravý panel link cílí na stejné URL pro všechny role, jen default tab se liší. Konzistentní s tvým návrhem „překlikávací s 3 variantami".

→ **Otázka:** (a) / (b) / (c)?

### 3.7 Tab „Zpracovat" — viditelnost a obsah v 1.4

Univerzální tab pro všechny role, polymorfní obsah. Otázka, jak v 1.4 vypadá pro role, jejichž content jiných fázích.

- (a) **Tab viditelný všem, placeholder per role** (kromě Admin/Superadmin = funkční). Hrac/PJ/Spravce\* uvidí prázdný state s hláškou „X bude dostupné s krokem Y". **Jednotná navigační struktura napříč rolemi od 1.4.**
- (b) **Tab skrytý do 3.x/1.8/2.4** — viditelný jen Admin/Superadmin v 1.4. Postupně se zapíná s implementací příslušné funkcionality. **Žádné prázdné placeholdery.**
- (c) **Tab viditelný všem, hlášení o nadcházející funkčnosti** (mezi a a b) — zobrazí roadmap entry („Brzy: žádosti o přátelství → 1.8") s timeline.

**Doporučení:** (a) — Spravce*/PJ/Hrac uvidí tab hned s placeholderem. Uživatel chápe, kde bude jeho inbox akcí žít. Konzistentní s tvým návrhem „překlikávací s 3 variantami". Spec-driven communication: viditelná kostra > neviditelná budoucnost.

→ **Otázka:** (a) / (b) / (c)?

### 3.8 1.4 vs. 1.8 dělba pro tab Přátelé

- 1.4 staví v tabu Přátelé **kostru** — empty state, placeholder card grid, hlášku „Plnohodnotný seznam přátel přijde v 1.8". Žádná logika.
- 1.8 staví **plnou funkčnost** — BE `Friendship` entita + endpointy, FE žádosti/přátele/akce, badge příchozí, websocket invalidace.

→ Bez otázky, princip „kostra → naplnění" konzistentní s ostatními fázemi.

---

## 4. Akceptační kritéria

**Stránka `/ikaros/uzivatele` — tab visibility per role:**
- [ ] Anon → redirect na úvodník s `?openLogin=1`.
- [ ] Hrac, PJ → vidí Přátelé + Zpracovat. Pokus o `?tab=uzivatele|audit` → toast „Nemáš oprávnění" + redirect na `?tab=pratele`.
- [ ] SpravceClanku/Galerie/Diskuzi → vidí Přátelé + Zpracovat. Tab Uživatelé i Audit skrytý.
- [ ] Admin/Superadmin → vidí všechny 4 taby (Přátelé / Uživatelé / Zpracovat / Audit). Default tab `uzivatele`.

**Tab Přátelé (kostra, 1.4):**
- [ ] Default tab pro neadmin role.
- [ ] V 1.4 placeholder grid s hláškou „Funkčnost přátel přijde v kroku 1.8".

**Tab Uživatelé (Admin/Superadmin, 1.4):**
- [ ] View-toggle `▦ Karty | ≡ Tabulka` v hlavičce, URL drží `?view=cards|table`, default `cards`.
- [ ] Search input (300ms debounce), sdíleno mezi oběma view módy.
- [ ] Sort toggle „Nejnovější / Abecedně" (default Nejnovější) — karty mód; tabulka má svůj column sort.
- [ ] Paginace 24 karet / stránka, URL drží `?page=N&search=…&sort=…&view=…`.
- [ ] Toggle „Zobrazit smazané" → `?includeDeleted=1` → karty/řádky s overlay `pendingDeletion`/`deleted`.
- [ ] Click na kartu (mimo kebab) → `/ikaros/uzivatel/:id`.
- [ ] Kebab akce (§3.4 a): Otevřít profil / Změnit roli / Banovat / Smazat účet / Otevřít v tabulce — reuse modaly z 1.3b.
- [ ] Role chip pro Admin/Superadmin/SpravceClanku/SpravceGalerie/SpravceDiskuzi (§3.2).
- [ ] Responzivní: desktop 4 sl., tablet 3 sl., mobil 2 sl.
- [ ] Theme tokens — žádné hardcoded barvy, projde `lint:colors`.

**Tab Zpracovat (1.4):**
- [ ] Admin/Superadmin: sekce Žádosti o username (přesun z 1.3b). Badge u tabu = počet pending requestů.
- [ ] SpravceClanku/Galerie/Diskuzi: placeholder dle §3.7 doporučení (a).
- [ ] PJ/Hrac: placeholder „Žádosti o přátelství budou dostupné s 1.8".

**Tab Audit (1.4 — jen Admin/Superadmin):**
- [ ] Reuse `AuditLogTab` z 1.3b bez funkčních změn.
- [ ] Filtry: action, actor, target; paginace 20/stránka.
- [ ] Ostatní role: tab není v nav menu, `?tab=audit` → redirect na default tab role.

**Veřejný profil `/ikaros/uzivatel/:id`:**
- [ ] Přihlášený uživatel otevře profil libovolného existujícího uživatele a vidí jeho header + bio + character (skrytá pokud prázdné).
- [ ] Sekce „Něco o mně" a „Postava v Rozcestí" se skrývají, pokud jsou prázdné.
- [ ] Veřejný profil **nezobrazí** email, lastLoginAt, chatColor, themeId, bannedAt, deletionRequestedAt.
- [ ] Self-profile zobrazí banner „Toto je tvůj veřejný profil…" + link na `/ikaros/profil` (rozhodnutí §3.5).
- [ ] „Napsat zprávu" a „Přidat do přátel" jsou disabled s tooltipem („Připravujeme — 3.5" / „Připravujeme — 1.8").
- [ ] Admin vidí navíc tlačítko „Otevřít v administraci" → `/admin/uzivatele?focus=:id` (rozhodnutí §3.4).
- [ ] 404 stránka při neexistujícím / tombstone / pending-delete uživateli pro běžné uživatele; admin vidí s overlay.

**BE:**
- [ ] `GET /api/users` — RoleGuard Admin/Superadmin + requireAuth.
- [ ] `GET /api/users/:id` — requireAuth (bez role gate), vrací `PublicUserProfile`.
- [ ] Default filtrace tombstone + pending-deletion; admin výjimka `?includeDeleted=1`.
- [ ] Default sort: `createdAt` DESC.
- [ ] Search: case-insensitive substring na `usernameLower` + `displayName.toLowerCase()` (Mongo `$regex` nebo text index — viz impl. plán).
- [ ] Pagination guards: `page >= 1`, `limit ∈ [1, 60]`.
- [ ] Throttle: 60 req/min/IP.
- [ ] Test ověří, že `GET /api/users/:id` response **neobsahuje** `email`, `lastLoginAt`, `themeId`, `chatColor`, `bannedAt`, `deletionRequestedAt`, `passwordHash`, `refreshTokens`.

---

## 5. UX/UI

### 5.1 Karta v adresáři (anatomie)

```
┌───────────────────────┐
│ [avatar 80]      ⋮    │  ← kebab menu (admin akce, pokud §3.4 = a)
│                       │
│   tyky_tan_junior     │  ← username (bold)
│   Tyky Tan Junior     │  ← displayName (subtle)
│                       │
│   📍 Praha            │  ← město (icon + city) — pokud existuje
│   ⚜ Superadmin       │  ← role chip — pokud role != Hrac
│   🌍 4 světy          │  ← worldsCount
│                       │
│ ⚠ DELETION PENDING   │  ← jen při includeDeleted=1 (status overlay)
└───────────────────────┘
```

Click na kartu (mimo kebab) → `/ikaros/uzivatel/:id`. Detailní layout řeší frontend-design audit (krok mezi spec → impl. plán).

### 5.2 Veřejný profil — layout

Layout-wise zrcadlí `/ikaros/profil` (1.3a), ale **bez edit afek**:
- Header karta — všechna pole read-only
- BioSection — read-only, prázdné se skrývá
- CharacterSection — read-only, prázdné se skrývá
- WorldsSection — **v 1.4 nepřítomná** (privacy + technika 5.x), místo ní jen aggregát v header kartě „X světů"
- Footer akce (poslední sekce) — placeholder buttony 1.8/3.5 + admin „Otevřít v administraci"

### 5.3 Role chip — vizuální tokeny

Role-specific barvy z theme tokenů (žádné hardcoded):
- Superadmin → `var(--role-superadmin)` (nebo nový alias, definice v impl. plánu)
- Admin → `var(--role-admin)`
- SpravceClanku/Galerie/Diskuze → `var(--role-spravce)`
- Hrac → bez chipu

Frontend-design audit dořeší přesné tokeny + zda chip rozlišovat ikonou nebo barvou.

---

## 6. Datový model

**Žádné nové DB entity.** Pouze nové DTO a endpointy nad existující `User` entitou.

DTOs (BE):
- `PublicUserListItemDto`
- `PublicUserProfileDto`
- `PublicUsersQueryDto` (`page`, `limit`, `search`, `sort`)

FE typy:
- `PublicUserListItem`
- `PublicUserProfile`
- `PublicUsersQuery`

---

## 7. API kontrakt

```
GET /api/users?page=1&limit=24&search=tyky&sort=new[&includeDeleted=1]
  → 200 { items: PublicUserListItem[], total: number }
  → 401 NOT_AUTHENTICATED
  → 403 FORBIDDEN (jen Admin/Superadmin)

GET /api/users/profile/:id
  → 200 PublicUserProfile
  → 401 NOT_AUTHENTICATED
  → 404 USER_NOT_FOUND (pro běžné usery, i pro tombstone/pending; admin přes výjimku vrátí 200 + flag)

GET /api/pending-actions/count
  → 200 { total: number }
  → 401 NOT_AUTHENTICATED

GET /api/pending-actions?type=<PendingActionType>&page=1&limit=20
  → 200 { items: unknown[], total: number }
  → 401 NOT_AUTHENTICATED
  → 400 invalid type
```

**Pozn.:** Veřejný profil dostal URL `/users/profile/:id` (ne `/users/:id`) kvůli koexistenci s admin detail endpointem `/users/:id`, který historicky existuje s admin-only data shape. 1.4 implementace ponechává historický endpoint nedotčený.

**Throttle:** 60/min/IP (konzistence s `/api/auth/check-username`).

**Cache strategie:** TanStack Query `staleTime: 30s` pro list, `staleTime: 60s` pro detail.

---

## 8. Testy

**BE:**
- Unit: `UsersController.list()` — filtrace tombstone + pending-deletion + search + pagination guards
- Unit: `UsersController.publicProfile(:id)` — 404 pro tombstone, 200+flag pro admin
- E2E: anon → 401, regular → 200 sans email/lastLoginAt, admin → vidí pending

**FE:**
- `usePublicUsers.spec.ts` — query params serializace
- `usePublicUserProfile.spec.ts` — 404 handling
- `UsersDirectoryPage.spec.tsx` — search debounce, sort toggle, paginace, empty/error state
- `PublicUserProfilePage.spec.tsx` — self banner, disabled placeholder buttons, admin „Otevřít v administraci"
- `UserCard.spec.tsx` — role chip rendering, fallback avatar, prázdné město

---

## 9. Žádná URL migrace

`/ikaros/uzivatele` zůstává admin-only (Admin/Superadmin). Stávající routing v `src/app/router.tsx` se nemění, RightPanel link beze změny. Veškerá změna se odehrává **uvnitř** existující `AdminUsersPage` (přidání view-toggle / nového tabu — viz §3.1).

Co se mění mimo `AdminUsersPage`:
- Nová route `/ikaros/uzivatele/:id` (resp. `/ikaros/uzivatel/:id` — již v routeru jako stub) dostane plnohodnotnou `PublicUserProfilePage`.
- BE: nové DTO + endpointy `GET /api/users`, `GET /api/users/:id`.

---

## 10. Bezpečnost / privacy

- **Public endpointy nesmí vracet citlivá pole.** Test E2E ověří, že response neobsahuje `email`, `lastLoginAt`, `themeId`, `chatColor`, `bannedAt`, `deletionRequestedAt`, `passwordHash`, `refreshTokens`.
- **Tombstone účty mizí z public view.** Memory `D-040` říká, že tombstone se integruje až ve fáze 3.x/6.x do obsahu. V 1.4 striktně: žádný tombstone v public adresáři.
- **Rate limiting** na obou endpointech (60/min/IP).
- **Žádné PII v URL** — pouze `id`. Search query je v URL (`?search=…`), ale to je vlastní zadání uživatele, ne PII jiné osoby.

---

## 11. Tracked dluhy / následky

- **D-029** se uzavře, pokud schválíme §3.4 (a).
- **D-040** dostane jasný princip: tombstone v public adresáři nezobrazovat, řešit per-obsah.
- Nový dluh návrh:
  - **D-044** — search index (Mongo text index) pro `/api/users` pokud user base přeroste 10k a regex bude pomalý. Zatím regex stačí.
  - **D-045** — privacy toggle „skrýt mě v adresáři" (uživatel chce být v platform, ale ne v listu) — diskuse pro 1.7+.

---

## 12. Návaznosti — každá fáze, která má queue typ, ho připojí do Zpracovat tabu

- **1.5 Presence** — doplní `online: boolean` do `PublicUserListItem` + indikátor v kartě i headeru profilu. **Nesouvisí se Zpracovat.**
- **1.8 Přátelé** — naplní Přátelé tab (BE `Friendship` modul, endpointy, websocket invalidace); **přidá queue typ „friend_request" do Zpracovat tabu příjemce** (renderer karty: avatar + username žadatele + tlačítka Přijmout / Odmítnout). Není samostatná stránka `/ikaros/pratele`.
- **2.4 Detail světa + join flow** — pro private světy: žádost o vstup **nepoužívá samostatné UI**, ale vstupuje do Zpracovat tabu PJ vlastníka světa jako queue typ „world_join_request" (renderer: avatar žadatele + název světa + tlačítka Přijmout / Odmítnout).
- **3.2 Články** — pending článek čekající na schválení **vstupuje do Zpracovat tabu SpravceClanku** jako queue typ „article_pending_review" (renderer: náhled článku + tlačítka Schválit / Vrátit s poznámkou / Odmítnout).
- **3.3 Galerie** — analogicky queue typ „gallery_pending_review" pro SpravceGalerie.
- **3.4 Diskuze** — queue typ „discussion_report" pro SpravceDiskuzi (hlášené příspěvky) + případný „discussion_join_request" pro uzamčené diskuze (renderuje se u majitele/manažera diskuze).
- **3.5 Pošta** — **explicitně oddělená** od Zpracovat. Pošta = konverzace + informativní zprávy. Zpracovat = akce. RSVP eventů z 3.5 zůstává v poště (je to konverzace s odpovědí), žádost o přidání do diskuze jde do Zpracovat (je to oprávňovací akce). Hranice = vyžaduje rozhodnutí = Zpracovat; konverzace = pošta.
- **5.x / 6.x Světy** — případně další queue typy specifické pro svět (např. žádost o roli ve světě, vstup do uzamčené diskuze v rámci světa).

**Architektonický artefakt z 1.4:** BE `PendingActionType` enum + abstraktní `IPendingActionProvider` interface (modul registruje svůj typ + provider, který umí načítat položky pro danou roli/uživatele). FE renderer-by-type registry v Zpracovat tabu.

---

## 13. Souhrn rozhodnutí k schválení

| #    | Otázka                                                              | Doporučení                                                   |
| ---- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| §3.1 | Karty vs. Tabulka uvnitř tabu Uživatelé                             | **A** — view-toggle „Karty/Tabulka", default Karty           |
| §3.2 | Role chip v kartě                                                   | **ANO**, subset (Admin/Superadmin/Spravce*; bez Hrac/PJ)     |
| §3.4 | Per-card rychlé akce (kebab) + uzavření D-029                       | **(a)** kebab s plnou sadou akcí (reuse modaly z 1.3b)       |
| §3.5 | Self-profile (`/ikaros/uzivatel/<moje-id>`)                         | **(a)** banner „View as", ne redirect                        |
| §3.6 | URL strategie (`/ikaros/pratele` vs. sjednocení)                    | **(a)** Sjednotit do `/ikaros/uzivatele?tab=…`                |
| §3.7 | Tab Zpracovat viditelnost pro role bez funkčního obsahu v 1.4       | **(a)** všichni vidí, neaktivní role mají placeholder         |

**Klíčové framing-rozhodnutí (potvrzené v této konverzaci 2026-05-12):**
1. Jediná stránka `/ikaros/uzivatele` s **4 taby** pro Admin/Superadmin (Přátelé / Uživatelé / Zpracovat / Audit), **2 taby** (Přátelé + Zpracovat) pro ostatní role.
2. Tab Uživatelé = adresář všech, **jen Admin/Superadmin**.
3. Tab Přátelé = vlastní přátelé, **všichni přihlášení** (kostra v 1.4, naplnění v 1.8).
4. **Tab Zpracovat = univerzální action queue.** Architektonický princip: *cokoliv, co vyžaduje rozhodnutí příjemce, jde do Zpracovat tabu této role*. Pošta zůstává pro konverzace.
5. **Tab Audit = read-only historie admin akcí.** Jen Admin/Superadmin. Oddělené od Zpracovat (princip „Zpracovat = akce, ne historie").
6. Veřejný profil `/ikaros/uzivatel/:id` dostupný každému přihlášenému.
7. **Role chip Spravce\* má vlastní barvy** per sub-typ (Články=amber, Galerie=purple, Diskuze=teal) — barevné rozlišení komu je co určené. Design audit §2.3.

---

## 14. Dopad na roadmap a hlavní plán

**Změna v 1.4 mění strukturu několika navazujících fází** (Zpracovat tab je univerzální agregátor → každá fáze, která má approval workflow, se k němu připojuje místo vlastního UI). Po schválení tohoto specu provedu následující úpravy v dokumentaci.

### 14.1 `docs/roadmap-fe.md`

**Fáze 1:**

- **1.4 přepsat** — z „Adresář uživatelů" na „Stránka Uživatelé (3-tab) + Veřejný profil + Zpracovat kostra":
  - `/ikaros/uzivatele` se 3 taby (Přátelé / Uživatelé / Zpracovat), role-aware viditelnost
  - `/ikaros/uzivatel/:id` veřejný profil
  - BE: `GET /api/users`, `GET /api/users/:id`, **`PendingActionType` enum + `IPendingActionProvider` skeleton**
  - FE: `UsersPage` (refactor `AdminUsersPage`), `PublicUserProfilePage`, kostra Zpracovat tabu s renderer registry
- **1.8 přepsat** — z „Přátelé (samostatná stránka `/ikaros/pratele`)" na „Friendships subsystém — naplní tab Přátelé + queue typ `friend_request` do Zpracovat":
  - Žádné `/ikaros/pratele` URL (sjednoceno do tabu)
  - BE: `Friendship` entita + endpointy + první konkrétní `PendingActionProvider` (`FriendRequestProvider`)
  - FE: naplnění Přátelé tabu + renderer karty `friend_request` v Zpracovat

**Fáze 2:**

- **2.4 doplnit** — pro private světy: žádost o vstup vstupuje do Zpracovat tabu PJ vlastníka. Přidat queue typ `world_join_request` + `WorldJoinRequestProvider` v BE. Smazat (pokud byla zmíněna) samostatná stránka „inbox žádostí o vstup".

**Fáze 3:**

- **3.2 doplnit** — pending článek do Zpracovat SpravceClanku (queue typ `article_pending_review`). Vlastní moderation UI uvnitř Zpracovat tabu (renderer karty).
- **3.3 doplnit** — analogicky pro `gallery_pending_review` (SpravceGalerie).
- **3.4 doplnit** — `discussion_report` pro SpravceDiskuzi + případný `discussion_join_request`.
- **3.5 doplnit explicitní hranici** — pošta = konverzace; **přemístit** RSVP a join request akce do textu jako „join request akce zůstávají ve Zpracovat tabu, ne v poště". RSVP eventů zůstává v poště (konverzace s odpovědí).

**Fáze 5/6:**

- **5.3 (Nastavení světa) zmínka** — moderace členství / role ve světě může přidat další queue typy do Zpracovat PJ.

### 14.2 `docs/hlavni-plan.md`

**Fáze 1 — Auth & Uživatelé** sekce kroků:

- **1.4** — přepsat popis ze „Adresář uživatelů (`/ikaros/uzivatele`, `/ikaros/uzivatel/:id`)" na: „Stránka Uživatelé (3 taby: Přátelé / Uživatelé / Zpracovat; role-aware), veřejný profil. Univerzální `PendingActionType` infrastruktura."
- **1.5 (Presence)** — beze změny.
- **1.6 (původně Přátelé v hlavni-plan)** — pozn.: hlavní plán má 1.6 = Přátelé. **Sjednotit číslování s roadmapou:** roadmap má 1.7 = Reset hesla, 1.8 = Přátelé. Hlavní plán neobsahuje 1.7. **Akce:** Hlavní plán doplnit 1.7 Reset hesla, 1.8 = Přátelé (přečíslování z 1.6).
- **1.8** popis přepsat na: „Friendships modul (BE + FE) + queue typ `friend_request` v Zpracovat tabu (z 1.4). Naplnění tabu Přátelé na `/ikaros/uzivatele`. Žádná samostatná stránka."

**Fáze 2:**

- **2.4** doplnit větu: „Pro private světy: žádost o vstup → queue typ `world_join_request` ve Zpracovat tabu vlastnícího PJ (infra z 1.4)."

**Fáze 3:**

- **3.2/3.3/3.4** doplnit větu o moderation queue v Zpracovat tabu Spravce* (infra z 1.4).
- **3.5** doplnit větu o hranici pošta vs. Zpracovat (RSVP zůstává; join requesty jdou jinam).

**Architektura systému** (sekce nahoře v hlavnim-plan.md): doplnit pod „Auth & uživatelé":
> *Univerzální action queue („Zpracovat") — agregátor pending akcí napříč moduly (friend requests, world join, content moderation). Spec 1.4.*

### 14.3 Co se NEMĚNÍ

- **Datový model `User`** — zůstává tak, jak je po 1.3a/b/c.
- **Routing tree** — pouze rozšíření existující route, žádné nové URL pro běžné uživatele (kromě `?tab=` query). Stub `/ikaros/uzivatel/:id` se naplní.
- **Pošta (3.5)** — RSVP a konverzační flow zachovány. Jen výslovně se z ní oddělí approval queue.
- **Memory `project_admin_panel_decision`** — paměť „Uživatelé zůstávají v ADMINISTRACE (pravý panel)" platí i nadále, jen kolonka má adaptivní label podle role.

### 14.4 Sekvence úprav (po schválení tohoto specu)

1. Update `docs/roadmap-fe.md` (1.4, 1.8, 2.4, 3.2–3.5).
2. Update `docs/hlavni-plan.md` (přečíslování, doplnění větvení Zpracovat).
3. Až poté: frontend-design audit → impl. plán 1.4 → kód.

Po schválení specu spustím **frontend-design audit** (vizuální návrh karty + role chipů + kebab menu + Zpracovat karta + public profilu), poté předložím **impl. plán 1.4** a paralelně **diff roadmapy/hlavního plánu** k odsouhlasení.

---

## 15 — Follow-up: Detailní karta na veřejném profilu (2026-06-10)

> Doplněno po testování. PJ/Admin chce u cizího uživatele vidět strukturovanou „kartu" s detaily, ne jen strohou hlavičku.

### Účel
`/ikaros/uzivatel/:id` dnes ukazuje jen `PublicProfileHeader` (avatar + jméno + meta řádek) + akce. Přidat pod hlavičku **datovou kartu** se strukturovaným gridem polí (vzor `ProfileHeader` „OSOBNÍ KARTA", ale read-only a jen veřejná pole).

### Rozsah
Nová komponenta **`PublicProfileCard`** na `PublicUserProfilePage` (pod hlavičkou):
- **Veřejná pole (všem):** uživatelské jméno, přezdívka, město, role, počet světů, člen od, naposledy online.
- **Admin-only:** poslední přihlášení (`lastLoginAt`).

### BE
- `PublicUserProfile` interface + `lastLoginAt?: string | null`.
- `users.service.publicProfileV14`: v existujícím `isAdmin` bloku nastavit `lastLoginAt = user.lastLoginAt?.toISOString() ?? null`. Ne-adminovi se pole vůbec neposílá (undefined).
- **E-mail se NEPŘIDÁVÁ** — zůstává soukromé pole (jen vlastní OSOBNÍ KARTA).

### FE
- FE `PublicUserProfile` typ + `lastLoginAt?: string | null`.
- `PublicProfileCard` — grid label/value (reuse vzhledu `ProfileHeader` gridu); řádek „Poslední přihlášení" jen když `profile.lastLoginAt` existuje (BE ho posílá jen Adminovi → FE jen zobrazí, co dostane).
- Vložit do `PublicUserProfilePage` mezi hlavičku a bio/postavu.

### Privacy / role
- `lastLoginAt` gated na **platformového Admina/Superadmina** (ne world PJ — veřejný profil je platformový obsah, konzistentní s `feedback_platform_vs_world_roles`). Rozhoduje BE, FE jen renderuje.
- E-mail cizího uživatele se nikde nezobrazuje.

### Acceptance
- [ ] Cizí profil má pod hlavičkou kartu s veřejnými detaily.
- [ ] Admin/Superadmin navíc vidí „Poslední přihlášení".
- [ ] Ne-admin „Poslední přihlášení" nevidí (BE neposílá).
- [ ] E-mail cizího uživatele se nikde nezobrazí.
- [ ] mobil/desktop OK.
