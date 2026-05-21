# Plán 6.5 — Správa kanálů a konverzací (PJ)

**Spec:** [spec-6.5.md](spec-6.5.md) (schváleno 2026-05-21)
**Design audit:** uvnitř konverzace (drag handle = vlastní 3 puntíky, conic-gradient Auto chip, color-mix tile hover, 12-slot palette extension)
**Pořadí:** **BE → FE knihovna → FE shared lib (color/icon) → FE komponenty → FE integrace → testy → audit → roadmap**.

> Plán je **konkrétní úkoly v provádacím pořadí** s odkazy na soubory a typové signatury. Otestuje se na koncových akcích (commit gates uvedené u každé fáze).

---

## Fáze 1 — BE doplňky (`Projekt-ikaros/backend/src/modules/chat`)

Cíl: schema + DTO + service + controller + gateway pro `color`, `iconKey`, reorder.

### 1.1 — Schema rozšíření
**Soubor:** `schemas/chat-group.schema.ts`
**Změna:** přidat dva `@Prop()`:
```ts
/** PJ explicit volba barvy — string slot '0'..'11'. Undef = auto (hash z id). */
@Prop({ type: String }) color?: string;
/** PJ ikona kanálu — klíč z curated mapy GROUP_ICONS. Undef = bez ikony. */
@Prop({ type: String }) iconKey?: string;
```
Neměnit existující indexy.

### 1.2 — DTO rozšíření
**Soubor:** `dto/update-group.dto.ts`
**Změna:** přidat validátory:
```ts
@IsOptional() @IsString() @Matches(/^([0-9]|1[01])$/) color?: string;
@IsOptional() @IsString() @Matches(/^[a-z0-9-]{1,32}$/) iconKey?: string;
```
+ import `Matches` z `class-validator`.

**Soubor:** `dto/create-group.dto.ts` — analogicky (color + iconKey optional).

### 1.3 — Nový DTO `reorder-items.dto.ts`
**Soubor:** `dto/reorder-items.dto.ts`
```ts
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsMongoId, Min, ValidateNested,
         ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class ReorderItemDto {
  @IsMongoId() id!: string;
  @IsInt() @Min(0) order!: number;
}

export class ReorderItemsDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200)
  @ValidateNested({ each: true }) @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
```

### 1.4 — Service: reorder metody
**Soubor:** `chat.service.ts`
**Přidat metody** (jen veřejné API, implementace v plánu):

```ts
async reorderGroups(worldId: string, items: ReorderItemDto[], user: RequestUser): Promise<void>;
async reorderChannels(worldId: string, items: ReorderItemDto[], user: RequestUser): Promise<void>;
```

Implementace `reorderGroups`:
1. `assertCanManageChat(worldId, user)` — reuse existující guard.
2. Načti `ChatGroup.find({ _id: { $in: ids }, worldId })` — pokud `result.length !== items.length` → `BadRequestException('INVALID_GROUP_ID')`.
3. `repo.bulkUpdateOrders(items)` — jedna `bulkWrite` operace s `updateOne` per item.
4. `eventEmitter.emit('chat.groups.reordered', { worldId, items })`.

`reorderChannels`:
1. `assertCanManageChat(worldId, user)`.
2. Načti `ChatChannel.find({ _id: { $in: ids }, worldId })` — validate count + že **všechny mají stejné `groupId`** (jinak `BadRequestException('MIXED_GROUPS')`).
3. `repo.bulkUpdateChannelOrders(items)`.
4. `eventEmitter.emit('chat.channels.reordered', { worldId, groupId, items })`.

### 1.5 — Repository
**Soubor:** `chat.repository.ts`
**Přidat metody:**
```ts
bulkUpdateGroupOrders(items: { id: string; order: number }[]): Promise<void>;
bulkUpdateChannelOrders(items: { id: string; order: number }[]): Promise<void>;
```
Implementace přes `Model.bulkWrite(items.map(i => ({ updateOne: { filter: { _id: i.id }, update: { $set: { order: i.order } } } })))`.

### 1.6 — Controller endpointy
**Soubor:** `chat.controller.ts`
**Přidat handlery:**
```ts
@Post('groups/reorder')
@ApiOperation({ summary: 'Reorder kanálů (bulk, PJ+)' })
@ApiResponse({ status: 204 })
async reorderGroups(
  @Param('worldId') worldId: string,
  @Body() dto: ReorderItemsDto,
  @CurrentUser() user: RequestUser,
): Promise<void> {
  await this.chatService.reorderGroups(worldId, dto.items, user);
}

@Post('channels/reorder')
@ApiOperation({ summary: 'Reorder konverzací v rámci jednoho kanálu (PJ+)' })
async reorderChannels(/* … */): Promise<void>;
```

**Pozn.:** umístit **před** `@Get('groups/:groupId')` route — jinak `'reorder'` matchne jako `groupId` param.

⚠️ **Risk:** existující route `@Patch('groups/:groupId')` (l. 81) je definované jako PATCH; náš nový endpoint je POST + path `groups/reorder` — žádná kolize. Ale **`@Get('groups')` musí zůstat výš** — pořadí dekorátorů v NestJS controlleru určuje routing prioritu jen v některých edge case; bezpečnější mít specifické routes (`reorder`) **před** parametrizovanými (`:groupId`). Při implementaci ověřit.

### 1.7 — Gateway broadcasty
**Soubor:** `chat.gateway.ts`
**Přidat OnEvent handlery:**
```ts
@OnEvent('chat.groups.reordered')
handleGroupsReordered(payload: { worldId: string; items: ReorderItemDto[] }): void {
  this.server.to(`world:${payload.worldId}`).emit('chat:groups:reordered', payload);
}

@OnEvent('chat.channels.reordered')
handleChannelsReordered(payload: { worldId: string; groupId: string; items: ReorderItemDto[] }): void {
  this.server.to(`world:${payload.worldId}`).emit('chat:channels:reordered', payload);
}
```

### 1.8 — `getGroupsWithChannels` — řazení
**Soubor:** `chat.service.ts` (existující metoda)
**Ověřit:** že vrací groups + channels **už seřazené dle `order` ASC**. Pokud ne, přidat `.sort({ order: 1 })` v repo query. (Pravděpodobně už je, ale ověřit.)

### 1.9 — Testy
**Soubor:** `chat.service.spec.ts`
**Přidat:**
- `reorderGroups` happy path — bulkUpdate volaný se správnými argumenty, event emitnutý.
- `reorderGroups` rejects PJ-1 (Pomocný PJ pod prahem) — `ForbiddenException`. **Ověřit prahovou roli** v `canManageChat` — spec mluví o PJ+, ale existující dialogy z 6.1f povolují Pomocný PJ. **Konzistence:** stejný práh jako edit/delete.
- `reorderGroups` rejects ID z jiného světa — `BadRequestException('INVALID_GROUP_ID')`.
- `reorderChannels` rejects mixed groups — `BadRequestException('MIXED_GROUPS')`.
- `updateGroup` přijme nové fieldy `color: '5'` a `iconKey: 'chat'`.
- `updateGroup` odmítne `color: '12'` → 400 (mimo regex).
- `updateGroup` odmítne `iconKey: 'BIG_CAPS'` → 400.

**Commit gate:** `cd backend && npm run test -- chat.service` zelený, `npm run lint` čistý.

---

## Fáze 2 — FE knihovna `@dnd-kit`

### 2.1 — Install
```
npm install @dnd-kit/core@^6 @dnd-kit/sortable@^8 @dnd-kit/utilities@^3
```

⚠️ Verze: `@dnd-kit/core` 6.x, `sortable` 8.x (latest stable). Pokud `npm install` hodí peer warning na React 18 (máme 18+), ověřit. `@dnd-kit/modifiers` **nepotřebujeme** (žádné snap-to-axis, libovolný drag).

**Commit gate:** `npm run typecheck` zelený (zatím beze změny v kódu), bundle visualizer kontrola (ne > +30 KB gzipped).

---

## Fáze 3 — FE shared lib (color, icon)

### 3.1 — `groupColor.ts` rozšíření
**Soubor:** `src/features/world/chat/lib/groupColor.ts`
**Změny:**
- `GROUP_COLOR_SLOTS` z 6 → 12.
- Přidat `groupColorVarFor(group: { id: string; color?: string }): string`.
- `groupColorVar(id)` zachovat (zpětná kompatibilita), interně volá `groupColorVarFor({ id })`.

```ts
export function groupColorVarFor(group: { id: string; color?: string }): string {
  if (group.color && /^([0-9]|1[01])$/.test(group.color)) {
    return `var(--chat-group-${Number(group.color) + 1})`;
  }
  return groupColorVar(group.id);
}
```

### 3.2 — `chatSkin.css` — paleta 7–12
**Soubor:** `src/features/world/chat/chatSkin.css`
**Změna:** přidat 6 nových slotů harmonicky se stávajícími (tmavší/světlejší varianty existujících 6):
```css
--chat-group-7:  #8a5c2c;   /* tmavší variant 1 */
--chat-group-8:  #3f7a90;   /* tmavší variant 2 */
--chat-group-9:  #7a4e80;   /* tmavší variant 3 */
--chat-group-10: #4e8054;   /* tmavší variant 4 */
--chat-group-11: #944e4e;   /* tmavší variant 5 */
--chat-group-12: #806a36;   /* tmavší variant 6 */
```
(Přesné hex doladit per audit — design audit zmínil potřebu doladit harmonicky.)

### 3.3 — `groupIcons.ts` — nová mapa
**Soubor:** `src/features/world/chat/lib/groupIcons.ts`
```ts
import {
  MessageCircle, Megaphone, Mail, Phone, Users, AtSign,
  BookOpen, Scroll, Feather, Crown, Swords, Shield,
  Skull, Ghost, Star, Moon, Sun, Flame,
  Pin, Flag, Bookmark, Tag, Folder, Archive,
  type LucideIcon,
} from 'lucide-react';

export const GROUP_ICONS: Record<string, LucideIcon> = {
  // Komunikace
  'chat': MessageCircle,
  'megaphone': Megaphone,
  'mail': Mail,
  'phone': Phone,
  'users': Users,
  'at-sign': AtSign,
  // Příběh
  'book': BookOpen,
  'scroll': Scroll,
  'feather': Feather,
  'crown': Crown,
  'swords': Swords,
  'shield': Shield,
  // Žánr
  'skull': Skull,
  'ghost': Ghost,
  'star': Star,
  'moon': Moon,
  'sun': Sun,
  'flame': Flame,
  // Organizace
  'pin': Pin,
  'flag': Flag,
  'bookmark': Bookmark,
  'tag': Tag,
  'folder': Folder,
  'archive': Archive,
};

export const GROUP_ICON_CATEGORIES = [
  { label: 'Komunikace', keys: ['chat', 'megaphone', 'mail', 'phone', 'users', 'at-sign'] },
  { label: 'Příběh',     keys: ['book', 'scroll', 'feather', 'crown', 'swords', 'shield'] },
  { label: 'Žánr',       keys: ['skull', 'ghost', 'star', 'moon', 'sun', 'flame'] },
  { label: 'Organizace', keys: ['pin', 'flag', 'bookmark', 'tag', 'folder', 'archive'] },
];

export function GroupIcon({ iconKey, size = 14 }: { iconKey?: string; size?: number }) {
  const Icon = iconKey ? GROUP_ICONS[iconKey] : null;
  return Icon ? <Icon size={size} /> : null;
}
```

### 3.4 — Type rozšíření
**Soubor:** `src/features/world/chat/lib/types.ts`
**Změna:** `ChatGroup` interface dostane:
```ts
color?: string;
iconKey?: string;
```

**Commit gate:** `npm run typecheck` zelený. `npm test -- groupColor` zelený (existující test rozšířen o `groupColorVarFor` cases).

---

## Fáze 4 — FE komponenty pickerů

### 4.1 — `GroupColorPicker.tsx`
**Soubor:** `src/features/world/chat/components/GroupColorPicker.tsx`
**Props:**
```ts
interface Props {
  value?: string;                        // '0'..'11' nebo undefined (= auto)
  onChange: (color: string | undefined) => void;
}
```
**Render:** 13 chipů (1 Auto + 12 slotů) `display: flex; flex-wrap: wrap; gap: var(--sp-1);`.
Auto chip = `conic-gradient(from 0deg, var(--chat-group-1), …, var(--chat-group-12), var(--chat-group-1))`.
Selected indicator = double box-shadow ring (viz design audit).

**Soubor:** `GroupColorPicker.module.css` — viz design audit §2.

### 4.2 — `GroupIconPicker.tsx`
**Soubor:** `src/features/world/chat/components/GroupIconPicker.tsx`
**Props:**
```ts
interface Props {
  value?: string;
  onChange: (iconKey: string | undefined) => void;
  accentColor?: string;  // var(--chat-group-N) pro hover/selected tint
}
```
**Render:** kontejner s `background: var(--theme-surface-2); border: 1px solid var(--theme-border);` obsahující grid 6 sloupců × 4 řádky tile (24 ikon). Pod gridem inline „⊘ Bez ikony" chip.

Categories *nezobrazujeme jako labels* — jen je používáme pro pořadí ikon (čisté UI dle audit).

**Soubor:** `GroupIconPicker.module.css` — viz design audit §3.

**Commit gate:** komponenty mountnou bez chyb v Storybook / smoke test (pokud máme), `npm run typecheck` zelený.

---

## Fáze 5 — `GroupDialog` integrace

### 5.1 — Rozšíření `GroupDialog.tsx`
**Soubor:** `src/features/world/chat/components/GroupDialog.tsx`
**Změny:**
- Přidat state `const [color, setColor] = useState<string | undefined>(initial?.color);`
- Přidat state `const [iconKey, setIconKey] = useState<string | undefined>(initial?.iconKey);`
- V JSX pod „Obrázek kanálu" sekci přidat:
  - `<GroupColorPicker value={color} onChange={setColor} />`
  - `<GroupIconPicker value={iconKey} onChange={setIconKey} accentColor={groupColorVarFor({ id: initial?.id ?? '', color })} />`
  - Inline warning pod icon pickerem pokud `preview && iconKey` (obrázek přebije).
- V `submit()`:
  - Při `create`: payload obsahuje `color`, `iconKey` pokud nejsou undefined.
  - Při `edit`: do `dto` zařadit `color` / `iconKey` pokud se změnily (porovnání s `initial`); explicit reset = poslat `''` (analogicky jako `imageUrl` při remove).

### 5.2 — `useCreateGroup` / `useUpdateGroup` — rozšíření inputu
**Soubor:** `src/features/world/chat/api/useChannelMutations.ts`
**Změna:** `CreateGroupInput` (nový) + `UpdateGroupInput` rozšířit o `color?: string` a `iconKey?: string`. Existující call-sites kompatibilní (oba jsou optional).

**Commit gate:** dialog se otevře, picker funguje, save proběhne, BE 200 s novými fieldy, refresh ukáže barvu/ikonu. `npm run typecheck` zelený.

---

## Fáze 6 — Drag-drop integrace v sidebaru

### 6.1 — `useReorderGroups` / `useReorderChannels` hooky
**Soubor:** `src/features/world/chat/api/useChannelMutations.ts`
**Přidat 2 nové exporty:**
```ts
export function useReorderGroups(worldId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; order: number }[]) => {
      await api.post<void>(`${base(worldId)}/groups/reorder`, { items });
    },
    onMutate: async (items) => { /* optimistic update — viz spec §4.7 */ },
    onError:  (err, _items, ctx) => { /* rollback + toast */ },
  });
}
```
Analogicky `useReorderChannels({ groupId, items })`.

### 6.2 — `ChannelGroup.tsx` — drag handle + sortable
**Soubor:** `src/features/world/chat/components/ChannelGroup.tsx`
**Změny:**
- Komponenta dostane `dragHandleProps` (nebo se přejde na render-via-`useSortable` uvnitř — preferred).
- Místo přímého `<section>` použít `useSortable({ id: group.id, disabled: !canManage || reorderPending })`.
- Drag handle `<button>` před `.headMain`, viditelný jen pro `canManage`. Implementace vizuálu = 3 puntíky přes `::before` (viz design audit).
- `style={{ transform: CSS.Transform.toString(transform), transition }}` na section.
- `data-dragging` atribut pro CSS hooks.

**Soubor:** `ChannelGroup.module.css` — přidat třídy `.dragHandle`, `.dragging`, `.dropIndicator` (viz design audit).

### 6.3 — `ChannelItem.tsx` — drag handle pro konverzace
**Soubor:** `src/features/world/chat/components/ChannelItem.tsx`
**Změny:** stejný pattern, ale menší handle (2 puntíky, výška 7 px). Handle viditelný jen pro `canManage`.

### 6.4 — `ChannelSidebar.tsx` — `DndContext` integrace
**Soubor:** `src/features/world/chat/components/ChannelSidebar.tsx`
**Změny:**
- Wrap `.scroll` do `<DndContext sensors collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>`.
- Wrap groups list do `<SortableContext items={groups.map(g => g.group.id)} strategy={verticalListSortingStrategy}>`.
- Každý `ChannelGroup` interně renderuje vnořený `<DndContext>` + `<SortableContext>` pro **svoje konverzace** (= izolovaná drag zóna, drag mezi kanály nedovolen).

📚 **Proč 2 vnořené `DndContext`?** Jeden globální by povolil drop konverzace z kanálu A do B. Vnořené kontexty = drag handler kanálu A nevidí drop targety v kanálu B. Drag cross-group fyzicky nemožný = robust proti UI omylu.

⚠️ **`@dnd-kit` vnořené kontexty:** podporované, dokumentované. Sensory zděděné z parent kontextu, ale onDragEnd/onDragOver eventy se neventují přes children. Ověřit při implementaci, že parent collision detection nepřebije child drop.

- `handleGroupDragEnd`: vypočítá nový order pole, zavolá `reorderGroups.mutate()` s optimistic update.
- `handleChannelDragEnd(groupId)`: per-kanál handler, volá `reorderChannels.mutate({ groupId, items })`.

### 6.5 — WS handlery v `useWorldChat`
**Soubor:** `src/features/world/chat/api/useWorldChat.ts` (nebo kde žije WS subscription)
**Přidat:**
```ts
sock.on('chat:groups:reordered', ({ items }) => { /* setQueryData + sort */ });
sock.on('chat:channels:reordered', ({ groupId, items }) => { /* per-group sort */ });
```
Detail logiky v spec §4.8.

### 6.6 — `ChannelGroup.tsx` render ikony
**Soubor:** `src/features/world/chat/components/ChannelGroup.tsx`
**Změna:** render priority v hlavičce:
```tsx
{group.imageUrl ? <img className={s.thumb} src={group.imageUrl} alt="" />
 : group.iconKey ? <span className={s.iconWrap}><GroupIcon iconKey={group.iconKey} size={14} /></span>
 : <span className={s.spine} aria-hidden="true" />}
```
+ propsuj barvu přes `style={{ '--g-color': groupColorVarFor(group) }}` (místo `groupColorVar(group.id)` z parent — barva má prioritu explicit volby).

### 6.7 — `ChannelSidebar.tsx` — barva přes `groupColorVarFor`
**Soubor:** `ChannelSidebar.tsx`
**Změna:** `color={groupColorVar(group.id)}` na `color={groupColorVarFor(group)}` (2 výskyty — pinned channels mapping + groups.map).

**Commit gate:** drag desktop funguje (myší, keyboard), drag mobil funguje (touch), persistence proběhne, ostatní klient dostane WS event a přerovná sidebar, ne-PJ handle nevidí.

---

## Fáze 7 — Testy

### 7.1 — Unit testy
- `groupColor.spec.ts` — rozšířit o cases `groupColorVarFor({ id, color: '5' })`, `groupColorVarFor({ id, color: undefined })`, invalid color `'foo'` → hash fallback.
- `groupIcons.spec.tsx` (nový) — `GroupIcon` rendruje SVG pro známý klíč, `null` pro unknown.
- `useChannelMutations.spec.ts` — `useReorderGroups` happy path, optimistic update, rollback při error.

### 7.2 — Integration test sidebar
- `ChannelSidebar.spec.tsx` — rozšířit:
  - Drag handle se nezobrazuje když `canManage: false`.
  - Drag onDragEnd → volá `reorderGroups.mutate` s novým pořadím.
  - WS event `chat:groups:reordered` přerovná sidebar.

⚠️ **Mock `@dnd-kit`:** v testech mockujeme `useSortable` aby vrátil identity transform, a manuálně voláme `DndContext.onDragEnd(event)`. Drag user-event simulace je flaky, vyhneme se jí.

**Commit gate:** `npm test` zelený.

---

## Fáze 8 — `mobil-desktop` audit

Spustit skill `mobil-desktop`. Ověřit:
- Drag handle terč ≥ 44 × 44 px na mobilu.
- Long-press 250 ms aktivuje drag (ne okamžitě — chrání před scroll konfliktem).
- `GroupColorPicker` chips na mobilu 32×32, wrap funguje.
- `GroupIconPicker` grid na mobilu 5–6 sloupců (responsive).
- `GroupDialog` na mobilu nepřeteče výšku viewportu (modal scroll).

Pokud něco selže → fix iterace.

---

## Fáze 9 — `napoveda` aktualizace

Spustit skill `napoveda`. Sekce „Správa chatu (PJ)" v `/ikaros/napoveda`:
- Drag-drop reorder kanálů a konverzací.
- Editace kanálu — barva, ikona, obrázek.
- Editace konverzace — přístup, role, členové, přesun mezi kanály (přes dialog).
- Mazání — kaskádově maže zprávy.

---

## Fáze 10 — Roadmap + spec uzavření

**Soubor:** `docs/roadmap-fe.md`
**Změna:** označit krok 6.5 jako `[x]` + datum + 4 odrážky:
```
### - [x] 6.5 Správa kanálů a konverzací (PJ)

*Edit/delete/přístup pokryto 6.1f; v 6.5 dodán drag-drop reorder + barva/ikona kanálu. Spec: `docs/arch/phase-6/spec-6.5.md`. **Hotovo 2026-05-XX.***

- [x] Editace / mazání kanálů a konverzací (pokryto 6.1f — `GroupDialog`, `ChannelDialog`)
- [x] Nastavení konverzace — accessMode/roles/members (6.1f); order přes drag-drop (6.5b)
- [x] Reorder kanálů a konverzací (drag-drop, `@dnd-kit`), barva + ikona kanálu (12 + 24)
- [x] `mobil-desktop` audit + `napoveda` aktualizace
```

**Soubor:** `spec-6.5.md` (head)
**Změna:** `Status: 🟡 Návrh k odsouhlasení` → `✅ Hotovo (2026-05-XX)`.

---

## Risk / rozhodnutí během implementace

| # | Risk | Mitigace |
|---|---|---|
| R1 | `@dnd-kit` vnořené `DndContext` nepodporují nějaký edge case | Fallback: jeden context, ale `useSortable` per channel s vlastním `data-group-id`; `onDragEnd` ignoruje pokud `active.data.group !== over.data.group` |
| R2 | Paleta 7–12 vizuálně nesedí s existující 1–6 ve všech 12 skinech | V 6.5 dodáme jen `:root` defaulty; per-skin override v `decorations.css` je opt-in dluh, ne blokující |
| R3 | Pomocný PJ vs PJ práh pro reorder | Sjednotit s `canManageChat` (= edit/delete práh z 6.1f). **Default: Pomocný PJ+**, jako u dialogů. |
| R4 | BE `getGroupsWithChannels` neřadí dle `order` | Ověřit v 1.8; pokud ne, fix součástí 6.5a (drobnost) |
| R5 | Touch drag konflikt se sidebar scrollem (mobil) | `activationConstraint: { delay: 250, tolerance: 5 }` — long-press, ne instant drag |

---

## Souhrn rozsahu

| Fáze | Soubory (cca) | Risk |
|---|---|---|
| 1. BE | 6 souborů (~120 ř.) | nízký |
| 2. Knihovna | `package.json` (~3 deps) | nízký |
| 3. Shared lib | 3 soubory (~80 ř.) | nízký |
| 4. Pickery | 4 soubory (~250 ř.) | nízký |
| 5. Dialog | 1 soubor (~50 ř. diff) | nízký |
| 6. Drag-drop | 6 souborů (~300 ř.) | **střední** (@dnd-kit nested) |
| 7. Testy | 3 soubory (~150 ř.) | nízký |
| 8. mobil-desktop | iterace | — |
| 9. napoveda | 1 soubor (~30 ř. diff) | — |
| 10. roadmap | 2 soubory (~10 ř. diff) | — |
| **Σ FE** | ~14 souborů, ~850 ř. | |
| **Σ BE** | ~6 souborů, ~140 ř. | |

---

**Otázky k odsouhlasení před začátkem:**

1. **PJ práh pro reorder** = `Pomocný PJ+` (jako edit/delete z 6.1f), nebo `PJ+` (přísnější)?
2. **Paleta 7–12** — necháme tmavší varianty existujících 6 (návrh §3.2), nebo cíleně doplníme **odlišné odstíny** (modrozelená, růžová, terakota — barevný rozsah, ne jen jas)?
3. **Bulk size limit** — 50 groups / 200 channels (DTO `@ArrayMaxSize`)? Reálné světy mají < 20 kanálů; limit jen safety.
4. **Mobile drag activation** — long-press 250 ms (chrání scroll), nebo distance threshold 8 px (rychlejší ale konfliktní)?

Po souhlasu spouštím Fázi 1.
