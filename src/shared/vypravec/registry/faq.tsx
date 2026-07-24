/**
 * D-080a (07-migrace-napovedy §3) — FAQ HelpPage jako data v registru Vypravěče.
 * Obsah přesunut 1:1 z `HelpPage/sections/FaqSection.tsx` (39 položek, 4 kategorie);
 * FaqSection z něj jen renderuje (akordeony `faq-<kategorie>`). Odpovědi zůstávají
 * JSX — konverze na md/blocks až při rozřezu kapitol (07 §7.3).
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Kategorie FAQ — mapují se na akordeony HelpPage s id `faq-<kategorie>`. */
export type FaqKategorie = 'ucet' | 'komunita' | 'svet' | 'obecne';

export interface FaqPolozka {
  cat: FaqKategorie;
  q: string;
  a: ReactNode;
}

export const FAQ_POLOZKY: FaqPolozka[] = [
  {
    cat: 'obecne',
    q: 'Kde najdu nápovědu přímo ve světě?',
    a: (
      <>
        <p>
          Nemusíš chodit sem — pomoc je i <strong>přímo v kontextu</strong>:
        </p>
        <ul>
          <li>
            <strong>Vypravěč</strong> — avatar průvodce vpravo dole (nebo
            Shift+V). Ví, kde stojíš, nabízí témata k místu, hledání, cesty
            pro nováčky i novinky. Ve světech tě vede Joe, na taktické mapě
            velí Měďák.
          </li>
          <li>
            Na <strong>úvodní straně světa</strong> je panel{' '}
            <strong>„Co máš po ruce"</strong> — rozcestník nástrojů; klik na dlaždici
            tě vezme rovnou tam.
          </li>
          <li>
            V <strong>taktické mapě</strong> a v <strong>chatu</strong> je tlačítko{' '}
            <strong>„?"</strong> — otevře stručný tahák k ovládání.
          </li>
        </ul>
        <p>
          Co vidíš, se řídí tvou rolí ve světě (PJ má víc nástrojů než hráč). Tahle
          stránka zůstává úplným přehledem.
        </p>
      </>
    ),
  },
  {
    cat: 'obecne',
    q: 'Co najdu na úvodní stránce po přihlášení?',
    a: (
      <>
        <p>Úvodní stránka <Link to="/">/</Link> ukazuje uvítací kartu, nejbližší platformové <strong>Akce</strong> (po přihlášení) a poslední <strong>Novinky</strong>. <strong>Moje světy</strong> a herní akce napříč světy nenajdeš tady, ale ve svém <Link to="/ikaros/profil">profilu</Link> a v pravém panelu.</p>
      </>
    ),
  },
  {
    cat: 'ucet',
    q: 'Jak si změním přezdívku?',
    a: (
      <>
        <p>
          Otevři <Link to="/ikaros/profil">Profil</Link> → sekce <strong>Bezpečnost</strong>{' '}
          → „Požádat o změnu přezdívky". Zadáš novou variantu a administrátor ji schválí.
        </p>
        <p>Po úspěšné změně platí <strong>cooldown 30 dní</strong>.</p>
      </>
    ),
  },
  {
    cat: 'ucet',
    q: 'Co dělat, když jsem zapomněl heslo?',
    a: (
      <>
        <p>
          V přihlašovacím dialogu klikni na <strong>„Zapomněl/a jsi heslo?"</strong>.
          Zadáš e-mail a přijde ti odkaz na nové heslo (platí 1 hodinu, na jedno použití).
        </p>
        <p>
          Po resetu se musíš znovu přihlásit. Pokud měl účet naplánované smazání, reset
          ho zruší a účet obnoví.
        </p>
      </>
    ),
  },
  {
    cat: 'ucet',
    q: 'Jak si změním e-mail?',
    a: (
      <>
        <p>
          V <Link to="/ikaros/profil">Profilu</Link> → hlavička je vedle e-mailu
          tlačítko <strong>Změnit</strong>. Zadáš novou adresu a aktuální heslo, na
          nový e-mail přijde potvrzovací odkaz (platí 1 hodinu). Na původní adresu
          dorazí informativní e-mail.
        </p>
        <p>Odznak <strong>✓ Ověřeno / ⚠ Neověřeno</strong> ukazuje stav; „Poslat znovu" max 3× za 15 min.</p>
      </>
    ),
  },
  {
    cat: 'ucet',
    q: 'Jak smažu účet?',
    a: (
      <>
        <p><Link to="/ikaros/profil">Profil</Link> → sekce <strong>Účet</strong> → „Smazat účet". Potvrdíš opsáním přezdívky.</p>
        <p>
          Účet jde do 30denního hold režimu (mezitím lze reaktivovat přihlášením). Po
          30 dnech proběhne anonymizace. Pokud jsi jediný PJ světa s Pomocným PJ, ten
          se automaticky povýší.
        </p>
      </>
    ),
  },
  {
    cat: 'ucet',
    q: 'Jak si stáhnu svoje data (a proč)?',
    a: (
      <>
        <p>
          V <Link to="/ikaros/profil">Profilu</Link> → sekce <strong>Účet</strong>{' '}
          je tlačítko <strong>„Stáhnout moje data (JSON)"</strong>. Vytvoří soubor s
          tvými údaji (profil, členství ve světech, přátelství a další záznamy) —
          máš na to právo (přístup a přenositelnost dat).
        </p>
        <p>Nabídneme ti stažení i <strong>před smazáním účtu</strong>.</p>
      </>
    ),
  },
  {
    cat: 'ucet',
    q: 'Kolik mi musí být let?',
    a: (
      <>
        <p>
          Platforma je určena hráčům <strong>od 15 let</strong>. Při registraci
          vybíráš jen, jestli ti je <strong>15 a víc, nebo méně</strong> — přesné
          datum nechceme.
        </p>
        <p>
          Když je ti <strong>méně než 15</strong>, registrace se{' '}
          <strong>nedokončí</strong> — mrkni k nám později! Dříve založené účty
          mladších uživatelů zůstávají v režimu ochrany (neveřejný profil, skrytí
          v adresáři). Víc v <Link to="/soukromi">Zásadách ochrany osobních údajů</Link>.
        </p>
      </>
    ),
  },
  {
    cat: 'ucet',
    q: 'Co je tombstone?',
    a: (
      <p>
        Vizuální stav smazaného účtu: <strong>černá diagonální páska</strong> přes
        avatar a šedá maska „Smazaný účet". Obsah (chat, články) zůstává v komunitě,
        ale identita autora je nevratně skryta.
      </p>
    ),
  },
  {
    cat: 'ucet',
    q: 'Jak dlouho zůstanu přihlášený?',
    a: (
      <p>
        Dokud platformu používáš, zůstáváš přihlášený automaticky — přihlášení se
        prodlužuje s každou aktivitou. Odhlásí tě až po <strong>3 dnech bez
        použití</strong>. Když ti přihlášení vyprší a otevřeš stránku jen pro
        přihlášené, místo chyby uvidíš výzvu <strong>„Nejdřív se přihlas"</strong>;
        po přihlášení tě to vrátí přesně tam, kam jsi mířil.
      </p>
    ),
  },
  {
    cat: 'komunita',
    q: 'Co je „Zpracovat" v adresáři uživatelů?',
    a: (
      <>
        <p>Univerzální fronta akcí, které vyžadují tvé rozhodnutí — dnes obsahuje:</p>
        <ul>
          <li>žádosti o přátelství</li>
          <li>žádosti o změnu přezdívky (jen Admin/Superadmin)</li>
          <li>žádosti o vstup do uzavřeného světa (pro PJ světa)</li>
          <li>články / obrázky / diskuze čekající na schválení (pro příslušné správce)</li>
          <li>
            nahlášený obsah k moderaci a odvolání proti rozhodnutí (pro správce
            článků/galerie/diskuzí a adminy)
          </li>
        </ul>
        <p>Číslo u záložky „Zpracovat" ukazuje počet čekajících položek.</p>
      </>
    ),
  },
  {
    cat: 'komunita',
    q: 'Jak si přidám přítele?',
    a: (
      <>
        <p>
          Otevři jeho <strong>veřejný profil</strong> (klik na kartu v adresáři nebo
          na hráče na stránce Hráči světa) a stiskni <strong>„Přidat do přátel"</strong>.
          Druhá strana žádost najde v tabu <strong>Zpracovat</strong>.
        </p>
        <p>Při odmítnutí pošleš novou žádost až za 7 dní (anti-spam).</p>
      </>
    ),
  },
  {
    cat: 'komunita',
    q: 'Jak někoho zablokovat?',
    a: (
      <>
        <p>Ve veřejném profilu klikni na <strong>„…"</strong> → <strong>„Blokovat uživatele"</strong>. Pak:</p>
        <ul>
          <li>Existující přátelství zmizí a pending žádost se zruší.</li>
          <li>Nepošlete si novou žádost, dokud blok neukončíš.</li>
          <li>Druhá strana nedostane žádné upozornění (anti-stalk).</li>
        </ul>
        <p>Zablokované najdeš v tabu <strong>Přátelé</strong> → sekce „Zablokovaní".</p>
      </>
    ),
  },
  {
    cat: 'komunita',
    q: 'Jak nahlásím nevhodný obsah a co se stane potom?',
    a: (
      <>
        <p>
          U cizího obsahu — článku, obrázku, profilu, náboru, příspěvku v diskuzi,
          stránky světa, novinky, přijaté zprávy i zprávy v chatu — je tlačítko{' '}
          <strong>„Nahlásit"</strong> (vlajka). Vybereš <strong>kategorii</strong>{' '}
          (autorská práva, osobní údaje, obtěžování, ohrožení nezletilých, nezákonný
          obsah, spam, jiné), popíšeš <strong>důvod</strong> a odešleš. Můžeš{' '}
          <strong>nahlásit anonymně</strong> (moderátor tvé jméno neuvidí).
        </p>
        <p>
          Hlášení dostane <strong>moderátor</strong> a rozhodne — od „bez zásahu"
          přes upozornění a skrytí až po odstranění obsahu. Dostaneš{' '}
          <strong>potvrzení</strong> a případně i výsledek; stav najdeš v{' '}
          <Link to="/ikaros/profil">Profilu</Link> → <strong>Moderace</strong>. Když
          někdo nahlásí <em>tvůj</em> obsah a moderátor zasáhne, uvidíš tam
          odůvodnění a můžeš se <strong>odvolat</strong> (posoudí to jiný moderátor).
        </p>
      </>
    ),
  },
  {
    cat: 'komunita',
    q: 'Jak označím, že je obrázek vytvořený AI?',
    a: (
      <>
        <p>
          Při <strong>nahrávání do galerie</strong> zaškrtni volbu{' '}
          <strong>„Tento obrázek je vytvořený AI"</strong>. U obrázku (na kartě i v
          detailu) se pak ukáže malý štítek <strong>„AI"</strong>, aby ostatní
          věděli, čím vznikl.
        </p>
        <p>
          Nahrát navíc jde jen po <strong>potvrzení</strong>, že máš k obsahu práva
          a neobsahuje cizí chráněný materiál bez licence.
        </p>
      </>
    ),
  },
  {
    cat: 'komunita',
    q: 'Jak funguje Pošta a kdo mi může psát?',
    a: (
      <>
        <p>
          <strong>Pošta</strong> (ikona v hlavičce) jsou soukromé zprávy. Složky
          Doručené / Odeslané, zpráva se čte jako vlákno a jde Odpovědět; odznak
          ukazuje nepřečtené.
        </p>
        <p>
          Novou napíšeš komukoli (našeptávač podle přezdívky nebo „Napsat zprávu" z
          osobní karty). Pokud máš v Soukromí zapnuté <strong>„Jen pro přátele"</strong>,
          první ti napíše jen přítel (a administrátor).
        </p>
      </>
    ),
  },
  {
    cat: 'komunita',
    q: 'K čemu je zvonek v hlavičce (notifikační centrum)?',
    a: (
      <>
        <p>
          <strong>Zvonek</strong> otevře souhrn chatů ze <strong>všech tvých světů</strong>{' '}
          (jen z kanálů, kam máš přístup). Odznak ukazuje, kolik nového přibylo.
          Kliknutím na zprávu se dostaneš přímo do dané konverzace na ten příspěvek.
        </p>
        <p>
          Záložka <strong>Události</strong> = co se týká přímo tebe (schválený vstup,
          článek, přiřazená postava); pro schvalovatele přibude <strong>Ke zpracování</strong>.
          Dole jde zapnout systémová upozornění na zařízení a v sekci „Tvá zařízení"
          spravovat (odhlásit) svá ostatní přihlášená zařízení.
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Můžou se na můj svět podívat lidé bez účtu?',
    a: (
      <>
        <p>
          Ano — když PJ v <strong>Nastavení světa → Přístup</strong> zapne{' '}
          <strong>Veřejné nahlížení (výkladní skříň)</strong>. Nepřihlášený
          návštěvník pak vidí novinky, stránky, postavy, mapy, bestiář a pravidla —
          přesně to, co člen v roli <strong>Čtenář</strong> — a nemůže nic měnit.
          Chat, taktická mapa a herní nástroje zůstávají jen pro členy, utajené
          stránky zůstávají skryté.
        </p>
        <p>
          Ve výchozím stavu je nahlížení <strong>vypnuté</strong>: bez něj vidí
          nečlen jen vizitku světa s tlačítkem Vstoupit / Požádat. Funguje jen u
          veřejných světů a jde kdykoli vypnout.
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Můžu sdílet svou bojovou scénu ostatním PJ (a použít cizí)?',
    a: (
      <>
        <p>
          Ano. Na taktické mapě otevři <strong>Knihovnu map</strong> a u své
          uložené šablony klikni <strong>Publikovat</strong> — scéna se po
          schválení kurátorem objeví v katalogu <strong>Společná tvorba → Scény</strong>.
          Vybereš, jestli si ji ostatní smí jen prohlížet, nebo i naklonovat.
        </p>
        <p>
          Z katalogu si naopak cizí scénu <strong>naklonuješ do svého světa</strong>{' '}
          (kde jsi Pán jeskyně) — vznikne nová scéna na taktické mapě i s pozadím,
          NPC a mlhou. Kvůli soukromí se <strong>nepřenášejí hráčské postavy ani
          zvuky</strong>.
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Jak připravím scénu, aby ji hráči zatím neviděli nebo nehýbali tokeny?',
    a: (
      <>
        <p>V panelu <strong>„⚙ Orchestrace"</strong> → sekce <strong>„Přístup a viditelnost"</strong> má každá scéna dva přepínače:</p>
        <ul>
          <li><strong>👁 / 🚫 skrýt mapu</strong> — hráč uvidí „Mapa skrytá".</li>
          <li><strong>🔓 / 🔒 zamknout pohyb</strong> — hráč mapu vidí, ale nehýbe tokeny.</li>
        </ul>
        <p>
          „👁 vše" / „🔒 vše" přepnou všechny najednou; per-hráč nastavení přebíjí
          scénu. Jednotlivý token zamkneš přes jeho info panel → „🔓 Zamknout".
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Kde si na taktické mapě vedu poznámky (deník)?',
    a: (
      <>
        <p>Na taktické mapě je pod panelem počasí tlačítko poznámkového bloku; obsah se průběžně ukládá.</p>
        <ul>
          <li><strong>PJ</strong> má <strong>Deník PJ</strong> — poznámky pro celý svět, soukromé per PJ (i z menu Hra → Deník PJ).</li>
          <li><strong>Hráč</strong> otevře <strong>Poznámky své postavy</strong> (najdeš je i na stránce postavy v tabu Poznámky).</li>
        </ul>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Co jsou zamčené (AKJ) záložky na stránce a co znamená zámek?',
    a: (
      <>
        <p>
          Stránka (postava, lokace, NPC…) může mít vedle běžných záložek i{' '}
          <strong>chráněné záložky</strong>. Záložku se stupněm utajení (AKJ) vidíš
          v liště, i když k ní zatím nemáš přístup — má <strong>zavřený zámek 🔒</strong>{' '}
          a klik ukáže jen „zašifrováno" a potřebnou úroveň, ne obsah.
        </p>
        <p>
          Jakmile ti PJ přístup dá (zvedne ti úroveň utajení, nebo tě přidá
          jmenovitě), zámek se <strong>odemkne 🔓</strong> a uvidíš celý obsah —
          text, obrázek i vše ostatní.
        </p>
        <p>
          U <strong>vlastní postavy</strong> své chráněné záložky vidíš automaticky
          — PJ ti tam nechá soukromý vzkaz. Nová postava proto rovnou dostane
          záložku „Soukromé".
        </p>
        <p>
          U některých svých záložek ti PJ může navíc povolit i{' '}
          <strong>úpravu obsahu</strong>. Pak na té záložce uvidíš tlačítko{' '}
          <strong>„Upravit záložku"</strong> a můžeš si sám měnit text, obrázek i
          údaje. Záložka „Soukromé" to má zapnuté rovnou. Kdo záložku vidí a jak
          se jmenuje, nastavuje dál jen PJ.
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Co všechno si můžu vytisknout nebo uložit jako PDF?',
    a: (
      <>
        <p>
          Skoro všechno, co ve světě vidíš — hledej tlačítko{' '}
          <strong>tiskárny 🖨 / „Tisk / PDF"</strong>:
        </p>
        <ul>
          <li>
            <strong>stránku</strong> (ikona v hlavičce), <strong>deník</strong> a{' '}
            <strong>záložky postavy/NPC</strong> (kalendář volitelně zaškrtneš),
          </li>
          <li>
            <strong>kalendář</strong> (vybereš rozsah 1–12 měsíců),{' '}
            <strong>bestiář</strong>, <strong>obchod</strong> (ceník),
          </li>
          <li>
            <strong>mapy</strong> (atlas), <strong>hvězdnou mapu</strong> (seznam
            těles), <strong>pavučinu</strong> vztahů a <strong>scénář</strong>.
          </li>
        </ul>
        <p>
          Otevře se dialog prohlížeče — buď <strong>vytiskneš</strong>, nebo zvolíš{' '}
          <strong>„Uložit jako PDF"</strong>. Vytiskne se jen samotný obsah (bez menu),
          sbalené sekce i odemčené chráněné záložky se <strong>rozbalí</strong>, a vždy
          jen to, co <strong>sám vidíš</strong>.
        </p>
        <p>
          <strong>PJ</strong> navíc může v <strong>Nastavení světa → Export / Záloha</strong>{' '}
          stáhnout <strong>celý svět</strong> jedním tlačítkem — ZIP se všemi daty
          (stránky, postavy, kampaň…) i <strong>staženými obrázky</strong>, chat
          volitelně. 🚧 Obnova ze zálohy zpět (import) se připravuje.
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Jak nastavím, co je vidět na hlavním obrázku stránky nebo postavy?',
    a: (
      <>
        <p>
          V <strong>editoru stránky</strong> (Pomocný PJ a výš) klikni přímo do
          Hlavního obrázku tam, kde má být <strong>střed výřezu</strong>. Pod
          obrázkem nastavíš <strong>přiblížení</strong> a režim <strong>Vyplnit</strong>{' '}
          / <strong>Vidět celý</strong>.
        </p>
        <p>Funguje to stejně u akcí i avataru postavy.</p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Smazal jsem svět (nebo ho chci zpět) — jde to vrátit?',
    a: (
      <>
        <p>
          Ano. Smazání světa je <strong>vratné po dobu 30 dní</strong>. Svět zmizí
          z provozu, ale všechna data (stránky, postavy, chat, mapy) zůstanou
          uložená.
        </p>
        <p>
          Obnovit svět může <strong>jen administrátor</strong> (v Administraci →
          Smazané světy). Pokud jsi svět smazal omylem nebo ho chceš převzít,
          <strong> napiš administrátorovi</strong> co nejdřív — po 30 dnech se svět
          i s daty smaže natrvalo a vrátit už nepůjde.
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Má svět vlastní vzhled a můžu si ho upravit?',
    a: (
      <>
        <p>
          Každý svět má <strong>vlastní vzhled</strong> nezávislý na platformě —
          určuje ho <strong>PJ</strong> v Nastavení světa; tento vzhled vidí všichni členové.
        </p>
        <p>
          Sobě si můžeš doladit barvy/jas/kontrast v Nastavení světa → tab{' '}
          <strong>„Můj vzhled"</strong>; vzhled platformy obdobně v{' '}
          <Link to="/ikaros/profil">Profilu</Link> → Doladění vzhledu.
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Jak funguje hudba a zvuky?',
    a: (
      <>
        <p>
          Každý svět má <strong>Zvukovou databázi</strong> (menu Hra → Zvuky) —
          knihovnu hudby z YouTube. Přehrát může každý člen, spravovat PJ.
        </p>
        <p>
          PJ pustí zvuk všem na <strong>taktické mapě</strong> (ambient scény) nebo v{' '}
          <strong>chatu</strong> (🎵). Při prvním cizím zvuku tě prohlížeč vyzve
          kliknout „Aktivovat zvuk".
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Co znamenají kostky k6+ a 2k6+ (nafukovací / otevřený hod)?',
    a: (
      <>
        <p>
          Některé systémy mají <strong>eskalující</strong> kostky — když padne
          extrém, házíš dál a výsledek se mění:
        </p>
        <ul>
          <li>
            <strong>k6+</strong> (nafukovací k6, Dračí Doupě 1.6): hodíš k6, a{' '}
            <strong>padne-li 6</strong>, házíš znovu a <strong>přičteš</strong> i
            další hod — dokud padají šestky. Výsledek tak může povyletět vysoko
            (jen nahoru).
          </li>
          <li>
            <strong>2k6+</strong> (otevřený hod, Dračí Doupě Plus): hodíš 2k6.
            Padne-li <strong>2× šestka</strong>, házíš dál po jedné kostce a za
            každou 4/5/6 přidáš <strong>+1</strong> (dokud nepadne 1/2/3).
            Padne-li <strong>2× jednička</strong>, je to naopak — za každou 1/2/3
            ubereš <strong>−1</strong> (dokud nepadne 4/5/6), takže výsledek může
            spadnout i <strong>do záporu</strong>. Jakýkoli jiný úvodní hod =
            prostý součet.
          </li>
        </ul>
        <p>
          Kde je najdeš: v <strong>🎲 výběru kostky</strong> (chat i taktická
          mapa), pokud je PJ světu povolil. PJ je zapíná při zakládání nebo v
          Nastavení světa; u Dračího Doupěte 1.6 a Plus je nabízíme rovnou.
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Jak fungují hody v Shadowrunu (hromada k6, úspěchy)?',
    a: (
      <>
        <p>
          Shadowrun používá <strong>úspěchový hod</strong> (success pool) — místo
          jedné kostky a překonání cílového čísla házíš <strong>hromadu k6</strong>:
        </p>
        <ul>
          <li>
            Číslo u dovednosti nebo útoku (např. <strong>9 k6</strong>) = kolik
            kostek hodíš.
          </li>
          <li>
            Každá kostka, co padne <strong>5 nebo 6</strong>, je jeden{' '}
            <strong>úspěch</strong>. Ostatní (1–4) se zahodí. Výsledek hodu = počet
            úspěchů.
          </li>
          <li>
            Kolik úspěchů potřebuješ, určuje <strong>PJ</strong> podle obtížnosti
            akce — proto se „cíl" neukládá do statbloku.
          </li>
          <li>
            <strong>Glitch</strong> (komplikace) = víc než polovina kostek padne na{' '}
            <strong>1</strong>; <strong>kritický glitch</strong> = glitch a zároveň
            žádný úspěch.
          </li>
        </ul>
        <p>
          Na taktické mapě i v chatu klikni na <strong>atribut, dovednost nebo
          útok</strong> ve statbaru postavy/tvora — hod proběhne a v záznamu kostek
          uvidíš počet úspěchů (a případný glitch). <strong>Iniciativa</strong> je
          výjimka: Reakce + Intuice + 1k6 (prostý součet, ne úspěchy).
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Jak se hází v Dračí Hlídce (útok, obrana, dovednosti)?',
    a: (
      <>
        <p>
          Dračí Hlídka je <strong>součtový</strong> systém — házíš kostkou a přičítáš{' '}
          <strong>opravu atributu</strong> (⌊stupeň/2⌋ − 5). Kostka se liší podle akce:
        </p>
        <ul>
          <li>
            <strong>Útok a obrana</strong>: <strong>nafukovací k6</strong> (padne-li 6,
            házíš dál a přičítáš — viz otázka o k6+ výše). Útok = útočnost zbraně +{' '}
            <strong>Síla</strong> (na blízko) / <strong>Obratnost</strong> (na dálku) + k6+;
            obrana = obrana zbraně + Obratnost + k6+.
          </li>
          <li>
            <strong>Dovednost</strong>: <strong>k10</strong> + oprava atributu + stupeň
            výcviku (deník i panel ukazují rozklad, např. „Sil +3 · výcvik +3").
          </li>
          <li>
            <strong>Iniciativa</strong>: oprava Obratnosti + k6 (obyčejná, nenafukuje).
          </li>
        </ul>
        <p>
          V deníku a chatu vidíš u zbraně <strong>jen čísla</strong> (útočnost / zranění /
          obrana); <strong>vlastnost se přičte až při hodu</strong>. Na taktické mapě i v
          chatu klikni na atribut, dovednost nebo zbraň ve statbaru — v záznamu kostek
          uvidíš rozpis „útoč + vlastnost + hod = výsledek / zranění".
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Jak fungují hody v GURPS (3k6 „pod cíl", úspěch a rozdíl)?',
    a: (
      <>
        <p>
          GURPS je <strong>opačný</strong> než součtové systémy: neházíš vysoko, ale{' '}
          <strong>nízko</strong>. Většina hodů = <strong>3k6</strong> a snažíš se hodit{' '}
          <strong>stejně nebo méně</strong> než své cílové číslo (hodnota atributu nebo
          dovednosti):
        </p>
        <ul>
          <li>
            <strong>Úspěch</strong> = součet 3k6 je ≤ cíl. <strong>Rozdíl</strong> (o kolik
            jsi to zvládl, cíl − hod) říká, jak dobře — v záznamu kostek ho vidíš.
          </li>
          <li>
            <strong>Kritický úspěch / selhání</strong> řeší pravidla GURPS automaticky
            (velmi nízké hody = kriticky výborně, 17–18 = kriticky špatně).
          </li>
          <li>
            <strong>Postihy/bonusy</strong> nastavíš v bojovém panelu (± u hodu) — přičtou
            se rovnou k cíli, takže nemusíš počítat.
          </li>
        </ul>
        <p>
          Výjimky: <strong>zranění</strong> se hází <strong>normálně vysoko</strong>{' '}
          (např. 2k6 + bonus, čím víc tím lépe) a <strong>iniciativa</strong> se nehází
          vůbec — je to tvá <strong>Základní rychlost</strong>. Na taktické mapě i v chatu
          klikni na atribut, dovednost nebo útok ve statbaru; v záznamu kostek uvidíš, zda
          hod prošel „pod cíl" a s jakým rozdílem.
        </p>
      </>
    ),
  },
  {
    cat: 'svet',
    q: 'Jak hledám stránky ve světě?',
    a: (
      <>
        <p>
          V hlavičce světa je pole <strong>„Hledat…"</strong> (nebo <strong>Ctrl+K</strong>,
          na Macu <strong>⌘ K</strong>). Jak píšeš, ukazují se nalezené stránky;
          potvrdíš klikem nebo Enter.
        </p>
        <p>Hledání prohledává <strong>jen aktuální svět</strong>. Na mobilu „Hledat ve světě" v menu.</p>
      </>
    ),
  },
  {
    cat: 'obecne',
    q: 'Když někomu pošlu odkaz na svět nebo článek, co uvidí?',
    a: (
      <>
        <p>
          Odkaz na <strong>veřejný</strong> svět, článek nebo galerii se při vložení
          do <strong>Discordu, Messengeru, WhatsAppu</strong> a podobně rozbalí do{' '}
          <strong>náhledové karty</strong> — s názvem, krátkým popisem a obrázkem
          místo holé adresy. Odkaz na <strong>neveřejný</strong> svět kartu
          nezobrazí (soukromý obsah se ven nedostane).
        </p>
        <p>
          Veřejné světy a články jsou navíc <strong>dohledatelné ve vyhledávačích</strong>{' '}
          (Google, Seznam). Přihlášená část a soukromé světy zůstávají skryté. Na
          detailu světa/článku tě nahoře vede <strong>drobečková navigace</strong>{' '}
          (např. „Domů › Světy › název").
        </p>
        <p>🚧 Tahle vrstva se právě nasazuje — naplno se projeví po spuštění.</p>
      </>
    ),
  },
  {
    cat: 'obecne',
    q: 'Co znamená Motiv (theme)?',
    a: (
      <p>
        Motiv = globální vizuální styl Ikaru (desítky variant — Modré nebe,
        Kyberpunk, Pergamen, Nemrtví, Arabský svět…). Přepínáš v přepínači motivů
        (hlavička / pravý panel); volba se ukládá k účtu.
      </p>
    ),
  },
  {
    cat: 'obecne',
    q: 'Můžu jako Admin banovat jiného Admina?',
    a: (
      <p>
        Standardně <strong>ne</strong>. Admin smí jen Hráče a PJ. K akcím proti
        jinému Adminovi potřebuješ zvláštní oprávnění od Superadmina. Banovat
        Superadmina nesmí <em>nikdo</em>.
      </p>
    ),
  },
  {
    cat: 'obecne',
    q: 'Jaký je rozdíl mezi globální a světovou rolí?',
    a: (
      <p>
        Globální role (Admin, Hráč…) platí napříč celou platformou. Světová role
        (PJ, Pomocný PJ, Hráč ve světě) platí jen v daném světě — jinde můžeš mít
        roli jinou. Detail v tabu <strong>Role &amp; oprávnění</strong>.
      </p>
    ),
  },
  {
    cat: 'obecne',
    q: 'Funguje to na mobilu?',
    a: (
      <p>
        Ano, celá platforma je responzivní. Sidebar se na mobilu skrývá do hamburger
        menu vlevo nahoře; tabulky a horní taby scrolují horizontálně.
      </p>
    ),
  },
  {
    cat: 'obecne',
    q: 'Kde najdu pravidla komunity, ochranu údajů a kontakt?',
    a: (
      <>
        <p>V <strong>patičce</strong> každé stránky (a taky odsud):</p>
        <ul>
          <li><Link to="/podminky">Podmínky použití</Link> — pravidla používání služby.</li>
          <li><Link to="/kodex">Pravidla komunity</Link> — co je a není v pořádku (nulová tolerance k obsahu ohrožujícímu nezletilé).</li>
          <li><Link to="/soukromi">Ochrana osobních údajů</Link> — co o tobě zpracováváme a jaká máš práva.</li>
          <li><Link to="/kontakt">Kontakt</Link> — kam napsat žádost nebo stížnost.</li>
        </ul>
      </>
    ),
  },
  {
    cat: 'obecne',
    q: 'Kde nahlásit chybu nebo navrhnout vylepšení?',
    a: (
      <p>
        Nejrychleji přes <strong>Vypravěče</strong>: klikni na jeho ikonu
        (vpravo dole, nebo zkratkou <strong>Shift+V</strong>) a zvol{' '}
        <strong>„Nahlásit chybu"</strong>. Stačí pár vět — kde jsi, verzi appky
        i prohlížeč přiložím sám. Funguje odkudkoli, i bez přihlášení. Kdykoli i
        e-mailem přes <Link to="/kontakt">kontaktní stránku</Link>.{' '}
        <em>(Nevhodný obsah takhle nehlas — na to je tlačítko „Nahlásit" přímo
        u obsahu.)</em>
      </p>
    ),
  },
];
