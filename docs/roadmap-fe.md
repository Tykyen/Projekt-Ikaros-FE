# Roadmap — Projekt Ikaros FE

**Stav:** Vite + React 19 + TS scaffold  
**BE repo:** `C:\Matrix\ProjektIkaros\Projekt-ikaros`  
**Referenční FE:** `C:\Matrix\Matrix\frontend` — pouze funkcionální reference, vizuální NE

**Hierarchie a pořadí stavby:**
1. **Ikaros platforma** — auth, komunita, správa světů, globální chat
2. **Světová vrstva** — jednou postavená, funguje pro každý svět (Matrix, D&D, ...)

---

## Přehled fází

| # | Název | Doména | Splněno |
|---|-------|--------|---------|
| 0 | Základ a infrastruktura | — | ✅ |
| 1 | Auth & Uživatelé | Ikaros | 🟡 (1.0 + 1.1 ✅, 1.2-1.6 čeká) |
| 2 | Ikaros jádro | Ikaros | ⬜ |
| 3 | Ikaros komunita | Ikaros | ⬜ |
| 4 | Globální chat (Hospoda) | Ikaros | ⬜ |
| — | **← Ikaros platforma hotová** | — | — |
| 5 | Svět — základ | Svět | ⬜ |
| 6 | Svět — chat | Svět | ⬜ |
| 7 | Svět — wiki stránky | Svět | ⬜ |
| 8 | Svět — postavy | Svět | ⬜ |
| — | **← MVP hranice** | — | — |
| 9 | Svět — herní nástroje | Svět | ⬜ |
| 10 | Svět — mapy | Svět | ⬜ |
| 11 | Svět — kampaně | Svět | ⬜ |
| 12 | Admin & nastavení | Ikaros + Svět | ⬜ |
| 13 | Pokročilé funkce | Ikaros + Svět | ⬜ |

> Legenda: ✅ Hotovo &nbsp;|&nbsp; 🟡 Rozpracováno &nbsp;|&nbsp; ⬜ Čeká

---

## Fáze 0 — Základ a infrastruktura

**Závislosti:**
- `jotai` — global state
- `sonner` — toast notifikace
- `clsx` — podmíněné CSS třídy
- `react-hook-form` + `zod` — formuláře a validace

### - [x] 0.1 Design system
- [x] CSS variables / theme tokeny (spacing, typografie, velikosti) — barvy a vizuální styl se řeší separátně
- [x] Základní UI komponenty: Button, Input, Card, Modal, Spinner, Badge
- [x] Theming architektura: `data-theme` atribut — Ikaros platforma / každý svět vlastní téma

### - [x] 0.2 Layout systém
- [x] `IkarosLayout` — 3-column shell (header, sidebar, main, right panel)
- [x] `WorldLayout` — světový shell (EXIT, název světa, dropdown nav, full-width main)
- [x] `AuthLayout` — prázdný layout pro login/register
- [x] Responsive — desktop 3 sloupce → tablet 2 → mobil drawer
- [x] `WorldContext` provider — worldId, world, isPJ, userRole, loading

### - [x] 0.3 Routing struktura
- [x] `src/router.tsx` — kompletní route tree (React Router v7)
- [x] `authLoader` — PrivateRoute přes loader pattern (redirect na `/login`)
- [x] `RoleGuard` — 403 stránka pro nedostatečnou roli
- [x] Lazy loading stránek (React.lazy + Suspense)

### - [x] 0.4 Auth infrastruktura
- [x] `useAuthStore` (Jotai atomWithStorage) — accessToken, refreshToken, currentUser
- [x] Axios interceptor — `Authorization: Bearer` + refresh při 401 (`POST /api/auth/refresh`)
- [x] `PrivateRoute` loader — redirect na `/login` (implementováno v 0.3 jako `authLoader`)
- [x] `RoleGuard` — 403 stránka (implementováno v 0.3)

### - [x] 0.5 API vrstva
- [x] Typovaný `apiClient` s `get/post/put/patch/delete`
- [x] Error handling — parsování BE error payloadu (`parseApiError`)
- [x] `useMyWorlds`, `useWorld` — TanStack Query hooky
- [x] `useUnreadCount` — REST + socket invalidace
- [x] Globální error boundary (`GlobalErrorBoundary` — class component nad RouterProvider)

### - [x] 0.6 Socket.IO infrastruktura
- [x] `SocketManager` singleton — JWT auth, status atom
- [x] `useSocketInit` — lifecycle (connect při přihlášení, disconnect při odhlášení)
- [x] `useSocket`, `useSocketEvent` — hooky pro komponenty
- [x] Toast při ztrátě / obnovení spojení (D-002 opraveno)
- [x] `main.tsx` — JotaiProvider, QueryClientProvider, GlobalErrorBoundary, Toaster, ThemeSync

---

## Fáze 1 — Auth & Uživatelé

**BE:** `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/users/me`, `PATCH /api/users/me`

### - [x] 1.0 Globální theme systém ✅

**Iterace A** (foundation + 3 reference themes) + **Iterace B** (zbývajících 18 témat) — viz `docs/superpowers/specs/2026-05-07-theme-system-design.md` a `docs/superpowers/plans/2026-05-07-theme-system-iterace-{a,b}.md`.

- [x] Definice **21 vizuálních témat platformy**: modré nebe (default), zlatý standard, sci-fi, vesmírná loď, vesmírná bitva, kyberpunk, postapo, příroda, pergamen, hospoda, nemrtví, temná červeň, čtyři živly, magie, severské runy, indiánské, africké, arabský svět, měsíc, slunce, bílá
- [x] CSS design tokeny per téma (`data-theme` atribut na layout root) — `src/themes/themes/<id>/index.ts`
- [x] 3D moderní efekty tlačítek per téma — translateY + box-shadow + per-theme glow v `decorations.css`
- [x] **Theme switcher v hlavičce** (deviace od původního plánu — switcher je v headeru místo v profilu, vždy dostupný)
- [x] Uložení volby uživatele — `themeAtom` (Jotai `atomWithStorage('ikaros.theme')`) + hybrid BE sync (graceful 404)
- [x] Výchozí téma před přihlášením — `DEFAULT_THEME = 'modre-nebe'` + pre-hydration script (žádný FOUT)

**Bonus nad rámec původního plánu:**
- [x] WCAG AA kontrast pro všech 21 témat (`npm run audit:contrast`)
- [x] Storybook gallery (Themes/Gallery → All Themes) pro vizuální testování
- [x] `prefers-reduced-motion` auto-disable animací
- [x] Lazy-load decorations.css + display fontů per téma
- [x] Architecture připravená pro **fázi 5.0** (theme scope na úrovni layoutu — `IkarosLayout` vs `WorldLayout`)
- [x] `lint:colors` skript zakazující hardcoded barvy v komponentech
- [x] 36 unit testů (registry, applyTheme, useTheme, useThemeSync)
- [x] Asset pipeline — `npm run themes:optimize` (sharp PNG → WebP, 21 thumbs + 21 backgrounds)

**Tracked dluhy:** D-003 (BE endpoint `PATCH /users/me { themeId }`), D-004 (`User.themeId` field type)

### - [x] 1.1 Login ✅

**Realizováno jako modal v hlavičce IkarosLayoutu** (deviace od původního "Login na `/login`" — viz spec `docs/arch/phase-1/spec-1.1.md`). Klíčové změny:

- [x] **BE:** `LoginDto.email` → `identifier` (přijímá e-mail NEBO přezdívku); `AuthService.login` rozhoduje podle `@`; `RegisterDto.username` zakázán `@`
- [x] **FE:** `LoginModal` komponenta (RHF + zod, themed, 3D buttons) — show/hide password toggle, error banner pro 401/429/network/5xx
- [x] **IkarosLayout je teď public shell** — anon vidí úvodník, vesmíry, články, galerii, diskuze, nápovědu; pravý sloupec a CHAT sekce jen pro logged-in
- [x] **Hlavička role-aware** — logged-out: PŘIHLÁSIT SE / REGISTRACE-disabled; logged-in: POŠTA, PŘÁTELÉ (placeholder pro 1.6) / UŽIVATELÉ (admin → 1.4), avatar+přezdívka, ODHLÁSIT
- [x] **Logout flow s 5s "Vrátit"** (sonner toast) — tokeny se mažou až po vypršení timeru
- [x] **Per-route `requireAuth` loader** nahradil global authLoader — chráněné routes redirectují na `/?openLogin=1` + uloží intent do sessionStorage
- [x] **JWT decode** pro hydrataci user dat po refreshi (`useAuthBootstrap`)
- [x] **`@hookform/resolvers`** přidán; `/login` a `/register` URL smazané, `LoginPage.tsx` smazán, `AuthLayout` čeká na 1.2

**Test coverage:** 72 FE testů (loginSchema, jwt, useAuth, LoginModal, themes); 22 BE unit + 9 E2E (auth-login-identifier).

**Tracked dluhy:** D-005 (`/users/me` plnohodnotná hydratace — 1.3), D-006 (Reset hesla — BE neumí, samostatný krok), D-008 (BE controller-level guards na `ikaros-articles/gallery/discussions` — vyřeší 3.2-3.4).

### - [ ] 1.2 Registrace (`/register`)
- [ ] Formulář (username, email, password, confirm), validace
- [ ] Success → redirect na login

### - [ ] 1.3 Uživatelský profil (`/ikaros/profil`)
- [ ] Editace profilu (displayName, username)
- [ ] Avatar upload (Cloudinary `POST /api/upload`)
- [ ] Theme settings, chat preferences

### - [ ] 1.4 Adresář uživatelů
- [ ] `/ikaros/uzivatele` — seznam (paginace)
- [ ] `/ikaros/uzivatel/:id` — veřejný profil

### - [ ] 1.5 Presence
- [ ] Online indikátor v user menu (header)
- [ ] Socket.IO `presence:update` event

### - [ ] 1.6 Přátelé

**Nový subsystém — BE i FE od nuly.** V roadmapě nebyl, doplněno při brainstormingu kroku 1.1 (UI hlavičky odkazuje na "PŘÁTELÉ" pro běžné uživatele, ADMIN/SUPERADMIN vidí "UŽIVATELÉ" z 1.4).

**BE (nový modul `friendships`):**
- [ ] Entity `Friendship` (userAId, userBId, status: `pending` | `accepted` | `blocked`, requestedById, createdAt, acceptedAt)
- [ ] `GET /api/friends` — seznam přijatých přátel
- [ ] `GET /api/friends/requests` — příchozí žádosti
- [ ] `POST /api/friends/request/:userId` — odeslat žádost
- [ ] `POST /api/friends/accept/:friendshipId` — přijmout
- [ ] `DELETE /api/friends/:friendshipId` — odmítnout / odebrat
- [ ] `POST /api/friends/block/:userId` — blokovat (volitelné)
- [ ] Notifikace přes Ikaros poštu (3.5) nebo Socket.IO event `friend:request`

**FE:**
- [ ] `/ikaros/pratele` — seznam přátel + příchozí/odeslané žádosti (taby)
- [ ] Tlačítko "Přidat do přátel" na veřejném profilu uživatele (1.4)
- [ ] Header link "PŘÁTELÉ" → `/ikaros/pratele` (nahradí placeholder z 1.1)
- [ ] Badge s počtem příchozích žádostí
- [ ] Toast / Socket event při přijetí žádosti

**Závislosti:** vyžaduje 1.4 (Adresář uživatelů) — odkud se přátelství iniciuje.

---

## Fáze 2 — Ikaros jádro

**BE:** `/api/worlds`, `/api/worlds/:id`, `/api/worlds/:id/join`, `/api/worlds/:id/members`, `/api/ikaros-news`

### - [ ] 2.1 Ikaros dashboard (`/`)
- [ ] Přehled světů uživatele
- [ ] Platformové novinky
- [ ] Blížící se eventy

### - [ ] 2.2 Přehled světů (`/ikaros/vesmiry`)
- [ ] Mřížka světů (vlastní + veřejné)
- [ ] Filtry (public/private/closed), search

### - [ ] 2.3 Vytvoření světa (`/ikaros/vytvorit-svet`)
- [ ] Wizard: název/slug/žánr/popis → přístupový režim → RPG systém preset

### - [ ] 2.4 Detail světa + join flow (`/svet/:worldId`)
- [ ] Informace o světě
- [ ] Join tlačítko (public = přímé, private = žádost)

---

## Fáze 3 — Ikaros komunita

**BE:** `/api/ikaros-articles`, `/api/ikaros-gallery`, `/api/ikaros-discussions`, `/api/ikaros-messages`, `/api/ikaros-news`

**Nové balíčky:** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-table`

### - [ ] 3.1 Ikaros novinky
- [ ] V dashboardu — čtení bez přihlášení
- [ ] Admin správa

### - [ ] 3.2 Články (`/ikaros/clanky`)
- [ ] Přehled (Published), `/novy` editor (TipTap)
- [ ] Draft → Pending → Published workflow, rating

### - [ ] 3.3 Galerie (`/ikaros/galerie`)
- [ ] Mřížka obrázků, `/nahrat` upload (Cloudinary)
- [ ] Schvalovací workflow (Pending → Approved)

### - [ ] 3.4 Diskuze (`/ikaros/diskuze`)
- [ ] Seznam diskuzí, `/:id` vlákno příspěvků
- [ ] Manageři, pozvánky

### - [ ] 3.5 Soukromá pošta (`/ikaros/posta`)
- [ ] Inbox / Sent, nová zpráva
- [ ] RSVP a join request akce
- [ ] Počítadlo nepřečtených v headeru

### - [ ] 3.6 Nápověda (`/ikaros/napoveda`)
- [ ] Statická stránka s tutoriály

---

## Fáze 4 — Globální chat (Hospoda)

**BE:** Socket.IO `GlobalChatGateway`  
**WS eventy:** viz `Projekt-ikaros/docs/websocket-api.md`

### - [ ] 4.1 Hospoda (`/chat`)
- [ ] Interdimenzionální chat, kanály, real-time zprávy
- [ ] Emotes (`:shortcode:`), typing indikátory

### - [ ] 4.2 Zprávy — rozšíření
- [ ] Reply, reakce (emoji), přílohy

---

## ← Ikaros platforma hotová →

---

## Fáze 5 — Svět — základ

*Tato fáze buduje světový shell. Vše níže běží v tomto shellu.*

### - [ ] 5.0 Světový theme systém
- [ ] Každý svět má vlastní vizuální styl, nezávislý na globálním tématu platformy
- [ ] Theme se definuje při vytvoření světa (nebo v nastavení světa)
- [ ] CSS design tokeny per svět (přepisují platformové tokeny uvnitř `WorldLayout`)
- [ ] Výběr a správa světového tématu (`/svet/:worldId/nastaveni`)

### - [ ] 5.1 WorldLayout (dokončení)
- [ ] Sidebar s navigací světa (chat, stránky, mapa, postavy...)
- [ ] Header s názvem světa, aktuální přihlášená postava
- [ ] Světový kontext (worldId, role v světě)

### - [ ] 5.2 World dashboard (`/svet/:worldId`)
- [ ] Novinky světa, poslední stránky, blížící se eventy

### - [ ] 5.3 Nastavení světa (`/svet/:worldId/nastaveni`)
- [ ] Základní info (název, popis, obrázek) — PJ+
- [ ] Custom skupiny, správa členů (role)

---

## Fáze 6 — Svět — chat

**BE:** Socket.IO `ChatGateway`  
**WS eventy:** `chat:join`, `chat:message`, `chat:typing`, `chat:read`

### - [ ] 6.1 Světový chat (`/svet/:worldId/chat`)
- [ ] Sidebar s kanály a skupinami (ChatGroup barevné kódování)
- [ ] Read status, soft-deleted zprávy

### - [ ] 6.2 Zprávy — rozšíření
- [ ] Reply, reakce, přílohy, dice roll, whisper (visibleTo filter)

---

## Fáze 7 — Svět — Wiki stránky

**BE:** `/api/pages`, `/api/worlds/:id/pages`

### - [ ] 7.1 Page viewer (`/svet/:worldId/:slug`)
- [ ] TipTap JSON → HTML render, accessRequirements, breadcrumbs

### - [ ] 7.2 Page editor (`/nova-stranka`, `/edit/:slug`)
- [ ] TipTap editor (headings, bold/italic, links, images, tables, code)
- [ ] Access settings, auto-save draft

### - [ ] 7.3 Správa stránek (`/admin/stranky`)
- [ ] Přehled, řazení, mazání, oblíbené (hvězdička)

---

## Fáze 8 — Svět — Postavy

**BE:** `/api/characters`, `/api/worlds/:id/characters`, `/api/npc-templates`

### - [ ] 8.1 Deník postavy (`/svet/:worldId/postava/:slug`)
- [ ] Dynamické fieldy dle `diarySchema` světa (D&D, DrD, GURPS, Matrix...)
- [ ] Extra volné bloky

### - [ ] 8.2 Vlastní postava (`/svet/:worldId/moje-postava`)
- [ ] Shortcut na postavu přihlášeného uživatele v tomto světě

### - [ ] 8.3 NPC adresář (`/admin/adresar-postav`)
- [ ] NPC šablony (hp, armor, injury, abilities, notes), vytváření / editace

---

## ← MVP hranice — výše je funkční základ pro hráče →

---

## Fáze 9 — Svět — Herní nástroje

### - [ ] 9.1 Game Events (`/svet/:worldId/sprava-udalosti`)
- [ ] RSVP (confirm/decline), skupinová viditelnost (targetGroup), komentáře

### - [ ] 9.2 Kalendář (`/svet/:worldId/kalendar`)
- [ ] Per-postava deníky, PJ pohled, fantasy data, nastavení barev

### - [ ] 9.3 Timeline (`/svet/:worldId/timeline`)
- [ ] Historická osa, fantasy datový formát (celestial overrides), přidávání událostí

### - [ ] 9.4 Počasí (`/svet/:worldId/pocasi`)
- [ ] Aktuální počasí, správa generátoru (admin)

### - [ ] 9.5 Světové novinky
- [ ] V dashboardu světa, admin správa

---

## Fáze 10 — Svět — Mapy

**BE:** `/api/maps`, `/api/dungeon-maps`, `/api/universe`  
**Nové balíčky:** `three`, `react-force-graph-3d`, `konva`, `react-konva`

### - [ ] 10.1 Universe mapa 3D (`/svet/:worldId/mapa`)
- [ ] 3D force graph (nodes = lokace, links = cesty), visibility filter, click → detail

### - [ ] 10.2 Taktická mapa (`/svet/:worldId/takticka-mapa`)
- [ ] Hex mřížka Konva canvas, tokeny (drag & drop, HP, initiative)
- [ ] Fog of war, efekty, Socket.IO `MapsGateway` sync

### - [ ] 10.3 Dungeon Builder (`/admin/dungeon-builder`)
- [ ] Tile-based editor, export jako MapTemplate / MapScene

---

## Fáze 11 — Svět — Kampaně

**BE:** `/api/campaign`  
**Nové balíčky:** `react-force-graph` (2D)

### - [ ] 11.1 Pavučina (`/svet/:worldId/pavucina`)
- [ ] 2D force graph vztahů, CampaignSubject nodes
- [ ] CampaignRelationship hrany (SideA/SideB perspektiva), editace

### - [ ] 11.2 Storylines & Scénáře (`/svet/:worldId/scenare`)
- [ ] Storyboard pro PJ, Storylines (fáze, status, next step)
- [ ] Scénáře s TipTap obsahem a obrázky

### - [ ] 11.3 QuickNotes & Shop (`/svet/:worldId/obchod`)
- [ ] QuickNote pin/unpin, status
- [ ] ShopItem seznam s cenou a skupinou

### - [ ] 11.4 Currency converter (`/svet/:worldId/prevodnik-men`)
- [ ] Výpočet konverzí mezi měnami světa (WorldCurrencies)

---

## Fáze 12 — Admin & nastavení

### - [ ] 12.1 Platform admin (`/admin`)
- [ ] Dashboard (statistiky), správa uživatelů (role, ban)
- [ ] Schvalování obsahu (articles, galerie)

### - [ ] 12.2 World admin
- [ ] `/admin/nastaveni-kalendare` — WorldCalendarConfig
- [ ] `/admin/meny` — WorldCurrencies (CRUD)
- [ ] `/admin/emotes` — custom emotes (shortcode → obrázek)
- [ ] `/admin/headline` — "Last info" box

---

## Fáze 13 — Pokročilé funkce

### - [ ] 13.1 Vyhledávání
- [ ] Globální search bar v headeru (Ctrl+K)
- [ ] MeiliSearch fulltext výsledky, filtry (stránky, postavy, diskuze)

### - [ ] 13.2 Push notifikace
- [ ] VAPID subscription registrace (`POST /api/push/subscribe`)
- [ ] Povolení při prvním přihlášení

### - [ ] 13.3 Zvuková databáze (`/svet/:worldId/zvuky`)
- [ ] Přehrávač (YouTube link), filtry (intensity, emotionalTone)
- [ ] Integrace s taktickou mapou (background ambient)

### - [ ] 13.4 Custom Emotes
- [ ] Správa per-world (`/admin/emotes`)
- [ ] Picker v chatu při psaní `:`

---

## Potřebné npm závislosti (celkový seznam)

```json
{
  "dependencies": {
    "jotai": "^2.x",
    "sonner": "^1.x",
    "clsx": "^2.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@tiptap/react": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@tiptap/extension-image": "^2.x",
    "@tiptap/extension-link": "^2.x",
    "@tiptap/extension-table": "^2.x",
    "three": "^0.x",
    "react-force-graph-3d": "^1.x",
    "react-force-graph": "^1.x",
    "konva": "^9.x",
    "react-konva": "^18.x",
    "@cloudinary/react": "^1.x",
    "react-datepicker": "^6.x"
  }
}
```

---

## Architektura src/

```
src/
├── api/
│   ├── client.ts
│   ├── socket.ts
│   └── hooks/             # useAuth, useWorlds, useChat, usePages, useCharacters...
├── components/
│   ├── ui/                # Button, Input, Modal, Card, Badge, Spinner...
│   ├── layout/            # IkarosLayout, WorldLayout, AuthLayout
│   └── features/          # ChatMessage, CharacterCard, PageCard, EventCard...
├── contexts/
│   └── WorldContext.tsx
├── pages/
│   ├── auth/              # Login, Register
│   ├── ikaros/            # Dashboard, Vesmiry, Clanky, Galerie, Diskuze, Posta...
│   ├── world/             # Chat, Stranky, Postavy, Mapa, Kalendar...
│   └── admin/             # Platform admin, World admin
├── store/
│   ├── authStore.ts       # JWT, user, role
│   ├── uiStore.ts         # sidebar, theme
│   └── socketStore.ts     # connection status
├── types/
│   └── index.ts           # TypeScript entity typy
└── utils/
```
