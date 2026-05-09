# Spec 1.6a — Reorganizace na feature-based moduly

**Status:** Draft — čeká na schválení
**Rozsah:** strukturní refactor FE, žádná funkční změna
**Repo:** `Projekt-ikaros-FE`, větev TBD (po domergování `feat/krok-1.2-registrace` a uzavření 1.3*)
**Velikost:** velký diff (~80–120 souborů přesun + update importů), 0 ř. behavior diff
**Autor:** PJ + Claude
**Datum:** 2026-05-09
**Souvisí:** [1.6b — assets cleanup](spec-1.6b-assets-cleanup.md), [1.6c — docs/arch cleanup](spec-1.6c-arch-docs-cleanup.md)

---

## 1. Cíl

Sjednotit kód do **feature-based modulů** v `src/features/<feature>/` tak, aby všechny artefakty jedné domény (hooks, store, schémata, komponenty, stránky) byly na jednom místě a importovaly se přes path alias `@/features/<feature>`.

Cíl není přepisovat logiku — jen ji přemístit a aktualizovat importy. **Žádná funkční změna, žádné nové API.** Po refactoru musí projít stávající testy, build a lint beze změny chování.

---

## 2. Motivace

Aktuální struktura je **by-type** (`api/`, `components/`, `pages/`, `store/`, `hooks/`). Důsledek: artefakty jedné domény jsou rozházené přes 4–5 složek. Konkrétní bolesti:

- **`auth`** je rozdrobený přes [src/api/hooks/useAuth.ts](src/api/hooks/useAuth.ts), [src/auth/loginIntent.ts](src/auth/loginIntent.ts), [src/components/auth/](src/components/auth/) (8 souborů + 4 specy), [src/store/authStore.ts](src/store/authStore.ts) a útržky v [src/router.tsx](src/router.tsx). Při změně auth kontraktu musíme upravovat 5 lokací.
- **`profile`** stejně — hook v `api/hooks/useProfile.ts`, schémata v `pages/ikaros/profile/profileSchemas.ts`, profil-specifické UI komponenty (`AvatarUploader`, `EditCard`, `ChatColorPicker`, `UserAvatar`) zalité do generického [src/components/ui/](src/components/ui/), page v `pages/ikaros/`.
- **`world`** — context v `contexts/`, hooks v `api/hooks/`, layout v `components/layout/`, stránek v `pages/world/` 22 ks.
- **Žádný path alias** ([tsconfig.app.json](tsconfig.app.json)) — všechny importy jsou relativní (`../../auth/loginIntent`), což ztěžuje přesuny a ztěžuje čtení.

**Důsledek:** vyšší cognitive load při navigaci, vyšší riziko duplicit (D-014 byl symptom), těžší smazatelnost feature.

**Riziko nedělání:** s každou další featurou (1.3+, world editor, chat, …) bordel poroste exponenciálně. Refactor teď je levnější než za 3 měsíce.

---

## 3. Audit současného stavu

### 3.1 Auth (5 lokací)

| Soubor | Účel |
|---|---|
| `src/api/hooks/useAuth.ts` | React Query mutace `useLogin`, `useRegister`, `useLogout` |
| `src/api/hooks/useAuth.spec.tsx` | testy hooks |
| `src/api/hooks/useAvailability.ts` + `.spec.tsx` | username/email check pro registraci |
| `src/auth/loginIntent.ts` | post-login deep-link helper (1.2h) |
| `src/components/auth/AuthBootstrap.tsx` | inicializace tokenu při boot |
| `src/components/auth/AvailabilityIcon.{tsx,module.css}` | UI indikátor |
| `src/components/auth/LoginModal.{tsx,module.css,spec.tsx,stories.tsx}` | login modal |
| `src/components/auth/RegisterModal.{tsx,module.css,spec.tsx,stories.tsx}` | register modal |
| `src/components/auth/PasswordStrengthIndicator.{tsx,module.css}` | UI |
| `src/components/auth/loginSchema.{ts,spec.ts}` | zod schéma |
| `src/components/auth/registerSchema.{ts,spec.ts}` | zod schéma |
| `src/components/auth/passwordStrength.{ts,spec.ts}` | čistá logika |
| `src/components/auth/index.ts` | barrel export |
| `src/store/authStore.ts` | Zustand store (token, user) |

### 3.2 Profile (4 lokace)

| Soubor | Účel |
|---|---|
| `src/api/hooks/useProfile.ts` | profile fetch + update mutation |
| `src/components/ui/AvatarUploader/` | profil-specific (default avatary, upload) |
| `src/components/ui/EditCard/` | profil-specific edit wrapper |
| `src/components/ui/UserAvatar/` | render avatar (možná shared — viz 3.6) |
| `src/components/ui/ChatColorPicker/` | profil-specific |
| `src/pages/ikaros/ProfilePage.{tsx,module.css}` | page |
| `src/pages/ikaros/profile/AccountSection.tsx` | sub-sekce |
| `src/pages/ikaros/profile/AppearanceSection.tsx` | sub-sekce |
| `src/pages/ikaros/profile/BioSection.tsx` | sub-sekce |
| `src/pages/ikaros/profile/CharacterSection.tsx` | sub-sekce |
| `src/pages/ikaros/profile/CommunityPlaceholders.tsx` | sub-sekce |
| `src/pages/ikaros/profile/ProfileHeader.{tsx,module.css}` | sub-sekce |
| `src/pages/ikaros/profile/SecuritySection.tsx` | sub-sekce |
| `src/pages/ikaros/profile/WorldsSection.tsx` | sub-sekce |
| `src/pages/ikaros/profile/profileSchemas.{ts,spec.ts}` | zod |
| `src/pages/ikaros/profile/ProfileSections.module.css` | css |

### 3.3 World (4 lokace)

- `src/contexts/WorldContext.tsx`
- `src/api/hooks/useWorlds.ts`
- `src/components/layout/WorldLayout/` (pokud existuje)
- `src/pages/world/` — 22 stránek

### 3.4 Chat / messages

- `src/api/hooks/useMessages.ts`
- `src/api/hooks/useSocket.ts`
- `src/store/socketStore.ts`
- `src/api/socket.ts`
- `src/pages/ikaros/ChatPage.tsx`
- `src/pages/world/WorldChatPage.tsx`

### 3.5 Admin

- `src/components/guards/RoleGuard.tsx`
- `src/pages/admin/PlatformAdminPage.tsx`
- `src/pages/admin/DungeonBuilderPage.tsx`

### 3.6 Shared UI (skutečně generické)

[src/components/ui/](src/components/ui/) obsahuje mix generik (`Button`, `Card`, `Input`, `Modal`, `Badge`, `Spinner`, `IkarosCard`) a feature-specific (`AvatarUploader`, `ChatColorPicker`, `EditCard`). Sporné: `UserAvatar` (používá ho profil i chat → asi shared).

### 3.7 Layout

[src/components/layout/](src/components/layout/) — `IkarosLayout`, `WorldLayout`, `PanelFrame`. **Patří do `app/`** (composition layer, ne feature).

### 3.8 Themes

[src/themes/](src/themes/) — funguje samostatně, **netýká se refactoru**. Zůstává `src/themes/`.

---

## 4. Návrh cílové struktury

```
src/
├── app/                          ← composition layer (rooted)
│   ├── main.tsx                  ← (z src/main.tsx)
│   ├── router.tsx                ← (z src/router.tsx)
│   ├── index.css                 ← (z src/index.css)
│   ├── providers/                ← QueryClientProvider, RouterProvider wrapper
│   └── layout/                   ← IkarosLayout, WorldLayout, PanelFrame
│
├── features/                     ← doménové moduly
│   ├── auth/
│   │   ├── api/                  ← useAuth, useAvailability + .spec
│   │   ├── components/           ← LoginModal, RegisterModal, AuthBootstrap,
│   │   │                           AvailabilityIcon, PasswordStrengthIndicator
│   │   ├── lib/                  ← loginIntent, loginSchema, registerSchema,
│   │   │                           passwordStrength + .spec
│   │   ├── store/                ← authStore
│   │   └── index.ts              ← veřejné exporty (barrel)
│   │
│   ├── profile/
│   │   ├── api/                  ← useProfile
│   │   ├── components/           ← AvatarUploader, EditCard, ChatColorPicker,
│   │   │                           ProfileHeader, *Section.tsx
│   │   ├── lib/                  ← profileSchemas + .spec
│   │   ├── pages/                ← ProfilePage
│   │   └── index.ts
│   │
│   ├── world/
│   │   ├── api/                  ← useWorlds
│   │   ├── context/              ← WorldContext
│   │   ├── pages/                ← 22 world pages
│   │   └── index.ts
│   │
│   ├── chat/
│   │   ├── api/                  ← useMessages, useSocket, socket.ts
│   │   ├── store/                ← socketStore
│   │   ├── pages/                ← ChatPage, WorldChatPage
│   │   └── index.ts
│   │
│   ├── admin/
│   │   ├── components/           ← RoleGuard
│   │   ├── pages/                ← PlatformAdminPage, DungeonBuilderPage
│   │   └── index.ts
│   │
│   └── ikaros/                   ← ostatní ikaros stránky bez vlastní feature
│       └── pages/                ← ArticlesPage, DiscussionsPage, GalleryPage,
│                                   HelpPage, MailPage, TermsPage, UsersPage,
│                                   UserProfilePage, WorldsPage,
│                                   CreateWorldPage, DashboardPage,
│                                   DiscussionsNewPage
│
├── shared/                       ← cross-feature, žádná doménová znalost
│   ├── api/                      ← client.ts (axios instance)
│   ├── ui/                       ← Button, Card, Input, Modal, Badge,
│   │                               Spinner, IkarosCard, UserAvatar
│   ├── ui/error/                 ← GlobalErrorBoundary
│   ├── lib/                      ← jwt, useDebouncedValue + .spec
│   ├── store/                    ← uiStore (UI-only, nemá doménu)
│   └── types/                    ← src/types/index.ts
│
├── themes/                       ← BEZ ZMĚNY (samostatný subsystém)
└── assets/                       ← BEZ ZMĚNY
```

### 4.1 Pravidla závislostí (import rules)

1. `app/` může importovat z `features/*` a `shared/*`.
2. `features/<X>/` může importovat z `shared/*` a z **veřejného `index.ts`** jiné feature `features/<Y>` (přes alias) — **ne přímo** z vnitřních souborů `features/<Y>/components/Foo.tsx`.
3. `shared/` **nesmí** importovat z `features/*` ani z `app/*`.
4. `themes/` zůstává samostatné — importuje jen z `shared/` (pokud vůbec).
5. Veřejné API feature je definováno v `features/<X>/index.ts`. Co tam není exportováno, je interní.

**Vynucení (volitelné, ne v scope této specu):** ESLint plugin `eslint-plugin-boundaries` nebo `eslint-plugin-import` s `no-restricted-paths`. Doporučuji zavést samostatným spec po dokončení 1.2i.

### 4.2 Path alias

Zavést alias `@/` → `src/` v [tsconfig.app.json](tsconfig.app.json) + [vite.config.ts](vite.config.ts) + případně [vitest.config](vitest.config.ts).

```jsonc
// tsconfig.app.json
"compilerOptions": {
  ...,
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"]
  }
}
```

```ts
// vite.config.ts
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}
```

**Konvence importů:**
- Mezi feature/shared/app → vždy `@/`. Příklad: `import { useAuth } from '@/features/auth'`.
- Uvnitř téže feature → relativní (`./components/X`, `../lib/y`). Příklad: `LoginModal.tsx` → `import { useLogin } from '../api/useAuth'`.

---

## 5. Mapping starý → nový path (přehled)

Uvedeno reprezentativně; kompletní seznam bude součástí impl. plánu.

| Starý | Nový |
|---|---|
| `src/main.tsx` | `src/app/main.tsx` |
| `src/router.tsx` | `src/app/router.tsx` |
| `src/index.css` | `src/app/index.css` |
| `src/components/layout/IkarosLayout/` | `src/app/layout/IkarosLayout/` |
| `src/components/layout/WorldLayout/` | `src/app/layout/WorldLayout/` |
| `src/components/layout/PanelFrame/` | `src/app/layout/PanelFrame/` |
| `src/api/client.ts` | `src/shared/api/client.ts` |
| `src/api/hooks/useAuth.ts` (+spec) | `src/features/auth/api/useAuth.ts` |
| `src/api/hooks/useAvailability.ts` (+spec) | `src/features/auth/api/useAvailability.ts` |
| `src/auth/loginIntent.ts` | `src/features/auth/lib/loginIntent.ts` |
| `src/components/auth/*` | `src/features/auth/components/*` (kromě schémat → `lib/`) |
| `src/components/auth/{login,register}Schema.ts` (+spec) | `src/features/auth/lib/{login,register}Schema.ts` |
| `src/components/auth/passwordStrength.ts` (+spec) | `src/features/auth/lib/passwordStrength.ts` |
| `src/store/authStore.ts` | `src/features/auth/store/authStore.ts` |
| `src/api/hooks/useProfile.ts` | `src/features/profile/api/useProfile.ts` |
| `src/components/ui/AvatarUploader/` | `src/features/profile/components/AvatarUploader/` |
| `src/components/ui/EditCard/` | `src/features/profile/components/EditCard/` |
| `src/components/ui/ChatColorPicker/` | `src/features/profile/components/ChatColorPicker/` |
| `src/pages/ikaros/ProfilePage.*` | `src/features/profile/pages/ProfilePage.*` |
| `src/pages/ikaros/profile/*` | `src/features/profile/components/*` (sub-sections) |
| `src/contexts/WorldContext.tsx` | `src/features/world/context/WorldContext.tsx` |
| `src/api/hooks/useWorlds.ts` | `src/features/world/api/useWorlds.ts` |
| `src/pages/world/*` | `src/features/world/pages/*` |
| `src/api/socket.ts` | `src/features/chat/api/socket.ts` |
| `src/api/hooks/useMessages.ts` | `src/features/chat/api/useMessages.ts` |
| `src/api/hooks/useSocket.ts` | `src/features/chat/api/useSocket.ts` |
| `src/store/socketStore.ts` | `src/features/chat/store/socketStore.ts` |
| `src/pages/ikaros/ChatPage.tsx` | `src/features/chat/pages/ChatPage.tsx` |
| `src/pages/world/WorldChatPage.tsx` | `src/features/chat/pages/WorldChatPage.tsx` |
| `src/components/guards/RoleGuard.tsx` | `src/features/admin/components/RoleGuard.tsx` |
| `src/pages/admin/*` | `src/features/admin/pages/*` |
| `src/pages/ikaros/{Articles,Chat,Discussions,Gallery,Help,Mail,Terms,Users,UserProfile,Worlds,CreateWorld,Dashboard,DiscussionsNew}Page.*` | `src/features/ikaros/pages/*` |
| `src/components/ui/{Button,Card,Input,Modal,Badge,Spinner,IkarosCard,UserAvatar}/` | `src/shared/ui/*` |
| `src/components/GlobalErrorBoundary.tsx` | `src/shared/ui/error/GlobalErrorBoundary.tsx` |
| `src/store/uiStore.ts` | `src/shared/store/uiStore.ts` |
| `src/utils/*` | `src/shared/lib/*` |
| `src/types/index.ts` | `src/shared/types/index.ts` |
| `src/__tests__/` | zůstává `src/__tests__/` (top-level) |

---

## 6. Postup migrace (fázování)

Refactor proběhne v **5 commitech v jednom PR**, aby každý commit byl smysluplný a jednoduše review-able. Pořadí podle závislosti (od listů ke kořeni):

### Commit 1 — Path alias `@/`
- Přidat `paths` do `tsconfig.app.json`, `alias` do `vite.config.ts` a vitest configu.
- **Žádný přesun souborů.** Jen infrastructure.
- Acceptance: `import x from '@/api/client'` funguje, build/test/lint zelený.

### Commit 2 — `shared/` přesun
- Přesunout `api/client.ts`, `utils/*`, `types/*`, `components/ui/{Button,Card,Input,Modal,Badge,Spinner,IkarosCard,UserAvatar}/`, `components/GlobalErrorBoundary.tsx`, `store/uiStore.ts`.
- Update všech importů na `@/shared/...`.
- Acceptance: build/test/lint zelený, žádná funkční změna.

### Commit 3 — `features/auth` + `features/profile`
- Přesun + barrel `index.ts`. Auth je první (nejvíc rozházený), profil druhý (nejvíc UI).
- Update importů.
- Acceptance: build/test/lint zelený.

### Commit 4 — `features/world` + `features/chat` + `features/admin` + `features/ikaros`
- Přesun zbývajících features.
- Acceptance: build/test/lint zelený.

### Commit 5 — `app/`
- Přesun `main.tsx`, `router.tsx`, `index.css`, `components/layout/` → `app/layout/`.
- Update `index.html` ([index.html](index.html)) entry pointu na `/src/app/main.tsx`.
- Smazat prázdné složky (`src/api/`, `src/components/`, `src/store/`, `src/contexts/`, `src/auth/`, `src/utils/`, `src/types/`, `src/pages/`).
- Acceptance: dev server startuje, build/test/lint zelený.

Každý commit je samostatně revertovatelný (rollback per krok).

---

## 7. Out of scope

- **Behaviorální změny** — žádné. Jen přesuny + importy.
- **Test refactor** — testy se přesouvají s implementací, jejich obsah se nemění.
- **ESLint vynucení import rules** — samostatný spec po 1.2i.
- **Storybook config update** — pokud používá glob na cestu, jen update glob. Žádný přepis stories.
- **Konsolidace `LoginModal`/`RegisterModal` post-auth flow** — odkaz na out-of-scope v 1.2h, stále otevřené.
- **Themes refaktor** — `src/themes/` zůstává.
- **Refactor sub-stránek profilu** (`AccountSection`, `BioSection`…) na samostatné moduly — zůstávají jako `features/profile/components/`.

---

## 8. Acceptance kritéria

1. ✅ Path alias `@/*` funguje v TS, Vite i Vitest. Příklad import `import { Button } from '@/shared/ui/Button'` se resolvuje.
2. ✅ Adresářová struktura odpovídá sekci 4 (`src/app/`, `src/features/{auth,profile,world,chat,admin,ikaros}/`, `src/shared/`, `src/themes/`, `src/assets/`).
3. ✅ Žádná feature neimportuje **přímo** z interních souborů jiné feature. Cross-feature importy jdou přes `@/features/<X>` (barrel).
4. ✅ `shared/` neimportuje nic z `features/*` ani z `app/*` (grep check).
5. ✅ Build prochází (`npm run build`).
6. ✅ Lint prochází bez nových warningů (`npm run lint`).
7. ✅ Testy prochází (`npm run test:run`) bez změny test logiky.
8. ✅ Dev server startuje (`npm run dev`) a UI funguje na `/`, `/?openLogin=1`, `/ikaros/profil`, `/world/<slug>` (smoke test).
9. ✅ Storybook startuje (`npm run storybook`) a stories se renderují.
10. ✅ `dluhy.md`: nový záznam D-021 → Uzavřené (s odkazem na 1.2i), nebo pokud nebyl předem evidovaný, jen poznámka v changelog části nahoře.
11. ✅ Žádné prázdné staré složky v `src/` (`api/`, `components/`, `store/`, `contexts/`, `auth/`, `utils/`, `types/`, `pages/`).

---

## 9. Test plán

**Automated:** stávající test suite (`npm run test:run`) musí projít beze změny.

**Manuální smoke test (po commitu 5):**
1. `npm run dev` → otevřít `/`. Headera + theme funguje.
2. Klik **Přihlásit** → LoginModal se otevře. Login `tykytanjunior@gmail.com` → redirect na dashboard.
3. Otevřít **Profil** (`/ikaros/profil`). Avatar uploader, sections, edit funguje.
4. Klik **Odhlásit** → redirect na `/`, sessionStorage smazán.
5. **Registrace** přes RegisterModal — username availability check funguje.
6. Otevřít world (libovolný) — `/world/<slug>` načte WorldLayout, sidebar funguje.
7. Otevřít chat (`/ikaros/chat`) — socket connect funguje.

---

## 10. Riziko & rollback

### Rizika

| # | Riziko | Pravděpodobnost | Mitigace |
|---|---|---|---|
| 1 | Storybook stories se rozbijí (cesty k assets, glob) | střední | per-commit kontrola `npm run storybook`, fix glob v `.storybook/main.ts` |
| 2 | Vitest nenajde testy po přesunu | nízká | vitest běžně používá glob `**/*.spec.*`, ale ověřit po commit 1 |
| 3 | Circular dependency mezi features (auth ↔ profile) | nízká | barrel `index.ts` je jen re-export, čisté API; pokud vznikne, řeší se ad-hoc (extrakce do `shared/`) |
| 4 | Merge konflikty s `feat/krok-1.2-registrace` | **vysoká** | **prerequisita: domergovat 1.2 před začátkem 1.2i.** Refactor neběží paralelně s feature prací. |
| 5 | Zapomenutý relativní import (`../../foo`) po přesunu | nízká | TS build vlastně chytí 100% — neexistující path = compile error |
| 6 | `index.html` entrypoint `src/main.tsx` se neaktualizuje | nízká | součást commit 5 acceptance |
| 7 | CSS modul cesty v `app/layout/` | nízká | CSS moduly jsou kotvené k `.tsx` souboru, přesun beze změny |

### Rollback

Per-commit rollback (`git revert <sha>`). Pokud se najde závada až po PR mergi, revert celého merge commitu vrátí strukturu zpět. Vzhledem k tomu, že žádná funkční změna není, rollback nemá behaviorální dopad.

---

## 11. Rozhodnutí (vlastní uvážení dle souhlasu autora)

Autor delegoval rozhodnutí. Volby:

1. **Path alias** → `@/*` → `src/*`. Krátký, idiomatic v React/Vite ekosystému.
2. **Pojmenování** → `features/`. FE community standard, čitelnější než `modules/` (matchnul by BE, ale FE/BE jsou jiné mentální modely).
3. **`features/ikaros/`** jako fallback pro placeholder stránky (Articles, Discussions, Gallery, Help, Mail, Terms, Users, Dashboard, DiscussionsNew, CreateWorld). Jakmile placeholder dozraje, vyextrahuje se do vlastní feature.
4. **`UserAvatar`** → `shared/ui/UserAvatar/`. Pure render komponenta bez doménové logiky, používá ji profil i chat.
5. **`authStore`** → **Variant B: `shared/store/authStore.ts`**. Token je cross-cutting concern (potřebuje ho `shared/api/client.ts` pro `Authorization` header). Auth feature store *používá*, nedefinuje vlastní. (Pragmatické > filozoficky čisté Variant A; Variant C over-engineering.)
6. **Načasování** → **až po domergování `feat/krok-1.2-registrace` a uzavření 1.3a/b/c.** Refactor neběží paralelně s feature prací, jinak merge hell.
7. **Velikost PR** → 1 PR, 5 commitů (per fáze). Nižší review overhead než 5 PR, každý commit samostatně revertovatelný.

---

**Po schválení specu napíšu implementační plán** (přesné CLI příkazy přesunů, exhaustivní seznam updatů importů, test running po každém commitu).
