# Plán 20.5 — Interní chat správy platformy

Provádění po blocích **A → B → C**. Každý blok samostatně funkční (bez dluhu). FE napřed, BE navazuje proti kontraktu.

## Blok A — FE kostra + layout (mock data)
- **A1** route `admin/chat` (RoleGuard Sa/Admin) + nav položka „Chat" v `PlatformAdminPage` (naviguje, ne tab) + `AdminChatPage` kostra.
  - `src/features/admin/chat/pages/AdminChatPage.tsx` (+ module.css)
  - `src/app/router.tsx` — lazy import + route
  - `src/features/admin/pages/PlatformAdminPage.tsx` — tab „Chat" → `navigate('/admin/chat')`
- **A2** 3-sloupcový layout (grid, vzor `WorldChatRoom.module.css`): sidebar konverzací / okno / panel úkolů. Statická data.
- **A3** Dokumenty: tlačítko vedle lupy → seznam PDF (přepínač panelu) → nativní čtečka (iframe). Statická data.
- **A4** Úkoly: accordion per admin, autorizace edit self vs. superadmin (zatím dle currentUser role, mock data).

## Blok B — BE chat + napojení
- **B** nový modul `platform-chat` (BE): konverzace `{name, memberIds[], createdBy, isPlatform}`, zprávy (reuse ChatMessage), membership CRUD (superadmin), WS `chat:{conversationId}`. FE hooky `useAdminChat` (vzor `useWorldChat`), swap mock → API.
- **B2** dokumenty: kolekce `platform_documents` + PDF storage (Cloudinary raw / vlastní — rozhodnout), endpointy list/upload/download/delete. FE swap.

## Blok C — BE úkoly + napojení
- **C** kolekce `admin_tasks` `{ownerId, text, done, order, createdBy}`, endpointy list/create/toggle/edit/delete/reorder, autorizace owner|superadmin. FE swap; volitelný WS signál.

## Uzávěr
- `mobil-desktop` (sloupce se skládají ≤768px), `funkce` + `napoveda`, vitest + BE testy, `npm run build`. BE restart.

> Rozhodnutí (defaulty z 2026-07-03): nativní PDF náhled; dokument maže superadmin+uploader; Hlavní/Vedení zamčené seed; pořadí A→B→C.
