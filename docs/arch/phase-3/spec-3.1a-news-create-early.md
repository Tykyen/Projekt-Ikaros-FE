# Spec 3.1a — Vytvoření Ikaros novinky z dashboardu (early slice z 3.1)

**Status:** Schváleno (2026-05-14)
**Rozsah:** FE jen (1 modal komponenta + 1 mutation hook + 1 schema + úprava `PlatformNewsSection`) — malé
**Repo:** `Projekt-ikaros-FE`, větev `main` (commit přímo, mikro-feature)
**Velikost:** ~5 nových souborů (~250 ř.), 1 úprava
**Autor:** PJ + Claude
**Datum:** 2026-05-14
**Souvisí:** [spec-2.1.md](../phase-2/spec-2.1.md) (PlatformNewsSection, NewsCard), full spec 3.1 přijde později

---

## 1. Cíl

Admin / Superadmin uvidí v hlavičce sekce **Novinky** na dashboardu (`/`) tlačítko `+`, kterým otevře modal a vytvoří novou Ikaros novinku. Po úspěšném odeslání se seznam okamžitě obnoví. Sekce **Akce** zůstává beze změny — `worldId` je povinný a vytváření patří do správy konkrétního světa (fáze 9.1).

---

## 2. Kontext / motivace

- Dashboard má prázdnou DB → uživatel (autor) chce naplnit první novinky bez nutnosti čekat na fázi 3 (`/ikaros/novinky` admin UI).
- BE už **plně podporuje** vytváření: `POST /api/IkarosNews` (JWT), DTO `{ title (≤300), content (≤10000) }`. Žádná změna BE.
  - *Poznámka:* BE controller dnes povoluje i `WorldRole.PJ`, což je legacy/bug — Ikaros novinky jsou platformový obsah, PJ je world-scoped role (viz `project_roles_architecture` memory). FE řídí přístup výhradně **globálními rolemi**. Sjednocení BE řešíme separátně (dluh, mimo tento spec).
- Toto je **early slice** z 3.1 — pouze create flow přímo z dashboardu. Plná admin správa (list, delete, edit, paginace, archiv) zůstává na fázi 3.1.
- Důvod předběhnutí: minimální zásah, BE hotový, autor blokovaný prázdným UI.

---

## 3. Audit současného stavu

- [`src/features/ikaros/pages/DashboardPage/sections/PlatformNewsSection.tsx`](../../../src/features/ikaros/pages/DashboardPage/sections/PlatformNewsSection.tsx) — sekce s `SectionHeader` (title + icon, **bez action prop**), `useIkarosNews()` query.
- [`src/features/ikaros/api/useIkarosNews.ts`](../../../src/features/ikaros/api/useIkarosNews.ts) — pouze GET query, `placeholderData: []`, queryKey `['ikaros-news']`.
- [`src/features/ikaros/pages/DashboardPage/components/SectionHeader.tsx`](../../../src/features/ikaros/pages/DashboardPage/components/SectionHeader.tsx) — podporuje `action?: ReactNode` slot vpravo.
- [`src/shared/ui/Modal/Modal.tsx`](../../../src/shared/ui/Modal/Modal.tsx) — existující modal s focus trap + Esc + backdrop close.
- Vzor form modalu: [`src/features/profile/components/ChangeEmailModal.tsx`](../../../src/features/profile/components/ChangeEmailModal.tsx) — `useForm` + `zodResolver` + sonner toast + axios error mapping.
- Role check vzor: [`IkarosLayout.tsx:191-192`](../../../src/app/layout/IkarosLayout/IkarosLayout.tsx#L191-L192) — `currentUser?.role === UserRole.Superadmin || currentUser?.role === UserRole.Admin`.
- BE controller: [`ikaros-news.controller.ts:41-49`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/ikaros-news/ikaros-news.controller.ts#L41-L49) — `POST /IkarosNews`, JwtAuthGuard, autor odvozen z JWT.
- BE DTO: [`create-ikaros-news.dto.ts`](C:/Matrix/ProjektIkaros/Projekt-ikaros/backend/src/modules/ikaros-news/dto/create-ikaros-news.dto.ts) — `title` IsNotEmpty MaxLength(300), `content` IsNotEmpty MaxLength(10000).

---

## 4. Návrh řešení

### 4.1 Viditelnost tlačítka `+`

V `PlatformNewsSection` přidat `action` prop do `SectionHeader` — **jen pokud `currentUser.role ∈ {Admin, Superadmin}`**. Ostatní globální role (Spr. článků/galerie/diskuzí, Ikarus) ani world role (PJ atd.) `+` nevidí. World role jsou v této matici irelevantní (viz `project_roles_architecture` memory).

Vizuál: kruhové ghost tlačítko s `Plus` ikonou (lucide-react), velikost odpovídá akčnímu slotu. Aria-label „Nová novinka". Reuse existující `Button` z `@/shared/ui` s `variant="ghost"` a `size="sm"`, ikona uvnitř — pokud `Button` nepodporuje icon-only nicely, použijeme přímý `<button>` se stylem konzistentním s existujícími actionmi v dashboard hlavičkách.

### 4.2 Modal `CreateNewsModal`

Soubor: `src/features/ikaros/components/CreateNewsModal.tsx` (sdílená komponenta — později ji použije i `/ikaros/novinky` admin v 3.1).

Form fields:
- **Nadpis** (`title`) — `Input`, 1–300 znaků, autoFocus, required.
- **Obsah** (`content`) — `<textarea>` (4–8 řádků, fixed-height), 1–10000 znaků, required. **Plain text** (řešení autora 2026-05-14 „jen minimum"). `\n` v textarea uložíme tak, jak jsou; `NewsCard` excerpt 2-line je nezalomí ani neoveze. Plný markdown / TipTap editor přichází v 3.1 + 3.2.

Validace: zod schema `createNewsSchema` v `src/features/ikaros/lib/createNewsSchema.ts`:
```
title: z.string().trim().min(1).max(300)
content: z.string().trim().min(1).max(10000)
```

Akce v patičce: **Zrušit** (ghost) + **Vytvořit** (primary, `loading` při mutaci).

Submit:
1. `useCreateIkarosNews` mutation (viz 4.3) → `mutateAsync({ title, content })`.
2. Úspěch → toast.success(„Novinka vytvořena."), reset formuláře, `onClose()`.
3. Chyba (axios) → mapování:
   - 401/403 → toast.error(„Nemáš oprávnění.") + close.
   - jiné → toast.error(„Nepodařilo se vytvořit novinku.") (form zůstane otevřený).

Modal velikost `md`, title „Nová novinka", standardní Modal infrastruktura.

### 4.3 Mutation hook `useCreateIkarosNews`

Rozšířit [`useIkarosNews.ts`](../../../src/features/ikaros/api/useIkarosNews.ts) o:

```ts
export function useCreateIkarosNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { title: string; content: string }) =>
      api.post<IkarosNews>('/IkarosNews', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ikaros-news'] });
    },
  });
}
```

Nová novinka se objeví okamžitě po invalidaci. Žádná optimistic update — list je krátký a invalidace stačí.

### 4.4 Integrace v `PlatformNewsSection`

```tsx
const currentUser = useAtomValue(currentUserAtom);
const canCreate = currentUser?.role === UserRole.Admin
  || currentUser?.role === UserRole.Superadmin;
const [createOpen, setCreateOpen] = useState(false);

<SectionHeader
  title="Novinky"
  icon={<Newspaper ... />}
  action={canCreate ? (
    <button aria-label="Nová novinka" onClick={() => setCreateOpen(true)}>
      <Plus size={18} />
    </button>
  ) : null}
/>
...
{canCreate && (
  <CreateNewsModal open={createOpen} onClose={() => setCreateOpen(false)} />
)}
```

### 4.5 Responsivita

Tlačítko `+` v `SectionHeader.action` slot — slot už řeší mobile/desktop layout v `SectionHeader.module.css`. Modal `Modal` má built-in responsive (size `md` → full-width na mobile). Žádné extra CSS úpravy potřeba (ověříme po implementaci skill `mobil-desktop`).

---

## 5. Mimo rozsah

- ❌ Edit / delete novinek z dashboardu — fáze 3.1.
- ❌ Stránka `/ikaros/novinky` (admin list, paginace, search) — fáze 3.1.
- ❌ Markdown / TipTap editor — fáze 3.1 / 3.2.
- ❌ Obrázek u novinky, kategorie, archiv — fáze 3.1.
- ❌ Tlačítko `+` u sekce **Akce** — vyžaduje cross-world UX, fáze 9.1.
- ❌ Ostatní globální role (Spr. článků/galerie/diskuzí) — vytváření novinek není v jejich matici oprávnění, fáze 3.1 si vyhodnotí.

---

## 6. Akceptační kritéria

- AK1: Anon uživatel → žádné `+` tlačítko v sekci Novinky.
- AK2: Logged-in s jinou globální rolí než Admin/Superadmin (Ikarus, Spr. článků/galerie/diskuzí) → žádné `+` tlačítko. World role jsou irelevantní.
- AK3: Admin nebo Superadmin → `+` viditelné vpravo nahoře v sekci Novinky.
- AK4: Klik na `+` otevře modal „Nová novinka" s prázdnými poli, focus v `title`.
- AK5: Validace: prázdný `title` nebo `content` → chyba pod polem, submit blocknutý.
- AK6: Validace: `title` > 300, `content` > 10000 znaků → chyba pod polem.
- AK7: Úspěšný submit → toast.success, modal se zavře, seznam novinek se obnoví (nová položka nahoře dle `createdAtUtc: -1`).
- AK8: 403 z BE → toast.error „Nemáš oprávnění" + modal se zavře (defensive — UI to nedovolí, ale BE může zatím odmítnout).
- AK9: Síťová chyba → toast.error + modal zůstane otevřený (user může opravit a resubmitnout).
- AK10: Modal funguje na mobilu i desktopu (skill `mobil-desktop` po implementaci).

---

## 7. Testy

- `CreateNewsModal.spec.tsx`:
  - render: title + content + Zrušit + Vytvořit (3 testy)
  - validace prázdná pole → submit blocknutý
  - validace max length
  - úspěšný submit → mutation volaná s daty, toast, onClose
  - chybová cesta → toast.error, modal otevřený
- `PlatformNewsSection.spec.tsx` (nový nebo úprava existujícího):
  - Anon → bez `+`
  - Ikarus (base globální role) → bez `+`
  - Admin → `+` viditelné, klik otevře modal
  - Superadmin → `+` viditelné
- `useCreateIkarosNews.spec.ts`: invalidace `['ikaros-news']` po úspěchu.

Cíl: +10–14 testů. Existující dashboard testy by neměly regressovat.

---

## 8. Dluhy & rizika

- **D-NEW3 (BE):** BE controller `POST /IkarosNews` povoluje `WorldRole.PJ` jako autorizovanou roli, což je sémantická chyba (Ikaros = platforma, PJ = world-scoped). Po nasazení 3.1a založit BE issue a zúžit BE autorizaci na globální role Admin/Superadmin. FE už nyní řídí přístup správně.
- **Riziko:** předběhnutí 3.1 znamená, že full admin UI ve 3.1 bude potřebovat sdílet `CreateNewsModal` — soubor proto umisťuji do `features/ikaros/components/`, ne do `features/ikaros/pages/DashboardPage/`. Plus `useCreateIkarosNews` hook v sdíleném `useIkarosNews.ts`.
- **Riziko:** plain `<textarea>` pro `content` — `\n` se v `NewsCard` excerptu zobrazí jako mezera (CSS `line-clamp`). OK pro start; rich text přijde s 3.1/3.2.

---

## 9. Rozhodnutí autora (2026-05-14)

1. **Plain textarea**, žádný markdown — „jen minimum".
2. **Branch:** commit přímo na `main` (mikro-feature).
3. **Role matice:** Ikaros novinky = platformový obsah → FE povolení **jen pro globální role Admin/Superadmin**. PJ a další world role jsou irelevantní (memory `feedback_platform_vs_world_roles`).
