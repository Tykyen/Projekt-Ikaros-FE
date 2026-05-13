import { Link } from 'react-router-dom';

export function AccountSection() {
  return (
    <>
      <p>
        Všechna nastavení účtu jsou na <Link to="/ikaros/profil">stránce
        Profil</Link>. Profil má sedm sekcí — popis níže.
      </p>

      <h2>1. Hlavička karty</h2>
      <p>
        Tvůj avatar, přezdívka, město, datum založení účtu, poslední přihlášení,
        zvolená barva chatu a aktuální motiv. Většinu polí (město, displayName)
        upravíš přes tlačítko <strong>Upravit</strong>.
      </p>
      <p>
        Vedle e-mailu vidíš odznak <strong>✓ Ověřeno</strong> nebo{' '}
        <strong>⚠ Neověřeno</strong>. Pokud ti e-mail nedorazil, klikni na{' '}
        <strong>„Poslat znovu"</strong> a zkontroluj i složku Spam. E-mail
        změníš tlačítkem <strong>Změnit</strong>: zadáš novou adresu a aktuální
        heslo, na novou adresu ti pošleme potvrzovací link — po kliknutí se
        adresa přepne. Na starou adresu zároveň dorazí informativní e-mail
        (signál proti zneužití).
      </p>

      <h2>2. Něco o mně</h2>
      <p>
        Volný text o tobě (max 1000 znaků). Zobrazuje se na tvém veřejném profilu.
      </p>

      <h2>3. Postava v Rozcestí</h2>
      <p>
        Jméno, krátký bio a <strong>samostatný avatar</strong> pro tvoji
        platformovou „postavu" &mdash; persona, pod kterou se objevíš v chatech a
        komunitě Ikaru.
      </p>

      <h2>4. Moje světy</h2>
      <p>
        Read-only seznam světů, ve kterých jsi členem. Klikneš a skočíš do
        světového layoutu.
      </p>

      <h2>5. Komunitní stopa</h2>
      <p>
        Tři placeholdery: Moje diskuze, Moje články, Moje galerie. Naplní se s
        fází 3.x.
      </p>

      <h2>6. Soukromí</h2>
      <ul>
        <li>
          <strong>Neviditelný mód</strong> — checkbox skryje tvůj online stav
          před ostatními. Tvá zelená/žlutá tečka u jména v adresáři, na profilu
          a v chatu zmizí. Ty vidíš ostatní beze změny. Vlastní online tečku ve
          své hlavičce uvidíš až po zrušení tohoto módu.
        </li>
      </ul>

      <h2>7. Bezpečnost</h2>
      <ul>
        <li>
          <strong>Změna hesla</strong> — vyžaduje staré heslo. Po úspěšné změně
          se odhlásí všechna ostatní zařízení.
        </li>
        <li>
          <strong>Zapomenuté heslo</strong> — v přihlašovacím modalu klikni na{' '}
          „Zapomněl/a jsi heslo?". Pošleme ti link na reset (platnost 1 hodina).
          Po nastavení nového hesla se musíš znovu přihlásit (žádný auto-login,
          bezpečnostní standard). Pokud měl tvůj účet naplánované smazání,
          reset hesla ho současně zruší.
        </li>
        <li>
          <strong>Žádost o změnu přezdívky</strong> — schvaluje administrátor. Po
          schválení následuje cooldown 30 dní, kdy nelze žádat znovu. Žádost
          můžeš stáhnout, dokud je „pending". O rozhodnutí ti přijde e-mail.
        </li>
      </ul>

      <h2>8. Účet</h2>
      <p>
        Smazání účtu funguje v <strong>30denním hold režimu</strong>:
      </p>
      <ul>
        <li>Klikneš na „Smazat účet", potvrdíš opsáním přezdívky.</li>
        <li>
          Účet jde do stavu <em>deletion pending</em>. Tvůj obsah (chat, články,
          diskuze) zůstává, ale tvé jméno se v UI překrývá tombstone páskou.
        </li>
        <li>
          Pokud se během 30 dní přihlásíš, nabídneme ti{' '}
          <strong>reaktivaci</strong>.
        </li>
        <li>
          Po 30 dnech nightly cron provede hard delete: avatary smaže (GDPR
          right-to-erasure), autorství obsahu nahradí trvalým „Smazaný účet"
          tombstonem.
        </li>
        <li>
          Pokud jsi jediný PJ světa, který má Pomocného PJ, ten se
          <strong> automaticky povýší</strong> na PJ při tvém smazání.
        </li>
      </ul>

      <h2>Default avatary</h2>
      <p>
        Pokud nenahraješ vlastní avatar, použije se <strong>default</strong>:
        muž, žena nebo „bytost". Typ si vybíráš v profilu.
      </p>

      <h2>Tombstone</h2>
      <p>
        Smazaný účet zachová obsah (chat, články, diskuze), ale autora vizuálně
        překrývá <strong>černá diagonální páska</strong> a šedá maska. Cíl: tvůj
        obsah neřízne komunitu, ale tvá identita zmizí. Stav je nevratný po
        cleanup cronu.
      </p>
    </>
  );
}
