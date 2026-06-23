import { UserRound, Crown, BookOpen } from 'lucide-react';
import { TermGrid, CalloutBox } from '@/shared/ui/help';
import type { HelpAudience } from '../toolboxItems';
import s from '../WorldHelp.module.css';

/** Role-aware cheat-sheet chatu světa. PJ vidí navíc správu kanálů a moderaci. */
export function ChatHelp({ audience }: { audience: HelpAudience }) {
  const isPJ = audience === 'pj';
  return (
    <div>
      <p className={s.intro}>
        Vlevo kanály a v nich konverzace, uprostřed zprávy. Pořadí kanálů i
        konverzací si přetáhneš úchopkou (⋮⋮) — řazení je osobní.
      </p>

      <div className={s.sectionTitle}>
        <UserRound size={18} aria-hidden="true" /> Psaní a zprávy
      </div>
      <TermGrid
        items={[
          { term: 'Odeslat', desc: 'Napiš a stiskni Enter; zpráva se ukáže ihned.' },
          { term: 'Odpověď', desc: 'Cituje původní zprávu — klik na citaci skočí na originál.' },
          { term: 'Reakce', desc: 'Emoji jedním klikem; opětovný klik reakci odebere.' },
          { term: 'Šepot', desc: 'Soukromá zpráva jen vybranému členovi.' },
          { term: 'Přílohy (📎)', desc: 'Obrázky a dokumenty (do 10 MB).' },
          { term: 'Úprava', desc: 'Vlastní zprávu i přílohy upravíš; hod kostkou ne.' },
          { term: 'Zmínka', desc: '@jméno upozorní konkrétního člena.' },
          { term: 'Herní datum (📅)', desc: 'Připne nad zprávu datum ve světě.' },
          { term: 'Hod kostkou (🎲)', desc: 'Kostky dle systému; 30 skinů, per svět.' },
          { term: 'Emoty', desc: 'Napiš :zkratka: (např. :smile:) → obrázek.' },
          { term: 'Oblíbené', desc: 'Konverzaci si připneš nahoru.' },
        ]}
      />

      {!isPJ && (
        <>
          <div className={s.sectionTitle}>
            <BookOpen size={18} aria-hidden="true" /> Můj deník a hody
          </div>
          <TermGrid
            items={[
              { term: 'Můj deník (📖)', desc: 'Vpravo otevřeš svůj deník — ikona „Můj deník" v hlavičce konverzace.' },
              { term: 'Hod schopnosti', desc: 'Klik na schopnost v deníku ji hodí rovnou do konverzace (kostky se rozletí).' },
              { term: 'Úprava', desc: 'Deník upravíš přímo z chatu; změna se projeví i na listu postavy.' },
            ]}
          />
        </>
      )}

      {isPJ && (
        <>
          <div className={s.sectionTitle}>
            <Crown size={18} aria-hidden="true" /> Pro Pána jeskyně
          </div>
          <TermGrid
            items={[
              { term: 'Kanály a konverzace', desc: 'Zakládáš (+) a spravuješ je — barva, ikona, přístup, přesun.' },
              { term: 'NPC mód (🎭)', desc: 'Pošleš zprávu pod libovolným jménem a avatarem.' },
              { term: 'Moderace', desc: 'Můžeš smazat cizí zprávu.' },
              { term: 'Přítomní (👥) + deníky', desc: 'Panel se členy online; klik na člena načte jeho deník — hodíš za něj (hod označen „PJ").' },
              { term: 'Hledání NPC/bestie', desc: 'Pole nad Přítomnými najde NPC nebo bestii → otevře jejich deník/statblok a hodíš za ně.' },
            ]}
          />
          <CalloutBox variant="tip">
            Kanál <strong>Postavy</strong> je soukromý — přidělená postava hráči
            automaticky založí privátní konverzaci s vedením světa.
          </CalloutBox>
        </>
      )}
    </div>
  );
}
