import { UserRound, Crown } from 'lucide-react';
import { TermGrid, CalloutBox } from '@/shared/ui/help';
import type { HelpAudience } from '../toolboxItems';
import s from '../WorldHelp.module.css';

/** Role-aware cheat-sheet taktické mapy. PJ vidí navíc PJ nástroje. */
export function TacticalMapHelp({ audience }: { audience: HelpAudience }) {
  const isPJ = audience === 'pj';
  return (
    <div>
      <p className={s.intro}>
        Rychlá tahák k ovládání. {isPJ ? 'Jako PJ řídíš scény, hráči se připojují k té, kterou jim přiřadíš.' : 'Hýbeš svou postavou a používáš základní nástroje.'}
      </p>

      <div className={s.sectionTitle}>
        <UserRound size={18} aria-hidden="true" /> Základní ovládání
      </div>
      <TermGrid
        items={[
          { term: 'Pohyb', desc: 'Táhni svůj token na cílový hex (PJ hýbe všemi).' },
          { term: 'Detail tokenu', desc: 'Klik na token → Staty / Deník / Poznámky postavy.' },
          { term: 'Hod kostkou', desc: 'Tlačítko 🎲 vlevo dole — vlastní hod i hod schopnosti.' },
          { term: 'Ping', desc: 'Dvojklik (na mobilu dvojité ťuknutí) pošle barevný prstenec všem.' },
          { term: 'Iniciativa', desc: 'Lišta nahoře; kdo je na tahu, má zlatý prstenec.' },
          { term: 'Počasí', desc: 'Panel vpravo nahoře; vizuální efekty (déšť/sníh) lze vypnout.' },
          { term: 'Mapa skrytá / zamčená', desc: 'PJ právě chystá scénu — chvíli počkej.' },
        ]}
      />

      {isPJ && (
        <>
          <div className={s.sectionTitle}>
            <Crown size={18} aria-hidden="true" /> Pro Pána jeskyně
          </div>
          <TermGrid
            items={[
              { term: 'Orchestrace (⚙)', desc: 'Přepínání a aktivace scén, přiřazení hráčů na scénu.' },
              { term: 'Viditelnost', desc: 'Skrýt mapu (👁/🚫) nebo zamknout pohyb (🔓/🔒) — hromadně i per hráč.' },
              { term: 'Spawn', desc: 'Přetáhni z palety PC/NPC/bestie na hex (nebo klik na řádek a pak na hex).' },
              { term: 'Efekty', desc: 'Barevná pole, bariéra (DC), výbuch/oblast; guma maže, koš smaže vše.' },
              { term: 'Mlha války', desc: 'Štětcem (1/7/19 hexů) odhaluješ a zahaluješ; „Zahalit vše".' },
              { term: 'Vysílání', desc: 'Počasí na mapu a ambientní hudbu spustíš všem na scéně.' },
              { term: 'Zámek tokenu', desc: 'Info panel tokenu → „🔓 Zamknout" (hráč jím nepohne).' },
              { term: 'Deník PJ', desc: 'Tlačítko deníku — soukromé poznámky pro celý svět.' },
            ]}
          />
          <CalloutBox variant="tip">
            Víc scén může běžet paralelně — hráč vidí jen tu svou. Hodí se rozdělit
            družinu nebo si dopředu připravit scénu skrytou.
          </CalloutBox>
        </>
      )}
    </div>
  );
}
