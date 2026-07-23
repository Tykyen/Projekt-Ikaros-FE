import { Link } from 'react-router-dom';
import { Rocket, BookOpen, Eye, KeyRound, Palette, Layout } from 'lucide-react';
import {
  HelpAccordion,
  InfoCard,
  InfoGrid,
  StepList,
  TermGrid,
  CalloutBox,
  IllustrationSlot,
  ScreenshotSlot,
} from '../components';

export function StartSection() {
  return (
    <>
      <h2>Co je Projekt Ikaros</h2>
      <IllustrationSlot media="start.hero" />
      <p>
        Komunitní platforma pro hraní rolí. Jeden „adresář" světů — Matrix, D&amp;D,
        vlastní fantasy — kde každá skupina hraje svým tempem, svým systémem, svou
        atmosférou. Sdílíš tu postavy, deníky, mapy, chat a celý herní život. Co
        zatím nefunguje, je označené štítkem <strong>🚧 Připravujeme</strong>.
      </p>

      <HelpAccordion icon={<Rocket size={20} />} title="První kroky" accent="success" defaultOpen>
        <p>Než se vrhneš do hry, projdi si tyhle tři kroky:</p>
        <StepList
          steps={[
            <>
              <strong>Zaregistruj se.</strong> V hlavičce klikni na{' '}
              <strong>Registrace</strong>, vyplň e-mail, přezdívku a heslo
              (indikátor síly napoví) a odsouhlas{' '}
              <Link to="/podminky">podmínky použití</Link>. Platforma je pro hráče
              od <strong>15 let</strong>. Po odeslání jsi rovnou přihlášený.
            </>,
            <>
              <strong>Vyplň profil a postavu.</strong> V profilu (po přihlášení)
              přidej avatar, něco o sobě a svou platformovou <strong>postavu</strong>{' '}
              v Campu — pod tou pak vystupuješ v komunitě a chatech.
            </>,
            <>
              <strong>Vstup do světa.</strong> V <Link to="/ikaros/vesmiry">Přehledu
              vesmírů</Link> si vyber svět a klikni Vstoupit (veřejný hned, uzavřený
              přes žádost ke schválení PJ). Pak už hraješ.
            </>,
          ]}
        />
        <CalloutBox variant="tip">
          Zapomenuté heslo vyřešíš odkazem „Zapomněl/a jsi heslo?" přímo v
          přihlašovacím dialogu — přijde ti e-mail s odkazem na nové heslo.
        </CalloutBox>
      </HelpAccordion>

      <HelpAccordion icon={<Eye size={20} />} title="Co uvidíš a co odemkne registrace" accent="info">
        <InfoGrid>
          <InfoCard icon={<Eye size={22} />} title="Bez přihlášení" accent="reader">
            Úvodník platformy, veřejné vesmíry, tahle nápověda a podmínky, články a
            galerie ke čtení. Do <strong>Putyky</strong> můžeš nakouknout i jako
            host (po ověření „nejsi robot") — popovídáš si pod přezdívkou anonym.
            Diskuze a vstup do světů vyžadují účet.
          </InfoCard>
          <InfoCard icon={<KeyRound size={22} />} title="Po registraci" accent="success">
            Vlastní profil a postava, vstup do vesmírů i tvorba světa, soukromá
            pošta a globální chat (Putyka), pravý panel s administrací a oblíbenými,
            přepínač motivů uložený k účtu.
          </InfoCard>
        </InfoGrid>
      </HelpAccordion>

      <HelpAccordion icon={<Layout size={20} />} title="Orientace v rozhraní" accent="accent">
        <TermGrid
          items={[
            { term: 'Hlavička', desc: 'Logo (na úvodník), přepínač motivů, zvonek (notifikace), Pošta, Profil, Odhlásit. U anonyma Přihlásit / Registrace.' },
            { term: 'Levý sidebar', desc: 'Navigace, seznam vesmírů a chat. Po přihlášení i Diskuze, Vytvořit svět a Camp; nepřihlášenému se tyhle skryjí (zůstává Úvodník, Články, Galerie, vesmíry a Putyka).' },
            { term: 'Hlavní panel', desc: 'Obsah aktuální stránky. Nepřihlášenému se na úvodníku navíc ukáže pás ukázek z aplikace.' },
            { term: 'Vypravěč', desc: 'Kulaté tlačítko vpravo dole (zkratka Shift+V) — průvodce platformou. Mimo světy tě provází Ishida, uvnitř světů Joe: řekne, kde jsi, poradí k místu, kde stojíš, a nové Pány jeskyně provede založením světa krok za krokem. Po registraci se jednou zeptá, co tu chceš dělat — podle toho tě nasměruje.' },
            { term: 'Pravý panel', desc: 'Po přihlášení administrace, moje světy a oblíbené. Bez přihlášení tu najdeš „Začni tady" — tři kroky, jak se zapojit.' },
            { term: 'Zvonek', desc: 'Souhrn zpráv ze všech tvých světů + záložky Události a Ke zpracování.' },
            { term: 'Hledání', desc: 'Uvnitř světa pole „Hledat…" (Ctrl+K) prohledá stránky aktuálního světa.' },
            { term: 'Mobil', desc: 'Sidebar se schová do hamburger menu vlevo nahoře.' },
          ]}
        />
        <ScreenshotSlot media="start.orientace" />
      </HelpAccordion>

      <HelpAccordion icon={<BookOpen size={20} />} title="Slovníček pojmů" accent="corrector">
        <p>Pár slov, na která narazíš všude:</p>
        <TermGrid
          items={[
            { term: 'Svět (vesmír)', desc: 'Samostatná hra se svými členy, mapami, postavami a vlastním vzhledem. Žiješ ve více světech zároveň.' },
            { term: 'PJ (Pán jeskyně)', desc: 'Vypravěč a vlastník světa — řídí hru, obsah a členy. Jinde též „GM".' },
            { term: 'Postava', desc: 'Tvoje herní identita ve světě (statistiky, deník, výbava). Platformová „postava v Campu" je samostatná persona pro komunitu.' },
            { term: 'NPC', desc: 'Postava řízená PJ (vedlejší charakter), ne hráčem.' },
            { term: 'Bestie', desc: 'Statblok nepřítele/tvora pro taktickou mapu (HP, zbroj, schopnosti) — bez deníku.' },
            { term: 'Token', desc: 'Figurka postavy nebo bestie na taktické mapě, se kterou se pohybuje.' },
            { term: 'AKJ', desc: 'Stupeň utajení stránky/záložky. Bez přístupu uvidíš jen zamčenou záložku, ne její obsah.' },
            { term: 'Motiv (theme)', desc: 'Vizuální styl — platforma má vlastní, každý svět taky svůj.' },
            { term: 'Camp', desc: 'Atmosférické roleplay místnosti pro hru na jeden večer bez mechanik — Fantasy, Mystery a Sci-fi camp. Scéna se sama střídá, jednu rozehranou hru si můžeš uložit a načíst.' },
            { term: 'Putyka', desc: 'Globální chat pro celou platformu napříč světy. Nakouknout a popovídat si jako host (anonym) můžeš i bez registrace — jen text.' },
            { term: 'Pavučina', desc: 'Vztahový graf kampaně — kdo koho má rád, frakce, příběhové linky.' },
            { term: 'Taktická mapa', desc: 'Hex-grid plocha pro boj a scény s tokeny, iniciativou a mlhou války.' },
          ]}
        />
      </HelpAccordion>

      <HelpAccordion icon={<Palette size={20} />} title="Vzhled (motivy)" accent="warning">
        <p>
          Platforma má desítky vizuálních motivů — od neutrální „Modré nebe" přes
          Kyberpunk, Pergamen, Nemrtví až po Arabský svět. Přepneš je v přepínači
          motivů v hlavičce nebo v pravém panelu; volba se ukládá k účtu a vrátí se
          ti i na jiném zařízení.
        </p>
        <CalloutBox variant="tip" title="Motiv světa je samostatný">
          Každý svět má vlastní vzhled nezávislý na platformě — určuje ho PJ. Sobě
          si ho můžeš přeladit přes „Vzhled světa" (ikona palety v hlavičce světa),
          „Reset" vrátí na motiv od PJ.
        </CalloutBox>
      </HelpAccordion>
    </>
  );
}
