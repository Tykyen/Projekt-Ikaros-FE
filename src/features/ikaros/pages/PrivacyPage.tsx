import { Seo } from '@/shared/seo';
import s from './legalPage.module.css';

/**
 * Statická stránka „Zásady ochrany osobních údajů" (20.2 — Příloha C).
 * Informace podle GDPR čl. 13 — NENÍ souhlas (uživatel bere na vědomí).
 * Obsah vychází z provozního rámce (21-gdpr-zaklady, 20-gdpr-mapa,
 * 23-zpracovatele-transfer, 22-prava-export, 80a-podminky-spolek).
 * Věkový gate a data-export tlačítko = Fáze C; tady jen informační text.
 */
export default function PrivacyPage() {
  return (
    <article className={s.page}>
      <Seo
        title="Zásady ochrany osobních údajů"
        description="Jak Projekt Ikaros zpracovává osobní údaje — účely, právní základy, příjemci, doby uložení a práva subjektu."
      />
      <h1>Zásady ochrany osobních údajů</h1>

      <p className={s.placeholder}>
        <strong>ⓘ Verze 1.0 (beta):</strong> pracovní znění. Finální revize
        (advokát) a doplnění identity správce proběhne před veřejným spuštěním.
      </p>

      <p className={s.callout}>
        Tento dokument je <strong>informace podle čl. 13 GDPR</strong>, ne
        souhlas. Bereš ho na vědomí — neodsouhlasuješ ho. Souhlas řešíme zvlášť
        a jen u toho, co je opravdu dobrovolné navíc.
      </p>

      <h2>1. Správce údajů</h2>
      <ul>
        <li>
          <strong>Správce:</strong>{' '}
          <mark className={s.dopisat}>[DOPLNIT: název]</mark> z.&nbsp;s., IČO{' '}
          <mark className={s.dopisat}>[DOPLNIT: IČO]</mark>, sídlo{' '}
          <mark className={s.dopisat}>[DOPLNIT: sídlo]</mark>, spolkový
          rejstřík{' '}
          <mark className={s.dopisat}>[DOPLNIT: soud, sp. zn.]</mark>.
        </li>
        <li>
          <strong>Kontakt pro žádosti:</strong>{' '}
          <mark className={s.dopisat}>[DOPLNIT: e-mail]</mark> (viz{' '}
          <a href="/kontakt">Kontakt</a>).
        </li>
        <li>
          <strong>Pověřenec (DPO):</strong>{' '}
          <mark className={s.dopisat}>[DOPLNIT: jméno, nebo „není jmenován“]</mark>
          .
        </li>
      </ul>

      <h2>2. Účely a právní základy</h2>
      <p>
        Právní základ vybíráme podle účelu. Provozní zpracování běží na základě
        smlouvy nebo oprávněného zájmu; souhlas jen tam, kde jde o dobrovolnou
        funkci navíc. Souhlas nikdy není podmínkou používání služby (čl. 7/4).
      </p>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Účel</th>
              <th>Právní základ</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Registrace a přihlášení</td><td>Plnění smlouvy (čl. 6/1/b)</td></tr>
            <tr><td>Bezpečnost, zálohy, prevence zneužití</td><td>Oprávněný zájem (čl. 6/1/f)</td></tr>
            <tr><td>Moderace a řešení stížností</td><td>Oprávněný zájem, příp. právní povinnost</td></tr>
            <tr><td>Veřejný profil (avatar, bio, odkazy)</td><td>Smlouva / oprávněný zájem</td></tr>
            <tr><td>AI asistence (prompty do LLM)</td><td>Smlouva + souhlas u citlivého obsahu</td></tr>
            <tr><td>Foto-dokumentace akce (kronika)</td><td>Oprávněný zájem (+ právo námitky)</td></tr>
            <tr><td>Foto pro marketing a sociální sítě</td><td>Souhlas (čl. 6/1/a)</td></tr>
            <tr><td>Newsletter a marketingová sdělení</td><td>Souhlas (čl. 6/1/a)</td></tr>
            <tr><td>Platby a dobrovolná podpora</td><td>Smlouva + právní povinnost (doklady)</td></tr>
            <tr><td>Nezbytná funkční analytika</td><td>Oprávněný zájem (agregovaně)</td></tr>
            {/* Spec 26.6 — telemetrie Vypravěče (rozhodnutí 7): poctivě vč. userId */}
            <tr><td>Průvodce Vypravěč — měření aktivace (události onboardingu vázané na účet, bez identifikátorů tvých světů či stránek; hledané dotazy zkrácené na 200 znaků; automatický výmaz po 90 dnech a při smazání účtu)</td><td>Oprávněný zájem (zlepšování prvních kroků)</td></tr>
            <tr><td>Marketingové cookies / cross-site analytika</td><td>Souhlas (cookie lišta)</td></tr>
          </tbody>
        </table>
      </div>

      <h2>3. Jaké údaje zpracováváme</h2>
      <p>
        Osobním údajem je i IP adresa, log přihlášení, push token a
        identifikátor zařízení.
      </p>
      <ul>
        <li><strong>Účet a přihlášení</strong> — e-mail, přezdívka, hash hesla, 2FA secret, IP, identifikátor zařízení, push token.</li>
        <li><strong>Profil</strong> — avatar, bio, odkazy, preference, přátelé, nastavení viditelnosti.</li>
        <li><strong>Obsah světů</strong> (kroniky, deníky, mapy, postavy) — texty a média; osobní údaj, pokud popisují reálnou osobu.</li>
        <li><strong>Diskuse a fóra</strong> — příspěvky, zmínky, IP autora.</li>
        <li><strong>Soukromé zprávy</strong> — obsah a metadata (kdo–komu–kdy).</li>
        <li><strong>Hlášení a reporty</strong> — identita oznamovatele i nahlášeného, důkazy, snímky.</li>
        <li><strong>Moderace</strong> — poznámky, historie zásahů, sankce, odůvodnění.</li>
        <li><strong>AI prompty a výstupy</strong> — texty, které mohou nést osobní údaje.</li>
        <li><strong>Foto a video z akcí</strong> — podoba osob, metadata souboru.</li>
        <li><strong>Komunitní knihovny</strong> — autoři, historie úprav, atribuce.</li>
        <li><strong>Newsletter a marketing</strong> — e-mail, jméno, historie interakcí.</li>
        <li><strong>Platby a podpora</strong> — jméno, e-mail, částka, doklad (kartová data drží brána).</li>
        <li><strong>Logy a bezpečnost</strong> — IP, časové značky, bezpečnostní události.</li>
      </ul>
      <p>
        <strong>Zvláštní kategorie (čl. 9)</strong> — aktivně je nesbíráme, ale
        uživatel je může sám vložit do textů. Podmínky zakazují vkládat citlivé
        údaje třetích osob, u volných polí varujeme a AI je minimalizuje. U
        dětských účtů dvojnásob.
      </p>

      <h2>4. Komu údaje předáváme (zpracovatelé)</h2>
      <p>
        S každým zpracovatelem, který sáhne na osobní údaje, máme smlouvu o
        zpracování (čl. 28). Přístup uvnitř mají jen role moderace a správy, s
        auditní stopou. Orgánům veřejné moci jen na základě zákona.
      </p>
      <ul>
        <li><strong>Hosting / servery</strong> — <mark className={s.dopisat}>[DOPLNIT: poskytovatel]</mark> (účty, obsah, logy, zálohy).</li>
        <li><strong>E-mail / SMTP</strong> — <mark className={s.dopisat}>[DOPLNIT: poskytovatel]</mark> (transakční e-maily).</li>
        <li><strong>Push notifikace</strong> — FCM (Firebase) / APNs (push token, obsah upozornění).</li>
        <li><strong>Úložiště souborů</strong> — Cloudinary (avatary, přílohy, mapy, obrázky).</li>
        <li><strong>Ochrana proti robotům</strong> — Cloudflare Turnstile (technická data ověření).</li>
        <li><strong>Vyhledávání</strong> — MeiliSearch (indexovaný obsah dle oprávnění).</li>
        <li><strong>AI / LLM</strong> — <mark className={s.dopisat}>[DOPLNIT: poskytovatel]</mark> (prompty; smluvně zákaz tréninku na našich datech).</li>
        <li><strong>Platební brána</strong> — <mark className={s.dopisat}>[DOPLNIT: pokud nasazena]</mark>.</li>
        <li><strong>Sledování chyb</strong> — <mark className={s.dopisat}>[DOPLNIT: pokud nasazeno]</mark>.</li>
      </ul>

      <h2>5. Předání mimo EU</h2>
      <p>
        Preferujeme <strong>EU regiony</strong>. Kde služba zpracovává v USA
        (typicky SMTP, push, AI/LLM), stojí předání na EU-US Data Privacy
        Framework (čl. 45), nebo na standardních smluvních doložkách (SCC, čl.
        46) s posouzením dopadu a doplňkovými opatřeními (šifrování,
        minimalizace).{' '}
        <mark className={s.dopisat}>
          [DOPLNIT: u každé nasazené služby konkrétní mechanismus DPF/SCC]
        </mark>
      </p>

      <h2>6. Jak dlouho údaje držíme</h2>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Kategorie</th>
              <th>Retence</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Aktivní účet a obsah</td><td>Po dobu trvání účtu</td></tr>
            <tr><td>Smazaný účet</td><td>30denní ochranná lhůta, pak anonymizace</td></tr>
            <tr><td>Push token</td><td>Do odhlášení zařízení</td></tr>
            <tr><td>Provozní a bezpečnostní logy</td><td>Dny až měsíce dle typu</td></tr>
            <tr><td>Hlášení a moderační spisy</td><td>Přiměřeně účelu, pak výmaz</td></tr>
            <tr><td>Soukromé zprávy</td><td>Do smazání účastníkem / zániku účtu</td></tr>
            <tr><td>Doklady o platbách</td><td>Zákonná archivační lhůta</td></tr>
            <tr><td>Zálohy</td><td>Rotační cyklus (data doběhnou)</td></tr>
          </tbody>
        </table>
      </div>

      <h2>7. Tvá práva</h2>
      <p>
        Žádost vyřídíme bez zbytečného odkladu, nejpozději do 1 měsíce (u
        složitých případů +2 měsíce s vyrozuměním). Zpravidla bezplatně.
      </p>
      <ul>
        <li><strong>Přístup (čl. 15)</strong> — přehled dat v profilu + strojový export účtu.</li>
        <li><strong>Oprava (čl. 16)</strong> — editace profilu a vlastního obsahu.</li>
        <li><strong>Výmaz (čl. 17)</strong> — smazání účtu z profilu; atribuce v týmových světech se anonymizuje. Právo má zákonné výjimky.</li>
        <li><strong>Omezení (čl. 18)</strong> — dočasné „zmrazení“ účtu/obsahu.</li>
        <li><strong>Přenositelnost (čl. 20)</strong> — strukturovaný export dat, která jsi poskytl.</li>
        <li><strong>Námitka (čl. 21)</strong> — proti zpracování z oprávněného zájmu; proti přímému marketingu bezvýjimečně.</li>
        <li><strong>Odvolání souhlasu (čl. 7/3)</strong> — přepínač u každé souhlasové funkce; působí do budoucna.</li>
      </ul>
      <p>
        Většinu vyřešíš přímo v aplikaci (export a smazání účtu, editace
        profilu, přepínače soukromí). Pro ostatní žádosti napiš na{' '}
        <a href="/kontakt">kontakt</a>.
      </p>

      <h2>8. Nezletilí</h2>
      <p>
        Věk pro samostatný souhlas se zpracováním údajů je v ČR{' '}
        <strong>15 let</strong> (§ 7 z. č. 110/2019 Sb.). Mladší smí službu
        užívat se souhlasem a pod dohledem zákonného zástupce, nebo v
        institucionálním režimu (kroužky, školy), kde účty spravuje odpovědná
        organizace.
      </p>
      <p>
        U dětských a institucionálních účtů je <strong>bezpečný výchozí
        režim</strong>: vypnutý veřejný profil, veřejné sdílení i přímé zprávy
        mimo skupinu; obsah dětí je neveřejný a nezveřejňuje se adresa, škola
        ani věk. Foto dětí pro promo jen se souhlasem zákonného zástupce.
      </p>

      <h2>9. Kontakt a stížnost</h2>
      <p>
        Dotazy a žádosti k osobním údajům:{' '}
        <mark className={s.dopisat}>[DOPLNIT: e-mail]</mark> (viz{' '}
        <a href="/kontakt">Kontakt</a>). Máš právo podat stížnost u dozorového
        úřadu: <strong>Úřad pro ochranu osobních údajů</strong>, Pplk. Sochora
        27, 170 00 Praha 7,{' '}
        <a href="https://uoou.gov.cz" target="_blank" rel="noreferrer">
          uoou.gov.cz
        </a>
        . Porušení zabezpečení ohlašujeme úřadu do 72 hodin (čl. 33).
      </p>

      <p className={s.footer}>
        <small>
          Verze zásad: 1.0 — pracovní verze, právní revize plánována po beta.
        </small>
      </p>
    </article>
  );
}
