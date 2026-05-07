# Projekt Ikaros — Frontend

Tento repozitář je **frontend** pro [Projekt Ikaros](https://github.com/Tykyen/Projekt-Ikaros) (NestJS backend). Spolu tvoří jeden produkt s oddělenými repy.

- **Backend (BE):** `c:\Matrix\ProjektIkaros\Projekt-ikaros` (NestJS, MongoDB, port 3000)
- **Frontend (FE):** `c:\Matrix\ProjektIkaros\Projekt-ikaros-FE` (tenhle repo — Vite + React + TS)

FE volá BE přes REST (axios) a real-time přes (TBD: SignalR/WebSocket — sjednotí se podle BE).

---

# Zdroje znalostí o herním systému

Při zjišťování jak funguje daný princip, feature nebo herní mechanika v existujícím systému čti z obou zdrojů:

1. **`../Projekt-ikaros/docs/old/`** — dokumentace starého backendu (datové modely, API, huby)
2. **`C:/Matrix/Matrix/frontend`** — zdrojový kód starého frontendu (React/TS), inspirace pro nový FE
3. **`C:/Matrix/Matrix/backend`** — zdrojový kód starého backendu (C#) pro pochopení datových toků

Kdy sáhnout přímo do `C:/Matrix/Matrix`:
- Dokumentace popisuje věc jen povrchně nebo chybí
- Potřebuješ vidět skutečnou implementaci (UI flow, jak se data renderují, jaké eventy se posílají)
- Komponenta v novém FE bude inspirovaná starou — najdi původní zdroj a přizpůsob

Postup: nejdřív zkus dokumentaci v BE, pokud nestačí dohledej konkrétní soubory v `C:/Matrix/Matrix/frontend` pomocí `find` nebo `grep`.

**Pozor:** starý FE byl React 19 + Vite 6 + Jotai + TanStack Query + axios + TipTap + FullCalendar + SignalR + Konva + three.js. Ne všechno přebíráme 1:1 — inspirujeme se, ale děláme jinak (čistěji, bez technického dluhu starého kódu).

---

# Vztah k backendu

- API kontrakty drží BE (`backend/src/**`). Pokud něco v API potřebuješ jinak, **nejdřív** to prodiskutuj s userem a pak se to mění v BE — FE se pak adaptuje.
- DTO typy zatím **neimportujeme** z BE (oddělená repa) — držíme paralelní typy v `src/types/` a hlídáme synchronizaci ručně. Pokud tohle začne bobtnat, navrhni sdílený `@projekt-ikaros/shared-types` package (do té doby do `docs/dluhy.md`).
- Auth: JWT v `Authorization: Bearer <token>` headeru — flow drží BE, FE jen ukládá a posílá.
- Anti-leak / 404 vs 403 policy: viz `../Projekt-ikaros/.claude/rules/auth-leak-policy.md` — FE musí korektně rozlišovat 401/403/404 v UI.

---

# Paralelní agenti

Kdykoli je možné spustit více agentů současně bez vzájemného konfliktu (různé soubory, různé moduly, nezávislé operace), **vždy je spusť v jedné zprávě jako paralelní volání**. Nečekej na dokončení jednoho před spuštěním dalšího, pokud na sobě nezávisí.

Příklady kdy spouštět paralelně:
- spec review + quality review (různí recenzenti, stejné soubory — čtení nekonfliktuje)
- implementace více nezávislých komponent najednou
- průzkum kódu (Explore agenti na různých částech codebase)
- čtení více spec/doc souborů pro přípravu kontextu

Výjimky — nespouštěj paralelně pokud:
- agent B závisí na výstupu agenta A (sekvenční závislost)
- oba agenti by zapisovali do stejného souboru
- implementační agenti v rámci subagent-driven-development (ti musí být sekvenční kvůli git historii)

---

# Škálovací limity

Při návrhu a implementaci vždy počítej s těmito limity (sdílené s BE):
- až 500 světů
- každý svět až 500 členů
- každý svět stovky stran obsahu

Na FE to znamená:
- **vždy paginace** u listů (světy, členové, stránky) — nikdy nenačítej "všechno"
- **virtualizace** dlouhých seznamů (≥ ~100 položek) — react-window / TanStack Virtual
- **server-side filtrování** — nepostuj N položek do paměti a tam je nefilter; pošli filter do BE
- **lazy loading** rout (`React.lazy`) a těžkých knihoven (TipTap, three.js, Konva, FullCalendar)
- **debounce** na search inputech (≥ 300ms)
- **React Query cache** s rozumným `staleTime` — neptej se BE na to samé v krátké době vícekrát

Pokud navrhované řešení tyto limity nezvládne, upozorni na to před implementací.
