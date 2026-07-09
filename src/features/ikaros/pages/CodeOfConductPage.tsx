import { Seo } from '@/shared/seo';
import s from './legalPage.module.css';

/**
 * Statická stránka „Pravidla komunity" (20.1 — Příloha C). Obsah vychází
 * z provozního rámce `70-kodex-hodnoty.html` (7 hodnot + zákazy + krátká
 * veřejná verze). Funkční nahlašování (`ReportButton`, fronta, M0–M7) přijde
 * ve Fázi B — tady jen pravidla, na která se nahlašování odkazuje.
 */
export default function CodeOfConductPage() {
  return (
    <article className={s.page}>
      <Seo
        title="Pravidla komunity"
        description="Hodnoty a pravidla chování na platformě Projekt Ikaros — respekt, důvěra, tvůrčí férovost, bezpečí."
      />
      <h1>Pravidla komunity</h1>

      <p className={s.placeholder}>
        <strong>ⓘ Verze 1.0 (beta):</strong> pracovní znění postavené na
        reálných funkcích platformy. Finální právní revize proběhne po skončení
        beta; text se ještě může upřesnit.
      </p>

      <p className={s.lead}>
        Ikaros je infrastruktura, která lidem pomáhá tvořit a hrát — vést
        deníky, stavět světy, psát kroniky a potkávat spoluhráče. Tato pravidla
        existují, aby se z ní nestalo místo, kde se krade cizí obsah, útočí na
        lidi, ponižují začátečníci, zneužívají mladší nebo se tajně těží cizí
        tvorba. Rozhodnutí, které se touto zásadou dá obhájit, je v souladu
        s Ikarem — i kdyby ho podmínky výslovně neřešily.
      </p>

      <h2>Sedm hodnot</h2>
      <ul className={s.values}>
        <li>
          <strong>Respekt.</strong> K člověku za postavou i za obrazovkou;
          kritizuje se dílo a rozhodnutí, ne osoba.
        </li>
        <li>
          <strong>Důvěra.</strong> Co si hráči svěří (deníky, tajné zápletky,
          soukromé konverzace), zůstává, kde má; nespoiluje se cizí kampaň bez
          souhlasu.
        </li>
        <li>
          <strong>Tvůrčí férovost.</strong> Cizí světy, mapy, texty a postavy
          mají autora; přebírají se s uvedením a v mezích licence, nekradou se.
        </li>
        <li>
          <strong>Bezpečí.</strong> Nikdo není obtěžován, zastrašován ani
          vystaven obsahu, na který nepřistoupil; u mladších a dětí zvlášť.
        </li>
        <li>
          <strong>Transparentnost.</strong> Komerční motiv, reklama, spolupráce
          i AI původ obsahu se přiznávají; žádné skryté cíle.
        </li>
        <li>
          <strong>Přístupnost.</strong> Začátečník je vítaný, ne terč; Ikaros
          funguje na mobilu i desktopu a nepředpokládá „zasvěcené“.
        </li>
        <li>
          <strong>Spolupráce.</strong> Komunita staví společně; konflikt se
          řeší přes pravidla a moderaci, ne veřejnou štvanicí.
        </li>
      </ul>

      <h2>Co do služby nepatří</h2>
      <p>
        Temná a dospělá fikce je přípustná — hranice je, že fikce nesmí být
        záminkou ke skutečnému útoku, zneužití nebo poškození reálného člověka.
      </p>
      <ul>
        <li>
          <strong>Protiprávní obsah</strong> a obsah propagující nebo umožňující
          trestnou činnost.
        </li>
        <li>
          <strong>Porušení autorských a jiných práv</strong> třetích osob
          (včetně kopírování chráněného obsahu příruček herních systémů).
        </li>
        <li>
          <strong>Zásah do osobnostních práv</strong> — cizí podoba, hlas,
          projevy osobní povahy nebo osobní údaje bez svolení.
        </li>
        <li>
          <strong>Doxxing</strong> — zveřejnění soukromých údajů jiné osoby
          s cílem uškodit.
        </li>
        <li>
          <strong>Obtěžování, výhrůžky, zastrašování a cílené štvaní</strong>{' '}
          vůči osobě nebo skupině.
        </li>
        <li>
          <strong>Nenávistný projev</strong> — podněcování k nenávisti nebo
          násilí.
        </li>
        <li>
          <strong>Ohrožení nezletilých</strong> — jakýkoli obsah sexualizující
          nezletilé a grooming. Nulová tolerance.
        </li>
        <li>
          <strong>Intimní záznamy šířené bez souhlasu</strong> zobrazené osoby.
        </li>
        <li>
          <strong>Škodlivý software</strong> a pokusy o narušení bezpečnosti
          nebo provozu služby.
        </li>
        <li>
          <strong>Spam a neoznačená skrytá reklama.</strong>
        </li>
        <li>
          <strong>Klamavý AI obsah</strong> — zejména podoba reálné osoby bez
          souhlasu a deepfake.
        </li>
      </ul>

      <h2>Ve zkratce</h2>
      <p className={s.callout}>
        Chováme se k lidem s respektem — k člověku za postavou i za obrazovkou.
        Chráníme tvorbu — cizí světy, mapy a texty se nekradou, přebírají se
        s uvedením autora a v mezích licence. Neobtěžujeme a netolerujeme
        zastrašování ani nenávistné projevy. Nešíříme tajné info — spoilery
        kampaní, soukromé konverzace ani PJ tajemství bez souhlasu. Neútočíme na
        začátečníky. U dětí platí přísnější režim a u AI ctíme transparentnost
        a autory. Kdo tyto zásady poruší, řeší to s moderací — nejde o tresty,
        jde o to, aby Ikaros zůstal místem, kam se lidi rádi vracejí.
      </p>

      <h2>Když něco nesedí</h2>
      <p>
        Závadný obsah nebo chování můžeš nahlásit — postupně přibývá tlačítko{' '}
        <strong>„Nahlásit“</strong> přímo u obsahu. Než bude všude, piš na{' '}
        <a href="/kontakt">kontakt</a>. Moderace může obsah skrýt či odstranit
        a při porušení účet pozastavit nebo zrušit; o zásahu i o možnosti
        odvolání tě vyrozumíme.
      </p>

      <p className={s.footer}>
        <small>
          Verze pravidel: 1.0 — pracovní verze, právní revize plánována po beta.
        </small>
      </p>
    </article>
  );
}
