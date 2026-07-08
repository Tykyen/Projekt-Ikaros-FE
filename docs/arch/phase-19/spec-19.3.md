# Spec 19.3 — LFG / Nábory (nástěnka náborů)

**Stav:** 🚧 rozpracováno · koncept odsouhlasen 2026-07-08, spec čeká na finální schválení
**Roadmapa:** [roadmap2.md](../../roadmap2.md) — 19.3 „LFG / nábory (objevování her a hráčů)"
**Návrh vzhledu:** [docs/navrhy/19.3-nabory-nastenka.html](../../navrhy/19.3-nabory-nastenka.html) (prototyp deska + typy lístku)

---

## 1. Účel

Lehké „hledám hru / hledám hráče" — veřejná **nástěnka náborů** na platformě. Řeší krok 5 trychtýře (prázdná platforma) a reálnou českou potřebu, kterou nikdo česky neřeší.

**Vstupní bod:** tlačítko **„Hledá se"** pod „Zobrazit vše →" v bloku přehledu světů (VESMÍRY) → vede na nástěnku `/ikaros/nabory`.

---

## 2. Model — dvě osy, každá řídí JINOU část (uživatel 2026-07-08)

> ⚠️ **Terminologická past.** „Motiv" má v projektu dvojí význam. Zde striktně:

| Část UI | Řídí | Osa | Odkud |
|---|---|---|---|
| **Lístek** (papírek) — tvar, jak je stavěný, **font I barva** | **motiv světa** | **12** | `getTheme(motiv).vars` aplikované **inline na lístek** + tvar `[data-nabor-motiv]` |
| **Deska / pozadí nástěnky** | **globální skin diváka** | 33 | `--theme-*` na `:root` (ThemeProvider), automaticky |

- **Motiv (12) = world-scope themes** (registry „krok 5.7", `scope: 'world'`): `ikaros`, `fantasy`, `dark-fantasy`, `vesmir` (=Sci-Fi), `cyberpunk`, `steampunk`, `apokalypsa` (=Post-apokalypsa), `horor`, `mystery`, `historie` (=Historický), `moderni` (=Současnost), `western`. **= přesně `world.themeId`.**
- **Klíč:** lístek je kompletně určen motivem světa (tvar + font + **barva**), NEzávisle na globálním skinu. Deska pod ním = globální skin diváka. Lístek „Dark Fantasy světa" je zelenočerný gotický v každém globálním skinu.
- **Mechanismus:** motiv = theme → lístek dostane `style={getTheme(nabor.motiv).vars}` (inline `--theme-*` přebijí `:root`) → barvy+fonty motivu. Tvar/ornament z `naborSkins.css` `[data-nabor-motiv='X'] [data-nabor-card]` (12 bloků, barvy čtou lokální `var(--theme-*)`). Deska čte `:root` `--theme-*` = globální skin.
- **Není to 12×33 ručních variant** — 12 tvarových bloků, barvy z inline motiv-vars. Vzor tvarů dle [bestieSkins.css](../../../src/features/world/bestiar/components/bestieSkins.css) (0 hardcoded barev — [[color_token_debt]]).
- ⚠️ **Font loading:** 12 motivů = 12 sad fontů; na nábor-stránce preload fontů všech přítomných motivů (polish, ne blokující kostru).

### Výběr motivu lístku (R3, R7 vyřešeno)
- **Hráč** (nábor „hledám hru") → **vybírá motiv** z 12 (picker při tvorbě).
- **PJ** (nábor „hledám hráče") → motiv = **`world.themeId`** propagovaného světa (auto; PJ smí přepsat pickerem). **R7 vyřešeno: svět už motiv má** (nastavení „Motiv světa" = `world.themeId`, [ThemeTab](../../../src/features/world/pages/WorldSettingsPage/tabs/ThemeTab.tsx)).

---

## 3. Entita `Nabor`

Vlastní entita (NE nadstavba nad Diskuze; z Diskuze se převezme jen vzor moderace).

| Pole | Typ | Pozn. |
|---|---|---|
| `id` | string | |
| `strana` | `'hledam-hru' \| 'hledam-hrace'` | určuje odznak + filtr |
| `motiv` | enum 12 | tvar lístku (viz §2) |
| `worldId?` | string | jen u `hledam-hrace`; ref na propagovaný svět |
| `title` | string | nadpis lístku |
| `body` | string | popis (krátký text) |
| `imageUrl?` | string | volitelný drobný obrázek (Cloudinary; kvóta 19.2) |
| `system?` | string | RPG systém; u PJ zdědí z `world.system` |
| `mode` | `'online' \| 'naживo'` | + volitelně místo (u naživo) |
| `place?` | string | město (u naживo) |
| `seatsTotal?` | number | jen `hledam-hrace` |
| `seatsTaken?` | number | jen `hledam-hrace`; obsazenost |
| `status` | `'open' \| 'closed' \| 'expired'` | „obsazeno" / expirace |
| `authorId`, `authorName` | string | + `authorIsDeleted?` (tombstone, [[world_soft_delete]]) |
| `createdAtUtc`, `expiresAtUtc` | string | auto-expirace (viz §6) |

---

## 4. Strana = odznak (ne tvar)

Rozhodnutí: strana `hledám hru / hledám hráče` je **odznak + barva + filtr**, NE samostatný tvar. Tvar je estetická volba (motiv), strana je datový fakt → svazovat = kombinatorický nesmysl.

---

## 5. Moderace + role

- **Zakládá:** Ikarus (každý přihlášený).
- **Maže / moderuje:** autor · **Správce diskuzí** · Admin · Superadmin (viz [[role_system]]; Správce diskuzí = globální role, platformový scope — sedí).
- **Nahlašování** inzerátu (napojit na 20.1). Schvalování (`isApproved` vzor z Diskuze) — 🔎 *rozhodnout: pre-moderace vs. post-moderace (nahlásit).* Doporučení: post-moderace (nábory chceme svižné), nahlášení → fronta správcům.

---

## 6. Životnost — expirace / obsazeno

⚠️ Bez životnosti se nástěnka zaplní mrtvými nábory. Proto:
- `expiresAtUtc` — auto-expirace (návrh: 30 dní; po expiraci `status='expired'`, skryté z výchozího filtru).
- Autor smí ručně **„Zavřít / obsazeno"** (`status='closed'`).
- `hledam-hrace`: při `seatsTaken >= seatsTotal` vizuál „plno" (neruší automaticky — PJ rozhodne).

---

## 7. Kontaktní smyčka — „Ozvat se"

Statický lístek nemá vlákna (na rozdíl od Diskuze). Tlačítko **„Ozvat se"** → napojení na existující zprávy/profil autora (DM). 🔎 *rozhodnout kanál:* přímá zpráva vs. lehká „žádost o připojení". Doporučení: DM (reuse existující messaging).

---

## 8. FE architektura

- **Route:** `/ikaros/nabory` (logged-in; analogicky Diskuze `requireAuth`), `/ikaros/nabory/nova` (tvorba).
- **Nástěnka (deska):** tokenová textura (`--bg-primary/-secondary` + `--theme-glow`), pinboard layout (columns), rozházené lístky.
- **Univerzální lístek (skeleton):** `NaborLístek` s `data-nabor-card`, `data-nabor-motiv`, `data-nabor-portrait` (stabilní selektory). Skeleton = strana(odznak) · nadpis · meta(systém/režim/místa) · popis · patička(autor+čas) · „Ozvat se". Prázdná pole skrývat.
- **Motivové skiny:** `naborSkins.css` (globální, NE module) — 12 bloků `[data-nabor-motiv='X'] [data-nabor-card] {…tvar+ornament…}`, barvy z `--theme-*`. **Vzor 1:1 dle [bestieSkins.css](../../../src/features/world/bestiar/components/bestieSkins.css).**
- **Filtr:** strana · systém · režim (client-side + BE query).
- **Tvorba:** `NaborNovaPage` / modal — picker motivu (hráč) nebo auto (PJ+svět), pole dle §3.
- **Vstup:** tlačítko „Hledá se" v komponentě přehledu světů.

## 9. BE (navazující sub-krok)

Nový modul `nabory` (vzor dle `discussions`): schema `Nabor`, DTO, service, controller, repository (toEntity whitelist — [[be_field_check]]), moderace gating, endpoints: `GET /nabory` (filtr+paginace), `POST /nabory`, `PATCH /nabory/:id` (status/edit), `DELETE /nabory/:id` (autor+moderátoři), `POST /nabory/:id/ozvat-se`. Po BE změně restart ([[fb_be_restart]]).

---

## 10. Rozhodnutí (schválena / navržena)

| # | Rozhodnutí | Stav |
|---|---|---|
| R1 | 12 motivových tvarů (parita bestiář), NE 4 | ✅ (uživatel 2026-07-08) |
| R2 | Motiv = tvar; barva = globální skin; nezávislé osy | ✅ |
| R3 | Hráč vybírá motiv; PJ = motiv světa (přepíše) | ✅ |
| R4 | Strana = odznak/barva, ne tvar | ✅ |
| R5 | Papír lístku tónovaný motivem (token-driven), ne fixní světlý | ✅ |
| R6 | Vlastní entita Nábor, moderace vzorem z Diskuze | ✅ |
| R7 | PJ dědí `world.themeId` (svět už motiv má, nastavení „Motiv světa") | ✅ |
| R10 | Lístek = motiv KOMPLETNĚ (tvar+font+barva) přes inline `getTheme(motiv).vars`; deska = globální skin | ✅ (uživatel 2026-07-08) |
| R8 | Pre- vs post-moderace | 🔎 návrh post |
| R9 | „Ozvat se" kanál (DM vs žádost) | 🔎 návrh DM |

---

## 11. Postup (bestiářský playbook pro motivy)

1. ✅ Návrh desky + typů lístku (HTML prototyp).
2. 🚧 Spec (tento dokument) → schválení.
3. Funkční kostra FE (skeleton lístek + nástěnka + filtr + tvorba + Ozvat se + vstup + entita/API kontrakt) — ověřit build+testy.
4. 12 motivů: per motiv **frontend-design návrh → uživatel vybere → impl do `naborSkins.css` → render-verify**. Zdroj pravdy log: `docs/nabor-motivy.md` (analog `docs/bestiar-motivy.md`).
5. BE modul `nabory` + restart.
6. `mobil-desktop` · `funkce` · `napoveda` · ruční commit.
