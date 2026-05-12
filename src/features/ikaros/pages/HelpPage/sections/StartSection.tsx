import { Link } from 'react-router-dom';
import s from '../HelpPage.module.css';

export function StartSection() {
  return (
    <>
      <h2>Co je Projekt Ikaros</h2>
      <p>
        Komunitní platforma pro hraní rolí. Jeden „adresář" světů — Matrix, D&amp;D,
        vlastní fantasy &mdash; kde každá skupina hraje svým tempem, svým systémem, svou
        atmosférou. Sdílíš tu postavy, deníky, mapy, chat a celý herní život.
      </p>
      <p>
        Platforma se právě staví. Co funguje, najdeš v tabu{' '}
        <strong>Stránky</strong>. Co teprve přijde, je tam s tagem{' '}
        <span className={`${s.statusPill} ${s.statusPillSoon}`}>Připravujeme</span>.
      </p>

      <h2>Co vidíš bez přihlášení</h2>
      <ul>
        <li>Úvodník platformy</li>
        <li>Veřejně dostupné vesmíry</li>
        <li>Tuto nápovědu a podmínky použití</li>
        <li>(Brzy) články, galerii a diskuze ke čtení</li>
      </ul>

      <h2>Co odemkne registrace</h2>
      <ul>
        <li>Vlastní profil + postava v Rozcestí</li>
        <li>Vstup do vesmírů, vytvoření vlastního světa</li>
        <li>Soukromou poštu a globální chat (Hospodu)</li>
        <li>Pravý panel s administrací, mými světy a oblíbenými</li>
        <li>Theme switcher uložený k účtu (21 motivů)</li>
      </ul>

      <h2>Jak se zaregistrovat</h2>
      <ol>
        <li>V hlavičce klikni na <strong>Registrace</strong>.</li>
        <li>Vyplň e-mail, přezdívku a heslo (indikátor síly ti napoví).</li>
        <li>Odsouhlas <Link to="/podminky">podmínky použití</Link>.</li>
        <li>
          Po odeslání jsi automaticky přihlášený &mdash; nemusíš znovu psát heslo.
        </li>
      </ol>

      <div className={s.warning}>
        <strong>Pozor:</strong> Reset hesla zatím není dostupný (přijde v kroku 1.7).
        Pokud heslo zapomeneš, ozvi se administrátorovi přes e-mail v podmínkách.
      </div>

      <h2>Jak se přihlásit</h2>
      <p>
        Klikni na <strong>Přihlásit se</strong> v hlavičce. Lze přihlásit přes
        e-mail nebo přezdívku. Pokud je tvůj účet ve stavu „smazání čeká",
        nabídne se ti reaktivace.
      </p>

      <h2>Orientace v rozhraní</h2>
      <ul>
        <li>
          <strong>Hlavička:</strong> logo (na úvodník) + theme switcher + Pošta /
          Profil / Odhlásit (přihlášený) nebo Přihlásit / Registrace (anon).
        </li>
        <li>
          <strong>Levý sidebar:</strong> Navigace (Úvodník, Nápověda, Diskuze,
          Články, Galerie, Vytvořit svět), seznam Vesmírů, Chat kanály.
        </li>
        <li>
          <strong>Hlavní panel:</strong> obsah aktuální stránky.
        </li>
        <li>
          <strong>Pravý panel</strong> (jen přihlášený):
          Administrace (
          <Link to="/ikaros/uzivatele">Uživatelé / Přátelé</Link>) + theme
          switcher, Moje světy, Moje diskuze, Oblíbené.
        </li>
        <li>
          Na <strong>mobilu</strong> se sidebar schová do hamburger menu vlevo
          nahoře.
        </li>
      </ul>

      <h2>Vzhled (motivy)</h2>
      <p>
        Platforma má 21 vizuálních motivů &mdash; od neutrální „Modré nebe" přes
        Kyberpunk, Pergamen, Nemrtví až po Arabský svět. Přepneš v theme
        switcheru v hlavičce nebo v pravém panelu v sekci Administrace. Volba
        se ukládá k účtu, na jiném zařízení se ti vrátí.
      </p>
    </>
  );
}
