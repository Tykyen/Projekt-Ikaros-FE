# Spec 3.1b — Novinky: typy, obrázek, veřejné stránky + kalendář akcí

**Status:** ✅ Hotovo (2026-05-15) — BE +42 testů, FE +31 testů. Implementováno v 10 sub-fázích (3.1b-a … 3.1b-j), commity přímo do `main`.
**Rozsah:** FE + **velký BE** — rozšíření novinek + 2 nové stránky + kalendář akcí + **dostavba chybějícího BE z 2.1b** (modul `ikaros-events` + generic upload)
**Repo:** `Projekt-ikaros-FE` + `Projekt-ikaros` (BE), commity přímo do `main` (bez feature větví — autorské rozhodnutí)
**Velikost:** odhad FE ~18–22 souborů / ~900 ř., BE ~14 souborů / ~700 ř. (z toho ~500 ř. nový modul `ikaros-events`)
**Autor:** PJ + Claude
**Datum:** 2026-05-15
**Souvisí:** [spec-3.1.md](spec-3.1.md), [spec-3.1a-news-create-early.md](spec-3.1a-news-create-early.md), [spec-2.1b-ikaros-events.md](../phase-2/spec-2.1b-ikaros-events.md)

---

## 1. Cíl

Rozšířit platformové novinky o **typ** (Informace / Upozornění / Systémová) a **obrázek**, předělat náhledovou kartu na **rozbalovací** (sbaleno = nadpis + typ + datum; rozbaleno = obrázek + text + autor). Přidat **stránku Akce** s měsíčním kalendářem globálních akcí. Dashboard omezit na **3 + 3** položky s prokliky na plné stránky.

Zároveň **konsolidovat správu novinek**: dnešní oddělený tab „Novinky" v `/ikaros/uzivatele` zrušit a sloučit s veřejnou stránkou `/ikaros/novinky` do **jediného hubu** — veřejné zobrazení i admin správa na jednom místě.

---

## 2. Kontext / motivace

Novinky dnes nemají kategorizaci — všechny vypadají stejně, čtenář nepozná systémové oznámení od běžné informace. Náhled na dashboardu plýtvá místem (excerpt + autor). Veřejná stránka `/ikaros/novinky` neexistuje (jen redirect na admin tab), takže **starší novinky není kde dohledat**. Globální akce mají jen widget „nadcházející" — bez kalendáře nejde procházet historii ani plán.

Typy a obrázek byly součástí původního záměru fáze 3.1 (roadmap ř. 419 „Full 3.1 … kategorie, obrázek"), ale descopnuly se. Tato spec je dokončuje.

---

## 3. Audit současného stavu

**Datový model** — [shared/types/index.ts:327](../../../src/shared/types/index.ts#L327) `IkarosNews` = `{ id, title, content (HTML), authorId, authorName, createdAtUtc, archived, archivedAtUtc?, archivedByUserId? }`. Žádný typ, žádný obrázek.

**Náhledová karta** — [NewsCard.tsx](../../../src/features/ikaros/pages/DashboardPage/components/NewsCard.tsx) ukazuje `title + relativní datum + excerpt + autora`. Statická, nerozbaluje se.

**Dashboard** — [PlatformNewsSection.tsx:15](../../../src/features/ikaros/pages/DashboardPage/sections/PlatformNewsSection.tsx#L15) `slice(0, 5)`; [IkarosEventsSection.tsx:14](../../../src/features/ikaros/pages/DashboardPage/sections/IkarosEventsSection.tsx#L14) `useUpcomingIkarosEvents(5)`. Žádný proklik na plnou stránku.

**Routing** — [router.tsx:156](../../../src/app/router.tsx#L156) `/ikaros/novinky` → `redirect('/ikaros/uzivatele?tab=novinky')`. Stránka akcí pro globální Ikaros eventy neexistuje (`EventsPage`/`sprava-udalosti` jsou herní události světa, jiná doména).

**Formulář** — [NewsFormModal.tsx](../../../src/features/ikaros/components/NewsFormModal.tsx) + [createNewsSchema.ts](../../../src/features/ikaros/lib/createNewsSchema.ts): jen `title` + `content`.

> ⚠️ **Zásadní nález — BE z fáze 2.1b nikdy nevznikl.** [spec-2.1b-ikaros-events.md](../phase-2/spec-2.1b-ikaros-events.md) i [roadmap-fe.md:420](../../roadmap-fe.md) tvrdí, že modul `ikaros-events` a generic upload endpoint jsou hotové („BE 28 testů"). `git log --all` v BE repu ale ukazuje **nula commitů** dotýkajících se `ikaros-events`. FE má kompletní UI (`useIkarosEvents`, `IkarosEventModal`, `IkarosEventCard`), volá `/ikaros-events` a `/upload/image` — **oba endpointy vrací 404**. Důsledek: sekce „Akce" na dashboardu je dnes **rozbitá** pro každého přihlášeného uživatele. Tato spec proto **dostavuje chybějící BE z 2.1b** (viz §4.9, §4.10). FE design z 2.1b §4.1/§4.2 slouží jako závazný kontrakt.

**Upload infra** — BE `UploadController` má jen `POST /upload`, který **vyžaduje `channelId`** (chat-only) — generický image upload neexistuje. `UploadService` ale už umí Cloudinary upload. → potřeba tenký generic endpoint `POST /upload/image` (§4.9).

**Admin správa** — [NewsManagementTab.tsx](../../../src/features/users/components/tabs/NewsManagementTab/NewsManagementTab.tsx) tabulka jako tab v `/ikaros/uzivatele?tab=novinky` (přesunuto sem commitem `27ed48c`). **Problém:** novinky budou veřejně viditelné na dashboardu i na `/ikaros/novinky` — oddělené admin místo v Uživatelích je dvojkolejnost. Roadmap ř. 521 navíc `/ikaros/novinky` stále popisuje jako „Admin správa" stránku, což je zastaralé.

---

## 4. Návrh řešení

### 4.1 Datový model (BE + FE type-sync)

Nový enum a 2 pole na `IkarosNews`:

```ts
export type IkarosNewsType = 'info' | 'warning' | 'system';
// info = Informace (fialová), warning = Upozornění (červená), system = Systémová (zelená)

export interface IkarosNews {
  // …stávající pole…
  type: IkarosNewsType;   // default 'info'
  imageUrl?: string;      // server-side storage, null = bez obrázku
}
```

**BE změny — `ikaros-news`:**
- `IkarosNews` schema + DTOs o `type` (enum, default `info`) + `imageUrl?` (string URL).
- `POST /IkarosNews` + `PATCH /IkarosNews/:id` přijímají `type` i `imageUrl`.
- Žádný news-specific image endpoint — obrázek se nahraje generickým `POST /upload/image` (§4.9), FE pošle vrácenou URL v `imageUrl`.
- Validace: `type` jen z enumu.

### 4.2 Barvy nadpisů — jen text nadpisu

Tři CSS tokeny, výchozí hodnoty, témata mohou přepsat (scoped `[data-theme=…]`):

```css
--news-info:    #8b5cf6;  /* fialová */
--news-warning: #dc2626;  /* červená */
--news-system:  #16a34a;  /* zelená */
```

Obarví se **pouze text nadpisu** novinky (`<h_>` v kartě i na detailu). Zbytek karty neutrální. Vedle nadpisu malý textový štítek typu („Informace" / „Upozornění" / „Systémová") ve stejné barvě — aby barva nebyla jediný nositel informace (přístupnost pro barvosleposti).

### 4.3 Rozbalovací karta novinky (`NewsCard`)

Přestavba na accordion:

| Stav | Obsah |
|------|-------|
| **Sbaleno** (default) | nadpis (obarvený) · štítek typu · datum vytvoření (dole) |
| **Rozbaleno** (po kliknutí) | + obrázek (pokud je) · plný rich-text obsah · dole autor za datem („— Jméno · 15. 5. 2026") |

- Klik na celou kartu / Enter na fokusu přepíná. `aria-expanded`, `role="button"`.
- Sdílená komponenta pro dashboard i veřejnou stránku.

📚 *Accordion* = prvek, který po kliknutí rozbalí/sbalí skrytý obsah na místě, bez přechodu na jinou stránku.

### 4.4 Dashboard — 3 + 3 + prokliky

- `PlatformNewsSection`: `slice(0, 3)`, pod seznamem odkaz **„Všechny novinky →"** na `/ikaros/novinky`.
- `IkarosEventsSection`: `useUpcomingIkarosEvents(3)`, odkaz **„Kalendář akcí →"** na `/ikaros/akce`.

### 4.5 Stránka Novinky (`/ikaros/novinky`) — jediný hub (veřejné zobrazení + admin správa)

Zrušit redirect, nová `NovinkyPage`. **Jedna stránka, role-aware obsah:**

| Role | Co vidí |
|------|---------|
| Anon / Hráč | Seznam **aktivních** novinek (scope `active`), nejnovější nahoře, rozbalovací karty z 4.3. Archiv = zpětné čtení. |
| Admin / Superadmin | + přepínač **Aktivní / Archiv** · tlačítko `+ Nová` · na každé kartě inline akce **Upravit / Archivovat (Obnovit) / Smazat**. |

- Paginace / „načíst další" — využije `useIkarosNewsList` + `useIkarosNewsCount` (přesun z `NewsManagementTab`).
- Mutace (archive/unarchive/delete/edit) a `NewsFormModal` se přesunou z `NewsManagementTab` sem.
- Tabulkový layout správy se **zahodí** — admin i anon vidí tytéž rozbalovací karty, admin navíc ovládací prvky. Jeden vizuál, žádná dvojkolejnost.
- Smazání přes `ConfirmDialog` („nevratné") — beze změny chování.

### 4.6 Stránka Akce (`/ikaros/akce`) — měsíční kalendář

- Nová `AkcePage` — měsíční mřížka (7 sloupců, dny), navigace ◀ měsíc ▶, tlačítko „Dnes".
- Akce vykreslené jako body/štítky v příslušných dnech; minulé i budoucí.
- Klik na akci → `IkarosEventModal` (existující) s detailem.
- Data: `useIkarosEvents()` (vrací všechny akce) — funguje až po dostavbě BE (§4.10).
- Admin/Superadmin: `+` pro vytvoření akce.
- Mobil: kalendář je široký → na ≤768px fallback na seznam (minulé/nadcházející) místo mřížky.

📚 Měsíční mřížka na mobilu má buňky ~45 px — nečitelné. Proto mobilní fallback na seznam; skill `mobil-desktop` to po implementaci ověří.

### 4.7 Formulář novinky (`NewsFormModal`)

- `createNewsSchema` + pole `type` (enum, default `info`).
- Select / radio se 3 typy.
- Uploader obrázku: náhled, „Vybrat soubor", „Odebrat". Nahrání přes `POST /upload/image` (§4.9) → vrácená URL do `imageUrl`.
- Tok: vybraný obrázek se nahraje, pak `POST /IkarosNews` / `PATCH /IkarosNews/:id` (JSON s `type` + `imageUrl`).

### 4.9 BE — generic image upload endpoint `POST /upload/image`

Dostavba chybějícího endpointu z 2.1b §4.2. Tenký endpoint nad existujícím `UploadService` (Cloudinary):

- `POST /upload/image`, `JwtAuthGuard`, `FileInterceptor` (memoryStorage, limit ~10 MB, jen `image/*`).
- Bez `channelId` (na rozdíl od `POST /upload`) — generický, použijí ho novinky i akce.
- Vrací `{ url, publicId }`.
- Role: Admin/Superadmin (tvorba platformového obsahu).

### 4.10 BE — dostavba modulu `ikaros-events`

Dostavba chybějícího modulu z 2.1b §4.1 — **závazný kontrakt = FE typ `IkarosEvent`** ([shared/types/index.ts:416](../../../src/shared/types/index.ts#L416)) a FE hooky [useIkarosEvents.ts](../../../src/features/ikaros/api/useIkarosEvents.ts). Struktura kopíruje `ikaros-news`.

- **Schema `ikaros_events`** — `title`, `date`, `description`, `imageUrl?`, `imageFocalX?/imageFocalY?` (0–100, z 2.1b-focal), `confirmable`, `attendeeUserIds: string[]`, `authorId`, `authorName?`, `createdAtUtc`, `isActive`.
- **DTO** create/update — viz 2.1b §4.1 + `imageFocalX/Y`.
- **Endpointy:** `GET /ikaros-events`, `GET /ikaros-events/upcoming?limit`, `POST`, `PUT /:id`, `DELETE /:id` (soft `isActive=false`), `POST /:id/confirm` (RSVP toggle, 409 pokud `confirmable=false`).
- **Response mapping:** odvodit `myRsvp` (`'confirmed'|'none'`), `confirmedCount`, `confirmedBy: [{userId,userName}]` (join jmen z Users) — FE typ je vyžaduje.
- **Auth:** read = logged-in (žádný anon, dle 2.1b); mutace = Admin/Superadmin; RSVP = kdokoli logged-in.
- **Testy** — service + repository, vzor `ikaros-news.service.spec.ts`.

### 4.8 Odstranění tabu „Novinky" z `/ikaros/uzivatele`

- Odebrat tab „Novinky" z [UsersPageTabs](../../../src/features/users/components/UsersPageTabs.tsx) + [usersPageTabs.helpers.ts](../../../src/features/users/components/usersPageTabs.helpers.ts).
- `NewsManagementTab` adresář **smazat** — jeho logika přešla do `NovinkyPage` (4.5). Stejně tak jeho testy.
- `?tab=novinky` na UsersPage → fallback na default tab (žádný redirect navíc).
- Sub-tab param `?novinky=archived` se přesune na `NovinkyPage` (jen pro admin režim).

---

## 5. Out of scope

- Obrázek uvnitř rich-textu obsahu (TipTap Image extension) — to je 3.3.
- Anonymní přístup k akcím — `/ikaros-events` zůstává logged-in (dle rozhodnutí 2.1b); veřejný kalendář pro anon by chtěl další BE změnu.
- Rozšiřování funkčnosti akcí nad rámec 2.1b kontraktu (3-stavový RSVP, opakování) — jen dostavujeme, co mělo existovat.
- Novinky/akce **světa** (9.5) — tato spec jen globální platformové.
- Notifikace o nové novince, „přečteno" tracking.
- Filtrování novinek podle typu na veřejné stránce — případně samostatný dluh.
- Drag&drop akcí v kalendáři, opakující se akce.

---

## 6. Acceptance kritéria

1. ✅ `IkarosNews` má `type` + `imageUrl`; FE typy synchronní s BE.
2. ✅ Nadpis novinky obarven dle typu (fialová/červená/zelená), vedle textový štítek typu.
3. ✅ Karta novinky sbalená = nadpis + typ + datum; po kliknutí rozbalí obrázek + text + autora za datem.
4. ✅ Dashboard ukazuje max 3 novinky a 3 akce + prokliky na plné stránky.
5. ✅ `/ikaros/novinky` je jediný hub: anon/hráč vidí archiv aktivních novinek, Admin+ navíc přepínač Aktivní/Archiv, `+ Nová` a inline správu (edit/archiv/smazat). Žádný redirect.
6. ✅ Tab „Novinky" v `/ikaros/uzivatele` je odstraněn; `NewsManagementTab` smazán.
7. ✅ BE modul `ikaros-events` existuje a odpovídá kontraktu FE typu `IkarosEvent`; `GET/POST/PUT/DELETE /ikaros-events` + `/confirm` fungují, BE testy zelené.
8. ✅ `POST /upload/image` existuje (generic, bez `channelId`); FE `useUploadImage` funguje.
9. ✅ Sekce „Akce" na dashboardu už není rozbitá; `/ikaros/akce` zobrazí měsíční kalendář globálních akcí (minulé i budoucí), klik → detail.
10. ✅ Admin může u novinky nastavit typ a obrázek (create i edit).
11. ✅ Vše funkční na mobilu i desktopu (`mobil-desktop` projde); kalendář má mobilní fallback.
12. ✅ Nápověda (`/ikaros/napoveda`) aktualizovaná; roadmap + status spec-2.1b opraveny (sekce 10).

---

## 7. Test plán

**Automated FE (Vitest):**
- `NewsCard` — sbaleno/rozbaleno toggle, `aria-expanded`, barva dle typu, autor jen v rozbaleném.
- `createNewsSchema` — `type` default + validace enumu.
- `NewsFormModal` — odeslání s typem; image upload tok (mock).
- `NovinkyPage` — render seznamu, paginace, empty/error state.
- `AkcePage` — render mřížky, navigace měsíců, klik na akci otevře modal, mobilní fallback.
- `PlatformNewsSection`/`IkarosEventsSection` — limit 3, proklik link.

**Automated BE (Jest):**
- `ikaros-events.service.spec` — create/update/delete (role check), findActive/findUpcoming, `myRsvp` derivace, `confirm` toggle + 409 při `confirmable=false`.
- `ikaros-events.repository.spec` — query + soft delete.
- `ikaros-news.service.spec` — `type` default + update.
- upload — `POST /upload/image` (image-only, role, chybějící soubor).

**Manuální smoke:** vytvořit novinku každého typu s obrázkem; ověřit barvy; rozbalit kartu; projít archiv; vytvořit akci, RSVP toggle; kalendář prev/next/dnes; mobil 360 px.

---

## 8. Riziko & rollback

| Riziko | Mitigace |
|--------|----------|
| Commity přímo do `main` rozbijí main | Každá sub-fáze samostatně zelená (test + build) před commitem; nikdy nezelený commit |
| `ikaros-events` modul neodpovídá FE kontraktu | Závazný kontrakt = FE typ `IkarosEvent` + hooky; BE testy ověří shape |
| BE `ikaros-events` je velký (~500 ř.) | Rozdělen na vlastní sub-fázi se samostatným zeleným commitem |
| Stávající novinky bez `type` | BE default `info` na úrovni schématu; FE fallback `news.type ?? 'info'` |
| Kalendář těžký na mobilu | Mobilní fallback na seznam (4.6) |
| Barvy se tlučou s tématy | Tokeny `--news-*` přepisovatelné per téma, výchozí přístupné |

**Rollback:** vše aditivní (nové moduly, route, pole). Revert daného sub-fáze commitu (`git revert`) vrátí stav. Stará data zůstávají validní (`type` optional na čtení).

---

## 9. Otázky k autorovi

Žádné, autor rozhodl. Volby:
- BE + FE **v jednom plánu**, commity přímo do `main`.
- Obrázek = **upload souboru** přes generic `POST /upload/image` (Cloudinary, dostavba z 2.1b).
- Stránka Akce = **skutečný měsíční kalendář** (+ mobilní fallback na seznam).
- Barva = **jen text nadpisu** + textový štítek typu.
- Chybějící BE z 2.1b (`ikaros-events`) = **dostavět teď v rámci 3.1b** („nejlepší varianta").

---

## 10. Roadmap dopad + oprava lživých statusů

Audit odhalil, že dokumentace tvrdí hotové věci, které neexistují. Nutno opravit:

**`docs/roadmap-fe.md`:**
- **Ř. 420** — entry „2.1b … Nová BE entita `IkarosEvent` (modul `ikaros-events`) … BE: 28 nových testů" je **nepravdivý**. BE nikdy nevznikl. Doplnit poznámku `⚠️ BE NEDODÁN — dostavba v 3.1b` a po dokončení 3.1b přeformulovat.
- **Ř. 521** — entry „Admin správa (`/ikaros/novinky`)" pod 3.1 je po 3.1b zastaralý. Doplnit `→ nahrazeno hubem v 3.1b`, checkbox 3.1 zůstává historicky `[x]`.
- **Nová sekce `### - [ ] 3.1b`** ve fázi 3 (za 3.1a) s odkazem na tuto spec.

**`docs/arch/phase-2/spec-2.1b-ikaros-events.md`:**
- Status „✅ Hotovo (2026-05-14) — BE 28 testů" je **lživý** pro BE část. Změnit na `⚠️ FE hotovo, BE nikdy nedodáno — dostavba v 3.1b`.

Tyto opravy provedu v sub-fázi `h` (wrap-up). Po dokončení implementace: zaškrtnout 3.1b, uzavřít dluhy (skill `dluh` / `spec-driven-development`).

---

**Spec schválena.** Implementační plán: [plan-3.1b.md](plan-3.1b.md).
