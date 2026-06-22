import { Seo } from '@/shared/seo';
import styles from './TermsPage.module.css';

/**
 * Statická stránka „Podmínky použití", verze 1.0.
 * Pracovní 1.0 postavená na reálných funkcích platformy — finální právní
 * revize (advokát) je plánovaná po skončení beta. Verzi drž v patičce a
 * při změně textu bumpni i `TERMS_VERSION` na BE (souhlas při registraci).
 */
export default function TermsPage() {
  return (
    <article className={styles.page}>
      <Seo
        title="Podmínky použití"
        description="Pravidla používání platformy Projekt Ikaros — účet, obsah, soukromí a odpovědnost."
      />
      <h1>Podmínky použití</h1>
      <p className={styles.lead}>
        Vítej v Projektu Ikaros — komunitní platformě pro hraní rolí (RPG),
        sdílení příběhů a tvorbu vlastních světů. Tyto podmínky popisují
        pravidla, za kterých můžeš službu používat. Vytvořením účtu s nimi
        vyjadřuješ souhlas.
      </p>

      <p className={styles.placeholder}>
        <strong>ⓘ Verze 1.0 (beta):</strong> Projekt Ikaros je hobby projekt v
        beta provozu. Tyto podmínky jsou platná pracovní verze; finální právní
        revize proběhne po skončení beta. Text se proto ještě může upřesnit.
      </p>

      <h2>1. O službě</h2>
      <p>
        Projekt Ikaros (dále „platforma" nebo „služba") je nekomerční komunitní
        platforma provozovaná soukromou osobou. Poskytuje nástroje pro tvorbu a
        hraní RPG světů (např. Matrix, Dračí Doupě, Dungeons&nbsp;&amp;&nbsp;Dragons
        a další systémy) — postavy, deníky, wiki stránky, mapy, kalendáře,
        chat, diskuze, články a galerii. Služba je poskytována zdarma „tak, jak
        je" (viz čl. 7).
      </p>

      <h2>2. Účet a kdo smí službu používat</h2>
      <ul>
        <li>
          Pro registraci je potřeba platná e-mailová adresa a přezdívka. Uváděj
          pravdivé údaje a udržuj je aktuální.
        </li>
        <li>
          Službu mohou používat osoby od <strong>15 let</strong>. Mladší jen se
          souhlasem zákonného zástupce.
        </li>
        <li>
          Účet je osobní — neprodávej ho, nesdílej přihlašovací údaje a
          neprovozuj více účtů za účelem obcházení pravidel. Za aktivitu pod
          svým účtem odpovídáš ty.
        </li>
        <li>
          Za zabezpečení účtu (heslo, dvoufázové ověření) odpovídáš ty.
          Doporučujeme zapnout dvoufázové ověření (2FA).
        </li>
      </ul>

      <h2>3. Tvůj obsah a licence</h2>
      <p>
        Obsah, který vytvoříš (světy, postavy, stránky, příspěvky, obrázky),
        zůstává <strong>tvůj</strong>. Tím, že ho na platformu nahraješ, nám
        uděluješ nevýhradní bezúplatnou licenci tento obsah ukládat, zobrazovat
        a zpřístupňovat ostatním uživatelům v rozsahu nutném pro fungování
        služby (např. zobrazit tvou stránku spoluhráčům ve světě). Licence
        končí smazáním obsahu, s výjimkou nutných záloh a obsahu, který už byl
        sdílen ostatním (viz čl. 9).
      </p>
      <p>
        Odpovídáš za to, že máš k nahranému obsahu práva. Za obsah vytvořený
        uživateli neneseme odpovědnost a nemusíme ho sledovat předem.
      </p>

      <h2>4. Pravidla chování</h2>
      <ul>
        <li>Respektuj ostatní — žádné urážky, šikana, vyhrožování ani diskriminace.</li>
        <li>
          Nenahrávej obsah nezákonný, nenávistný, extremistický ani sexuální
          obsah zobrazující nezletilé.
        </li>
        <li>
          Nezneužívej chat, poštu ani jiné nástroje — žádný spam, masová
          reklama ani automatizované/robotické akce.
        </li>
        <li>
          Neobcházej zabezpečení ani oprávnění (např. přístup k cizím datům,
          světům nebo skrytému obsahu).
        </li>
        <li>
          Nahlašuj závadný obsah a chování provozovateli (viz kontakt). Můžeme
          obsah skrýt či odstranit a účet při porušení pozastavit nebo zrušit.
        </li>
      </ul>

      <h2>5. Cizí autorská práva</h2>
      <p>
        Nenahrávej obrázky, texty ani jiný materiál, ke kterému nemáš práva.
        Pokud se domníváš, že obsah na platformě porušuje tvá autorská práva,
        napiš nám na kontakt níže — po ověření obsah odstraníme.
      </p>

      <h2>6. Osobní údaje a soukromí</h2>
      <p>
        Pro provoz účtu zpracováváme zejména e-mail a přezdívku. E-mail
        nezveřejňujeme ve veřejném profilu. Údaje zpracováváme v souladu s
        nařízením GDPR (EU 2016/679). Máš právo na přístup ke svým údajům,
        jejich opravu, smazání i přenos.
      </p>
      <ul>
        <li>
          <strong>Stažení dat:</strong> svá data si můžeš vyžádat / stáhnout
          (GDPR export).
        </li>
        <li>
          <strong>Smazání účtu:</strong> kdykoli z profilu — viz čl. 9.
        </li>
        <li>
          Dotazy k osobním údajům piš na kontakt v čl. 11. Samostatné Zásady
          ochrany osobních údajů doplníme s finální právní revizí.
        </li>
      </ul>

      <h2>7. Dostupnost služby (beta)</h2>
      <p>
        Služba je poskytována „tak, jak je", bez záruky nepřetržité
        dostupnosti. V beta provozu může docházet k výpadkům, změnám funkcí i
        ztrátě dat. Děláme zálohy, ale <strong>neručíme</strong> za zachování
        obsahu — doporučujeme si důležitý obsah průběžně exportovat. Funkce
        můžeme přidávat, měnit i rušit.
      </p>

      <h2>8. Omezení odpovědnosti</h2>
      <p>
        V rozsahu povoleném zákonem neneseme odpovědnost za škodu vzniklou
        používáním služby, za ztrátu dat ani za obsah vytvořený uživateli.
        Službu používáš na vlastní riziko.
      </p>

      <h2>9. Ukončení účtu</h2>
      <p>
        Účet můžeš kdykoli smazat z profilu. Smazání má 30denní ochrannou lhůtu
        (soft delete) — během ní lze účet obnovit přihlášením. Po jejím
        vypršení dochází k nevratné anonymizaci: komunitní příspěvky (chat,
        články, galerie, diskuze) zůstávají zachovány, ale autorství je
        nahrazeno anonymním záznamem („tombstone"). Při porušení podmínek
        můžeme účet pozastavit nebo zrušit i my.
      </p>

      <h2>10. Změny podmínek</h2>
      <p>
        Tyto podmínky můžeme aktualizovat. O podstatných změnách budeš
        informován (např. při příštím přihlášení). Pokračováním v používání
        platformy po účinnosti změn s novou verzí souhlasíš.
      </p>

      <h2>11. Rozhodné právo a kontakt</h2>
      <p>
        Vztah se řídí právem České republiky. Dotazy, nahlášení obsahu i
        žádosti k osobním údajům posílej na{' '}
        <a href="mailto:tykytanjunior@gmail.com">tykytanjunior@gmail.com</a>.
      </p>

      <p className={styles.footer}>
        <small>Verze podmínek: 1.0 (2026-06-18) — pracovní verze, právní revize plánována po beta.</small>
      </p>
    </article>
  );
}
