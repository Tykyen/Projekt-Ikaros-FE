# Vypravěč · 02a — Generační prompty grafiky (Ishida + Joe)

Stav: podklad · 2026-07-21 · Příloha k [02-persona-a-grafika.md](02-persona-a-grafika.md) (persona, akceptační testy, pipeline po dodání)
Model dvou průvodců (návrh, čeká potvrzení vlastníka): **Ishida = šéf, globální/platformní scope · Joe = agentka v terénu, scope světů.** Kompozičně proti sobě: Ishida doleva, Joe doprava.

## Pravidla generace (platí pro všechny prompty)

1. **Styl:** stylizovaný realismus (painterly digital art) — NE fotografie, NE anime; silné tvary kvůli zmenšeninám (busta 64 px, silueta 24 px).
2. **Pořadí:** master → kontrola (silueta + rozpoznatelnost + zmenšenina) → busty (stejný seed / image-to-image z masteru) → siluety nakonec (image-to-image z hotových assetů).
3. **Pozadí:** průhledné, pokud nástroj umí; jinak jednolitá světle šedá (dev vyřízne).
4. **IP / osobnostní práva:**
   - Ishida: odlišení od předlohy (Mefisto Feles) je zapracované v definici — viz 02 §3.1a; test rozpoznatelnosti blokuje schválení masteru.
   - Joe: referenční obrázek je **vlastní AI generát vlastníka (potvrzeno 2026-07-21)** → image-to-image povoleno; vlastník ji stejně generuje znovu z promptů níže. Kdyby se kdy měnila reference, pravidlo trvá: z fotky reálné osoby nikdy.
5. Soubory: `ishida-*.png` / `joe-*.png`, 2048×2048, do `src/assets/vypravec/` (viz 02 §3.6). Reference-předlohy se NIKDY necommitují.

---

## ISHIDA — šéf (globální)

Společný popis (v každém promptu): štíhlý gentleman neurčitého věku · temně fialovočerné vlasy sčesané na stranu · jantarové oči · lidské uši · hladce oholený · vlídný úsměv se zavřenými rty · půlnočně indigový cylindr se zářícím pásem cyan→magenta a mosazným klíčkem za pásem · slonovinový dvouřadý kabát s vysokým límcem, mosazné knoflíky, cyan prošití · tmavě indigová vesta · sytě magentový askot · krémové rukavice · mosazný špendlík-klíč na hrudi.

### I-1 · ishida-master.png (full body)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Ishida, an elegant mysterious gentleman guide: slender man of indeterminate age, deep violet-black hair swept to one side, warm amber eyes, normal human ears, clean-shaven, warm knowing closed-lips smile; tall midnight-indigo top hat with a glowing cyan-to-magenta gradient band and a small brass key tucked into the band; long ivory double-breasted coat with high collar, brass buttons and thin cyan seam piping; dark indigo vest; solid deep-magenta ascot; off-white gloves; small brass key pin on the chest. POSE: full body, standing calm and composed, one gloved hand lightly resting on the coat lapel, confident gentle expression. Three-quarter view facing left. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### I-2 · ishida-bust-vita.png (uvítání)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Ishida, an elegant mysterious gentleman guide: slender man of indeterminate age, deep violet-black hair swept to one side, warm amber eyes, normal human ears, clean-shaven, warm welcoming smile; tall midnight-indigo top hat with a glowing cyan-to-magenta gradient band and a small brass key tucked into the band; long ivory double-breasted coat with high collar, brass buttons and thin cyan seam piping; dark indigo vest; solid deep-magenta ascot; off-white gloves; small brass key pin on the chest. POSE: waist-up, gracefully tipping his top hat in greeting with one hand. Three-quarter view facing left. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### I-3 · ishida-bust-ukazuje.png (navigace)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Ishida, an elegant mysterious gentleman guide: slender man of indeterminate age, deep violet-black hair swept to one side, warm amber eyes, normal human ears, clean-shaven, focused friendly expression; tall midnight-indigo top hat with a glowing cyan-to-magenta gradient band and a small brass key tucked into the band; long ivory double-breasted coat with high collar, brass buttons and thin cyan seam piping; dark indigo vest; solid deep-magenta ascot; off-white gloves; small brass key pin on the chest. POSE: waist-up, one arm fully extended pointing to the right. Three-quarter view facing left. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### I-4 · ishida-bust-omluvny.png (chyby, údržba)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Ishida, an elegant mysterious gentleman guide: slender man of indeterminate age, deep violet-black hair swept to one side, warm amber eyes, normal human ears, clean-shaven, apologetic soft expression; tall midnight-indigo top hat with a glowing cyan-to-magenta gradient band and a small brass key tucked into the band; long ivory double-breasted coat with high collar, brass buttons and thin cyan seam piping; dark indigo vest; solid deep-magenta ascot; off-white gloves; small brass key pin on the chest. POSE: waist-up, slight courteous bow with one hand on the chest. Three-quarter view facing left. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### I-5 · ishida-bust-premysli.png (v2)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Ishida, an elegant mysterious gentleman guide: slender man of indeterminate age, deep violet-black hair swept to one side, warm amber eyes, normal human ears, clean-shaven, thoughtful expression; tall midnight-indigo top hat with a glowing cyan-to-magenta gradient band and a small brass key tucked into the band; long ivory double-breasted coat with high collar, brass buttons and thin cyan seam piping; dark indigo vest; solid deep-magenta ascot; off-white gloves; small brass key pin on the chest. POSE: waist-up, one gloved hand on chin, eyes slightly upward. Three-quarter view facing left. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### I-6 · ishida-bust-varuje.png (v2)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Ishida, an elegant mysterious gentleman guide: slender man of indeterminate age, deep violet-black hair swept to one side, warm amber eyes, normal human ears, clean-shaven, serious calm concerned expression; tall midnight-indigo top hat with a glowing cyan-to-magenta gradient band and a small brass key tucked into the band; long ivory double-breasted coat with high collar, brass buttons and thin cyan seam piping; dark indigo vest; solid deep-magenta ascot; off-white gloves; small brass key pin on the chest. POSE: waist-up, one raised palm in a composed stop gesture, not threatening. Three-quarter view facing left. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### I-7 · ishida-bust-slavi.png (v2)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Ishida, an elegant mysterious gentleman guide: slender man of indeterminate age, deep violet-black hair swept to one side, warm amber eyes, normal human ears, clean-shaven, delighted warm smile; midnight-indigo top hat with a glowing cyan-to-magenta gradient band and a small brass key tucked into the band, raised high in one hand in celebration; long ivory double-breasted coat with high collar, brass buttons and thin cyan seam piping; dark indigo vest; solid deep-magenta ascot; off-white gloves; small brass key pin on the chest. POSE: waist-up, joyful celebrating gesture raising the top hat above his head. Three-quarter view facing left. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### I-8 · ishida-avatar.png (FAB, kruhový ořez)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Ishida, an elegant mysterious gentleman guide: deep violet-black hair swept to one side, warm amber eyes, normal human ears, clean-shaven, warm knowing closed-lips smile; tall midnight-indigo top hat with a glowing cyan-to-magenta gradient band and a small brass key tucked into the band, hat slightly tilted; high ivory coat collar and solid deep-magenta ascot visible. POSE: head and shoulders portrait, composed for a circular avatar crop, bold simple shapes readable at very small size. Three-quarter view facing left. Transparent background, no text, not a photograph, not anime, no watermark. 2048x2048.
```

---

## JOE — agentka v terénu (světy)

Společný popis: mladá žena · dlouhé tmavé zvlněné vlasy · výrazné modré oči · klidný sebejistý přátelský výraz · praktický elegantní tmavý cestovní kabát s vysokým límcem a drobnými mosaznými knoflíky · tmavě indigový šátek/šála · rukavice bez prstů · **mosazný klíček na šňůrce na krku** (znak Ishidovy organizace) · **malá mosazná ruční lucerna** s teplou cyan-magenta září (podpis siluety).

### J-1 · joe-master.png (full body)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Joe, a young female guide and field agent of a secret order: long dark wavy hair, striking blue eyes, calm confident friendly expression; practical elegant dark high-collared travel coat with small brass buttons; deep indigo scarf; fingerless gloves; small brass key pendant on a cord around her neck; holding a small brass hand lantern with a warm cyan-to-magenta glow. POSE: full body, standing relaxed and ready, lantern held at her side in one hand. Three-quarter view facing right. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### J-2 · joe-bust-vita.png (uvítání)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Joe, a young female guide and field agent of a secret order: long dark wavy hair, striking blue eyes, warm welcoming smile; practical elegant dark high-collared travel coat with small brass buttons; deep indigo scarf; fingerless gloves; small brass key pendant on a cord around her neck; holding a small brass hand lantern with a warm cyan-to-magenta glow. POSE: waist-up, raising the lantern slightly in a friendly greeting. Three-quarter view facing right. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### J-3 · joe-bust-ukazuje.png (navigace)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Joe, a young female guide and field agent of a secret order: long dark wavy hair, striking blue eyes, focused friendly expression; practical elegant dark high-collared travel coat with small brass buttons; deep indigo scarf; fingerless gloves; small brass key pendant on a cord around her neck; small brass hand lantern with a warm cyan-to-magenta glow in her other hand. POSE: waist-up, one arm fully extended pointing to the left. Three-quarter view facing right. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### J-4 · joe-bust-omluvna.png (chyby, údržba)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Joe, a young female guide and field agent of a secret order: long dark wavy hair, striking blue eyes, apologetic soft smile; practical elegant dark high-collared travel coat with small brass buttons; deep indigo scarf; fingerless gloves; small brass key pendant on a cord around her neck; small brass hand lantern with a warm cyan-to-magenta glow lowered at her side. POSE: waist-up, free hand on her chest, slight apologetic tilt of the head. Three-quarter view facing right. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### J-5 · joe-bust-premysli.png (v2)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Joe, a young female guide and field agent of a secret order: long dark wavy hair, striking blue eyes, thoughtful expression; practical elegant dark high-collared travel coat with small brass buttons; deep indigo scarf; fingerless gloves; small brass key pendant on a cord around her neck; small brass hand lantern with a warm cyan-to-magenta glow. POSE: waist-up, one hand near her chin, eyes slightly upward. Three-quarter view facing right. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### J-6 · joe-bust-varuje.png (v2)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Joe, a young female guide and field agent of a secret order: long dark wavy hair, striking blue eyes, serious calm concerned expression; practical elegant dark high-collared travel coat with small brass buttons; deep indigo scarf; fingerless gloves; small brass key pendant on a cord around her neck; small brass hand lantern with a warm cyan-to-magenta glow lowered at her side. POSE: waist-up, one raised palm in a composed stop gesture, not threatening. Three-quarter view facing right. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### J-7 · joe-bust-slavi.png (v2)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Joe, a young female guide and field agent of a secret order: long dark wavy hair, striking blue eyes, delighted warm smile; practical elegant dark high-collared travel coat with small brass buttons; deep indigo scarf; fingerless gloves; small brass key pendant on a cord around her neck. POSE: waist-up, joyfully raising the glowing brass lantern high above her head in celebration. Three-quarter view facing right. Strong readable silhouette. Transparent background, no text, not a photograph, not anime, no watermark, consistent character sheet style. 2048x2048.
```

### J-8 · joe-avatar.png (FAB, kruhový ořez)
```text
Semi-realistic painterly character illustration, detailed stylized digital painting, soft cinematic lighting, rich but limited palette, strong readable shapes. Joe, a young female guide and field agent of a secret order: long dark wavy hair, striking blue eyes, calm confident friendly closed-lips smile; high collar of a dark travel coat and deep indigo scarf visible; small brass key pendant on a cord around her neck. POSE: head and shoulders portrait, composed for a circular avatar crop, bold simple shapes readable at very small size. Three-quarter view facing right. Transparent background, no text, not a photograph, not anime, no watermark. 2048x2048.
```

---

## Siluety (oba, nakonec)

Image-to-image z hotového schváleného assetu (Ishida: I-1 a I-3 · Joe: J-1 a J-3), týž prompt:
```text
Solid black silhouette of the same character and pose, single flat shape, no internal details, smooth clean edges, transparent background.
```
Joe silueta = **postava s lucernou** — primární in-world silueta pro FAB (tokenizace `mask-image` + `currentColor`).

## Character-sheet alternativa (konzistence)

Neumí-li nástroj seed/image-to-image: jedním generátem mřížka 4 póz (full body klid · vita · ukazuje · omluvný/á) + celý popis postavy z master promptu; rozřezat. Jeden generát = jedna tvář.

## Akceptační testy (blokují schválení; detail 02 §3.3)

- Master: silueta rozpoznatelná ve 24 px; **test rozpoznatelnosti** (reverse image search + „kdo to je?" — nesmí padnout jméno existující postavy/osoby).
- Busty: čitelné v 64 px na motivu ikaros i světlém; konzistentní tvář napříč sadou.
- Avatar: čitelný ve 48 px v kruhu (Ishida: klobouk nakloněný, ať přežije ořez).
- Siluety: 100% černá, bez vnitřních detailů, hladký obrys.
