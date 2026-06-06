# Spec — Vlastník postavy vidí AKJ záložky + předpřipravená „Soukromé"

**Status:** ✅ IMPLEMENTOVÁNO 2026-06-06 (BE+FE). BE typecheck + jest (45/45) zelené, FE build zelený. Schváleno PJ.
**Autor:** PJ + Claude
**Datum:** 2026-06-06
**Rozšiřuje:** [spec-akj-protected-tabs.md](spec-akj-protected-tabs.md) (AKJ chráněné záložky, implementováno 2026-06-02)

---

## 1. Problém

Při tvorbě postavy hráče (PC) chybí místo, kam PJ napíše **soukromou část životopisu** určenou **jen pro daného hráče a sebe** (ostatní hráči ji nevidí).

Původní pole `privateContent` / `privateInfoBlocks` (9.1) byla **vědomě odstraněna** při zavedení AKJ chráněných záložek (2026-06-02). Náhrada — AKJ záložky — to dnes umí jen oklikou: PJ by musel ručně vytvořit AKJ záložku a **jmenovitě grantnout** UserId hráče. To je:
- nepohodlné (není „rovnou tam"),
- křehké — při přiřazení postavy jinému hráči zůstane starý grant viset na původním (leak soukromého obsahu bývalému hráči).

## 2. Cíl

1. **Vlastník postavy (PC) vidí AKJ záložky na své postavě defaultně.** Právo lze per-záložka **odebrat**.
2. **Při tvorbě PC se předpřipraví AKJ záložka „Soukromé"** — viditelná pro PJ + vlastníka, kam PJ rovnou píše soukromé info.

## 3. Datový model

Nové pole na sub-entitě `AkjTab`:

```ts
export interface AkjTab {
  id: string;
  name: string;
  order: number;
  access: AccessRequirement[];
  /** Skryje záložku i vlastníkovi postavy (page.ownerUserId). Default/undefined =
   *  false = vlastník JE výjimka a záložku vidí (i bez explicitního access grantu).
   *  Platí jen pro stránky s ownerUserId (PC); jinde bez efektu. */
  ownerHidden?: boolean;
  contentOverride?: AkjTabContentOverride;
}
```

💡 **Proč `ownerHidden` (skrýt), ne `ownerVisible` (zobrazit):** default chování = vlastník vidí. Absence pole → `false` → vidí. Staré záložky bez pole tím automaticky zdědí „vlastník vidí", což je požadovaná sémantika. Nový field se přidá jako opt-**out**.

## 4. Vyhodnocení přístupu (BE)

Owner výjimka žije v `filterAkjTabsForViewer` (pages.service.ts), který **má** k dispozici `page.ownerUserId`. `passesAccess` zůstává beze změny (nemá `page`).

```
visible = tab.access OR-passuje  (dnešní passesAccess)
        || (page.ownerUserId === userId && !tab.ownerHidden)   // NOVÉ
```

- PJ / platform Admin+ : `seesAll` bypass beze změny (vidí vše).
- PomocnyPJ : beze změny (žádný auto-bypass, jen granty).
- Vlastník postavy : nově vidí každou AKJ záložku na své PC, kde `ownerHidden !== true`.
- Ostatní hráči : beze změny.

⚠️ **Pozor — visibility leak guard:** owner výjimka se uplatní jen na stránkách typu PC (kde `ownerUserId` existuje). Na wiki/NPC bez ownera nemá `ownerUserId === userId` jak projít. OK.

## 5. Presety záložek (FE editor)

Dva rychlé presety s **opačným** defaultem ownerHidden — vyjasňují sémantiku:

| Preset | access | ownerHidden | Kdo vidí |
|---|---|---|---|
| **PJ informace** | `Role ≥ PomocnyPJ` | `true` | jen PJ tým (NE hráč) |
| **Soukromé** (nový) | `[]` (prázdné) | `false` | PJ (bypass) + vlastník postavy |

💡 „Soukromé" nepotřebuje žádný access grant — vlastníka pustí owner-výjimka, PJ `seesAll`. Ostatní hráči: prázdné access + nejsou owner → nevidí.

⚠️ **Změna u presetu „PJ informace":** dostává `ownerHidden: true`, jinak by ho po zavedení owner-default-visible viděl i hráč postavy (rozpor s názvem). Pro ne-PC stránky je pole bez efektu.

## 6. Předpřipravení „Soukromé" u nové PC

V `PageEditor.tsx` initial draft (new mode): když `initialType === 'Postava hráče'`, seedni do `akjTabs` jednu záložku „Soukromé" (`access: []`, `ownerHidden: false`, prázdný `contentOverride.content`).

- Platí jen pro **nové** PC (new mode). Edit existující PC se nemění (žádná retro-migrace).
- PJ může záložku přejmenovat / smazat / vyplnit jako kteroukoli jinou.
- ⚠️ Negeneruje se pro NPC ani wiki (NPC nemá ownerUserId → owner-výjimka by stejně nefungovala).

## 7. UI editoru (AkjTabsPanel)

- Nový přepínač **„Vlastník postavy vidí"** (checkbox/toggle) na kartě záložky `AkjTabCard`.
  - Zobrazí se **jen** když editovaná stránka je PC (`formState.ownerUserId` neprázdné / `type === 'Postava hráče'`) — jinde nemá smysl. → `AkjTabsPanel` dostane nový prop `ownerControlled: boolean`.
  - Zaškrtnuto = `ownerHidden: false` (default). Odškrtnuto = `ownerHidden: true`.
- Tlačítko nový preset **„Soukromé"** vedle „AKJ záložka" / „PJ informace".

## 8. Dotčená místa (field-drift checklist)

Nové pole `ownerHidden` — viz [[project_be_field_checklist]] (vždy od toEntity mapperu):

| # | Soubor | Změna |
|---|---|---|
| 1 | BE `repositories/pages.repository.ts` (~ř. 282–302, `toEntity`) | mapovat `ownerHidden: tab.ownerHidden as boolean \| undefined` |
| 2 | BE `schemas/page.schema.ts` | akjTabs je `MixedArraySubSchema` (volné) — bez změny, ale ověřit že projde |
| 3 | BE `dto/create-page.dto.ts` `AkjTabDto` | `@IsOptional() @IsBoolean() ownerHidden?: boolean` |
| 4 | BE `interfaces/page.interface.ts` `AkjTab` | `ownerHidden?: boolean` |
| 5 | BE `pages.service.ts` `filterAkjTabsForViewer` | owner-výjimka v `visible` filtru (§4) |
| 6 | BE `pages.service.ts` `sanitizeAkjTabs` | ověřit, že passthrough zachová `ownerHidden` (spread `...tab` / `return tab`) |
| 7 | FE `api/pages.types.ts` `AkjTab` | `ownerHidden?: boolean` |
| 8 | FE `PageEditor/panels/AkjTabsPanel.tsx` `freshTab` | presety: `pj` → `ownerHidden:true`; nový `soukrome` → `ownerHidden:false`; přepínač v `AkjTabCard` |
| 9 | FE `PageEditor/PageEditor.tsx` | seed „Soukromé" pro nový PC (§6) |

⚠️ **BE restart nutný** ([[feedback_be_restart_required.md]]) — jinak ValidationPipe whitelist tiše dropne `ownerHidden`.

## 9. Test (persistence A→B→A)

- Vytvoř PC → ověř, že „Soukromé" záložka existuje a vlastník ji v vieweru vidí, jiný hráč ne.
- Toggle „Vlastník vidí" off → uložit → načíst → vlastník nevidí. Toggle on → vidí. (round-trip přes BE, ne jen local state.)
- „PJ informace" na PC → hráč nevidí, PJ ano.

## 10. Mimo rozsah

- Retro-migrace existujících PC (nedostanou „Soukromé" automaticky — PJ přidá ručně).
- Žádné vzkříšení `privateContent` polí.
