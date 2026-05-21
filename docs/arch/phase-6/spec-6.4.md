# Spec 6.4 — Custom emotes (per-svět + globální)

**Status:** 🟡 Návrh k odsouhlasení
**Rozsah:** FE (admin stránky pro správu, napojení rendereru, picker v composeru, WS handlery) + drobné BE doplňky (WS `emote:deleted`, validace velikosti, limit per-svět)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros`
**Velikost:** odhad ~12 FE souborů / ~1100 ř. + ~3 BE soubory / ~80 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-21
**Souvisí:** [spec-6.1.md](spec-6.1.md), [spec-6.2.md](spec-6.2.md) (zejména 6.2g — `renderChatContent` čeká na `worldEmotes` mapu), [roadmap-fe.md](../../roadmap-fe.md) (Fáze 6.4, řádek 1576: `/admin/emotes` → 6.4), `docs/old/emotes.md` (starý Matrix referenční model).

> Cíl: vrátit do platformy **per-svět vlastní obrázkové `:shortcode:` emotes** (a paralelně **globální** sadu pro celou Ikaros). PJ světa uploaduje, hráči pak píšou `:smile:` a v chatu se zobrazí jejich vlastní obrázek. Globální emotes spravuje Admin platformy.

---

## 0. Názvosloví

Dědí z [spec-6.1.md §0](spec-6.1.md). Nově:

- **Custom emote** = jeden záznam s polo­žkami `shortcode`, `name`, `imageId` (Cloudinary publicId), volitelně `worldId`. `worldId === null` → globální.
- **Shortcode** = ASCII identifikátor v `:dvojtečkách:` ve zprávě (např. `:smile:`). Validace `[a-z0-9_]{2,32}` (BE už enforces).
- **Per-svět sada** = všechny `CustomEmote` s `worldId === <aktivní svět>`. Hráč i PJ je vidí; jen PJ/PomocnýPJ je spravuje.
- **Globální sada** = `worldId === null`. Viditelná všem členům jakéhokoli světa (BE filtr v `findGlobal` autentikuje jen JWT). Spravuje **Admin platformy** v `/ikaros/admin/emotes`.
- **Aktivní sada** = union per-svět + globálních při render zprávy. Per-svět má **prioritu** při kolizi shortcode (svět může „přepsat" globální `:smile:` vlastní variantou).

---

## 1. Cíl

1. **6.4a Audit BE** — ověřit kompletnost modulu `emotes` (controller, gateway, schema, repo) a doplnit chybějící: WS `emote:deleted`, soft limit počtu emotes per svět, validace velikosti uploadu (Cloudinary transformace).
2. **6.4b Render v chatu** — naplnit `worldEmotes` mapu v `renderChatContent` reálnou sadou: GET `/emotes/:worldId` + GET `/emotes/global` při mountu `WorldChatRoom`, předat do všech `MessageItem`. Při kolizi shortcode má per-svět prioritu.
3. **6.4c PJ správa per-svět** — stránka `/svet/:worldSlug/admin/emotes`. Grid karet (image + shortcode + name + 🗑). „Nový emote" tlačítko → modal s uploadem (drag-drop / file picker) + shortcode + name. Mazání s confirm.
4. **6.4d Admin správa globálních** — stránka `/ikaros/admin/emotes`. Stejný UI pattern jako 6.4c, ale pro globální sadu (worldId=null). Viditelná v levém nav Ikaros panelu jen pro Admin+.
5. **6.4e Picker v composeru** — rozšířit existující emoji popover (😊 v toolbaru) o sekci „Tohoto světa" (custom emotes světa) + „Globální" (globální custom emotes) pod existující sekci statických emoji. Klik → insert `:shortcode:` na pozici kurzoru.
6. **6.4f WS sync** — `emote:created` (BE už emituje) + `emote:deleted` (nově) invaliduje React Query cache `['world-emotes', worldId]` u všech online klientů světa.

---

## 2. Kontext / motivace

Starý Matrix měl plnohodnotné per-svět custom emotes — vlastní `:smile:` obrázek na svět, navíc Google Drive jako úložiště. Roadmap je vytáhla z dluhové fáze 13.4 do 6.4, protože jsou organicky součástí světového chatu (sady světa, nikoli platformy).

**Co staré umělo a necháváme:**
- Per-svět izolace (každý svět má vlastní sadu).
- PJ/PomocnýPJ+ může spravovat.
- Shortcode `:name:` v textu zprávy → render image.
- Mazání emote nemění historii zpráv (zpráva s `:smile:` po smazání emote zůstane jako text `:smile:`).

**Co nově:**
- **Globální sada** (worldId=null) — nový koncept, neměl ho starý Matrix. Motivace: některé emoty mají platformový smysl (Ikaros maskot, hodnocení 👍, žárovka 💡). Spravuje Admin.
- **Storage:** Cloudinary (`imageId` = publicId) místo Google Drive — sjednoceno s ostatními image uploady (avatary, hero, chat attachmenty).
- **WS sync v reálném čase** — když PJ uploadne nový emote, ostatní online hráči ho mohou ihned použít bez F5.
- **Kopírování mezi světy** (BE už umí — `POST /emotes/:worldId/:id/copy`) — UI tlačítko v PJ admin: „Zkopírovat do jiného světa".

📚 **Proč per-svět prioritu při kolizi shortcode?** Když Ikaros má globální `:smile:` a svět chce vlastní svatební `:smile:`, fairness je dát světu „přepsat" globální. Hráč ve světě A vidí svatební, hráč v jiném světě nebo bez membershipu vidí klasický. Bez priority by se uplatnil first-match (deterministicky podle implementace, hard to reason about).

⚠️ **Nesrovnalost při auditu BE:** chybí WS event `emote:deleted`. Důsledek: PJ smaže emote → ostatním klientům zůstane v cache `worldEmotes` mapě → na refresh / reconnect zmizí. Krátkodobě benigní, ale jednou online hráč napíše `:emote:` a uvidí obrázek, kterého už není v admin panelu (řekl mu mazání právě teď). **Řešení:** přidat event do `EmotesGateway.handleEmoteDeleted` (paralela k `handleEmoteCreated`), service to emituje při `deleteFromWorld` a `deleteGlobal`.

⚠️ **Druhá nesrovnalost:** `delete` ve `EmotesService` (řádky 118 a 128) **neemituje** event přes `EventEmitter2`. Service má `eventEmitter` v constructoru, ale `delete*` ho nepoužívá. To je **bug — opravujeme v 6.4a**.

---

## 3. Audit současného stavu

### 3.1 Backend — co `emotes` modul **už umí**

| Endpoint / chování | Stav | Soubor |
|---|---|---|
| `GET /emotes/:worldId` (členové světa) | ✅ | [emotes.controller.ts:73](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/emotes/emotes.controller.ts#L73) |
| `POST /emotes/:worldId` (PJ/PomocnýPJ+) | ✅ | [emotes.controller.ts:86](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/emotes/emotes.controller.ts#L86) |
| `DELETE /emotes/:worldId/:id` | ✅ | [emotes.controller.ts:101](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/emotes/emotes.controller.ts#L101) |
| `POST /emotes/:worldId/:id/copy` (do jiného světa) | ✅ | [emotes.controller.ts:115](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/emotes/emotes.controller.ts#L115) |
| `GET /emotes/global` | ✅ | [emotes.controller.ts:36](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/emotes/emotes.controller.ts#L36) |
| `POST /emotes/global` (Admin+) | ✅ | [emotes.controller.ts:45](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/emotes/emotes.controller.ts#L45) |
| `DELETE /emotes/global/:id` (Admin+) | ✅ | [emotes.controller.ts:59](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/emotes/emotes.controller.ts#L59) |
| Validace shortcode `[a-z0-9_]{2,32}` | ✅ | [create-emote.dto.ts:9](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/emotes/dto/create-emote.dto.ts#L9) |
| Unique index `(worldId, shortcode)` | ✅ | [custom-emote.schema.ts:29](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/emotes/schemas/custom-emote.schema.ts#L29) |
| WS `emote:created` broadcast do `world:<id>` room | ✅ | [emotes.gateway.ts:12](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/emotes/emotes.gateway.ts#L12) |
| `emote.created` event emit při `create` a `copy` | ✅ | [emotes.service.ts:95,166](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/emotes/emotes.service.ts#L95) |

### 3.2 Backend — nesrovnalosti k opravě v 6.4a

| # | Nález | Řešení |
|---|---|---|
| **N1** | `delete*` neemituje event → ostatní klienti nedostanou WS notifikaci o smazání. | Service `deleteFromWorld` / `deleteGlobal` emituje `emote.deleted` (`{ worldId, emoteId }`). Gateway přidá `@OnEvent('emote.deleted')` handler — broadcast `emote:deleted` do `world:<id>` (per-svět) resp. všem klientům (global). |
| **N2** | Žádný limit počtu emotes per svět. Storage / UX můžou degradovat při stovkách. | Soft limit 100 per svět: `EmotesService.create` před vložením zavolá `repo.countByWorldId(worldId)`; >= 100 → `ConflictException('EMOTE_LIMIT_REACHED')`. Globální limit 200 (Admin to neudělá omylem, ale ochrana proti scriptu). |
| **N3** | Žádná validace velikosti / typu uploadu (BE jen přijímá `imageId` z Cloudinary). | Cloudinary upload je řešený FE přes `useUploadImage` (`POST /upload/image`). Tam FE před uploadem validuje (1) `file.type ∈ {image/png, jpeg, gif, webp}`, (2) `file.size <= 512 KB`. Server-side: backend Cloudinary transformace přidá `c_limit,w_128,h_128` v URL builderu (FE), čímž zaručíme max 128×128 zobrazení i pro velký zdrojový obrázek. Tj. **upload nelimitujeme tvrdě na BE**, ale FE má guard + transform na render. |
| **N4** | Globální `findGlobal` autentikuje JEN JWT — i `Žadatel` (uchazeč) ho dostane. | Akceptováno — globální emoty mohou být veřejné v rámci přihlášených uživatelů. Žádná oprava. |
| **N5** | `EmotesService.assertIsMember` blokuje `Žadatel` od per-svět GET. To je správně, ale chyba v error response: vrací `'NOT_WORLD_MEMBER'` i pro neznámý svět (404 vs 403). | Drobnost — neopravujeme v 6.4 (nesouvisí s rozsahem). |

### 3.3 Frontend — co máme

| Místo | Stav |
|---|---|
| `renderChatContent` ([renderChatContent.tsx:54](../../../src/features/world/chat/lib/renderChatContent.tsx#L54)) — split na `worldEmotes` mapě | ✅ — připravený, čeká na napojení |
| `EMOTES` statická sada (fáze 4) — `:smile:` / `:heart:` etc. | ✅ — reuse, fungují nezávisle |
| `useUploadImage` (`POST /upload/image`) → `{ url, publicId }` | ✅ — použijeme pro upload emote obrázku |
| `cloudinary.ts` URL builder | ✅ — použijeme pro `imageId → URL` |
| WS klient (existující connection per-world) | ✅ — přidat handler `emote:created` / `emote:deleted` |
| Roadmap link `/admin/emotes` → 6.4 | ✅ — registrace v `WorldLayout` + `IkarosLayout` |

### 3.4 Frontend — co dostavíme

```
src/features/world/chat/emotes/                # NOVÁ podsložka pod world chat
├── api/
│   ├── useWorldEmotes.ts                      # GET /emotes/:worldId + WS sync
│   ├── useCreateEmote.ts                      # POST /emotes/:worldId
│   ├── useDeleteEmote.ts                      # DELETE /emotes/:worldId/:id
│   └── useCopyEmote.ts                        # POST /emotes/:worldId/:id/copy
├── components/
│   ├── EmoteUploadDialog.tsx                  # upload obrázku + shortcode + name
│   ├── EmoteUploadDialog.module.css
│   ├── EmoteCard.tsx                          # jedna karta v gridu (image + shortcode + delete + copy)
│   ├── EmoteCard.module.css
│   ├── EmoteGrid.tsx                          # responsivní grid karet
│   └── EmoteGrid.module.css
└── lib/
    ├── buildEmoteUrl.ts                       # imageId → Cloudinary URL (c_limit,w_128,h_128)
    ├── mergeEmoteSets.ts                      # union per-svět + globální; per-svět priorita
    └── validateEmoteFile.ts                   # FE guard: type + size

src/features/world/pages/WorldEmotesAdminPage/ # NOVÁ stránka /svet/:worldSlug/admin/emotes
├── WorldEmotesAdminPage.tsx
└── WorldEmotesAdminPage.module.css

src/features/world/chat/api/
└── useGlobalEmotes.ts                         # GET /emotes/global (sdílený s ikaros admin)

src/features/ikaros/pages/IkarosEmotesAdminPage/ # NOVÁ /ikaros/admin/emotes
├── IkarosEmotesAdminPage.tsx
└── api/
    ├── useCreateGlobalEmote.ts                # POST /emotes/global
    └── useDeleteGlobalEmote.ts                # DELETE /emotes/global/:id

src/features/world/chat/components/
├── ChannelComposer.tsx                        # ROZŠÍŘENO — emoji popover dostane sekce world/global
└── EmojiPopover.tsx (či ekvivalent)           # ROZŠÍŘENO — render custom emote sekcí
```

⚠️ **Pozn. ke struktuře:** Emote API hooky a komponenty žijí pod `features/world/chat/emotes/` (analogicky `features/world/chat/dice/` z 6.3) — emotes jsou primárně chat-feature. Admin **stránka** ale spadá pod `features/world/pages/` (paralela ostatních admin stránek). To je intentional separation: data layer s chatem, page-level UI s ostatními pages.

### 3.5 Vstup ze starého Matrixu

| Soubor | Port? | Pozn. |
|---|---|---|
| `WorldEmotesAdmin.tsx` (komponenta z `frontend/src/components/...`) | ⚠️ inspirace | Layout grid + upload modal. Nepoužijeme 1:1 — UI je z 2019, jdeme s `frontend-design` auditem. |
| `docs/old/emotes.md` | ✅ kontext | Datový model starý vs. nový — `ImageId` zde = Cloudinary `publicId` místo Google Drive. |
| Žádný roll engine / lib pro samotné emotes — primitivní substituce | — | — |

---

## 4. Návrh řešení

### 4.1 BE — drobné doplňky (6.4a)

**`emotes.service.ts`:**

```ts
async deleteFromWorld(id: string, worldId: string): Promise<void> {
  const emote = await this.repo.findById(id);
  if (!emote || emote.worldId !== worldId) throw new NotFoundException({ code: 'EMOTE_NOT_FOUND' });
  await this.repo.deleteById(id);
  this.eventEmitter.emit('emote.deleted', { worldId, emoteId: id });  // NOVĚ
}

async deleteGlobal(id: string): Promise<void> {
  const emote = await this.repo.findById(id);
  if (!emote || emote.worldId !== null) throw new NotFoundException({ code: 'GLOBAL_EMOTE_NOT_FOUND' });
  await this.repo.deleteById(id);
  this.eventEmitter.emit('emote.deleted', { worldId: null, emoteId: id });  // NOVĚ
}

async create(worldId: string, dto: CreateEmoteDto, userId: string): Promise<CustomEmote> {
  const count = await this.repo.countByWorldId(worldId);   // NOVĚ
  if (count >= 100) throw new ConflictException({ code: 'EMOTE_LIMIT_REACHED', message: 'Svět má max 100 emotes' });
  // ... zbytek beze změny
}

async createGlobal(dto: CreateEmoteDto, userId: string): Promise<CustomEmote> {
  const count = await this.repo.countGlobal();             // NOVĚ
  if (count >= 200) throw new ConflictException({ code: 'EMOTE_LIMIT_REACHED' });
  // ... zbytek beze změny
}
```

**`emotes.gateway.ts`:**

```ts
@OnEvent('emote.deleted')
handleEmoteDeleted(payload: { worldId: string | null; emoteId: string }): void {
  if (payload.worldId) {
    this.server.to(`world:${payload.worldId}`).emit('emote:deleted', { emoteId: payload.emoteId });
  } else {
    // globální — broadcast všem připojeným (každý svět by měl invalidovat globální cache)
    this.server.emit('emote:deleted-global', { emoteId: payload.emoteId });
  }
}
```

**Repository přírůstky** (`ICustomEmotesRepository` interface + Mongo impl):

```ts
countByWorldId(worldId: string): Promise<number>;
countGlobal(): Promise<number>;
```

### 4.2 FE — render napojení (6.4b)

**`useWorldEmotes.ts`:**

```ts
export interface WorldEmote {
  id: string;
  worldId: string | null;
  name: string;
  shortcode: string;
  imageId: string;
  createdBy: string;
  createdAt: string;
}

export function useWorldEmotes(worldId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['world-emotes', worldId],
    queryFn: async () => {
      const res = await apiClient.get<WorldEmote[]>(`/emotes/${worldId}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // WS sync
  useEffect(() => {
    const sock = getWorldSocket(worldId);
    const onCreated = (emote: WorldEmote) => {
      queryClient.setQueryData<WorldEmote[]>(['world-emotes', worldId], (prev) => [emote, ...(prev ?? [])]);
    };
    const onDeleted = ({ emoteId }: { emoteId: string }) => {
      queryClient.setQueryData<WorldEmote[]>(['world-emotes', worldId], (prev) => prev?.filter((e) => e.id !== emoteId));
    };
    sock.on('emote:created', onCreated);
    sock.on('emote:deleted', onDeleted);
    return () => { sock.off('emote:created', onCreated); sock.off('emote:deleted', onDeleted); };
  }, [worldId, queryClient]);

  return query;
}
```

**`useGlobalEmotes.ts`** — analogicky, ale `queryKey: ['global-emotes']`, WS `emote:deleted-global`. Globální cache sdílená napříč světy.

**`buildEmoteUrl.ts`:**

```ts
export function buildEmoteUrl(imageId: string): string {
  return buildCloudinaryUrl(imageId, { transformation: 'c_limit,w_128,h_128,f_auto,q_auto' });
}
```

**`mergeEmoteSets.ts`:**

```ts
export function mergeEmoteSets(worldEmotes: WorldEmote[], globalEmotes: WorldEmote[]): WorldEmoteSet {
  const byShortcode = new Map<string, string>();
  // globální nejdřív, per-svět je přepíše (priorita)
  globalEmotes.forEach((e) => byShortcode.set(e.shortcode.toLowerCase(), buildEmoteUrl(e.imageId)));
  worldEmotes.forEach((e) => byShortcode.set(e.shortcode.toLowerCase(), buildEmoteUrl(e.imageId)));
  return { byShortcode };
}
```

**`WorldChatRoom.tsx`** (rozšíření):

```tsx
const { data: worldEmotes = [] } = useWorldEmotes(worldId);
const { data: globalEmotes = [] } = useGlobalEmotes();
const emoteSet = useMemo(() => mergeEmoteSets(worldEmotes, globalEmotes), [worldEmotes, globalEmotes]);

// předat dolů přes context nebo přímo props do ChannelView → MessageItem → renderChatContent
```

📚 **Proč context, ne props drilling?** `MessageItem` je hluboko v stromu (`WorldChatRoom > ChannelView > MessageList > MessageItem`). Drilling `worldEmotes` přes 4 vrstvy by zbytečně rebuilovalo memo. Lepší řešení: `WorldEmotesContext` poskytuje set; `MessageItem` ho čte přes `useContext`. ⚠️ Alternativa: rozšířit existující world-scoped context (pokud existuje něco jako `WorldDataContext`). Zkontrolovat při implementaci.

### 4.3 FE — PJ admin per-svět (6.4c)

**Route:** `/svet/:worldSlug/admin/emotes` (registrace v `WorldRouter`).

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Custom emoty světa                          [+ Nový emote]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐    │
│  │ img │  │ img │  │ img │  │ img │  │ img │  │ img │    │
│  │     │  │     │  │     │  │     │  │     │  │     │    │
│  │:sml:│  │:hrt:│  │:thx:│  │:lol:│  │:omg:│  │:pog:│    │
│  │Smile│  │Heart│  │Thanks│ │LOL  │  │OMG  │  │Pog  │    │
│  │ 🗑 ↪│  │ 🗑 ↪│  │ 🗑 ↪│  │ 🗑 ↪│  │ 🗑 ↪│  │ 🗑 ↪│    │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘    │
│                                                              │
│  ... (další karty wrapují)                                  │
│                                                              │
│  Využito: 8 / 100 emotů                                     │
└─────────────────────────────────────────────────────────────┘
```

**Karta:**
- 96 × 96 px náhled obrázku (desktop) / 80 × 80 mobil
- pod obrázkem: `:shortcode:` (monospace) + `Name` (sans)
- akce: 🗑 smazat (confirm), ↪ zkopírovat do jiného světa (modal s výběrem světa)

**Upload modal:**

```
┌──────────────────────────────────────┐
│  Nový emote                       ✕  │
├──────────────────────────────────────┤
│                                       │
│   ┌─────────────────────────────┐    │
│   │    [Drag & drop obrázek]    │    │
│   │     nebo klikni             │    │
│   │  PNG, JPG, GIF, WebP        │    │
│   │  max 512 KB                 │    │
│   └─────────────────────────────┘    │
│                                       │
│   Náhled:  [img]                      │
│                                       │
│   Shortcode:   :[___________]:        │
│   (a-z, 0-9, _, 2-32 znaků)          │
│                                       │
│   Název:       [_______________]      │
│                                       │
│              [Zrušit] [Nahrát]        │
└──────────────────────────────────────┘
```

**Flow uploadu:**
1. User zvolí soubor → FE validuje (`validateEmoteFile`) → ukáže náhled.
2. User vyplní shortcode + name (s live validací: shortcode regex, kolize check disabled — necháme BE 409).
3. Klik „Nahrát" → `useUploadImage(file)` → `{ publicId }` → `useCreateEmote({ shortcode, name, imageId: publicId })`.
4. Úspěch → modal zavře, grid se updatuje optimisticky (WS event přijde a confirmuje).
5. BE 409 `EMOTE_SHORTCODE_TAKEN` → toast + zvýraznit shortcode input.

⚠️ **Edge case:** user uploadne obrázek, ale create se nepodaří (kolize shortcode) → obrázek visí na Cloudinary jako orphaned. **Akceptujeme** — cleanup orphans je zvláštní úloha, mimo 6.4 (dluh `D-NEW-cloudinary-orphan-cleanup`). Storage cost je trivial pro 128 px obrázky.

### 4.4 FE — Admin globální (6.4d)

**Route:** `/ikaros/admin/emotes`.

Stejný UI pattern jako 6.4c, ale:
- Header: „Globální emoty platformy"
- Limit: 200
- Endpoint: `/emotes/global` místo `/emotes/:worldId`
- Žádný „kopírovat do jiného světa" (nemá smysl — globální už je všude)
- Reuse `EmoteGrid` + `EmoteUploadDialog` komponenty (props variant: `'world' | 'global'`)

Vstup do stránky: levý nav Ikaros panel získá novou položku „Emoty" — viditelná jen pro `UserRole.Admin+`.

### 4.5 FE — Picker v composeru (6.4e)

**Existující stav:** `ChannelComposer` má 😊 tlačítko → otevírá `EmojiPopover` (z fáze 4, pravděpodobně rendering jen statických `EMOTES`).

**Rozšíření:** popover dostane **3 sekce** (tabs nebo collapsible):

```
┌──────────────────────────────────┐
│  Vyhledat:  [____________]       │
├──────────────────────────────────┤
│ 🌍 Tohoto světa (8)              │
│   [:smile:] [:heart:] [:thx:]    │
│   [:lol:] [:omg:] [:pog:] ...    │
├──────────────────────────────────┤
│ ✨ Globální (12)                  │
│   [:thumbsup:] [:bulb:] [:fire:] │
│   [:star:] [:eyes:] ...          │
├──────────────────────────────────┤
│ 😀 Statické (Unicode)            │
│   [:smile:] [:heart:] ...        │
└──────────────────────────────────┘
```

- Klik na emote → insert `:shortcode:` na pozici kurzoru v composer textarea.
- Search input filtruje napříč sekcemi (matches v shortcode OR name).
- Pokud world nemá žádné emotes → sekce „Tohoto světa" se skryje (ne empty state — sníží šum).
- Pokud žádné globální → sekce skrytá analogicky.

📚 **Proč zachovat statické emoji?** Statické (`:smile:` → 😊 Unicode) jsou součástí fáze 4 a fungují bez závislostí. Custom emotes nadstavují (priorita), nenahrazují. User v každém případě uvidí statickou variantu pokud world nemá vlastní.

### 4.6 FE — WS handler (6.4f)

Žije v hooku `useWorldEmotes` (viz §4.2 ukázka). Klíčové:
- `emote:created` → optimistic prepend do cache.
- `emote:deleted` → filter z cache.
- `emote:deleted-global` (globální broadcast) → handler v `useGlobalEmotes`.

⚠️ **Connection scope:** WS klient existuje per-svět. Globální events (`emote:deleted-global`) jdou na všechny klienty — ale klient může být připojený k víc světům paralelně? **Ověřit při implementaci** — jestli existuje global socket, nebo zda každý world socket dostane všechny global broadcasty. Pokud jen world sockety: `globalSocket.emit('emote:deleted-global', ...)` v gateway je špatně, server.emit() pošle všem, OK.

---

## 5. UX / responsivita

| Breakpoint | Admin grid | Upload modal | Picker popover |
|---|---|---|---|
| **Mobil ≤ 768 px** | 2 sloupce, karty 80×80 + popisek pod | Full-screen modal, 1 column | Bottom-sheet slide-up, 6 emotes na řádek |
| **Tablet 769–1024 px** | 4 sloupce, karty 96×96 | Centered 90vw max 480 px | Popover 320 px anchored |
| **Desktop > 1024 px** | 6–8 sloupců (CSS `repeat(auto-fill, minmax(96px, 1fr))`) | Centered 480 px | Popover 360 px anchored |

Touch terče ≥ 44 px (mazací tlačítka v kartě, picker emote tiles).

Empty stav (admin):
- Per-svět: „Tento svět zatím nemá žádné vlastní emoty. Klikni na **Nový emote** výše." + drobná Ikaros ilustrace.
- Globální: „Platforma zatím nemá žádné globální emoty." (Admin-only viditelné).

`mobil-desktop` audit povinný po implementaci.

---

## 6. Akceptační kritéria

### 6.4a — BE doplňky
- [ ] `emotes.service.spec.ts` test: `deleteFromWorld` emituje `emote.deleted` event.
- [ ] `emotes.service.spec.ts` test: `create` při 100+ emotech vrátí 409 `EMOTE_LIMIT_REACHED`.
- [ ] `EmotesGateway` má handler `@OnEvent('emote.deleted')` který broadcastuje `emote:deleted`.
- [ ] Repository přidána `countByWorldId` / `countGlobal`.

### 6.4b — Render
- [ ] `WorldChatRoom` mount načte `world-emotes/:worldId` + `global-emotes` (paralelně).
- [ ] `renderChatContent` dostane sloučenou `worldEmotes` mapu.
- [ ] Zpráva s `:smile:` (kde svět má `smile`) renderuje `<img>` (DOM check: `.emote` class + `alt=":smile:"`).
- [ ] Kolize: per-svět `:smile:` přebije globální `:smile:`.
- [ ] Neznámý shortcode (`:xyz123:` který v sadě není) zůstane jako plain text.
- [ ] Smazání emote nepřemaluje historii zpráv → text `:smile:` se zobrazí jako plain text retroaktivně (akceptováno, BE neukládá rendered HTML).

### 6.4c — PJ admin per-svět
- [ ] Route `/svet/:worldSlug/admin/emotes` přístupná jen pro `PomocnyPJ+`.
- [ ] Grid karet zobrazuje všechny emoty světa, řazení sestupně dle `createdAt`.
- [ ] „Nový emote" → upload modal → po úspěchu karta se objeví v gridu (optimistic + WS confirm).
- [ ] FE guard: soubor > 512 KB → toast, upload se neprovede.
- [ ] FE guard: jiný formát než PNG/JPG/GIF/WebP → toast.
- [ ] Mazání s confirm dialogem; po úspěchu karta zmizí (WS).
- [ ] Tlačítko „Kopírovat do jiného světa" → modal s SelectField světů kde PJ má `PomocnyPJ+`, po zvolení volá `POST /emotes/:srcWorld/:emoteId/copy`.
- [ ] Citizen counter „Využito: X / 100" pod gridem.
- [ ] BE 409 `EMOTE_LIMIT_REACHED` → toast „Svět dosáhl limitu 100 emotů. Smaž nepoužívané."

### 6.4d — Admin globální
- [ ] Route `/ikaros/admin/emotes` přístupná jen pro `UserRole.Admin+`.
- [ ] Položka v levém Ikaros nav „Emoty" (jen Admin+).
- [ ] Grid + upload modal funguje analogicky k 6.4c, bez tlačítka kopírovat.
- [ ] Limit 200.

### 6.4e — Picker v composeru
- [ ] 😊 v composeru otevře popover se sekcemi (Tohoto světa / Globální / Statické).
- [ ] Sekce „Tohoto světa" / „Globální" skryté pokud prázdné.
- [ ] Klik na emote vloží `:shortcode:` na pozici kurzoru.
- [ ] Search filtruje napříč sekcemi (match v `shortcode` nebo `name`).

### 6.4f — WS sync
- [ ] PJ vytvoří emote v admin → ostatní otevřený chat klient ihned vidí emote v pickeru bez F5.
- [ ] PJ smaže emote → ostatním okamžitě zmizí z pickeru (zprávy s tím shortcode se přemalují na plain text při dalším re-renderu).
- [ ] Admin smaže globální emote → broadcast jde všem online klientům (test: 2 prohlížeče ve 2 různých světech).

### Cross-cutting
- [ ] `mobil-desktop` audit OK.
- [ ] `npm run typecheck` zelený.
- [ ] `npm run test` (FE) zelený — `mergeEmoteSets.spec.ts`, `validateEmoteFile.spec.ts`, `useWorldEmotes.spec.tsx`.
- [ ] BE `npm run test` zelený — `emotes.service.spec.ts` aktualizovaný o nové testy.
- [ ] `napoveda` aktualizovaná o novou admin stránku + funkcionalitu emotes pro hráče.

---

## 7. Mimo rozsah / dluhy

| Položka | Důvod odložení | Cíl |
|---|---|---|
| Update emote (rename shortcode / nahradit obrázek) | BE neumí; re-create stačí. Risk: změnit shortcode po napsání zpráv = orphany. | Dluh `D-NEW-emote-update` |
| Cleanup orphaned Cloudinary obrázků | Storage je cheap, manual cleanup acceptable | Dluh `D-NEW-cloudinary-orphan-cleanup` |
| Animované GIF render optimalizace (pause on hover, lazy decode) | Performance, ne MVP | Dluh `D-NEW-emote-gif-perf` |
| Emote reactions (jako Discord, klik na emote = reakce na zprávu) | Reakce mají vlastní existující systém (fáze 4); custom emote v reakcích = nadstavba | Fáze 13 |
| Emote autocomplete v textarea (`:sm` → dropdown s `:smile:` / `:smirk:`) | UX nadstavba; picker stačí pro MVP | Dluh `D-NEW-emote-autocomplete` |
| Statistika použití emote (kolikrát byl použit) | Analytics nadstavba | Fáze 13 |
| Export / import emote sady mezi instancemi | Migration tool, ne user feature | nikdy / DevOps |
| Sound emotes / mp3 přehrávané při použití | Mimo MVP | Fáze 13.3 (zvuky) |
| Emote kategorie / tagy v PJ admin | Když svět má > 30 emotes, hodí se. MVP postačí flat list. | Dluh `D-NEW-emote-categories` |

---

## 8. Rozhodnutí PJ k odsouhlasení

1. **Globální emotes v rozsahu 6.4** = ANO. BE endpointy jsou hotové, roadmap zmiňuje `/admin/emotes` → 6.4. Bez extra úsilí dodáme. *(Možnost: vyhodit a nechat na Admin fáze později.)*
2. **Picker v composeru** = v rozsahu (rozšíření existujícího 😊 popoveru). *(Možnost: nechat jen rendering + admin a picker až později.)*
3. **Default skin/dataset pro nový svět** = prázdná sada. PJ si emoty nahraje sám podle gustu světa. *(Možnost: seed pár obecných po vytvoření světa — fakultativní.)*
4. **Soft limit per svět** = 100 emotes. *(Možnost: jiné číslo.)*
5. **Max velikost uploadu** = 512 KB. Render přes Cloudinary transform = max 128×128 px. *(Možnost: jiný limit / dimenze.)*
6. **Per-svět prioritní override globálních** = ANO. Svět může „přepsat" globální `:smile:` vlastní variantou. *(Možnost: globální mají prioritu, nebo collision = error při uploadu.)*

---

**Po schválení tohoto spec:**
1. Spustím `frontend-design` skill jako design audit (vizuál admin gridu, upload modalu, picker rozšíření).
2. Napíšu `plan-6.4.md` s konkrétními úkoly (BE doplňky + FE struktura + napojení).
3. Implementace → mobil-desktop audit → `napoveda` update → zaškrtnutí 6.4 v roadmapě.
