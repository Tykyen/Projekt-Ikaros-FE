import styles from './TermsPage.module.css';

/**
 * D-010 — Statická stránka „Podmínky použití". Aktuální text je placeholder.
 * Před produkčním nasazením musí PJ dodat finální verzi (právní konzultace doporučená).
 */
export default function TermsPage() {
  return (
    <article className={styles.page}>
      <h1>Podmínky použití</h1>
      <p className={styles.lead}>
        Vítej v Projektu Ikaros — komunitní platformě pro hraní rolí, sdílení
        příběhů a tvorbu světů. Před vytvořením účtu si přečti následující
        podmínky.
      </p>

      <p className={styles.placeholder}>
        <strong>⚠ Upozornění:</strong> Toto je pracovní verze podmínek (D-010).
        Finální text dodá PJ po právní konzultaci před veřejným nasazením.
      </p>

      <h2>1. Účel platformy</h2>
      <p>
        Projekt Ikaros poskytuje prostor pro tvorbu a hraní RPG světů (Matrix,
        D&amp;D a další). Účet umožňuje editovat vlastní postavy, články,
        příspěvky v diskuzích, galerii a chatu.
      </p>

      <h2>2. Zpracování osobních údajů</h2>
      <p>
        Pro registraci je nutný e-mail a přezdívka. E-mail neukládáme do
        veřejného profilu. Data jsou zpracovávána v souladu s nařízením GDPR
        (EU 2016/679). Máš právo na přístup, opravu, smazání a přenos svých
        údajů — kontaktuj nás na <a href="mailto:tykytanjunior@gmail.com">tykytanjunior@gmail.com</a>.
      </p>

      <h2>3. Pravidla chování</h2>
      <ul>
        <li>Respektuj ostatní hráče — žádné urážky, šikana ani diskriminace.</li>
        <li>
          Nesdílej obsah, který porušuje autorská práva, nebo obsah s
          extremistickou, sexistickou nebo násilnou tematikou.
        </li>
        <li>
          Nezneužívej chatovací systém — žádný spam, masová reklama ani
          automatizované akce.
        </li>
      </ul>

      <h2>4. Smazání účtu</h2>
      <p>
        Smazání účtu trvá 30 dní (soft delete). Během této doby lze účet
        obnovit přihlášením. Po vypršení dochází k anonymizaci — komunitní
        příspěvky (chat, články, galerie, diskuze) zůstávají, ale autorství je
        nahrazeno tombstone záznamem.
      </p>

      <h2>5. Změny podmínek</h2>
      <p>
        O změnách budeš informován při příštím přihlášení. Pokračování v
        používání platformy znamená souhlas s aktualizovanou verzí.
      </p>

      <p className={styles.footer}>
        <small>Verze podmínek: 0.1 (placeholder, 2026-05-08)</small>
      </p>
    </article>
  );
}
