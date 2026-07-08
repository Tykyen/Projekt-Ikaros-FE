/**
 * 17.13 — Dedikovaná nápověda panelu Orchestrace.
 *
 * Čistě prezentační, role-aware přes `canManageScenes` (= `isPjStrict`):
 * PomocnyPJ nevidí tvorbu scén (BE `maps.assertCanManage` = PJ) → nápověda
 * u těch akcí ukáže poznámku „jen plný PJ".
 *
 * Reuse in-situ bloků (spec 13.6) + s.intro/s.sectionTitle z WorldHelp (shodně
 * s TacticalMapHelp/ChatHelp). Spec: docs/arch/phase-17/spec-17.13-napoveda-orchestrace.md
 */
import { Info, ListOrdered, Layers, UsersRound, Swords } from 'lucide-react';
import { TermGrid, StepList, HelpSubAccordion, CalloutBox } from '@/shared/ui/help';
import s from '@/features/world/help/WorldHelp.module.css';

export function OrchestraceHelp({ canManageScenes }: { canManageScenes: boolean }) {
  /** Suffix u akcí, které smí jen plný PJ (ne PomocnyPJ). */
  const pjOnly = canManageScenes ? '' : ' — jen plný PJ (ne Pomocný PJ)';

  return (
    <div>
      <p className={s.intro}>
        Orchestrace je tvůj režisérský pult. Řídíš z ní <strong>scény</strong> —
        jednotlivé mapy, na které přiřazuješ hráče — a plníš je figurkami postav,
        NPC a bestií. Vidíš ji jen ty (PJ), hráči ne.
      </p>

      <div className={s.sectionTitle}>
        <Info size={18} aria-hidden="true" /> Slovníček
      </div>
      <TermGrid
        items={[
          { term: 'Scéna', desc: 'Samostatná mapa: pozadí + mřížka + figurky + efekty + mlha + zvuky. Ve světě jich může běžet víc naráz.' },
          { term: 'Aktivní scéna', desc: 'Scéna, která právě „žije". Hráč vždy vidí jen tu, na kterou jsi ho přiřadil.' },
          { term: 'Aktivní set', desc: 'Kdo je na scéně k dispozici ke spawnu (PC/NPC/bestie). Přidáváš „+ z katalogu"; teprve pak figurku pokládáš na mapu.' },
          { term: 'Přiřazení hráče', desc: 'Určuje, kterou scénu hráč vidí. Dva hráči můžou být každý na jiné scéně.' },
          { term: 'Více scén paralelně', desc: 'Hodí se rozdělit družinu, nebo si dopředu chystat skrytou scénu na příště.' },
          { term: 'Viditelnost / zámek', desc: 'Scénu i figurky lze hráčům skrýt (👁/🚫) nebo zamknout pohyb (🔓/🔒) — hromadně i per hráč.' },
        ]}
      />

      <div className={s.sectionTitle}>
        <ListOrdered size={18} aria-hidden="true" /> Rychlý start — od prázdné mapy k boji
      </div>
      <StepList
        steps={[
          <>Klikni na hlavičku <strong>⚙ Orchestrace</strong> — panel se rozbalí.</>,
          <>V „Aktivní scény" udělej scénu: <strong>+ Nová</strong> (prázdná), <strong>📚 Knihovna</strong> (ze šablony), <strong>🎬 Načíst přípravu</strong> (ze scénáře) nebo <strong>📥 Import UVTT</strong> (hotová mapa se zdmi){pjOnly}.</>,
          <>U scény klikni <strong>⚙ Upravit</strong> — nastav jméno, pozadí, mřížku, měřítko, viditelnost (LoS), viditelnost HP a kreslení hráčům.</>,
          <>Otevři palety <strong>PC / NPC / Bestiář</strong> a přes „<strong>+ z katalogu</strong>" vyber, kdo bude na scéně k dispozici (aktivní set).</>,
          <>Figurku <strong>polož na mapu</strong>: klikni na řádek (pak na hex), nebo řádek přetáhni na hex. NPC a bestie jde klást víc kopií po sobě.</>,
          <>Rozmísti a řiď: <strong>táhni</strong> figurky, zamykej je, uprav HP v kartě figurky, spusť <strong>iniciativu a boj</strong> lištou nahoře.</>,
          <>Když je scéna hotová, <strong>přiřaď hráče</strong> (v „Upravit scénu" → Přístup hráčů). Do té doby ji drž skrytou (🚫).</>,
          <>Volitelně scénu <strong>ulož do knihovny</strong> jako šablonu pro příště{pjOnly}.</>,
        ]}
      />

      <HelpSubAccordion icon={<Layers size={16} />} title="Aktivní scény — co které tlačítko dělá">
        <TermGrid
          items={[
            { term: 'Klik na řádek scény', desc: 'Přepne na ni tebe (ostatní scény běží dál).' },
            { term: '+ Nová', desc: `Prázdná scéna, hned aktivní a přiřazená tobě.${pjOnly}` },
            { term: '📚 Knihovna', desc: `Ulož/načti scénu jako šablonu (per-PJ, napříč světy). Šablona nese vše kromě figurek hráčů.${pjOnly}` },
            { term: '🎬 Načíst přípravu', desc: `Scéna ze scénáře kampaně — rovnou s podkladem a předvybranými postavami/bestiemi.${pjOnly}` },
            { term: '📥 Import UVTT', desc: `Hotová mapa z Dungeondraft/DungeonFog (.dd2vtt/.uvtt) včetně zdí a světel.${pjOnly}` },
            { term: '⚙ Upravit', desc: 'Nastavení scény (jméno, pozadí, mřížka, měřítko, LoS, HP, přístup hráčů).' },
            { term: '🧹 Vyčistit', desc: 'Smaže figurky ze scény a ukončí boj (aktivní set zůstane).' },
            { term: '✕ Deaktivovat', desc: 'Scéna přestane žít; přiřazení hráči ji ztratí.' },
          ]}
        />
      </HelpSubAccordion>

      <HelpSubAccordion icon={<UsersRound size={16} />} title="PC / NPC / Bestiář — figurky na mapu">
        <TermGrid
          items={[
            { term: 'Aktivní set vs katalog', desc: 'Paleta ukazuje jen aktivní set scény. Kým ho naplníš, vybíráš přes „+ z katalogu".' },
            { term: 'Spawn figurky', desc: 'Klik na řádek → banner „Klikni na hex", nebo řádek přetáhni na hex.' },
            { term: 'PC (hráčské postavy)', desc: 'Jedna figurka na postavu; už umístěná má ✓ a nejde zdvojit.' },
            { term: 'NPC a bestie', desc: 'Lze klást víc kopií po sobě (např. 5 banditů). Každá figurka je vlastní instance (HP, poznámky).' },
            { term: 'Bestiář', desc: 'Tři rozsahy — Můj / Svět / Systém. Paleta se ukáže, jen když svět má herní systém.' },
            { term: '× u řádku', desc: 'Odebere postavu/bestii z aktivního setu (z databáze ji nemaže).' },
          ]}
        />
      </HelpSubAccordion>

      <HelpSubAccordion icon={<Swords size={16} />} title="Řízení scény — co dělá zbytek mapy">
        <TermGrid
          items={[
            { term: 'Přesun a zámek figurky', desc: 'Táhni figurku; „🔓 Zamknout" v její kartě zabrání hráči s ní hýbat.' },
            { term: 'HP a staty', desc: 'Karta figurky → systémový list; hodnoty se ukládají živě všem.' },
            { term: 'Iniciativa a boj', desc: 'Lišta nahoře: zahájit boj, další tah, ukončit. Kdo je na tahu, má zlatý prstenec.' },
            { term: 'Mlha války / viditelnost', desc: 'Štětcem odhaluješ mapu; nebo zapni automatickou viditelnost přes zdi (LoS) v „Upravit scénu".' },
            { term: 'Efekty a kreslení', desc: 'Barevná pole, bariéry (DC), oblasti kouzel, čáry a text přímo do scény.' },
            { term: 'Vysílání', desc: 'Počasí a ambientní hudbu spustíš všem na scéně.' },
          ]}
        />
      </HelpSubAccordion>

      <CalloutBox variant="tip">
        Víc scén může běžet naráz — každý hráč vidí jen tu svou. Dokud scénu
        chystáš, drž ji skrytou (🚫) a odkryj ji, až je hotová.
        {!canManageScenes && (
          <> Jako <strong>Pomocný PJ</strong> spravuješ scény a přiřazuješ hráče,
          ale zakládat nové scény (Nová / Knihovna / Příprava / Import) může jen
          plný PJ.</>
        )}
      </CalloutBox>
    </div>
  );
}
