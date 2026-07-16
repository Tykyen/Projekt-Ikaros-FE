# Plán 11.5 — implementace (přesné diffy)

Spec: [spec-11.5-pavucina-tvorba-entit.md](spec-11.5-pavucina-tvorba-entit.md). Pořadí: **B2 → A → B1**. Bez feature větve (main). Commit ruční (autor).

**Rozhodnutí (schváleno):** hráč SMÍ navrhnout Frakci/Organizaci/Stát (pending) → přidat do `PLAYER_PROPOSABLE_PAGE_TYPES`.

---

## Sub-krok B2 — nové wiki-like Page-typy (Frakce / Organizace / Stát)

### BE (`Projekt-ikaros/backend`)
1. `pages/interfaces/page.interface.ts:14` — za `Ostatni` přidat do `PAGE_TYPES`:
   ```
   Frakce: 'Frakce',
   Organizace: 'Organizace',
   Stat: 'Stát',
   ```
2. `page.interface.ts:29-36` — do `PLAYER_PROPOSABLE_PAGE_TYPES` přidat `PAGE_TYPES.Frakce, PAGE_TYPES.Organizace, PAGE_TYPES.Stat`.
   *(auto-Character whitelist `pages.service.ts:336-344` netřeba — nové typy tam nespadnou; DTO/schema/repo generické.)*

### FE (`Projekt-ikaros-FE`)
3. `pages/api/pages.types.ts:23` — stejné 3 klíče do `PAGE_TYPES` (za `Ostatni`).
4. `pages/PageViewer/PageViewer.tsx:47-59` — do `LAYOUTS` přidat `'Frakce': OstatniLayout, 'Organizace': OstatniLayout, 'Stát': OstatniLayout` *(klíč = hodnota enumu = display-name)*.
5. `pages/PagesListPage/lib/pageTypeMeta.tsx:17-29` — do `PAGE_TYPE_ICON`: `Frakce: Flag, Organizace: Users, Stát: Landmark` (lucide-react).
6. `pages/PageEditor/components/NewPageWizardModal.tsx:5-12` — typ `NewPageChoice` + ChoiceCard(y) (`frakce`/`organizace`/`stat`); vč. `proposeMode` bloku (hráč smí navrhnout).
7. `app/layout/WorldLayout/WorldLayout.tsx:282-293` — `handleWizardChoice`: `choice==='frakce' → '?type=Frakce'` atd.
8. `campaign/components/SubjectForm.tsx:16-27` — `pageTypeToSubjectType`: `'Frakce'→'FACTION'`, `'Organizace'→'ORG'`, `'Stát'→'STATE'`.
9. `pages/PageViewer/hooks/useAutoLink.ts:25` — do `ENTITY_TYPES` přidat 3 typy (auto-link zmínek).

---

## Sub-krok A — graf jako pracovní plocha

10. `campaign/components/PavucinaGraph.tsx` — přidat context-menu na uzel (stav `menuNode {id,x,y}`; `onNodeRightClick` → otevřít menu místo přímého goto). Položky: **Detail** (`onOpenSubject`), **Vyvolat** (nový prop `onInvoke`), **+ Vztah odsud** (nový prop `onNewRelationship`), **Upravit** / **Smazat** (nové propy). + tlačítko **„+ Subjekt"** v `graphControls` (nový prop `onNewSubject`). Menu jako pozicovaný `<div>` (funguje i na dotyku přes „⋯"/dlouhý tap; ne jen pravý klik).
11. `campaign/components/CampaignView.tsx` — dodat handlery: `onNewSubject` (otevřít SubjectForm v tabu Síť — přesunout stav formu sem nebo předat callback do SubjektyTab), `onInvoke(id)` (navigace `/svet/:worldSlug/:slug`), `onNewRelationship(id)`, `onEdit`, `onDelete`. Vyvolání přes `useNavigate` + `worldSlug` z `useWorldContext`.
12. `campaign/components/SubjectDetail.tsx:59-66` — rozšířit „Vyvolat" i na `linkedCharacterSlug` (dnes jen `linkedPageSlug`); jednotný odkaz `→ Otevřít stránku`.

*(Pozn.: tvorbu subjektu/vztahu z grafu implementovat re-použitím `SubjectForm`/`RelationshipForm` — buď zvednout jejich stav do `CampaignView`, nebo lehký lokální modal v grafu. Rozhodnout při impl. — preferovat zvednutí stavu, ať není 2. kopie.)*

---

## Sub-krok B1 — materializace subjektu → reálná entita

13. `campaign/useMaterializeSubject.ts` (nový hook) — vstup `subject`; odvodí `type` (subjektTyp→pageTyp inverzní k `pageTypeToSubjectType`), `title=name`, `slug=slugify(name)`; zavolá `useCreatePage`; po úspěchu `updateSubject` s `linkedPageSlug` (+ `linkedCharacterSlug` u PC/NPC). Ošetřit 409 (slug kolize → dovětek `-2`). Vrátí `{materialize, isPending}`.
14. `campaign/components/SubjectDetail.tsx` — u subjektu bez vazby a s materializovatelným typem tlačítko **„Založit reálnou stránku"** (role-aware: hráč+PC → skryté; hráč+NPC/Lokace/Frakce → text „Navrhnout ke schválení"). Po úspěchu toast + volitelně vyvolat.
15. `campaign/components/SubjectForm.tsx` — volitelný checkbox „vytvořit i reálnou stránku" (jen když jméno ≠ existující a typ je materializovatelný). *(Lze odložit do B1b, když se návrh v detailu ukáže dost — rozhodnout při impl.)*

Materializovatelné typy: PC, NPC, LOCATION, FACTION, ORG, STATE (mají teď reálný Page-typ). `OTHER` → ne.

---

## Ověření (po každém sub-kroku i na konci)
- FE: `npm run build` (tsc -b — hlídá `Record<PageType>` pasti), `npm run lint` (eslint --fix, NE prettier).
- BE: `npm run typecheck` + `npm run lint:check`; dotčené jest testy ručně (`create-page`, `pages.service`, `SubjectForm.spec`).
- `mobil-desktop` na graf/menu; screenshoty od autora (živý web).
- Docs: `funkce`, `napoveda`, zaškrtnout v `roadmap-fe.md` (11.5), `chybovy-denik` u netriviálních řešení.
