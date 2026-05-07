---
name: auth-policy
description: Ověř, že komponenta/stránka správně zpracovává 401/403/404 dle auth-leak-policy. Spusť při implementaci chráněných stránek, API volání nebo error handlingu.
---

# Skill: auth-policy

Ověří, že FE korektně rozlišuje a zobrazuje 401 / 403 / 404 dle pravidel z `../Projekt-ikaros/.claude/rules/auth-leak-policy.md`.

## Pravidlo (zkráceně)

| Situace | BE vrátí | FE musí zobrazit |
|---|---|---|
| Nepřihlášený uživatel, neexistující nebo forbidden zdroj | **403** | → redirect na `/login` nebo "Přístup odepřen" |
| Přihlášený, zdroj neexistuje | **404** | → stránka "Nenalezeno" |
| Přihlášený, zdroj existuje ale nemá práva | **403** | → stránka "Nemáš oprávnění" (NE 404) |
| Token expiroval | **401** | → refresh → retry → při selhání redirect na `/login` |

## Postup

1. **Identifikuj API volání** v upravované komponentě/stránce.
2. **Pro každé volání zkontroluj:**
   - [ ] Je ošetřen případ **401** → spouští refresh flow (ne přímý redirect)
   - [ ] Je ošetřen případ **403** → zobrazuje "Nemáš oprávnění", ne prázdnou stránku ani "Nenalezeno"
   - [ ] Je ošetřen případ **404** → zobrazuje "Nenalezeno", ne obecnou chybovou hlášku
   - [ ] Anonymní endpointy vrací 403 i pro neexistující zdroje — FE to **nezobrazuje jako 404**
3. **Zkontroluj route guard** — chráněné stránky mají `PrivateRoute` wrapper nebo ekvivalent.
4. **Nahlásit výsledek** — projde / seznam problémů.
5. **Pokud neprojde** — oprav hned nebo použij skill `dluh` (bezpečnostní riziko = priorita Vysoká).

## Červené vlajky

- `catch (e) { navigate('/login') }` — swalluje 403/404, vždy redirectuje na login
- Zobrazení "Svět nenalezen" pro 403 — leak existence zdroje
- Chybějící error boundary na stránce světa — 403 se zobrazí jako prázdná stránka
- `if (error) return null` — tiché selhání bez UX feedbacku

## Reference

- Kompletní pravidlo: `../Projekt-ikaros/.claude/rules/auth-leak-policy.md`
- Refresh flow: `src/api/client.ts` — response interceptor
