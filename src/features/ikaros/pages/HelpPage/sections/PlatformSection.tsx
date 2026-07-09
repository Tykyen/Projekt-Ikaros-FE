import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Globe2,
  Mic,
  MessageSquare,
  Mail,
  Bell,
  MessagesSquare,
  BookOpen,
  Image,
  Newspaper,
  CalendarDays,
  Star,
  User,
  Users,
  KeyRound,
  Shield,
  Smile,
  Beer,
  Smartphone,
  Dices,
  Palette,
  Flag,
  Gavel,
  Lock,
  Contact,
} from 'lucide-react';
import { HelpAccordion, HelpSubAccordion, TagChip, ScreenshotSlot, type TagKind } from '../components';

// Pomocný „nástroj" = pod-sekce s audience štítkem v hlavičce.
function Tool({
  icon,
  title,
  audience,
  accent,
  children,
}: {
  icon: ReactNode;
  title: string;
  audience: { kind: TagKind; label: string };
  accent?: 'accent' | 'player' | 'pj' | 'corrector' | 'warning' | 'success' | 'info';
  children: ReactNode;
}) {
  return (
    <HelpSubAccordion
      icon={icon}
      title={title}
      accent={accent}
      tag={<TagChip kind={audience.kind} label={audience.label} />}
    >
      {children}
    </HelpSubAccordion>
  );
}

export function PlatformSection() {
  return (
    <>
      <p>
        Nástroje platformy Ikaros — to, co máš společné napříč všemi světy. Rozbal
        si skupinu a v ní konkrétní stránku. Štítek u názvu říká, kdo ji používá.
      </p>

      {/* ── Úvod & orientace ───────────────────────────────────────────── */}
      <HelpAccordion icon={<Home size={20} />} title="Úvod & vesmíry" accent="accent" defaultOpen>
        <Tool icon={<Home size={16} />} title="Úvodník" audience={{ kind: 'vse', label: 'Všichni' }}>
          <p>
            Vstupní stránka platformy: uvítací karta + dvě sekce vedle sebe — vlevo
            nadcházející globální <strong>Akce</strong> (po přihlášení), vpravo{' '}
            <strong>Novinky</strong> platformy. Admin vidí v hlavičkách tlačítko +
            pro rychlé vytvoření akce/novinky. Akce a novinky konkrétního světa se
            sem nemíchají — ty jsou jen v daném světě.
          </p>
        </Tool>
        <Tool icon={<Globe2 size={16} />} title="Přehled vesmírů" audience={{ kind: 'vse', label: 'Všichni' }}>
          <p>
            Mřížka <strong>všech</strong> aktivních světů (katalog). Hledání podle
            názvu, filtr Vše / Veřejné / Mé světy a řazení (datum vzniku / abeceda
            / volná místa). Veřejný svět otevřeš rovnou, otevřený přes žádost o
            vstup; <strong>soukromý</strong> svět se ukazuje zamčený (🔒) — dovnitř
            jen jeho členové. Najdeš v{' '}
            <Link to="/ikaros/vesmiry">Přehledu vesmírů</Link>.
          </p>
        </Tool>
        <Tool icon={<Dices size={16} />} title="RPG systémy" audience={{ kind: 'vse', label: 'Všichni' }}>
          <p>
            Rozcestník stránek o jednotlivých herních systémech — co pro daný
            systém Ikaros umí (deníkový list, taktická mapa, kalendář, chat za
            postavu), jak začít a jak založit svět. Zatím{' '}
            <strong>Dračí Doupě 1.6</strong>, <strong>Dračí Doupě II</strong> a{' '}
            <strong>Jeskyně a Draci</strong>; další systémy přibydou. Najdeš v{' '}
            <Link to="/ikaros/systemy">RPG systémech</Link>.
          </p>
        </Tool>
        <Tool icon={<Users size={16} />} title="Nástěnka náborů (Hledá se)" audience={{ kind: 'vse', label: 'Přihlášení' }}>
          <p>
            Vývěska „<strong>hledám hru / hledám hráče</strong>" — najdeš ji
            tlačítkem <strong>„Hledá se"</strong> pod přehledem světů. Připneš si
            vlastní lístek: jako hráč <strong>hledám hru</strong> (vybereš si
            vzhled lístku z 12 motivů), jako vypravěč <strong>hledám hráče</strong>{' '}
            do svého světa (lístek převezme motiv toho světa). Nástěnku filtruješ
            podle strany, systému a toho, jestli se hraje online nebo naživo.
          </p>
          <p>
            Každý lístek vypadá <strong>podle motivu svého světa</strong> (tvar,
            písmo i barva), zatímco pozadí nástěnky se řídí <strong>tvým
            vzhledem</strong>. Když tě nějaký nábor zaujme, tlačítkem{' '}
            <strong>„Ozvat se"</strong> pošleš jeho autorovi soukromou zprávu. Svůj
            lístek můžeš kdykoli zavřít nebo smazat; nevhodné nábory řeší Správce
            diskuzí a admini. Nábor po čase sám zmizí. Najdeš v{' '}
            <Link to="/ikaros/nabory">Nástěnce náborů</Link>.
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Komunikace ─────────────────────────────────────────────────── */}
      <HelpAccordion icon={<MessageSquare size={20} />} title="Komunikace" accent="info">
        <Tool icon={<Beer size={16} />} title="Putyka (globální chat)" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="info">
          <p>
            Jedna sdílená místnost pro celou platformu napříč světy. Píšeš v reálném
            čase, vidíš přítomné a kdo píše. Nahoře volíš „Všem" (veřejně) nebo
            konkrétního uživatele (soukromý šepot). Funguje odpověď s citací, emoji
            reakce, emoty přes <code>:zkratka:</code> a přílohy (obrázky/dokumenty).
            Zprávy mizí po hodině; příchody a odchody se zapisují do chatu.
          </p>
          <ScreenshotSlot media="platforma.hospoda" />
        </Tool>
        <Tool icon={<Mic size={16} />} title="Voice krčma (hlasový chat)" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="info">
          <p>
            Hlasová místnost pro <strong>pokec na mikrofonu</strong> — mezi Putykou
            a Campy. Klikneš na <strong>„Usednout k mikrofonu"</strong> a mluvíš;
            kamera je volitelná, jde i <strong>sdílet obrazovku</strong>. Vedle
            hlasu běží textový pokec, takže píšeš i mluvíš zároveň.
          </p>
          <p>
            Tlačítkem <strong>„Otevřít v samostatném okně"</strong> vytáhneš krčmu
            do vlastního okna — třeba na druhý monitor. Voice krčma je jen pro{' '}
            <strong>přihlášené</strong> (host se do ní nedostane).
          </p>
          <p>
            Hlas a video najdeš i <strong>uvnitř světa</strong> — tlačítkem 📞
            v hlavičce světového chatu nebo na taktické mapě se připojíš k hovoru
            svého světa. Je to <strong>jeden hovor sdílený chatem i mapou</strong>,
            takže se drží, i když mezi nimi přepínáš.
          </p>
        </Tool>
        <Tool icon={<Globe2 size={16} />} title="Camp (Fantasy · Mystery · Sci-fi)" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="info">
          <p>
            Tři atmosférické roleplay místnosti — hra na jeden večer bez kostek.
            Každá má <strong>pevný žánr</strong>: Fantasy camp, Mystery camp a
            Sci-fi camp. Prostředí (jedna z 20 lokací s ilustrací na pozadí) se{' '}
            <strong>samo střídá dvakrát denně</strong> — v poledne a o půlnoci;
            navíc ji mohou kdykoli přepnout správci. Scénu <strong>neměníš</strong>{' '}
            — jen v ní hraješ.
          </p>
          <p>
            Stejné chatovací funkce jako Putyka, ale <strong>u zpráv i v seznamu
            přítomných</strong> vystupuješ jako svoje <strong>postava</strong>{' '}
            (jméno a obrázek z profilu „Postava v Campu"), ne jako účet. Kdo
            postavu nevyplnil, zobrazí se účtem. Klik na osobu otevře kartu její
            postavy.
          </p>
          <p>
            Můžeš si <strong>uložit jednu rozehranou hru</strong> 📜 — zapamatuje
            si scénu a posledních pár zpráv. Když ji později <strong>načteš</strong>{' '}
            📂, scéna se obnoví a nad chatem se ukáže blok „Tady jste skončili",
            ať víte, kde jste přestali. Uloženou hru máš jen jednu — další uložení
            tu předchozí přepíše. Zprávy jinak mizí po hodině.
          </p>
        </Tool>
        <Tool icon={<Mail size={16} />} title="Pošta" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="info">
          <p>
            Soukromé zprávy mezi uživateli. Složky Doručené / Odeslané, zpráva se
            čte jako vlákno a jde rovnou Odpovědět. Novou napíšeš tlačítkem Nová
            zpráva (příjemce našeptávačem) nebo z osobní karty uživatele. Odznak u
            ikony Pošta ukazuje nepřečtené. V profilu si můžeš zapnout „smí mi psát
            jen přátelé".
          </p>
        </Tool>
        <Tool icon={<Bell size={16} />} title="Notifikační centrum (zvonek)" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="info">
          <p>
            Zvonek v hlavičce otevře souhrn zpráv ze <strong>všech tvých světů</strong>{' '}
            na jednom místě (jen z kanálů, kam máš přístup). <strong>Klik na zprávu</strong>{' '}
            tě přenese rovnou do té konverzace a doscrolluje na ni. Záložka <strong>Události</strong>{' '}
            = co se týká přímo tebe (schválený vstup, článek, přiřazená postava),
            záložka <strong>Ke zpracování</strong> pro schvalovatele. Dole jde
            zapnout systémová upozornění na zařízení; v sekci <strong>Tvá
            zařízení</strong> vidíš všechna přihlášená zařízení a ta vzdálená
            můžeš odhlásit (aktuální se ovládá přepínačem).
          </p>
        </Tool>
        <Tool icon={<Smartphone size={16} />} title="Instalace na plochu (appka)" audience={{ kind: 'vse', label: 'Všichni' }} accent="info">
          <p>
            Ikaros si můžeš nainstalovat jako <strong>aplikaci na plochu</strong>{' '}
            telefonu i počítače — vlastní ikona, spuštění na celou obrazovku, žádný
            adresní řádek. Dole se sám nabídne pruh <strong>Nainstaluj Ikaros</strong>:
            na Androidu a počítači stačí tlačítko <strong>Nainstalovat</strong>, na
            iPhonu/iPadu (Safari) klepni na <strong>Sdílet</strong> a zvol{' '}
            <strong>Přidat na plochu</strong>. Pruh můžeš zavřít křížkem; znovu se
            ozve nejdřív za pár týdnů a po instalaci už vůbec.
          </p>
          <p>
            Na <strong>iPhonu/iPadu</strong> je instalace na plochu nutná, aby
            chodily <strong>upozornění na telefon</strong> (push) — bez ní je
            Safari neumí. Když jsi <strong>offline</strong>, appka místo chybové
            stránky prohlížeče ukáže vlastní hlášku s tlačítkem Zkusit znovu.
          </p>
        </Tool>
        <Tool icon={<MessagesSquare size={16} />} title="Diskuze" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="info">
          <p>
            Témata k rozhovoru — založ téma a veď vlákno (formátovaný text). Diskuze
            může být otevřená nebo uzamčená (pozvánky/žádosti). Příspěvky lze
            lajkovat, diskuzi přidat do oblíbených a nevhodné nahlásit. Schvaluje a
            moderuje Správce diskuzí.
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Obsah komunity ─────────────────────────────────────────────── */}
      <HelpAccordion icon={<BookOpen size={20} />} title="Obsah komunity" accent="corrector">
        <Tool icon={<Palette size={16} />} title="Společná tvorba (rozcestník)" audience={{ kind: 'vse', label: 'Všichni' }} accent="corrector">
          <p>
            Jedno tlačítko v hlavním menu, které otevře rozcestník veškeré
            komunitní tvorby. Najdeš tu dlaždice na <strong>Diskuze</strong>,{' '}
            <strong>Články</strong>, <strong>Galerii</strong> a{' '}
            <strong>Bestiář</strong> (fungují) a připravované sekce{' '}
            <strong>Herbář, Lektvary, Kouzla</strong> a <strong>Hádanky</strong> —
            ty zatím nesou štítek „Připravujeme". RPG systémy mají v menu vlastní
            tlačítko.
          </p>
        </Tool>
        <Tool icon={<BookOpen size={16} />} title="Globální bestiář" audience={{ kind: 'vse', label: 'Čtení všichni' }} accent="corrector">
          <p>
            Sdílený katalog bytostí napříč světy i herními systémy (ve „Společné
            tvorbě"). Dvě knihovny: <strong>Schválená</strong> (ověřené bytosti,
            laděné systém po systému) a <strong>Návrhy</strong> (komunitní, zatím
            neověřené — vzít lze i tak). Každá bytost je jako kniha: obrázek +
            popis, nahoře <strong>záložky s pravidly</strong> pro jednotlivé
            systémy (D&amp;D, Dračí doupě…) a dole <strong>diskuse</strong> —
            zvlášť k bytosti a zvlášť ke statům každého systému.
          </p>
          <p>
            Číst a diskutovat může každý přihlášený. Můžeš{' '}
            <strong>vytvořit</strong> novou bytost (uloží se jako návrh a rovnou
            ji máš i ve svém bestiáři), <strong>navrhnout staty</strong> pro další
            systém a <strong>vložit</strong> si bytost do svého bestiáře — do
            osobního, nebo do konkrétního světa, kde jsi Pomocný PJ nebo výš.
            Popis a obrázek se mění volně, ale <strong>staty se ladí přes
            diskusi</strong> a schvaluje je správce.
          </p>
        </Tool>
        <Tool icon={<BookOpen size={16} />} title="Články" audience={{ kind: 'vse', label: 'Čtení všichni' }} accent="corrector">
          <p>
            Literární archiv komunity. Přehled s vyhledáváním, řazením a filtrem
            kategorií; tab Moje (po přihlášení) včetně konceptů. Nový článek píšeš v
            editoru s formátováním (text se průběžně ukládá do prohlížeče). Workflow:
            koncept → odeslat ke schválení → publikováno (schvaluje Správce článků).
            Detail má hodnocení hvězdičkami a „Více od autora".
          </p>
        </Tool>
        <Tool icon={<Image size={16} />} title="Galerie" audience={{ kind: 'vse', label: 'Čtení všichni' }} accent="corrector">
          <p>
            Obrazový salon komunity — mřížka obrázků s kategoriemi, hledáním,
            řazením a prohlížečem na celou obrazovku. Nahraješ obrázek, uložíš
            koncept nebo odešleš ke schválení; po schválení (Správce galerie) ho lze
            hodnotit a přidat do oblíbených.
          </p>
          <p>
            Při nahrávání <strong>musíš potvrdit</strong>, že máš k obsahu práva a
            neobsahuje cizí chráněný materiál bez licence — bez toho nahrát nejde.
            Pokud obrázek <strong>vytvořila AI</strong>, zaškrtni to; u obrázku se
            pak ukáže malý štítek <strong>„AI"</strong>, aby ostatní věděli, čím
            vznikl.
          </p>
        </Tool>
        <Tool icon={<Newspaper size={16} />} title="Novinky" audience={{ kind: 'vse', label: 'Všichni' }} accent="corrector">
          <p>
            Archiv platformových novinek. Každá má typ (Informace / Upozornění /
            Systémová) se štítkem; karta ukazuje obrázek, datum a úryvek, po
            kliknutí se otevře okno s celým textem (zavřeš křížkem, klávesou Esc
            nebo klikem mimo). Admin tu novinky rovnou spravuje (Aktivní /
            Archiv, vytvořit, upravit, archivovat, smazat).
          </p>
        </Tool>
        <Tool icon={<CalendarDays size={16} />} title="Akce (kalendář)" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="corrector">
          <p>
            Měsíční kalendář globálních akcí (minulých i budoucích). Listuješ
            šipkami, tlačítko Dnes skočí na aktuální měsíc, klik na akci otevře
            detail s tlačítkem Zúčastním se. Na mobilu místo mřížky seznam
            Nadcházející / Proběhlé. Akce zakládá Admin.
          </p>
        </Tool>
        <Tool icon={<Star size={16} />} title="Oblíbené" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="corrector">
          <p>
            Tvoje záložky napříč diskuzemi, články a galerií na jednom místě (tři
            taby). Přidáš ikonou záložky na detailu nebo kartě. Vybrané můžeš
            „připnout" (max 5 na typ) do pravého panelu. Je to čistě osobní.
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Lidé & profil ──────────────────────────────────────────────── */}
      <HelpAccordion icon={<Users size={20} />} title="Lidé & profil" accent="player">
        <Tool icon={<User size={16} />} title="Profil" audience={{ kind: 'vse', label: 'Vlastník účtu' }} accent="player">
          <p>
            Tvoje nastavení účtu (po přihlášení): hlavička, něco o mně, postava v
            Camp, moje světy, moje akce ve světech, komunitní stopa, soukromí,
            bezpečnost (heslo, žádost o přezdívku) a účet (smazání). Detaily v tabu{' '}
            <strong>Účet &amp; profil</strong>.
          </p>
          <ScreenshotSlot media="platforma.profil" />
        </Tool>
        <Tool icon={<User size={16} />} title="Veřejný profil" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="player">
          <p>
            Read-only zrcadlo profilu jiného uživatele bez citlivých polí. Tlačítko
            „Přidat do přátel" mění stav podle vztahu, „Napsat zprávu" otevře poštu s
            předvyplněným příjemcem.
          </p>
        </Tool>
        <Tool icon={<User size={16} />} title="Online indikátor" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="player">
          <p>
            Zelená tečka u avataru = uživatel má právě otevřenou platformu, žlutá =
            je u počítače ale ~5 min neaktivní (idle), žádná = offline. U offline
            uživatelů vidíš „naposledy aktivní před X". Svůj stav skryješ přes
            Soukromí v profilu.
          </p>
        </Tool>
        <Tool icon={<Users size={16} />} title="Adresář uživatelů" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="player">
          <p>
            Komunitní část — taby Přátelé (přijatí + odeslané žádosti), Uživatelé
            (procházení adresáře, žádost o přátelství) a Zpracovat (univerzální
            fronta žádostí napříč moduly). Najdeš v{' '}
            <Link to="/ikaros/uzivatele">Adresáři uživatelů</Link>.
          </p>
        </Tool>
        <Tool icon={<KeyRound size={16} />} title="Reset hesla" audience={{ kind: 'vse', label: 'Zapomenuté heslo' }} accent="player">
          <p>
            „Zapomněl/a jsi heslo?" v přihlašovacím dialogu → zadáš e-mail → přijde
            odkaz na reset (platí 1 hodinu, na jedno použití). Pokud měl účet
            naplánované smazání, reset ho zruší a účet obnoví.
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Pravidla, soukromí & nahlašování ───────────────────────────── */}
      <HelpAccordion icon={<Gavel size={20} />} title="Pravidla, soukromí & nahlašování" accent="info">
        <Tool icon={<Flag size={16} />} title="Nahlásit obsah" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="info">
          <p>
            U cizího obsahu — <strong>článku, obrázku v galerii, profilu, náboru,
            příspěvku v diskuzi, stránky světa, novinky, přijaté zprávy v poště i
            zprávy v chatu</strong> — najdeš tlačítko <strong>„Nahlásit"</strong>{' '}
            (ikona vlajky). Otevře formulář: vybereš <strong>kategorii</strong>{' '}
            (autorská práva, osobní údaje, obtěžování, ohrožení nezletilých,
            nezákonný obsah, spam, jiné), napíšeš <strong>důvod</strong>, necháš
            (nebo upravíš) svůj e-mail a potvrdíš, že to myslíš vážně. Můžeš zvolit{' '}
            <strong>„nahlásit anonymně"</strong> (tvé jméno moderátor neuvidí).
          </p>
          <p>
            Co se stane pak: hlášení dostane <strong>moderátor</strong> do fronty a
            rozhodne — od „bez zásahu" přes upozornění a skrytí až po odstranění
            obsahu, v krajních případech omezení účtu. Dostaneš{' '}
            <strong>potvrzení</strong> a (pokud sis to nechal/a poslat) i výsledek.
            Stav svých hlášení sleduješ v <Link to="/ikaros/profil">Profilu</Link>{' '}
            → sekce <strong>Moderace</strong>. Vlastní obsah nahlásit nelze.
          </p>
        </Tool>
        <Tool icon={<Gavel size={16} />} title="Pravidla komunity" audience={{ kind: 'vse', label: 'Všichni' }} accent="info">
          <p>
            <Link to="/kodex">Pravidla komunity</Link> shrnují, co na platformě
            platí a co je zakázané (mj. <strong>nulová tolerance</strong> k obsahu
            ohrožujícímu nezletilé). Odkaz najdeš i v <strong>patičce</strong> na
            každé stránce.
          </p>
        </Tool>
        <Tool icon={<Lock size={16} />} title="Ochrana osobních údajů" audience={{ kind: 'vse', label: 'Všichni' }} accent="info">
          <p>
            <Link to="/soukromi">Zásady ochrany osobních údajů</Link> vysvětlují,
            jaké údaje o tobě zpracováváme, proč, jak dlouho a jaká máš práva
            (přístup, oprava, výmaz, přenositelnost). Většinu vyřešíš přímo v appce
            — <strong>stáhnout data</strong> i <strong>smazat účet</strong> najdeš v{' '}
            <Link to="/ikaros/profil">Profilu</Link> → Účet.
          </p>
        </Tool>
        <Tool icon={<Contact size={16} />} title="Kontakt" audience={{ kind: 'vse', label: 'Všichni' }} accent="info">
          <p>
            <Link to="/kontakt">Kontaktní stránka</Link> říká, kam napsat žádost k
            osobním údajům, stížnost nebo podnět, který nejde vyřešit tlačítkem
            „Nahlásit". Odkaz je i v patičce.
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Správa platformy (admini) ──────────────────────────────────── */}
      <HelpAccordion icon={<Shield size={20} />} title="Správa platformy" accent="warning">
        <Tool icon={<Shield size={16} />} title="Správa platformy (/admin)" audience={{ kind: 'admin', label: 'Jen admini' }} accent="warning">
          <p>
            Admin hub se třemi taby. <strong>Přehled</strong>: dashboard se
            statistikami a rychlými odkazy — kromě počtů (uživatelé, světy, obsah)
            i <strong>návštěvnost</strong>, <strong>růst &amp; retence</strong>{' '}
            (kolik lidí projde cestou registrace → svět → postava → hra a kolik se
            vrací) a <strong>náklady</strong> (nahraný obsah + využití úložiště
            Cloudinary). Čísla jsou orientační, počítaná z databáze bez sledování
            jednotlivců. <strong>Uživatelé</strong>: plná správa
            — hledání, změna role (v hierarchii), ban (i dočasný), naplánování
            smazání (30denní lhůta), u Superadmina jemná oprávnění adminů.{' '}
            <strong>Audit log</strong>: read-only historie admin akcí. Otevřeš
            odkazem „Správa platformy" v pravém panelu (Admin+).
          </p>
        </Tool>
        <Tool icon={<Smile size={16} />} title="Globální emoty" audience={{ kind: 'admin', label: 'Jen admini' }} accent="warning">
          <p>
            Správa globálních custom emotů — <code>:zkratka:</code> dostupné napříč
            všemi světy (limit 200). Když svět vytvoří stejnou zkratku, jeho
            varianta v daném světě přebíjí globální; ostatní světy dál vidí
            globální.
          </p>
        </Tool>
        <Tool icon={<MessageSquare size={16} />} title="Interní chat správy" audience={{ kind: 'admin', label: 'Jen admini' }} accent="warning">
          <p>
            Oddělené pracoviště pro tým správy na vlastní stránce. Vlevo{' '}
            <strong>konverzace</strong> (týmový chat v reálném čase; přednastavené
            „Hlavní" a „Vedení", nové zakládá Superadmin a určuje, kdo v nich je —
            všichni správci, nebo jen vybraní), uprostřed{' '}
            <strong>sdílené dokumenty</strong> (PDF — nahraješ, otevřeš ke čtení
            přímo v prohlížeči, stáhneš), vpravo <strong>úkoly týmu</strong>{' '}
            (osobní seznam úkolů každého admina, viditelný ostatním; cizí úkoly
            upravuje jen Superadmin).
          </p>
          <p>
            Dokumenty jsou zatím omezené na <strong>10 MB na soubor</strong> —
            větší PDF zatím rozděl na menší části. Otevřeš odkazem „Chat" v
            Administraci (jen přihlášený admin).
          </p>
        </Tool>
      </HelpAccordion>
    </>
  );
}
