/**
 * 17.13 — Dedikovaná nápověda panelu „Efekty & kreslení".
 *
 * Role-aware (`audience`):
 *  - `hrac` vidí jen **Kreslení** (a jen když PJ u scény zapnul „Hráči smí
 *    kreslit anotace"); efekty jsou PJ-only, hráč je nikdy nevidí.
 *  - `pj` vidí efekty (barevná pole / bariéry / výbuchy / šablony / guma / koš)
 *    i kreslení + hromadné mazání.
 *
 * Reuse in-situ bloků (spec 13.6) + s.intro/s.sectionTitle z WorldHelp
 * (shodně s TacticalMapHelp/ChatHelp/OrchestraceHelp).
 */
import { Palette, Pencil, Eye } from 'lucide-react';
import { TermGrid, CalloutBox } from '@/shared/ui/help';
import type { HelpAudience } from '@/features/world/help';
import s from '@/features/world/help/WorldHelp.module.css';

export function EfektyKresleniHelp({ audience }: { audience: HelpAudience }) {
  const isPJ = audience === 'pj';

  return (
    <div>
      <p className={s.intro}>
        {isPJ
          ? 'Panel má dvě části: efekty na scénu (barevná pole, bariéry, výbuchy, šablony kouzel) a kreslení anotací. Efekty děláš jen ty, kreslit můžou i hráči, když jim to u scény povolíš.'
          : 'PJ ti povolil kreslit anotace na mapu. Kresby jsou tvoje poznámky přímo do scény — čáry, šipky, kruhy, text.'}
      </p>

      {isPJ && (
        <>
          <div className={s.sectionTitle}>
            <Palette size={18} aria-hidden="true" /> Efekty (jen PJ)
          </div>
          <TermGrid
            items={[
              { term: '🎨 Barevná pole', desc: 'Klikni nebo táhni po hexech — obarví plochu (vybranou barvou z palety). Značí zóny, terén, kouzla.' },
              { term: '🛡️ Bariéra (DC)', desc: 'Zeď s obtížností (DC 0–99). Kresli štětcem (táhni) nebo jako kruh o daném poloměru.' },
              { term: '💥 Výbuch / oblast', desc: 'Soustředné kruhy se zraněním na každém (Střed, Kruh 1…). Varianty 🔥 oheň / ☠️ plyn / 💨 kouř s pevnými barvami.' },
              { term: '📐 Šablona oblasti', desc: 'Tvar kouzla — 🔺 kužel / 📏 linie / ⭕ koule / ⬛ čtverec. Klik = střed, táhni směr a dosah, pusť.' },
              { term: '🧽 Guma', desc: 'Klik/tažení maže efekty. Barevné pole po hexu, bariéru a výbuch celé.' },
              { term: '🗑 Koš', desc: 'Smaže všechny efekty scény najednou (objeví se, jen když nějaké jsou).' },
            ]}
          />
        </>
      )}

      <div className={s.sectionTitle}>
        <Pencil size={18} aria-hidden="true" /> Kreslení {isPJ ? '' : '(anotace)'}
      </div>
      <TermGrid
        items={[
          { term: '╱ Čára / ➤ Šipka / ◯ Kruh', desc: 'Stiskni a táhni — od bodu, kde začneš, k bodu, kde pustíš.' },
          { term: '🅣 Text', desc: 'Klik umístí kotvu a otevře pole pro napsání textu.' },
          { term: 'Barva', desc: 'Z palety pod tlačítky; pamatuje se ti do příště.' },
          { term: '👁 Všichni / 🔒 Jen PJ', desc: isPJ
            ? 'Přepíná, kdo tvou kresbu vidí — všichni na scéně, nebo jen PJ.'
            : 'Přepínač viditelnosti: „Všichni" vidí kresbu všichni; „Jen PJ" = soukromá poznámka jen pro vedení hry (a tebe).' },
          { term: 'Smazat moje', desc: 'Smaže jen tvoje vlastní kresby (cizí ne).' },
          ...(isPJ
            ? [{ term: 'Smazat vše', desc: 'Smaže kresby všech na scéně (jen PJ).' }]
            : []),
        ]}
      />

      {isPJ ? (
        <CalloutBox variant="tip">
          Hráči můžou kreslit, jen když jim to zapneš — v „Upravit scénu" (nebo
          v Nastavení světa jako výchozí) zaškrtni <strong>„Hráči smí kreslit
          anotace"</strong>. Efekty zůstávají vždy jen tobě.
        </CalloutBox>
      ) : (
        <CalloutBox variant="tip">
          <Eye size={14} aria-hidden="true" /> Efekty (barevná pole, bariéry,
          výbuchy) dělá jen PJ — proto je v panelu nevidíš. Ty máš k dispozici
          kreslení anotací.
        </CalloutBox>
      )}
    </div>
  );
}
