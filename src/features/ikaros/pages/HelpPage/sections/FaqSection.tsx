import { Link } from 'react-router-dom';
import s from '../HelpPage.module.css';

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

const FAQ: FaqItem[] = [
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
          Univerzální fronta akcí, které vyžadují tvé rozhodnutí. Dnes obsahuje
          žádosti o změnu přezdívky (pro adminy). Postupně přibude:
        </p>
        <ul>
          <li>žádosti o přátelství (Fáze 1.8)</li>
          <li>žádosti o vstup do uzavřeného světa (Fáze 2.4, pro PJ)</li>
          <li>pending články / obrázky / hlášené příspěvky (Fáze 3.2–3.4)</li>
        </ul>
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
