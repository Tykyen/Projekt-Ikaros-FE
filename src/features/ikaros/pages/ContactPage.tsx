import { Seo } from '@/shared/seo';
import s from './legalPage.module.css';

/**
 * Statická stránka „Kontakt" (20.1 — Příloha C). Plní dvě kontaktní místa dle
 * DSA čl. 11 (orgány) a čl. 12 (uživatelé — musí existovat cesta k člověku,
 * ne jen automat). Konkrétní nahlašování obsahu poběží přes tlačítko
 * „Nahlásit" u příspěvku (Fáze B, čl. 16), ne přes tento obecný kontakt.
 */
export default function ContactPage() {
  return (
    <article className={s.page}>
      <Seo
        title="Kontakt"
        description="Kontaktní místa platformy Projekt Ikaros — pro uživatele i pro orgány (DSA)."
      />
      <h1>Kontakt</h1>

      <p className={s.placeholder}>
        <strong>ⓘ Verze 1.0 (beta):</strong> pracovní znění. Identitu
        provozovatele a kontaktní adresy doplníme před veřejným spuštěním.
      </p>

      <h2>Provozovatel</h2>
      <p>
        Projekt Ikaros provozuje{' '}
        <mark className={s.dopisat}>[DOPLNIT: název]</mark> z.&nbsp;s., IČO{' '}
        <mark className={s.dopisat}>[DOPLNIT: IČO]</mark>, se sídlem{' '}
        <mark className={s.dopisat}>[DOPLNIT: sídlo]</mark>, zapsaný ve
        spolkovém rejstříku{' '}
        <mark className={s.dopisat}>[DOPLNIT: soud, sp. zn.]</mark>.
      </p>
      <p>
        Provozní e-mail:{' '}
        <mark className={s.dopisat}>[DOPLNIT: e-mail]</mark>.
      </p>

      <h2>Kontaktní místo pro uživatele</h2>
      <p>
        Pro dotazy, žádosti k osobním údajům i obecná hlášení nás kontaktuj
        elektronicky na{' '}
        <mark className={s.dopisat}>[DOPLNIT: e-mail / formulář]</mark>. Za
        kontaktním místem stojí člověk — nespoléháme výhradně na automat. Sem
        směřuje i případné <strong>odvolání</strong> proti moderačnímu
        rozhodnutí.
      </p>

      <h2>Kontaktní místo pro orgány</h2>
      <p>
        Jednotné kontaktní místo pro orgány členských států, Evropskou komisi
        a sbor (DSA čl. 11):{' '}
        <mark className={s.dopisat}>[DOPLNIT: e-mail pro orgány]</mark>.
      </p>

      <h2>Jazyk komunikace</h2>
      <p>
        Komunikujeme <strong>česky</strong>; s orgány a zahraničními uživateli
        také <strong>anglicky</strong>.
      </p>

      <h2>Nahlášení konkrétního obsahu</h2>
      <p>
        Protiprávní nebo závadný obsah se nehlásí přes tento obecný kontakt, ale
        tlačítkem <strong>„Nahlásit“</strong> přímo u příspěvku (postupně
        přibývá ke všem plochám). U podezření na trestný čin ohrožující život
        nebo bezpečí jednáme neprodleně a věc předáváme příslušným orgánům.
      </p>
      <p>
        Pravidla, kterými se komunita řídí, najdeš v{' '}
        <a href="/kodex">Pravidlech komunity</a>. Jak nakládáme s osobními
        údaji, popisují <a href="/soukromi">Zásady ochrany osobních údajů</a>.
      </p>
    </article>
  );
}
