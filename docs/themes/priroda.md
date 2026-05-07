# Téma: Příroda

**ID:** `priroda`  
**Referenční obrázek:** [assets/priroda.png](assets/priroda.png)

---

## Atmosféra

Zakletý les plný magie. Zlaté světlo probíjející se korunami stromů, víla vznášející se v pozadí, vodopády, houby, fialové květy. Panely jsou vyrobeny ze starého dřeva, omotaného kořeny a popínavými rostlinami. Smaragdové krystaly jako zdroj energie. Pocit druidské přírody, pohádkového lesa a přírodní magie.

---

## Barevná paleta

| Role | Hex | Použití |
|------|-----|---------|
| `--bg-primary` | `#1a1208` | Hlavní pozadí — tmavá zemitá čerň |
| `--bg-secondary` | `#231a0a` | Sidebary — tmavé dřevo |
| `--bg-card` | `#2a1e0c` | Karty — středně tmavé dřevo |
| `--bg-card-hover` | `#332510` | Hover stav karet |
| `--accent-green` | `#4a8a30` | Primární lesní zelená — aktivní prvky |
| `--accent-green-bright` | `#68b040` | Hover zelená, světlé ikony |
| `--accent-emerald` | `#00c090` | Smaragdová — krystaly, speciální akcenty |
| `--accent-emerald-glow` | `#20e0b0` | Smaragdový glow (krystaly svítí) |
| `--accent-gold-warm` | `#d4900a` | Zlaté světlo lesa — nadpisy, logo |
| `--accent-gold-light` | `#f0b020` | Světelné paprsky, hover zlaté prvky |
| `--text-primary` | `#e8d8a0` | Hlavní text — teplá krémová |
| `--text-secondary` | `#8a7040` | Sekundární — zemitá zlatá |
| `--text-muted` | `#504030` | Vypnuté prvky |
| `--border-wood` | `#4a3018` | Dřevěná bordura |
| `--border-vine` | `#2a5020` | Vinná/kořenová bordura |
| `--border-emerald` | `#00c09040` | Smaragdová bordura (průhledná) |

---

## Tlačítka (3D efekt)

Organicky zaoblené, dřevěná textura, zelený gradient. Připomínají vyrytá tlačítka ve starém stromě.

```
Tvar:      border-radius: 6px — mírně zaoblené (organické, ne přísně pravoúhlé)
Normální:  tmavě zelený gradient + dřevěná bordura + spodní stín (zemitý)
Hover:     zezelenání + translateY(-2px) + smaragdový glow na okraji
Active:    translateY(1px) + stín zmenšen
Primární:  středně zelený gradient s leaf texture overlay
Aktivní nav: jasně zelené bg + zlatý text + leaf ikona vlevo
```

---

## Dekorativní prvky

- **Vinné/kořenové bordury:** Organické křivolaké linie okolo panelů (SVG nebo border-image)
- **Smaragdové krystaly:** V rozích karet a na klíčových místech — svítí (CSS glow animation)
- **Logo wreath:** Ikaros v kruhu z listů a větví (SVG věnec okolo ikony)
- **Houby:** Dekorativní v rozích sidebaru (background-image detail)
- **Fialové květy:** Rozptýlené v pozadí — CSS ::before scattered dots nebo background-image
- **Světluška/víla:** Background animace — jemně pohybující se světelné body
- **Zlaté paprsky:** Radiální gradient ze středu nahoře — světlo procházející korunami

---

## Typografie

- **Logo:** Cinzel nebo Uncial Antiqua — organický, elfský serif
- **Nadpisy:** IM Fell English nebo Lora — knižní, přírodní
- **Navigace:** Sentence case, mírný letter-spacing, serif nebo organic sans
- **Text:** Lora — teplý, čitelný
- **Admin kurzíva:** Zlatá italic — jako psaní inkoustem na pergamen

---

## Rozdíly od ostatních témat

| Vlastnost | Zlatý standard | Sci-fi | Příroda |
|-----------|---------------|--------|---------|
| Tvar panelů | Ostré + ornament | Chamfer | Organické + viny |
| Materiál | Kov + zlato | Plast + neon | Dřevo + kámen |
| Akcent 1 | Zlatá | Cyan | Lesní zelená |
| Akcent 2 | — | Magenta | Smaragdová |
| Dekor | Geometrický | HUD tech | Organický přírodní |
| Světlo | Hvězdné | Neon | Sluneční paprsky |

---

## Poznámky pro implementaci

- Dřevěná textura: `background-image: url(wood-texture.png)` na panelech (nebo CSS grain)
- Vine bordury: SVG `path` jako `border-image` nebo absolute positioned overlay
- Smaragdové krystaly: SVG komponenta s `filter: drop-shadow(0 0 6px #00c090)` + pulse animace
- Logo věnec: SVG kruh z listů okolo ikony (samostatná varianta loga pro toto téma)
- Světluška animace: `@keyframes float` na malých kruhových elementech s opacity pulse
- Background: enchanted forest s god rays (radial-gradient overlay na background-image)
