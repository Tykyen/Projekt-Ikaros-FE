import { Link } from 'react-router-dom';
import s from '../HelpPage.module.css';

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

const FAQ: FaqItem[] = [
  {
    q: 'Co najdu na úvodní stránce po přihlášení?',
    a: (
      <>
        <p>
          Úvodní stránka <Link to="/">/</Link> je tvůj rozcestník. Postupně
          vidíš tři sekce:
        </p>
        <ul>
          <li>
            <strong>Moje světy</strong> — karty světů, kterých jsi členem;
            klik na kartu nebo tlačítko „Vstoupit do světa" tě přesune do
            světa. U každého světa vidíš svou roli (PJ, Hráč, …) a počet
            hráčů. Pokud ještě nejsi v žádném světě, ukáže se výzva s
            tlačítky „Prozkoumat světy" a „Vytvořit svět".
          </li>
          <li>
            <strong>Akce</strong> — 5 nejbližších herních
            událostí napříč všemi tvými světy, seřazené podle data. U
            každé akce můžeš kliknout na „Půjdu" a přihlásit se. Klik
            na řádek tě přesune do konkrétního světa.
          </li>
          <li>
            <strong>Novinky</strong> — platformové novinky, které píše
            administrátor.
          </li>
        </ul>
      </>
    ),
  },
  {
    q: 'Jak si změním přezdívku?',
    a: (
      <>
        <p>
          Otevři <Link to="/ikaros/profil">Profil</Link> → sekce
          <strong> Bezpečnost</strong> → tlačítko „Požádat o změnu přezdívky".
          Zadáš novou variantu a administrátor ji schválí (obvykle do několika
          dní).
        </p>
        <p>
          Po úspěšné změně platí <strong>cooldown 30 dní</strong> &mdash; další
          žádost přijmeme až po něm.
        </p>
      </>
    ),
  },
  {
    q: 'Co dělat, když jsem zapomněl heslo?',
    a: (
      <>
        <p>
          V přihlašovacím dialogu klikni na <strong>„Zapomněl/a jsi heslo?"</strong>.
          Zadáš e-mail a my ti pošleme link na nastavení nového hesla. Link platí
          jednu hodinu a lze ho použít jen jednou.
        </p>
        <p>
          Po úspěšném resetu se musíš znovu přihlásit (žádný auto-login —
          bezpečnostní standard). Pokud měl tvůj účet naplánované smazání, reset
          hesla ho současně zruší a účet se obnoví.
        </p>
      </>
    ),
  },
  {
    q: 'Jak si změním e-mail?',
    a: (
      <>
        <p>
          V <Link to="/ikaros/profil">Profilu</Link> → karta Hlavička je vedle
          e-mailu tlačítko <strong>Změnit</strong>. Zadáš novou adresu a aktuální
          heslo. Na nový e-mail dostaneš potvrzovací link (platnost 1 hodina) —
          po kliknutí se adresa přepne. Na původní adresu zároveň přijde
          informativní e-mail (pokud o tom nevíš, někdo má přístup k tvému účtu
          a měl/a bys hned změnit heslo).
        </p>
        <p>
          Vedle e-mailu v profilu vidíš odznak{' '}
          <strong>✓ Ověřeno / ⚠ Neověřeno</strong>. Pokud verifikační e-mail
          nedorazí, klikni na <strong>„Poslat znovu"</strong> (max 3× za 15 min).
        </p>
      </>
    ),
  },
  {
    q: 'Jak smažu účet?',
    a: (
      <>
        <p>
          <Link to="/ikaros/profil">Profil</Link> → sekce <strong>Účet</strong>{' '}
          → „Smazat účet". Potvrdíš opsáním přezdívky a souhlasem.
        </p>
        <p>
          Účet jde do 30denního hold režimu. Pokud se během něj přihlásíš,
          nabídneme reaktivaci. Po 30 dnech proběhne anonymizace (autorství
          obsahu se přepíše tombstonem). Pokud jsi jediný PJ světa s Pomocným
          PJ, ten se automaticky povýší.
        </p>
      </>
    ),
  },
  {
    q: 'Co je „Zpracovat" v adresáři uživatelů?',
    a: (
      <>
        <p>
          Univerzální fronta akcí, které vyžadují tvé rozhodnutí. Dnes obsahuje:
        </p>
        <ul>
          <li>žádosti o přátelství (přicházejí, když ti někdo pošle pozvánku)</li>
          <li>žádosti o změnu přezdívky (jen Admin/Superadmin)</li>
          <li>žádosti o vstup do uzavřeného světa (pro PJ světa)</li>
          <li>
            články čekající na schválení (pro Správce článků a
            Admin/Superadmin) — schválíš je, nebo vrátíš autorovi s poznámkou
          </li>
          <li>
            obrázky čekající na schválení (pro Správce galerie a
            Admin/Superadmin) — schválíš je, nebo vrátíš autorovi s poznámkou
          </li>
          <li>
            diskuze čekající na schválení a nahlášené příspěvky (pro Správce
            diskuzí a Admin/Superadmin)
          </li>
          <li>
            žádosti o přidání do uzamčené diskuze (pro správce té diskuze)
          </li>
        </ul>
        <p>
          Číslo u záložky „Zpracovat" v pravém panelu ukazuje, kolik položek
          čeká na tvé rozhodnutí. Pokud schvaluješ obsah, vidíš počet
          čekajících položek i jako číslo přímo vedle <strong>Diskuze</strong>,
          {' '}<strong>Články</strong> a <strong>Galerie</strong> v levé
          navigaci — víš tak rovnou, kde něco čeká.
        </p>
      </>
    ),
  },
  {
    q: 'Jak si přidám přítele?',
    a: (
      <>
        <p>
          Otevři jeho <strong>veřejný profil</strong> (klikni na avatar / kartu
          v adresáři) a stiskni <strong>„Přidat do přátel"</strong>. Druhá strana
          dostane žádost ve svém tabu <strong>Zpracovat</strong> a může ji
          přijmout nebo odmítnout.
        </p>
        <p>
          Po přijetí se přítel objeví v tabu <strong>Přátelé</strong> u obou.
          Odebrání je možné kdykoliv (kebab menu na kartě „Odebrat z přátel").
          Pokud druhá strana žádost odmítne, můžeš ji znovu poslat až za{' '}
          <strong>24 hodin</strong> (anti-spam pojistka).
        </p>
      </>
    ),
  },
  {
    q: 'Jak někoho zablokovat?',
    a: (
      <>
        <p>
          Ve veřejném profilu uživatele klikni vpravo na <strong>„…"</strong>{' '}
          (kebab menu) → <strong>„Blokovat uživatele"</strong>. Potvrdíš dialog a:
        </p>
        <ul>
          <li>Existující přátelství zmizí.</li>
          <li>Pending žádost (od kterékoliv strany) se zruší.</li>
          <li>Nepošlete si novou žádost o přátelství, dokud blok neukončíš.</li>
          <li>
            Druhá strana <strong>nedostane žádné upozornění</strong>
            {' '}(anti-stalk).
          </li>
        </ul>
        <p>
          Své zablokované najdeš v tabu <strong>Přátelé</strong> → sbalitelná
          sekce <strong>„Zablokovaní"</strong> (default zavřená). Odblokuješ je
          jedním klikem.
        </p>
      </>
    ),
  },
  {
    q: 'Jak funguje Pošta a kdo mi může psát?',
    a: (
      <>
        <p>
          <strong>Pošta</strong> (ikona v hlavičce) jsou soukromé zprávy mezi
          uživateli. Máš složky <strong>Doručené</strong> a{' '}
          <strong>Odeslané</strong>; po otevření zprávy ji čteš jako vlákno
          konverzace a můžeš rovnou <strong>Odpovědět</strong>. Odznak u ikony
          ukazuje počet nepřečtených.
        </p>
        <p>
          Novou zprávu napíšeš komukoliv — příjemce vybereš našeptávačem podle
          přezdívky. Pokud si ale v <strong>profilu → Soukromí</strong> zapneš{' '}
          <strong>„Jen pro přátele"</strong>, napsat ti jako první může jen tvůj
          přítel (a administrátor). Na zprávu, kterou jsi sám/sama poslal/a, ti
          druhá strana může odpovědět vždy.
        </p>
      </>
    ),
  },
  {
    q: 'Co znamená Motiv (theme) a kolik jich je?',
    a: (
      <p>
        Motiv = globální vizuální styl Ikaru. Existuje <strong>21 motivů</strong>{' '}
        &mdash; od neutrální Modré nebe přes Kyberpunk, Pergamen, Nemrtví,
        Arabský svět až po Bílou. Přepínáš v theme switcheru (hlavička +
        Administrace v pravém panelu). Volba se ukládá k účtu.
      </p>
    ),
  },
  {
    q: 'Má svět vlastní vzhled a můžu si ho upravit?',
    a: (
      <>
        <p>
          Každý svět má <strong>vlastní vzhled</strong>, nezávislý na platformě.
          Určuje ho <strong>PJ</strong> v Nastavení světa (odvozuje se ze žánru,
          PJ ho může přepsat a doladit) &mdash; tento vzhled vidí všichni
          členové stejně.
        </p>
        <p>
          Ty si můžeš <strong>pro sebe</strong> doladit barvy, jas a kontrast
          kvůli čitelnosti &mdash; v Nastavení světa → tab{' '}
          <strong>„Můj vzhled"</strong>. Skin a písmo zůstávají, měníš jen
          barevnou vrstvu. Vzhled platformy Ikaros si doladíš obdobně v{' '}
          <Link to="/ikaros/profil">Profilu</Link> → sekce{' '}
          <strong>Doladění vzhledu</strong>.
        </p>
      </>
    ),
  },
  {
    q: 'Co je tombstone?',
    a: (
      <p>
        Vizuální stav smazaného účtu: <strong>černá diagonální páska</strong>{' '}
        přes avatar a šedá maska s nápisem „Smazaný účet". Cíl: obsah (chat,
        články) zůstává v komunitě, ale identita autora je nevratně skryta.
      </p>
    ),
  },
  {
    q: 'Můžu jako Admin banovat jiného Admina?',
    a: (
      <p>
        Standardně <strong>ne</strong>. Admin smí jen Hráče a PJ. K akcím proti
        jinému Adminovi musíš mít flag <code>canManageAdmins</code> (uděluje
        Superadmin). Banovat Superadmina nesmí <em>nikdo</em>.
      </p>
    ),
  },
  {
    q: 'Funguje to na mobilu?',
    a: (
      <p>
        Ano, celá platforma je responzivní. Sidebar se na mobilu skrývá do
        hamburger menu vlevo nahoře. Tabulky a horní taby v této nápovědě
        scrolují horizontálně.
      </p>
    ),
  },
  {
    q: 'Kde nahlásit chybu nebo navrhnout vylepšení?',
    a: (
      <p>
        E-mailem na adresu uvedenou v{' '}
        <Link to="/podminky">podmínkách použití</Link>. Stručný popis + jak
        chybu vyvolat + screenshot významně urychlí opravu.
      </p>
    ),
  },
  {
    q: 'Jaký je rozdíl mezi globální a světovou rolí?',
    a: (
      <p>
        Globální role (např. Admin, Hráč) platí napříč celou platformou.
        Světová role (PJ, Pomocný PJ, Hráč ve světě) platí jen v daném světě
        &mdash; v jednom světě můžeš být PJ, v jiném jen Hráč. Detail v tabu{' '}
        <strong>Role &amp; oprávnění</strong>.
      </p>
    ),
  },
];

export function FaqSection() {
  return (
    <>
      <p>Krátké odpovědi na časté otázky. Kliknutím na otázku se rozbalí.</p>
      <div className={s.faqList}>
        {FAQ.map((item, idx) => (
          <details key={idx} className={s.faqItem}>
            <summary>{item.q}</summary>
            <div className={s.faqAnswer}>{item.a}</div>
          </details>
        ))}
      </div>
    </>
  );
}
