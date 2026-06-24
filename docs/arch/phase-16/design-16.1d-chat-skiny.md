# Design audit 16.1d — 12 chat skinů dle motivů světa

**Status:** design audit (mezi spec a impl. plánem). Vstup pro impl. plán.
**Datum:** 2026-06-24 · **Souvisí:** spec-16.1d · `feedback_skin_originality` · `feedback_frontend_design_audit`.
Kotvy palety/fontů taženy z `src/themes/themes/<id>/index.ts` (default skin musí ladit s motivem světa).

---

## 0. Klíčové zjištění — riziko konvergence (řídí celý audit)
6 z 12 motivů má **skoro stejnou paletu** (jantar/bronz na teplé černi): steampunk `#c8893a` · horor `#c89a52` · mystery `#d8a24a` · historie `#bd9a4e` · moderní `#c87e54` · western `#cf8a44`.
→ **Pravidlo auditu:** rozlišení skinu NESE **(1) typografie · (2) tvarový jazyk chrome (tvar bubliny/rámu) · (3) jeden originální „signature" ornament**, NE paleta. Sekundární akcent = druhá barevná osa. Žádné sdílení ornamentů mezi motivy.

## 1. Sdílená anatomie chatu (co každý skin přebarvuje)
Společná kostra, 12× jiný kabát — token kontrakt `--chat-*` (rozšíření `chatSkin.css`):
- **Bublina zprávy** — `--chat-bubble-bg/-border/-text/-radius/-clip` (+ tvar: oblá / ostrá / klipnutá / trhaná / papír / kov).
- **Levý rail** (kanály/konverzace) — `--chat-rail-bg/-texture`, aktivní/hover stav.
- **Panel + hlavička konverzace** — `--chat-panel-bg/-border`, `--chat-header-bg`.
- **Paleta kanálů** — `--chat-group-1..12` (per žánr přeladěná do rodiny).
- **Font chrome** — `--chat-font-chrome` (display) + dědí body z motivu.
- **Akcent + glow** — `--chat-accent`, `--chat-accent-2`, `--chat-glow`.
- **Ornament** — `--chat-ornament-*` (rohy, dělič, textura panelu, „razítko").
Vše scoped `[data-chat-skin="<id>"]` uvnitř chatu (`feedback_theme_isolation`).

## 2. Per-motiv směr (anchor · font · tvar · signature · motion)

### 🟣 ikaros — neon synthwave / Matrix
Anchor `#0c0820` / akcent `#a96cff` violet + `#d8ccff`. Font **Orbitron / Rajdhani**.
Tvar: ostře **klipnuté rohy** (`clip-path`), neonová vlasová linka, scanline. Signature: **fialový glyf-ghost** v railu + glow okraj bubliny, lehký glitch na hover. Motion: scanline drift, glow pulse. *(= baseline, formalizace dnešního vzhledu.)*

### ⚔️ fantasy — vznešená elfí síň
Anchor `#0b1510` / zlato `#e3c66b` + smaragd `#6fd3a8`. Font **Marcellus / Cormorant Garamond**.
Tvar: **oblé pergamenové** bubliny, zlatý **filigránový roh** rámu, smaragdové podtržení hlavičky. Signature: **zlatá filigrán-vlnovka** jako dělič + iniciála hlavičky. Motion: jemný zlatý shimmer.

### 🩸 dark-fantasy — grimdark, krev & blackletter
Anchor `#0c0608` / krvavá `#b51e2e` + ocel `#c8ccd6`. Font **Grenze Gotisch / EB Garamond**.
Tvar: **zubaté gotické** rámy, ostře vrubené rohy, těžká vinětace. Signature: **pečetní vosk / kapka krve** u jména + blackletter drop-cap. Motion: pomalé temné dýchání glow. *(Odliš od horor: heroický grim, ne viktoriánský okultismus.)*

### 🛸 sci-fi / vesmir — čistý holo-HUD
Anchor `#070b12` / cyan `#4fd4e4` + modrá `#5b8fd6`. Font **Orbitron / Exo 2**.
Tvar: **čisté oblé HUD panely**, tenké cyan rámy, **rohové závorky/ticky**, telemetry mřížka. Signature: **rohové bracket-ticky + holografický sheen** (žádný glitch — to je ikaros). Motion: subtle sweep linka. *(Odliš od ikaros: chladný/čistý NASA, ne fialový neon.)*

### ☣️ cyberpunk — corpo hazard
Anchor `#0a0a08` / kyselá žlutá `#f0d020` + ocel `#7d8a96`. Font **Chakra Petch / Rajdhani**.
Tvar: **hazard-pruh** (žluto-černé šrafy) v okraji railu/hlavičky, monospace tagy. Signature: **hazard-tape + barcode/ID strip** u jména. Motion: glitch flicker akcentu. *(Odliš: industriální žlutá vs cyan/violet.)*

### ⚙️ steampunk — mosaz & ozubení
Anchor `#16100a` / mosaz `#c8893a` + patina-zeleň `#5fa890`. Font **Cinzel / Spectral**.
Tvar: **kovové rámy s nýty**, embossed bevel, mosazná karta bubliny. Signature: **ozubené kolo v rohu + mosazný ukazatel/gauge**, patina textura. Motion: pomalé otáčení ornamentu kola.

### ☢️ apokalypsa — military stencil & rez
Anchor `#10130e` / vojenská zeleň `#7e9c5c` + rez `#a06840`. Font **Oswald / Spectral**.
Tvar: **stencil hlavičky**, trhané/lepené okraje, vlnitý plech textura. Signature: **duct-tape záplata + stencil číslo kanálu + rezavé skvrny**. Motion: žádná zbytečná — statická drsnost, jen flicker „kontrolky".

### 🕯️ horor — viktoriánský sépiový okultismus
Anchor `#090807` / svíčkové zlato `#c89a52` + popel `#8a8478`. Font **IM Fell English / Cormorant Garamond**.
Tvar: **staropapírová** bublina, ink-bleed okraj, svíčková vinětace, vybledlá fotografie. Signature: **inkoustová kaňka / vybledlá skvrna** + flicker svíčky na akcentu. Motion: nepravidelný candle-flicker glow. *(Odliš od dark-fantasy: sépie/parchment, tlumený strach.)*

### 🌧️ mystery — noir detektivka
Anchor `#0c0f14` / lampové jantar `#d8a24a` + modrošedá `#5e7488`. Font **Cinzel / Crimson Pro**.
Tvar: **deštěm potažené sklo** panelu, strojopisné case-notes bubliny. Signature: **redakční začerněné pruhy + úhel lampového světla v modré mlze**. Motion: pomalý rain-streak na pozadí panelu.

### 📜 historie — iluminovaný rukopis
Anchor `#160d0c` / zlato `#bd9a4e` + oxblood `#8a3b3a`. Font **Cormorant / EB Garamond**.
Tvar: **pravý pergamen**, manuskript linkování, **iluminovaná iniciála**, voskové pečeti. Signature: **illuminated drop-cap + rumělkové ruční linkování**. Motion: minimální — klid skriptoria. *(Odliš od fantasy: autentický středověk, ne fantastické elfí zlato.)*

### 📰 moderní — editorial magazín (klidný)
Anchor `#15110d` / terakota `#c87e54` + šalvěj `#7d9478`. Font **Fraunces / Newsreader**.
Tvar: **čisté editorial karty**, velkorysý whitespace, jemné stíny, **minimum ornamentu**. Signature: **typografie sama** (pull-quote, výrazný display serif), terakotová vlasová linka. Motion: jemný fade. *(Záměrně „klid" pól sady — protiváha k maximalismu ostatních.)*

### 🤠 western — wanted-poster letterpress
Anchor `#171009` / spálená oranž `#cf8a44` + šalvěj `#8a8a64`. Font **Rye / Spectral**.
Tvar: **letterpress wanted-poster** rám, ošlapané dřevo/kůže, wood-type display. Signature: **šerifská hvězda + provazový dělič + „WANTED" letterpress** hlavička. Motion: žádná / jen jemný papír-grain.

## 3. Závěr auditu → impl. plán
- **Tvarový jazyk a font drží odlišnost**, ne paleta (řeší zjištění §0).
- **Ikaros = referenční sada (F2)**, ostatní dědí token kontrakt + tvarovou kostru, mění hodnoty + originální ornament (F3, každý naplno).
- Ornamenty/textury = SVG/CSS, žádné sdílení mezi motivy; per-skin originál.
- Mobil: ornamenty degradují (rohy/textury lehčí), čitelnost bublin priorita; ověřit `mobil-desktop` po každé vlně.
