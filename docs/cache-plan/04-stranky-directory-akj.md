# 04 — Stránky & directory & AKJ

> **Sweep 2026-06-05.** Cache-invalidation inventura (TanStack Query v5). Read-only.
> Osy: `FO` `KM` `CR` `DEL` `CB` · perspektivy P1 (konzumentská inventura) + P5 (delete/404).
> Soubory: `src/features/world/pages/api/`, konzumenti v `pages/**`, `campaign/**`, `shop/**`, `app/layout/WorldLayout`.
> Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-15…C-19`).
> **Stav: ✅ hotovo — 5 nálezů (C-15 🔴, C-16/C-17 🟠, C-18/C-19 🟡); CR/DEL/OPT vzory čisté, žádné WS (pages nemají real-time).**

## 1. Konzumentská inventura (P1)

| Zdroj / entita | `queryKey` | role | staleTime / enabled | soubor:řádek |
|---|---|---|---|---|
| Page **detail** | `['pages', worldId, 'detail', slug]` | detail (PageViewer, Bio, editor hydrace) | 30s | [usePage.ts:12](../../src/features/world/pages/api/usePage.ts#L12) |
| Page **directory** (full) | `['pages', worldId, 'directory']` (factory) | seznam, Cmd+K, broken-links, editor pickery, FavoritePagesColumn, ScenarioLinks, ShopItemForm, TimelineEventCard | 5 min | usePagesDirectory.ts:18 |
| Persona **directory** (PC/NPC) | `['pages', worldId, 'directory', 'persona']` **inline** | CharacterDirectory karty, ShopView, SubjectForm | 60s | usePersonaDirectory.ts:17 |
| Page **meta** (AKJ shield) | `['pages', worldId, 'meta', slug]` | AccessDenied 403 screen | 60s | usePageMeta.ts:39 |
| Page **backlinks** | `['pages', worldId, 'backlinks', slug]` | „Odkazuje sem" panel | 60s; retry false | usePageBacklinks.ts:15 |
| World page **templates** | `['worldPageTemplates', worldId]` (factory) | DataTemplatePanel, settings | 60s | useWorldPageTemplates.ts:14 |
| Favorite slugs (zdroj) | `['worlds', 'slug', worldSlug]` → `world.favoritePageSlugs` | hvězda, sekce Oblíbené, dashboard | (world detail) | useFavoritePage.ts:17 |
| **Character detail** (subdoc entity) | `['characters', worldId, 'detail', slug]` (factory) | PostavaLayout subdoc taby, ShopView | 30s | useCharacter.ts:11 |
| **Character directory** (legacy) | `['characters', worldId, 'directory']` (factory) | **WorldLayout sidebar nav slot postavy**, MyCharacterPage, MembersTab, TransferModal, MapEmptyState | 30s | useCharacterDirectory.ts:15 |

> **Past projektu (`project_directory_id_vs_character_id`):** `PageDirectoryEntry.id` = page ID, ne characterId. Persona karty lookupují přes slug (9.1). Page mutace a Character mutace žijí ve **dvou disjunktních namespace** (`pages` vs `characters`) — kořen C-15.
>
> **Prefix-match (P2):** `pagesQueryKey.directory(worldId)` = `['pages',w,'directory']` **prefixuje** persona `['pages',w,'directory','persona']` (segment navíc) → invalidace directory trefí i persona ✅.

## 2. Mutace × konzument matice

| Mutace (soubor:řádek) | pages dir | persona | page detail | meta | backlinks | char dir (legacy) | favorite | templates | placement |
|---|---|---|---|---|---|---|---|---|---|
| useCreatePage [:54](../../src/features/world/pages/api/useCreatePage.ts#L54) | ✅ | ✅ᵖ | ✅ seed | — | — | **❌** | ✅ | — | hook onSuccess |
| useUpdatePage [:35](../../src/features/world/pages/api/useUpdatePage.ts#L35) | ✅ | ✅ᵖ | ✅ seed (+rename remove) | **❌** | **❌** | **❌** | ✅ | — | hook onSuccess |
| useDeletePage [:14](../../src/features/world/pages/api/useDeletePage.ts#L14) | ✅ | ✅ᵖ | ✅ remove | **❌** | ✅ remove | **❌** | ✅ | — | hook onSuccess |
| useFavoritePage [:31](../../src/features/world/pages/api/useFavoritePage.ts#L31) | — | — | — | — | — | — | ✅ optimistic+rollback+settled | — | hook onMutate/onError/onSettled |
| Template create/update/delete | — | — | — | — | — | — | — | ✅ | hook onSuccess |

ᵖ = prefix-match přes `directory`. **WS handlery: žádné** — pages nemají real-time push (grep `page-created/updated/deleted` → 0).
**Placement / CB ✅:** všechny page mutace invalidují v `useMutation({onSuccess})`; PageEditor `mutateAsync`+`await` před `navigate` → invalidace přežije unmount i po delete.

## 3. Nálezy

### 🔴 C-15 · `FO` · Page CRUD neinvaliduje legacy character directory → sidebar nav + 5 konzumentů stale
- **Mutace:** [useCreatePage.ts:54](../../src/features/world/pages/api/useCreatePage.ts#L54), [useUpdatePage.ts:35](../../src/features/world/pages/api/useUpdatePage.ts#L35), [useDeletePage.ts:14](../../src/features/world/pages/api/useDeletePage.ts#L14) — invalidují jen `['pages',…]`.
- **Konzument:** `useCharacterDirectory` = `['characters', worldId, 'directory']` ([useCharacterDirectory.ts:15](../../src/features/world/pages/api/useCharacterDirectory.ts#L15)), čtený v **WorldLayout sidebar nav** (slot jméno+avatar postavy člena), MyCharacterPage, GroupMembers, MembersTab, TransferModal, MapEmptyState.
- **Rozpor:** PC/NPC se vytváří/edituje/maže **přes Page entity** (PageEditor type=PostavaHrace/NPC → BE založí `characterRef`). Page mutace invalidují jen `pages` directory; legacy `characters` directory (jiný namespace) drží starý seznam 30s.
- **Trigger:** PJ vytvoří/přejmenuje/smaže PC v editoru. **Viditelnost:** nová/přejmenovaná postava chybí (nebo starý název/avatar) v **trvale viditelném sidebar nav slotu**, v MembersTab přiřazení, v TransferModal cílech, na mapě (spawn list). Tiše. **Workaround:** 30s / F5.
- **Reciprocita:** `useCharacterMutations` (convert/delete/update) invaliduje `characters` directory ale **ne** `pages`/persona directory → viz [C-20](05-postavy-ekonomika.md). **Dvě disjunktní directory cache pro tytéž entity.**
- **Závažnost 🔴:** sidebar je trvale viditelný shell; po vytvoření vlastní postavy ji hráč nevidí ve slotu bez reloadu. **Návrh:** Page CRUD `onSuccess` doplnit `invalidate(['characters',worldId,'directory'])` (a Character CRUD recipročně `invalidate(pagesQueryKey.directory(worldId))`). Dlouhodobě sjednotit oba directory zdroje na jeden klíč.

### 🟠 C-16 · `FO` · update/delete neinvaliduje backlinks cílových stránek
- **Mutace:** [useUpdatePage.ts:35](../../src/features/world/pages/api/useUpdatePage.ts#L35) (změna wikilinků), [useDeletePage.ts:14](../../src/features/world/pages/api/useDeletePage.ts#L14).
- **Konzument:** `usePageBacklinks` = `['pages',w,'backlinks',slug]` ([usePageBacklinks.ts:15](../../src/features/world/pages/api/usePageBacklinks.ts#L15)).
- **Rozpor:** delete invaliduje backlinks jen **smazané** stránky (správný úklid), ale stránky, **na které** odkazovala, drží svůj backlinks seznam stale. Update přidá/odebere `[[odkaz]]` → backlinks **cílové** stránky se nikdy neinvaliduje (klíč nese slug editované, ne cílové; cíle FE nezná).
- **Trigger:** přidám `[[Londýn]]` do A → otevřu Londýn → „Odkazuje sem" A neukáže. **Viditelnost:** tiše chybí/přebývá. **Workaround:** 60s / F5. **Závažnost 🟠** (sekundární panel). **Návrh:** invalidovat celý `['pages',w,'backlinks']` (prefix all) po update/delete — over-invalidation, ale endpoint lehký, refetchne jen mounted.

### 🟠 C-17 · `FO` · update/delete neinvaliduje page meta (AKJ shield na AccessDenied)
- **Mutace:** [useUpdatePage.ts:35](../../src/features/world/pages/api/useUpdatePage.ts#L35) (`accessRequirements`), [useDeletePage.ts:14](../../src/features/world/pages/api/useDeletePage.ts#L14).
- **Konzument:** `usePageMeta` = `['pages',w,'meta',slug]` ([usePageMeta.ts:39](../../src/features/world/pages/api/usePageMeta.ts#L39)) — `shieldedBy[]` AKJ překážky na AccessDenied screenu.
- **Rozpor:** `directory` invalidace (`['pages',w,'directory']`) je meta sourozenec, ne prefix → netrefí. Update AKJ úrovně → meta drží starou; delete → meta orphan (na rozdíl od backlinks bez `removeQueries`).
- **Trigger:** PJ změní AKJ úroveň → hráč na AccessDenied vidí starou požadovanou úroveň. **Viditelnost:** matoucí instrukce. **Workaround:** 60s / F5. **Závažnost 🟠** (vidí jen ne-oprávněný, mění se zřídka). **Návrh:** delete `removeQueries(meta)`; update `invalidate(['pages',w,'meta',slug])`.

### 🟡 C-18 · `KM` (drift-trap) · `usePage` má inline klíč místo factory
- **Místo:** [usePage.ts:12](../../src/features/world/pages/api/usePage.ts#L12) `['pages',worldId,'detail',slug]` (inline) vs factory `pagesQueryKey.detail()` (identický) ve stejném souboru. Dnes se shodují.
- **Riziko:** budoucí změna tvaru detail klíče ve factory (kterou používají create/update/delete `setQueryData`/`removeQueries`) **nepropíše** do query → mutace by psaly/mazaly do jiného klíče než čte `usePage` → detail by se po zápisu neobnovil (🔴 potenciál). Stejný vzor jako D-03-7. **Návrh:** `usePage` volat `pagesQueryKey.detail(worldId, slug)`.

### 🟡 C-19 · `KM` (drift-trap) · `usePersonaDirectory` inline klíč mimo factory
- **Místo:** [usePersonaDirectory.ts:17](../../src/features/world/pages/api/usePersonaDirectory.ts#L17) `['pages',worldId,'directory','persona']` — inline; factory persona varianta neexistuje.
- **Riziko:** dnes prefix-matchuje `pagesQueryKey.directory(worldId)` → invalidace funguje. Kdyby factory `directory()` dostala segment navíc, persona se tiše odpojí od invalidace → CharacterDirectory karty stale po každém CRUD. Žádný test to nehlídá. **Návrh:** přidat `pagesQueryKey.personaDirectory(worldId)` do factory.

## 4. Ověřené OK (CR / DEL / OPT — ne nálezy)

- **CR ✅:** nová stránka → `invalidate(directory)` → objeví se ve správně řazeném seznamu (řazení klientské `useMemo`, žádná paginace → žádný append problém); `setQueryData(detail)` pre-seed bez flicker.
- **DEL ✅:** `removeQueries(detail)` (ne invalidate → žádný 404 flash) + `removeQueries(backlinks)` + `invalidate(directory)` + navigace pryč. Pořadí korektní. Rename slug: `removeQueries(starý slug)` jen při skutečném rename (N-38 fix).
- **OPT (favorite) ✅:** plný cyklus onMutate snapshot+set → onError rollback → onSettled invalidate; tvar zápisu == queryFn. [useFavoritePage.ts:31](../../src/features/world/pages/api/useFavoritePage.ts#L31).
- **Conflict (409) ✅:** ConflictModal „Obnovit" → `invalidate(detail)` → re-hydrate. Error-path resync existuje (P3).

## 5. Latentní / VERIFY

- **D-04-1 `SC` 🟡** — page mutace navíc invalidují `['worlds','slug',worldSlug]` (kvůli `favoritePageSlugs`) → over-invalidace celého world detailu při každé editaci obsahu. Bezpečné, jen zbytečný refetch.
- **D-04-2 `FO` 🟡 VERIFY** — update Bio postavy (Page) neinvaliduje `useCharacter` detail. Pravděpodobně by-design (Bio tab čte z `usePage`, subdoc taby z `useCharacter`). VERIFY (M4) zda Character entity drží `name`/`slug` zrcadlo renderované z `useCharacter`.
- **WS gap (info):** pages nemají žádný real-time push — cizí editace viditelná až po staleTime (konzistentní s C-04). Není broken invalidace, chybějící vrstva.

**Census (M-CEN): čistý** — všech 8 page/template mutací má ≥1 cache efekt.
