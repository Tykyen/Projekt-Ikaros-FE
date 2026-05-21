# Spec 6.5 — Správa kanálů a konverzací (PJ)

**Status:** ✅ Hotovo (2026-05-21)
**Rozsah:** FE (drag-drop reorder, picker barvy + ikony kanálu, dotažení dialogů) + drobné BE doplňky (`color` / `iconKey` na `ChatGroup`, bulk reorder endpoint, WS event)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE)
**Velikost:** odhad ~8 FE souborů / ~700 ř. + ~3 BE soubory / ~120 ř.
**Autor:** PJ + Claude
**Datum:** 2026-05-21
**Souvisí:** [spec-6.1.md](spec-6.1.md) (§4.6 zakládání + §3.1 chat REST + §3.2 prezentační vrstva), `docs/old/chat-skupiny.md` (starý Matrix `ChatGroupManager` — port).

> Cíl: dokončit administraci světového chatu — PJ/Pomocný PJ ovládá **pořadí** kanálů a konverzací (drag-drop), **barvu + ikonu** kanálu, a má jistotu, že **editace / mazání / nastavení přístupu** (které 6.1f vtáhl) pokrývá všechny případy. Po tomto kroku má 6.5 splněnou roadmapovou kapitolu a Fáze 6 = chat je z administrátorského hlediska kompletní.

---

## 0. Názvosloví

Dědí z [spec-6.1.md §0](spec-6.1.md). Připomenutí:
- **Kanál** (UI) = `ChatGroup` (BE) — sbalovací kontejner v sidebaru.
- **Konverzace** (UI) = `ChatChannel` (BE) — chatovací místnost uvnitř kanálu.
- **Reorder** = změna pole `order` na entitě; v UI drag-drop. Bulk operace, ne PATCH po jednom.

---

## 1. Cíl

1. **6.5a — Reorder kanálů (drag-drop):** PJ chytne kanál v sidebaru, přetáhne nahoru/dolů. Persist na BE bulk endpoint `PATCH /worlds/:worldId/chat/groups/reorder`. WS broadcast `chat:groups:reordered`.
2. **6.5b — Reorder konverzací (drag-drop):** PJ chytne konverzaci uvnitř kanálu, přetáhne v rámci stejného kanálu. (Přesun mezi kanály už řeší `groupId` select v `ChannelDialog` z 6.1f — drag-drop **mezi** kanály mimo rozsah, viz §7.) Endpoint `PATCH /worlds/:worldId/chat/channels/reorder`. WS `chat:channels:reordered`.
3. **6.5c — Barva + ikona kanálu:** `ChatGroup` dostane volitelná pole `color` (preset slot 0–11) a `iconKey` (string z předdefinované sady). `GroupDialog` (6.1f) se rozšíří o picker. Default fallback = deterministický slot z `groupColorSlot()` (paleta 6 → rozšíříme na 12) + žádná ikona.
4. **6.5d — Audit edit/mazání UX:** projít existující `GroupDialog` / `ChannelDialog` z 6.1f, ověřit pokrytí roadmapy 6.5 (accessMode, allowedRoles, allowedMemberIds, přesun mezi kanály) → pokud něco chybí, doplnit; jinak označit jako hotové bez kódu.
5. **6.5e — `mobil-desktop` + `napoveda`:** drag-drop touch sensory, drag handle terč ≥ 44 px, mobilní fallback (long-press → ↑↓ tlačítka pokud touch drag selže), aktualizace `/ikaros/napoveda` o správě chatu pro PJ.

---

## 2. Kontext / motivace

Krok 6.1f vtáhl **zakládání** kanálů/konverzací a — jak ukázal audit současného stavu (§3.2) — implementace **přeskočila scope** a dodala i **editaci a mazání** (`mode: 'create' | 'edit'` na obou dialozích, `Trash2` button s confirm). Roadmapa 6.5 tedy byla psaná dřív, než vzniklo 6.1f, a její první dvě odrážky („Editace / mazání", „Nastavení konverzace — accessMode/roles/members") jsou **fakticky hotové**. Zbývá:

- **Reorder** — totálně chybí, ani BE endpoint nemá.
- **Ikona / barva kanálu** — chybí jako schema pole i UI. Starý Matrix měl `Icon` + `Color` + `Background` na `ChatGroup`; vracíme se k tomu (bez `Background`, viz §7).
- **`order` field konverzace v UI** — momentálně needitovatelný, drag-drop ho vyřeší.

📚 **Co je to bulk reorder endpoint?** Místo `PATCH groups/:id { order: 3 }` po jednom (= N requestů + race condition při souběhu) pošleme jeden request s polem `[{id, order}]`. BE v jedné transakci přepíše. Klient i ostatní sokety dostanou jednu konzistentní informaci.

⚠️ **Nesrovnalost mezi roadmapou a 6.1f:** roadmapa 6.5 říká „zbývá editace, mazání, reorder", ale 6.1f dodal editaci+mazání. **Řešení:** spec 6.5 to explicitně přiznává, redukuje rozsah, a v Fázi 3 (zaškrtnutí roadmapy) odrážku „Editace / mazání" označí jako hotovou s odkazem na 6.1f commit.

---

## 3. Audit současného stavu

### 3.1 Backend — co modul `chat` **už umí** (relevantní pro 6.5)

| Endpoint | Stav | Pozn. |
|---|---|---|
| `PATCH /worlds/:worldId/chat/groups/:groupId` | ✅ | DTO `UpdateGroupDto` = `{ name?, order?, imageUrl? }` |
| `DELETE /worlds/:worldId/chat/groups/:groupId` | ✅ | Kaskáda na konverzace + soft-delete zpráv |
| `PATCH /worlds/:worldId/chat/channels/:channelId` | ✅ | DTO = `{ name?, accessMode?, allowedRoles?, allowedMemberIds?, order?, type?, imageUrl?, groupId? }` |
| `DELETE /worlds/:worldId/chat/channels/:channelId` | ✅ | Soft-delete zpráv |
| WS `chat:group:updated` / `:deleted` | ✅ | `chat.gateway.ts` |
| WS `chat:channel:updated` / `:deleted` | ✅ | `chat.gateway.ts` |
| Pole `ChatGroup.order: number` | ✅ | Default 0 |
| Pole `ChatChannel.order: number` | ✅ | Default 0 |
| Pole `ChatGroup.imageUrl?: string` | ✅ | 6.1f |
| Pole `ChatChannel.imageUrl?: string` | ✅ | 6.1f |

### 3.2 Backend — co chybí (doplníme v 6.5)

| # | Nález | Řešení |
|---|---|---|
| **B1** | `ChatGroup` nemá `color` ani `iconKey` field. | Schema `chat-group.schema.ts` přidat `@Prop() color?: string` (preset slot `'0'..'11'`) + `@Prop() iconKey?: string`. `UpdateGroupDto` rozšířit o oba (`@IsOptional() @IsString() @MaxLength(8)`). |
| **B2** | Žádný bulk reorder endpoint. | `POST /worlds/:worldId/chat/groups/reorder` s body `{ items: { id: string; order: number }[] }`. Service `reorderGroups(worldId, items, user)` — validate ownership všech ID, jedna `bulkWrite` updates, emit `chat.groups.reordered`. Stejně pro channels: `POST .../chat/channels/reorder` s validací, že všechny `channelId` patří do daného `worldId` (a volitelně všechny do téhož `groupId`, viz §4.1). |
| **B3** | Žádný WS event po reorderu. | Gateway handler `@OnEvent('chat.groups.reordered')` → broadcast `chat:groups:reordered` do `world:{worldId}` s payloadem `{ worldId, items: { id, order }[] }`. Analogicky `chat:channels:reordered` s navíc `groupId`. |
| **B4** | DTO `UpdateGroupDto` nemá `@MaxLength` na `imageUrl`. | Drobnost — dodat `@MaxLength(512)` paralelně k `UpdateChannelDto`. |

### 3.3 Frontend — co máme (relevantní pro 6.5)

| Místo | Stav | Pozn. |
|---|---|---|
| `GroupDialog.tsx` | ✅ create + edit + delete (name, imageUrl) | Rozšíříme o color + iconKey picker (6.5c) |
| `ChannelDialog.tsx` | ✅ create + edit + delete (name, groupId, accessMode, roles, members, imageUrl) | Bez změn — pokrývá roadmap odrážky „Nastavení konverzace" |
| `ChannelGroup.tsx` | ✅ render kanálu + `Settings` button | Přidáme drag handle (☰) + integrace `@dnd-kit` Sortable |
| `ChannelItem.tsx` | ✅ render konverzace + Settings button | Přidáme drag handle pro konverzace v rámci kanálu |
| `ChannelSidebar.tsx` | ✅ kompozice kanálů | Wrap do `DndContext` + `SortableContext` (na 2 úrovních: groups + channels-per-group) |
| `useChannelMutations.ts` | ✅ create/update/delete hooky | Přidáme `useReorderGroups`, `useReorderChannels` |
| `groupColor.ts` (`GROUP_COLOR_SLOTS = 6`) | ✅ deterministický fallback | Rozšíříme na 12 slotů (palette doplníme v `chatSkin.css`) + nový helper `groupColorVarFor(group)`, který preferuje `group.color`, fallback na `groupColorSlot(id)` |
| Drag-drop knihovna | ❌ chybí v `package.json` | Instalujeme `@dnd-kit/core` + `@dnd-kit/sortable` (~25 KB gzipped, accessible, touch sensory) |
| Ikona kanálu render | ❌ není | `ChannelGroup` aktuálně renderuje `imageUrl` jako thumb nebo prázdný `spine`. Přidáme: pokud `iconKey`, render `<DynamicIcon name={iconKey} size={14} />` z předdefinované mapy lucide ikon. Priorita render: `imageUrl` > `iconKey` > spine |

### 3.4 Frontend — co dostavíme

```
src/features/world/chat/
├── api/
│   └── useChannelMutations.ts                    # ROZŠÍŘENO — useReorderGroups, useReorderChannels
├── components/
│   ├── ChannelSidebar.tsx                        # ROZŠÍŘENO — DndContext + 2 SortableContext
│   ├── ChannelGroup.tsx                          # ROZŠÍŘENO — drag handle, render iconKey
│   ├── ChannelItem.tsx                           # ROZŠÍŘENO — drag handle
│   ├── GroupDialog.tsx                           # ROZŠÍŘENO — color picker + icon picker
│   ├── GroupColorPicker.tsx                      # NOVÝ — 12 preset chips
│   ├── GroupIconPicker.tsx                       # NOVÝ — grid lucide ikon
│   └── *.module.css                              # styly drag handlu + pickerů
└── lib/
    ├── groupColor.ts                             # ROZŠÍŘENO — 12 slotů + groupColorVarFor()
    └── groupIcons.ts                             # NOVÝ — mapa iconKey → LucideIcon

package.json                                       # + @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
```

### 3.5 Starý Matrix (referenční)

`ChatGroup` měl `Icon`, `Background`, `Color`, `Order`. UI: reorder se dělal ručně přes editaci `Order` integer (žádný drag-drop). Ikona = emoji nebo URL. Background = CSS gradient / image — komplexní, často visuálně rozbíjelo.

**Co bereme:** `Color` (jako preset slot, ne free hex), `Icon` (jako iconKey z curated sady, ne libovolné emoji/URL).
**Co necháváme:** `Background` (visuálně nadbytečné — sidebar má jeden theme; per-kanál background by tříštil layout). `Order` integer ruční editace (drag-drop UX > spinner).

---

## 4. Návrh řešení

### 4.1 BE doplňky (6.5a/b/c — část)

**`chat-group.schema.ts`:**

```ts
@Prop() imageUrl?: string;
@Prop() color?: string;     // '0'..'11' string preset slot; '' / undefined = auto
@Prop() iconKey?: string;   // string z mapy (viz §4.4); '' / undefined = bez ikony
```

**`UpdateGroupDto`:**

```ts
@IsOptional() @IsString() @MaxLength(64) name?: string;
@IsOptional() @IsInt() order?: number;
@IsOptional() @IsString() @MaxLength(512) imageUrl?: string;
@IsOptional() @IsString() @Matches(/^([0-9]|1[01])$/) color?: string;     // '0'..'11'
@IsOptional() @IsString() @Matches(/^[a-z0-9-]{1,32}$/) iconKey?: string;
```

**Reorder endpointy** (`chat.controller.ts` + service):

```ts
// POST /worlds/:worldId/chat/groups/reorder
@Post('groups/reorder')
async reorderGroups(
  @Param('worldId') worldId: string,
  @Body() dto: ReorderGroupsDto,
  @User() user: UserClaims,
): Promise<void> {
  await this.chatService.reorderGroups(worldId, dto.items, user);
}

// POST /worlds/:worldId/chat/channels/reorder
@Post('channels/reorder')
async reorderChannels(
  @Param('worldId') worldId: string,
  @Body() dto: ReorderChannelsDto,
  @User() user: UserClaims,
): Promise<void> {
  await this.chatService.reorderChannels(worldId, dto.items, user);
}
```

**`ReorderGroupsDto`:**

```ts
class ReorderItemDto {
  @IsMongoId() id!: string;
  @IsInt() @Min(0) order!: number;
}

class ReorderGroupsDto {
  @ValidateNested({ each: true }) @ArrayMinSize(1) @ArrayMaxSize(50)
  @Type(() => ReorderItemDto) items!: ReorderItemDto[];
}
```

Analogicky `ReorderChannelsDto` (`@ArrayMaxSize(200)`).

**Service `reorderGroups`:**

1. `canManageChat(worldId, user)` — guard PJ+.
2. Načti všechny `ChatGroup` se zadanými ID, ověř `worldId` match (jinak 400 `INVALID_GROUP`).
3. `bulkWrite` updateOne pro každou (jedna DB roundtrip).
4. Emit `chat.groups.reordered` event s `{ worldId, items }`.

`reorderChannels` analogicky + navíc validuje, že **všechny channely jsou ve stejné `groupId`** — drag-drop mezi kanály mimo rozsah (viz §7). Pokud client pošle různé groupId → 400 `MIXED_GROUPS`.

**Gateway:**

```ts
@OnEvent('chat.groups.reordered')
handleGroupsReordered(payload: { worldId: string; items: { id: string; order: number }[] }) {
  this.server.to(`world:${payload.worldId}`).emit('chat:groups:reordered', payload);
}

@OnEvent('chat.channels.reordered')
handleChannelsReordered(payload: { worldId: string; groupId: string; items: { id: string; order: number }[] }) {
  this.server.to(`world:${payload.worldId}`).emit('chat:channels:reordered', payload);
}
```

### 4.2 FE — drag-drop integrace (6.5a/b)

**Knihovna:** `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`. Důvod volby:
- Native accessibility (keyboard support `Space` pick → ↑/↓ → `Space` drop).
- Touch sensory s configurable activation delay (long-press 250 ms → drag) — chrání před omylem při tap-scrollu.
- React-friendly API, zero CSS imports (styly si píšeme sami).
- ~25 KB gzipped — akceptovatelné.

⚠️ Alternativy zvažované: `react-beautiful-dnd` (deprecated, nemá React 18 podporu), `framer-motion` Reorder (krásné API, ale není accessible — keyboard rebuild od nuly), `sortablejs` (imperative DOM, špatně se to mountuje s React stromem). `@dnd-kit` je current best-practice.

**`ChannelSidebar.tsx`** (zjednodušený náčrt):

```tsx
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
);

const handleGroupDragEnd = (e: DragEndEvent) => {
  if (!e.over || e.active.id === e.over.id) return;
  const oldIdx = groupIds.indexOf(String(e.active.id));
  const newIdx = groupIds.indexOf(String(e.over.id));
  const reordered = arrayMove(groupIds, oldIdx, newIdx);
  // optimistic update cache
  queryClient.setQueryData(['chat-groups', worldId], (old) => reorderInCache(old, reordered));
  // persist
  reorderGroups.mutate(reordered.map((id, i) => ({ id, order: i })));
};

return (
  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
    <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
      {groups.map((g) => <SortableChannelGroup key={g.id} group={g} ... />)}
    </SortableContext>
  </DndContext>
);
```

Pro konverzace **uvnitř** kanálu — vlastní vnořený `DndContext` + `SortableContext` per kanál (každý kanál izolovaná drag zóna). Drag mezi kanály = mimo rozsah; PJ použije `ChannelDialog` → `groupId` select.

**Drag handle:**
- Desktop: `<GripVertical size={12} />` (lucide) vlevo od názvu, viditelný **jen pro PJ+** (`canManage`) a **jen na hover** kanálu (na mobilu pořád). Cursor `grab`.
- Mobil: handle pořád viditelný, ≥ 44 px touch terč.
- ARIA: `role="button"` + `aria-label="Přesunout kanál {name}"`.

📚 **Proč `activationConstraint: { distance: 8 }`?** Bez tohoto by každé kliknutí na handle začalo drag. 8 px threshold = uživatel musí myší/prstem posunout, aby se drag aktivoval; čistý klik (např. když uživatel jen klikne na handle omylem) drag nezapne.

⚠️ **Edge case — drag během načítání:** pokud uživatel dragguje zatímco BE roundtrip běží, druhý drag zapíše stale order. Řešení: `useReorderGroups` má `isPending`, drag handle dostane `disabled` flag → cursor `not-allowed` + drag události ignorovány.

**WS sync:**
- `chat:groups:reordered` → setQueryData přepíše `order` u všech groups dle payloadu.
- Pokud lokální optimistic update už ten stav má (vlastní reorder), `setQueryData` je no-op (dedup podle equality).

### 4.3 FE — barva kanálu (6.5c)

**12-slotová paleta** (rozšíření stávajících 6) v `chatSkin.css`:

```css
:root {
  --chat-group-1:  /* stávajících 6 */
  --chat-group-2:
  --chat-group-3:
  --chat-group-4:
  --chat-group-5:
  --chat-group-6:
  --chat-group-7:  /* nové 6 — harmonické rozšíření (jiné odstíny) */
  --chat-group-8:
  --chat-group-9:
  --chat-group-10:
  --chat-group-11:
  --chat-group-12:
}
```

📚 **Proč 12?** 6 stačí pro deterministický fallback, ale když PJ explicitně volí, chce variabilitu (12 = běžný design count, lze zarovnat do 4×3 nebo 2×6 grid). Více než 12 začne tříštit téma světa.

**`groupColor.ts` rozšíření:**

```ts
export const GROUP_COLOR_SLOTS = 12;

export function groupColorVarFor(group: { id: string; color?: string }): string {
  // PJ explicit volba má prioritu před hashem
  if (group.color && /^([0-9]|1[01])$/.test(group.color)) {
    return `var(--chat-group-${Number(group.color) + 1})`;
  }
  return groupColorVar(group.id);
}
```

**`GroupColorPicker.tsx`:** 12 kruhových chip 28×28 (mobil 32×32) + chip „Auto" (= reset na `undefined`, fallback hash). Klik → setState. Vybraný má outline `2px solid var(--theme-accent)`.

```
┌───────────────────────────────────────────────┐
│ Barva kanálu                                  │
│  ⊘  ⬤  ⬤  ⬤  ⬤  ⬤  ⬤  ⬤  ⬤  ⬤  ⬤  ⬤  ⬤  │
│  ↑auto   1  2  3  4  5  6  7  8  9 10 11 12  │
└───────────────────────────────────────────────┘
```

### 4.4 FE — ikona kanálu (6.5c)

**`groupIcons.ts`** — curated mapa 24 ikon ze stávajícího `lucide-react`. Klíče = stable string identifikátor (ne komponentový název, kdyby lucide v budoucnu přejmenoval).

Návrh sady (4 řady × 6):

| Řada | Klíče |
|---|---|
| Komunikace | `chat`, `megaphone`, `mail`, `phone`, `users`, `at-sign` |
| Příběh | `book-open`, `scroll`, `feather`, `crown`, `swords`, `shield` |
| Žánr | `skull`, `ghost`, `star`, `moon`, `sun`, `flame` |
| Organizace | `pin`, `flag`, `bookmark`, `tag`, `folder`, `archive` |

```ts
export const GROUP_ICONS: Record<string, LucideIcon> = {
  'chat': MessageCircle,
  'megaphone': Megaphone,
  // ... atd
};

export function GroupIcon({ iconKey, size = 14 }: { iconKey?: string; size?: number }) {
  const Icon = iconKey ? GROUP_ICONS[iconKey] : null;
  return Icon ? <Icon size={size} /> : null;
}
```

**`GroupIconPicker.tsx`:** grid 6 sloupců × 4 řady, každá ikona 32×32 tile (mobil 40×40). Klik vybere; outline na vybrané. Plus chip „Bez ikony" (reset). Search nadbytečný pro 24 ikon.

**Render priority v `ChannelGroup.tsx`:**

```tsx
{group.imageUrl ? (
  <img className={s.thumb} src={group.imageUrl} alt="" />
) : group.iconKey ? (
  <span className={s.iconWrap} style={{ color: groupColorVarFor(group) }}>
    <GroupIcon iconKey={group.iconKey} size={14} />
  </span>
) : (
  <span className={s.spine} aria-hidden="true" />
)}
```

⚠️ **Konflikt s imageUrl:** pokud PJ má vyplněno obojí, `imageUrl` vyhrává (větší prostor, vyšší info density). V `GroupDialog` ukážeme upozornění „Obrázek přebije ikonu" pod icon pickerem, pokud user nahrál obrázek.

### 4.5 FE — `GroupDialog` rozšíření

Stávající (6.1f) má **2 fieldy**: název + obrázek. Přidáme:

```
┌──────────────────────────────────────────────┐
│  Upravit kanál                            ✕  │
├──────────────────────────────────────────────┤
│  Název kanálu                                │
│  [_______________________________________]   │
│                                              │
│  Obrázek kanálu (volitelné)                  │
│  [preview] [Nahrát] [Odebrat]                │
│                                              │
│  Barva (volitelné)                           │
│  ⊘ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤ ⬤              │
│                                              │
│  Ikona (volitelné)                           │
│  ┌──┬──┬──┬──┬──┬──┐                        │
│  │📨│📣│✉ │📞│👥│ @│                        │
│  ├──┼──┼──┼──┼──┼──┤                        │
│  │📖│📜│✒│👑│⚔ │🛡│                         │
│  ├──┼──┼──┼──┼──┼──┤                        │
│  │💀│👻│⭐│🌙│☀│🔥│                         │
│  ├──┼──┼──┼──┼──┼──┤                        │
│  │📌│🚩│🔖│🏷│📁│📦│                        │
│  └──┴──┴──┴──┴──┴──┘                        │
│  [⊘ Bez ikony]                              │
│                                              │
│  ⚠ Obrázek přebije ikonu (pokud máš oboje)  │
│                                              │
│  [Smazat kanál]    [Zrušit] [Uložit]        │
└──────────────────────────────────────────────┘
```

DTO submit dostane nově `color` a `iconKey` v `useUpdateGroup` payloadu. Při create totéž v `useCreateGroup`.

### 4.6 FE — audit `ChannelDialog` (6.5d)

Existující dialog (z 6.1f) má: name, groupId, accessMode, allowedRoles, allowedMemberIds, imageUrl, delete. **Splňuje** roadmap odrážku „Nastavení konverzace — accessMode/roles/members/order".

Jediné chybějící: pole **`order`** se needituje (drag-drop ho řeší). Roadmap odrážka „pořadí (order)" → splněno v 6.5b.

**Závěr:** `ChannelDialog` v 6.5 **nevyžaduje změny**. Když přijde drag-drop, `order` se aktualizuje automaticky.

### 4.7 `useReorderGroups` / `useReorderChannels`

```ts
export function useReorderGroups(worldId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; order: number }[]) => {
      await apiClient.post(`/worlds/${worldId}/chat/groups/reorder`, { items });
    },
    onMutate: async (items) => {
      // optimistic cache update
      await queryClient.cancelQueries({ queryKey: ['chat-groups', worldId] });
      const prev = queryClient.getQueryData<GroupWithChannels[]>(['chat-groups', worldId]);
      queryClient.setQueryData<GroupWithChannels[]>(['chat-groups', worldId], (old) => {
        if (!old) return old;
        const orderMap = new Map(items.map((i) => [i.id, i.order]));
        return [...old].sort((a, b) => (orderMap.get(a.group.id) ?? a.group.order) - (orderMap.get(b.group.id) ?? b.group.order));
      });
      return { prev };
    },
    onError: (err, _items, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['chat-groups', worldId], ctx.prev);
      toast.error(`Reorder selhal: ${parseApiError(err)}`);
    },
  });
}
```

`useReorderChannels` analogicky, sortuje channels uvnitř group s `groupId === payload.groupId`.

### 4.8 WS handlery v `useWorldChat`

```ts
sock.on('chat:groups:reordered', ({ items }) => {
  queryClient.setQueryData<GroupWithChannels[]>(['chat-groups', worldId], (old) => {
    if (!old) return old;
    const orderMap = new Map(items.map((i) => [i.id, i.order]));
    return [...old]
      .map((g) => ({ ...g, group: { ...g.group, order: orderMap.get(g.group.id) ?? g.group.order } }))
      .sort((a, b) => a.group.order - b.group.order);
  });
});

sock.on('chat:channels:reordered', ({ groupId, items }) => {
  queryClient.setQueryData<GroupWithChannels[]>(['chat-groups', worldId], (old) => {
    if (!old) return old;
    const orderMap = new Map(items.map((i) => [i.id, i.order]));
    return old.map((g) =>
      g.group.id !== groupId
        ? g
        : { ...g, channels: [...g.channels]
            .map((c) => ({ ...c, order: orderMap.get(c.id) ?? c.order }))
            .sort((a, b) => a.order - b.order) },
    );
  });
});
```

---

## 5. UX / responsivita

| Breakpoint | Drag handle | Color picker | Icon picker |
|---|---|---|---|
| **Mobil ≤ 768 px** | Viditelný stále, 44 × 44 px touch terč; long-press 250 ms aktivuje drag | Chips 32 × 32, wrap 6/řádek | Grid 5–6 sloupců, tiles 40 × 40 |
| **Tablet 769–1024 px** | Viditelný na hover kanálu, 28 × 28 px | Chips 28 × 28 | Grid 6 sloupců, tiles 36 × 36 |
| **Desktop > 1024 px** | Viditelný na hover, 24 × 24 px, cursor `grab` → `grabbing` | Chips 28 × 28 | Grid 6 sloupců, tiles 32 × 32 |

**Drag UX:**
- Během drag: zdrojový kanál `opacity: 0.4` + ostatní kanály se animovaně posunou (transition 200 ms `cubic-bezier`).
- Drop target indicator: `border-top: 2px solid var(--theme-accent)` na cílové pozici.
- Po drop: 150 ms „settle" animace (lehký bounce).

**Empty / loading stavy:**
- Reorder pending: handle dostane `cursor: progress`, dragging je disabled.
- 1 jediný kanál v sidebaru → drag handle skrytý (nemá kam přesunout).
- 1 jediná konverzace v kanálu → handle skrytý.

**Touch fallback:**
- Pokud `PointerSensor` selže na exotickém mobilu (např. starý iOS Safari), `KeyboardSensor` zůstává (focus handle + arrow keys). Toto je accessibility win, ne fallback — `@dnd-kit` touch sensory pokrývají iOS 14+, což je naše baseline.

`mobil-desktop` audit povinný po implementaci.

---

## 6. Akceptační kritéria

### 6.5a — Reorder kanálů
- [ ] PJ chytne kanál v sidebaru za drag handle, přetáhne na jinou pozici → po release karta zůstane na nové pozici.
- [ ] BE `POST /worlds/:worldId/chat/groups/reorder` zavoláno s celým novým pořadím.
- [ ] WS `chat:groups:reordered` přijde u ostatních klientů → sidebar se přerovná bez F5.
- [ ] Hráč (ne-PJ) drag handle nevidí (`canManage: false`).
- [ ] Po reloadu stránky pořadí zachováno.
- [ ] Keyboard accessibility: focus na handle → Space → ↑/↓ → Space → drop. Aria-live oznámí změnu („Kanál Evropani přesunut na pozici 2 z 5").

### 6.5b — Reorder konverzací
- [ ] PJ přetáhne konverzaci v rámci kanálu → nová pozice persistuje.
- [ ] BE `POST .../chat/channels/reorder` validuje, že všechny channely jsou ve stejné `groupId`; jinak 400.
- [ ] WS `chat:channels:reordered` přijde → ostatním se konverzace přerovnají.
- [ ] Drag **mezi** kanály (jiná `groupId`) **není dovolený** — drag handle nepřijme drop mimo svůj parent group. PJ použije `ChannelDialog` → `groupId` select.

### 6.5c — Barva + ikona kanálu
- [ ] `chat-group.schema.ts` má `color?: string`, `iconKey?: string`.
- [ ] `UpdateGroupDto` validuje `color` regex `/^([0-9]|1[01])$/` a `iconKey` regex `/^[a-z0-9-]{1,32}$/`.
- [ ] `GroupDialog` má `GroupColorPicker` (12 + Auto) a `GroupIconPicker` (24 + Bez ikony).
- [ ] Render: `imageUrl > iconKey > spine` priority.
- [ ] Barva při `color: undefined` → deterministický slot z `groupColorSlot(id)`, beze změny.
- [ ] PJ explicit nastavená barva přetrvá i po rename kanálu (id se nemění, color se zachová).

### 6.5d — Audit edit/delete
- [ ] Otestováno, že `GroupDialog` a `ChannelDialog` (z 6.1f) pokrývají všechny roadmap odrážky 6.5 mimo reorder/icon/color.
- [ ] Pokud audit najde mezeru → tracked jako sub-task v plánu (`plan-6.5.md`); jinak v specu označeno „pokryto 6.1f".

### 6.5e — Cross-cutting
- [ ] `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` v `package.json`.
- [ ] `npm run typecheck` zelený.
- [ ] FE testy: `groupColor.spec.ts` rozšířen o `groupColorVarFor()`; `useChannelMutations.spec.ts` pokrývá optimistic update reorderu; `ChannelSidebar.spec.tsx` rozšířen o drag-drop happy path (mock @dnd-kit).
- [ ] BE testy: `chat.service.spec.ts` — `reorderGroups` happy path, `MIXED_GROUPS` error, ownership validace; `chat.controller.spec.ts` — guard PJ+.
- [ ] `mobil-desktop` audit (drag handle terč ≥ 44 px, touch sensory funkční).
- [ ] `napoveda` aktualizovaná — PJ sekce „Správa chatu" nově uvádí drag-drop reorder, ikonu/barvu kanálu.

---

## 7. Mimo rozsah / dluhy

| Položka | Důvod odložení | Cíl |
|---|---|---|
| Drag-drop **mezi** kanály (přesun konverzace pomocí drag) | Komplexita: cross-context drop, vizuální indikátor přechodu mezi groupami, race condition při souběhu s reorderem uvnitř group. Přesun už řeší `groupId` select v `ChannelDialog`. | Dluh `D-NEW-chat-channel-cross-group-drag` |
| `Background` na ChatGroup (CSS gradient / image jako ve starém Matrixu) | Tříštilo by sidebar layout; jeden world theme stačí. | Vyřazeno — nedělat |
| Free hex color picker (místo 12 presetů) | Sjednocenost s theme — PJ nemá lézt mimo paletu. | Vyřazeno — nedělat |
| Custom upload ikony (SVG/PNG místo lucide) | Mimo MVP; kanál má `imageUrl` pokud chce PJ vlastní vizuál. | Dluh `D-NEW-chat-group-custom-icon` |
| Reorder undo (Ctrl+Z) | UX nadstavba; reorder je idempotentní a rychle reverzibilní manuálně. | Dluh `D-NEW-chat-reorder-undo` |
| Bulk smazání kanálů / „archivovat" stav | Mimo roadmap 6.5; archive = nová sémantika. | Fáze 13 |
| Per-konverzace `color` (nejen kanál) | Konverzace dědí barvu z kanálu (UX-konzistentní). Per-konverzace barva = visuální chaos. | Vyřazeno — nedělat |
| Editace pole `type` na konverzaci | Existující channely mají `type: 'all'` default; změna typu = sémantická refactor (mimo MVP). | Dluh / fáze 13 |
| Drag-drop reorder v `WorldEmotesAdminPage` (6.4) | Konzistence by byla nice-to-have, ale 6.4 admin grid řadí dle createdAt, ne manuálně. | Dluh `D-NEW-emote-manual-reorder` |

---

## 8. Rozhodnutí PJ k odsouhlasení

1. **Drag-drop knihovna** = `@dnd-kit` (core + sortable + utilities). *Důvod: accessibility, touch, current best-practice. Alternativy (`react-beautiful-dnd`, `framer-motion Reorder`, `sortablejs`) zamítnuty viz §4.2.*
2. **Reorder kanálů a konverzací jen v rámci stejného kanálu (channels) / sidebaru (groups)** = ANO. Cross-group drag-drop přesun konverzací mimo rozsah, řeší `ChannelDialog → groupId` select.
3. **Barva** = 12 preset slotů + „Auto" (deterministický hash). Free hex picker zamítnut.
4. **Ikona** = curated 24 lucide ikon + „Bez ikony". Vlastní SVG upload mimo rozsah.
5. **Priorita renderu** = `imageUrl > iconKey > spine`. Pokud PJ má oboje, obrázek přebije ikonu (s warning v dialogu).
6. **Roadmap odrážka „Editace / mazání"** = označit jako hotovou s odkazem na 6.1f (`GroupDialog` / `ChannelDialog`).
7. **Audit edit/delete UX** (6.5d) provedeme paralelně s implementací reorderu; pokud najdeme mezeru, tracked v `plan-6.5.md`.
8. **`Background` field** = nevracíme (starý Matrix měl, my záměrně vynecháváme).

---

**Po schválení tohoto spec:**
1. Spustím `frontend-design` skill jako design audit (drag handle vizuál, color/icon picker layout, drag animace).
2. Napíšu `plan-6.5.md` s konkrétními úkoly (BE doplňky → FE knihovna → komponenty → integrace → testy → audit).
3. Implementace → mobil-desktop audit → `napoveda` update → zaškrtnutí 6.5 v roadmapě (vč. retroaktivního označení 6.1f-pokrytých odrážek).
