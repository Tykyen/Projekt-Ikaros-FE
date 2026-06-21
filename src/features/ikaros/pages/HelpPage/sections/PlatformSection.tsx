import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Globe2,
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
            Mřížka aktivních světů. Hledání podle názvu, filtr Vše / Veřejné / Mé
            světy a řazení (datum vzniku / abeceda / volná místa). Kliknutím na
            kartu otevřeš detail světa. Anonym vidí veřejné a otevřené světy,
            přihlášený navíc své. Najdeš v{' '}
            <Link to="/ikaros/vesmiry">Přehledu vesmírů</Link>.
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Komunikace ─────────────────────────────────────────────────── */}
      <HelpAccordion icon={<MessageSquare size={20} />} title="Komunikace" accent="info">
        <Tool icon={<Beer size={16} />} title="Hospoda (globální chat)" audience={{ kind: 'vse', label: 'Přihlášení' }} accent="info">
          <p>
            Jedna sdílená místnost pro celou platformu napříč světy. Píšeš v reálném
            čase, vidíš přítomné a kdo píše. Nahoře volíš „Všem" (veřejně) nebo
            konkrétního uživatele (soukromý šepot). Funguje odpověď s citací, emoji
            reakce, emoty přes <code>:zkratka:</code> a přílohy (obrázky/dokumenty).
            Zprávy mizí po hodině; příchody a odchody se zapisují do chatu.
          </p>
          <ScreenshotSlot media="platforma.hospoda" />
        </Tool>
        <Tool icon={<Globe2 size={16} />} title="Rozcestí I.–III." audience={{ kind: 'vse', label: 'Přihlášení' }} accent="info">
          <p>
            Tři atmosférické roleplay místnosti — hra na jeden večer bez kostek.
            Každá má prostředí (styl + jedna z 20 lokací s ilustrací na pozadí).
            Stejné chatovací funkce jako Hospoda, ale <strong>u zpráv i v seznamu
            přítomných</strong> vystupuješ jako svoje <strong>postava</strong>{' '}
            (jméno a obrázek z profilu „Postava v Rozcestí"), ne jako účet. Kdo
            postavu nevyplnil, zobrazí se účtem. Klik na osobu otevře kartu její
            postavy.
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
        </Tool>
        <Tool icon={<Newspaper size={16} />} title="Novinky" audience={{ kind: 'vse', label: 'Všichni' }} accent="corrector">
          <p>
            Archiv platformových novinek. Každá má typ (Informace / Upozornění /
            Systémová) odlišený barvou nadpisu; karta je sbalená, po kliknutí
            ukáže obrázek a celý text. Admin tu novinky rovnou spravuje (Aktivní /
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
            Rozcestí, moje světy, moje akce ve světech, komunitní stopa, soukromí,
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

      {/* ── Správa platformy (admini) ──────────────────────────────────── */}
      <HelpAccordion icon={<Shield size={20} />} title="Správa platformy" accent="warning">
        <Tool icon={<Shield size={16} />} title="Správa platformy (/admin)" audience={{ kind: 'admin', label: 'Jen admini' }} accent="warning">
          <p>
            Admin hub se třemi taby. <strong>Přehled</strong>: dashboard se
            statistikami a rychlými odkazy. <strong>Uživatelé</strong>: plná správa
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
      </HelpAccordion>
    </>
  );
}
