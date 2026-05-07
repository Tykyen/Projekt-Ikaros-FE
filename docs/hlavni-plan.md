# Hlavní plán — Projekt Ikaros FE

**Projekt:** Frontend pro platformu Projekt Ikaros  
**Stack:** React 19 + Vite + TypeScript + Socket.IO  
**Backend:** NestJS (viz `C:\Matrix\ProjektIkaros\Projekt-ikaros`) — 206 REST endpointů, 51 WS eventů  
**Referenční systém:** Starý Matrix (`C:\Matrix\Matrix\frontend`) — funkcionální reference, vizuální NE  
**Datum:** 2026-05-07

---

## Architektura systému

```
Ikaros Platforma  ← PRIMÁRNÍ, staví se PRVNÍ
├── Auth & uživatelé
├── Komunita (články, galerie, diskuze, pošta, novinky)
├── Globální chat (Hospoda)
├── Správa světů (browse, create, join)
└── Světy (instance) ← SEKUNDÁRNÍ, staví se DRUHÉ
    ├── Každý svět má identickou sadu funkcí:
    │   ├── Světový chat (kanály, skupiny)
    │   ├── Wiki stránky (TipTap editor)
    │   ├── Postavy a deníky
    │   ├── Herní nástroje (kalendář, timeline, počasí, events)
    │   ├── Mapy (universe 3D, taktická, dungeon builder)
    │   └── Kampaně (pavučina, storylines, scénáře)
    ├── Matrix  ← první svět (referenční)
    ├── D&D svět
    └── [libovolný další svět]
```

**Postup:** Ikaros platforma celá → pak světová vrstva (jednou postavená, funguje pro všechny světy).

---

## Co stavíme

Ikaros je primární platforma. Každý svět (Matrix, D&D...) je jen instance světové vrstvy.  
Vizuální design platformy a světů se řeší separátně — plán barvy nespecifikuje.

---

## Fáze a kroky

### Fáze 0 — Základ (blokovací)
*Musí být hotovo před čímkoliv jiným.*

- **0.1** Design system — CSS variables/theme tokeny (spacing, typografie, velikosti). Barvy a vizuální styl se řeší separátně.
- **0.2** Layout — `IkarosLayout` (platform shell), `WorldLayout` (světový shell), `AuthLayout`, responsive
- **0.3** Routing — kompletní stromová struktura routes
- **0.4** Auth infrastruktura — store (token + user + role), Axios interceptory (Bearer + refresh při 401), `PrivateRoute`, `RoleGuard`
- **0.5** API vrstva — typovaný client, error handling, React Query patterns
- **0.6** Socket.IO — SocketManager singleton, `useSocket` hook, reconnect logic

**Nové balíčky:** `jotai`, `sonner`, `clsx`

---

### Fáze 1 — Auth & Uživatelé
*Platform-level — nepatří žádnému světu.*

- **1.1** Login (`/login`) — formulář, JWT do store
- **1.2** Registrace (`/register`) — formulář, validace
- **1.3** Profil (`/ikaros/profil`) — editace, avatar upload (Cloudinary)
- **1.4** Adresář uživatelů (`/ikaros/uzivatele`, `/ikaros/uzivatel/:id`)
- **1.5** Presence — online indikátor, Socket.IO `presence:update`
- **1.6** Přátelé — friendships modul (BE + FE), žádosti, seznam přátel, header link nahradí placeholder z 1.1

---

### Fáze 2 — Ikaros jádro
*Hlavní platforma — dashboard, správa světů.*

- **2.1** Ikaros dashboard (`/`) — přehled vlastních světů, platformové novinky
- **2.2** Přehled světů (`/ikaros/vesmiry`) — mřížka, filtry, search
- **2.3** Vytvoření světa (`/ikaros/vytvorit-svet`) — wizard (název/žánr → přístup → RPG systém)
- **2.4** Detail světa / join flow (`/svet/:worldId`) — info, join pro public/private

---

### Fáze 3 — Ikaros komunita
*Platformové funkce — nadsvětové, patří přímo Ikarosu.*

- **3.1** Ikaros novinky — v dashboardu (čtení bez přihlášení)
- **3.2** Články (`/ikaros/clanky`) — přehled, TipTap editor, Draft→Published workflow, rating
- **3.3** Galerie (`/ikaros/galerie`) — Cloudinary upload, schvalovací workflow
- **3.4** Diskuze (`/ikaros/diskuze`) — vlákna příspěvků, manageři, pozvánky
- **3.5** Pošta (`/ikaros/posta`) — Inbox/Sent, RSVP akce, počítadlo nepřečtených
- **3.6** Nápověda (`/ikaros/napoveda`)

**Nové balíčky:** `@tiptap/react`, `@tiptap/starter-kit` + extensions

---

### Fáze 4 — Globální chat (Hospoda)
*Ikaros-level chat — napříč světy.*

- **4.1** Hospoda (`/chat`) — interdimenzionální chat, kanály, real-time Socket.IO
- **4.2** Emotes v chatu, typing indikátory
- **4.3** Reply, reakce, přílohy

---

### ← Ikaros platforma hotová →

---

### Fáze 5 — Svět — základ
*Světová vrstva — jednou postavená, funguje pro každý svět.*

- **5.1** `WorldLayout` — sidebar s navigací světa (chat, stránky, mapa, atd.), header s názvem světa
- **5.2** Přehled světa (`/svet/:worldId`) — novinky, poslední stránky, eventy
- **5.3** Nastavení světa (`/svet/:worldId/nastaveni`) — info, správa členů (PJ+)

---

### Fáze 6 — Svět — chat
*Světový chat — Socket.IO, skupiny, kanály.*

- **6.1** `/svet/:worldId/chat` — sidebar s kanály a skupinami, read status
- **6.2** Zprávy — dice roll, whisper, soft-delete
- **6.3** Reply, reakce, přílohy

---

### Fáze 7 — Svět — Wiki stránky

- **7.1** Page viewer (`/svet/:worldId/:slug`) — TipTap JSON → HTML
- **7.2** Page editor (`nova-stranka`, `edit/:slug`) — TipTap, access settings, auto-save
- **7.3** Správa stránek (`admin/stranky`) — řazení, oblíbené

---

### Fáze 8 — Svět — Postavy

- **8.1** Deník postavy (`/svet/:worldId/postava/:slug`) — dynamické fieldy dle diarySchema
- **8.2** Vlastní postava (`/svet/:worldId/moje-postava`)
- **8.3** NPC adresář (`admin/adresar-postav`) — šablony HP/armor/abilities

---

### ← MVP hranice — výše je funkční základ pro hráče →

---

### Fáze 9 — Svět — Herní nástroje

- **9.1** Game Events — RSVP, skupinová viditelnost, komentáře
- **9.2** Kalendář — deníky postav + PJ pohled, fantasy data
- **9.3** Timeline — historická osa, fantasy datový formát
- **9.4** Počasí — zobrazení + správa generátoru
- **9.5** Světové novinky — dashboard + admin správa

---

### Fáze 10 — Svět — Mapy *(nejkomplexnější)*

- **10.1** Universe mapa 3D — force graph, nodes/links, visibility filter
- **10.2** Taktická mapa — hex Konva canvas, tokeny, fog of war, Socket.IO sync
- **10.3** Dungeon Builder — tile editor, export

**Nové balíčky:** `three`, `react-force-graph-3d`, `konva`, `react-konva`

---

### Fáze 11 — Svět — Kampaně

- **11.1** Pavučina — 2D force graph vztahů, CampaignSubject nodes, SideA/SideB perspektivy
- **11.2** Storylines & Scénáře — storyboard pro PJ, TipTap obsah
- **11.3** QuickNotes & Shop — pin/unpin, ShopItem seznam
- **11.4** Currency converter

**Nové balíčky:** `react-force-graph` (2D)

---

### Fáze 12 — Admin & nastavení

- **12.1** Platform admin (`/admin`) — statistiky, správa uživatelů (role, ban), schvalování obsahu
- **12.2** World admin — WorldCalendarConfig, měny, emotes, headline

---

### Fáze 13 — Pokročilé funkce

- **13.1** Vyhledávání — globální Ctrl+K, MeiliSearch výsledky, filtry
- **13.2** Push notifikace — VAPID subscription, povolení při přihlášení
- **13.3** Zvuková databáze — přehrávač, filtry, integrace s mapou
- **13.4** Custom Emotes — správa per-world, picker v chatu

---

## MVP hranice

**Funkční základ = Fáze 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8**

Po těchto fázích existuje Ikaros platforma (komunita, světy) a každý svět má chat, wiki a postavy.

---

## Navrhovaná architektura src/

```
src/
├── api/
│   ├── client.ts
│   ├── socket.ts
│   └── hooks/              # useAuth, useWorlds, useChat, usePages...
├── components/
│   ├── ui/                 # Button, Input, Modal, Card, Badge, Spinner...
│   ├── layout/             # IkarosLayout, WorldLayout, AuthLayout, Sidebar, Header
│   └── features/           # ChatMessage, CharacterCard, PageCard...
├── pages/
│   ├── auth/               # Login, Register
│   ├── ikaros/             # Ikaros platforma (komunita, světy)
│   ├── world/              # Světové stránky (chat, mapa, postavy...)
│   └── admin/              # Admin panel
├── store/
│   ├── authStore.ts        # JWT, user, role
│   ├── uiStore.ts          # sidebar, theme
│   └── socketStore.ts      # connection status
├── types/
│   └── index.ts            # TypeScript entity typy
└── utils/
```

---

## Detailní plán

Pro každou fázi viz `docs/roadmap-fe.md`.  
BE endpointy a WS eventy viz `Projekt-ikaros/docs/websocket-api.md` a Swagger (`/api/docs`).
