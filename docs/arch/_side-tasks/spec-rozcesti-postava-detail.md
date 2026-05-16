# Side-task: detail postavy po kliknutí v Rozcestí (`PŘÍTOMNÍ`)

## Cíl

V Rozcestí (`/chat/rozcesti*`) jde kliknout na osobu v seznamu `PŘÍTOMNÍ`.
Klik otevře modal s **kartou postavy** — avatar postavy, jméno postavy a popis
postavy (`characterBio`). Modal zůstane in-character: neukazuje žádné údaje
o účtu (username, město, role, bio účtu).

## Kontext

- Každý uživatel má „Postavu v Rozcestí“ — `characterName`, `characterBio`
  (až 1000 znaků), `characterAvatarUrl` (profil, sekce
  [CharacterSection.tsx](../../../src/features/profile/components/CharacterSection.tsx)).
- `UserList` v `mode="character"` (Rozcestí) už zobrazuje postavu místo účtu,
  ale řádky nejsou interaktivní.
- `ChatUser` z `room-info` / WS presence nese jen `characterName` +
  `characterAvatarUrl` — **`characterBio` v presence datech není**.
- Endpoint `GET /api/users/profile/:id` (`usePublicUserProfile`) vrací
  `PublicUserProfile` včetně `characterName`, `characterBio`,
  `characterAvatarUrl`, `defaultAvatarType`.

## Rozhodnutí (z brainstormingu)

1. **Obsah:** jen karta postavy (avatar postavy + jméno + popis). Žádné údaje
   o účtu — udrží roleplay.
2. **Forma:** modal (`shared/ui/Modal`), velikost `sm`/`md`. Zůstává se
   v místnosti.
3. **Data:** on-demand přes existující `usePublicUserProfile(userId)`. Bez
   změny BE.

## Rozsah změn

### 1. `UserList` — klikatelné řádky
- Nový volitelný prop `onSelectUser?: (userId: string) => void`.
- Pokud je předán, řádek je `<button>` (jinak zůstává `<div>` — Hospoda se
  nemění).
- Klik volá `onSelectUser(u.userId)`.
- Zachovat `s.self` zvýraznění; tap target ≥ 40 px (mobil).

### 2. Nová komponenta `CharacterDetailModal`
- `src/features/chat/components/CharacterDetailModal.tsx` + `.module.css`.
- Props: `userId: string | null`, `onClose: () => void`. `open = !!userId`.
- `usePublicUserProfile(userId)` — `staleTime` už 60 s, opakovaný klik je
  z cache.
- Stavy v těle modalu:
  - **loading** → `Spinner`.
  - **success** → `UserAvatar` (`characterAvatarUrl`, `defaultType="being"`),
    `characterName` (fallback „Bezejmenná postava“), `characterBio`
    (fallback „Tato postava zatím nemá popis.“).
  - **403** → „Profil této postavy je skrytý.“
  - **404 / jiná chyba** → „Postavu se nepodařilo načíst.“
- Modal `title="Detail postavy"` → hlavička s viditelným `✕` (objevitelné
  zavření na dotykovém mobilu; bez `title` `Modal` `✕` nerenderuje).

### 3. `ChatRoom` — zapojení
- `selectedUserId` state (`useState<string | null>`).
- `UserList` dostane `onSelectUser` **jen v `mode="character"`** (Rozcestí);
  v Hospodě zůstává `undefined` → řádky neklikatelné.
- Renderovat `<CharacterDetailModal userId={selectedUserId} onClose={…} />`.

## Mimo scope

- Hospoda (`mode="account"`) — řádky zůstávají neklikatelné.
- Doplnění `characterBio` do `room-info` / WS presence (BE).
- Odkaz z modalu na plný veřejný profil.

## Doplněná BE úprava

Předpoklad „bez změny BE“ byl chybný — žádný veřejný endpoint nevystavoval
pole postavy. Doplněno:

- BE `publicProfileV14` → odpověď nově obsahuje `bio`, `city`,
  `characterName`, `characterBio`, `characterAvatarUrl` (interface
  `PublicUserProfile` rozšířen).
- FE `usePublicUserProfile` přepnut z `/users/profile/:id` (starý minimální
  tvar) na `/users/profile/v14/:id` — opravuje i veřejný profil 1.4.

## Známé omezení

- `GET /users/profile/v14/:id` může u friends-only profilu vrátit 403 → modal
  ukáže „Profil této postavy je skrytý“ (in-character popis se nezobrazí).

## Stav

- [x] Schváleno
- [x] Implementováno (FE + BE)
