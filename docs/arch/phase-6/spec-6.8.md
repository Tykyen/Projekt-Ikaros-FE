# Spec 6.8 — PJ identita v chatu (PJ persona)

> **Stav: ✅ implementováno (2026-06-10).** BE+FE build zelený, mobil-desktop (strukturálně) + napoveda hotové. ⚠️ **Čeká nasazení** (BE deploy kvůli `pjChatPersona` poli + FE deploy).
>
> **Soubory:** BE `world-settings.{schema,interface}.ts` + `update-world-settings.dto.ts` + `world-settings.repository.ts` (toEntity). FE `shared/types/index.ts` (`PjChatPersona`), `world/chat/lib/pjPersona.ts` (resolver), `chat/components/{MessageItem,MessageList}.tsx` + `world/chat/components/ChannelView.tsx` (render), `WorldSettingsPage/tabs/PjChatTab.tsx` + `components/PjChatPersonaEditor.tsx` (UI).
>
> Navazuje na 6.x chat. Cílem je, aby zprávy od vedení světa vystupovaly pod jednotnou identitou **„PJ"** s per-svět zvoleným avatarem, ne pod přihlašovacím jménem.

## Problém
Send flow nastaví `senderName = membership.characterPath || username`. PJ nemá postavu → padá na username („Tyky"). Avatar = `membership.avatarUrl` (osobní avatar účtu). V chatu tak vedení vystupuje pod civilní identitou — nežádoucí (mystérium/ponoření). Týká se i 1506 migrovaných zpráv (F11).

## Řešení — render-time (NEpřepisuje uložená data)
Identita „PJ" se dosadí **při vykreslení** podle role odesílatele v daném světě. Výhody: aplikuje se zpětně na všechny zprávy (i migrované), je živé (změna avatara/role se projeví všude), neduplikuje data, vratné.

### 1. World-setting `pjChatPersona`
Nové pole ve `WorldSettings`:
```ts
pjChatPersona: {
  enabled: boolean;      // default true — lze per svět vypnout
  name: string | null;   // null → label „PJ"
  avatarUrl: string | null; // null → fallback iniciála „P"
} | null
```
Edituje **PJ+** (role ≥ PJ) v Nastavení světa. Per svět (jedna sdílená identita „PJ", i když je PJ víc).

### 2. Render pravidlo (jen WORLD chat)
Pro zprávu, kde odesílatel má v daném světě **roli ≥ PomocnyPJ (4)** A zpráva **není NPC persona** (`overrideName` prázdné) A `pjChatPersona.enabled`:
- zobrazené jméno = `pjChatPersona.name ?? "PJ"`
- avatar = `pjChatPersona.avatarUrl ?? fallback (iniciála)`

**Priorita:** NPC override (`overrideName`) > PJ persona > membership (postava/jméno). PJ mluvící „za bytost" zůstává tou bytostí.

### 3. Rozsah povrchů
- **Bublina zprávy** (jméno + avatar) — MessageItem.
- **Citace odpovědi** (`replyToSenderName`) — pokud citovaná zpráva je od PJ → „PJ".
- Globální chat (`features/chat`) **netýká** — role jsou world-scoped, persona se předává jen z world ChannelView.

### 4. UI nastavení
Sekce v **Nastavení světa → Chat** (nebo nejbližší existující záložka): toggle „Vedení vystupuje jako PJ" + pole jméno (default „PJ") + výběr/upload avatara (vzor `groupImages` / profilový avatar upload, Cloudinary).

## Rozhodnutí (odsouhlaseno 2026-06-10)
1. **PomocnyPJ taky → „PJ"** (role ≥ PomocnyPJ 4), ne jen plný PJ.
2. Render-time (ne přepis uložených `senderName`) — pokrývá všech 1506 migrovaných i budoucí, retroaktivně.
3. Jméno default „PJ", per svět přejmenovatelné.
4. Avatar zvolí uživatel (PJ), aplikuje se zpětně automaticky.

## Otevřené / mimo rozsah
- Per-message opt-out („tahle zpráva pod mým jménem") — neřešíme (NPC override pokrývá potřebu mluvit jinak).
- Sjednocení barvy/fontu PJ persony — mimo rozsah (jen jméno+avatar).
