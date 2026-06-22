import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Map as MapIcon,
  Swords,
  ScrollText,
  CalendarDays,
  Coins,
  MessageSquare,
  Settings,
  BookOpen,
  Crown,
  Footprints,
  Skull,
  NotebookPen,
  Dices,
  Crosshair,
  Flame,
  CloudFog,
  ListOrdered,
  Layers,
  CloudSun,
  Music,
  Network,
  Lock,
  Backpack,
  Smile,
  Grid3x3,
  Ruler,
  Triangle,
  Pencil,
  Share2,
} from 'lucide-react';
import {
  HelpAccordion,
  HelpSubAccordion,
  TagChip,
  CalloutBox,
  ScreenshotSlot,
  type TagKind,
} from '../components';

type Accent = 'accent' | 'player' | 'pj' | 'pjasst' | 'corrector' | 'warning' | 'success' | 'info';

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
  accent?: Accent;
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

// Pod-pod-sekce taktické mapy (3. úroveň) — kompaktní.
function MapFeature({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <HelpSubAccordion icon={icon} title={title} accent="pj">
      {children}
    </HelpSubAccordion>
  );
}

export function WorldSection() {
  return (
    <>
      <p>
        Nástroje uvnitř konkrétního světa (adresy <code>/svet/…</code>). Každý svět
        má vlastní motiv, role a obsah nezávisle na platformě. Rozbal si skupinu a
        v ní nástroj; štítek říká, kdo ho používá.
      </p>

      {/* ── Základy světa ──────────────────────────────────────────────── */}
      <HelpAccordion icon={<LayoutDashboard size={20} />} title="Základy světa" accent="accent" defaultOpen>
        <Tool icon={<LayoutDashboard size={16} />} title="Přehled světa" audience={{ kind: 'vse', label: 'Členové' }}>
          <p>
            Vstupní strana světa ve 3 sloupcích: vlevo nadcházející herní{' '}
            <strong>Akce</strong>, uprostřed <strong>Novinky</strong> světa, vpravo tvoje{' '}
            <strong>Oblíbené stránky</strong> — osobní seznam, který si každý člen tvoří
            sám (hvězdičkou u stránek) a může v něm přetahováním měnit pořadí.
            Anonym a Žadatel vidí pre-join verzi s tlačítkem Vstoupit / Požádat.
          </p>
          <ScreenshotSlot media="svet.prehled" />
        </Tool>
        <Tool icon={<Share2 size={16} />} title="Sdílet svět (pozvánka)" audience={{ kind: 'vse', label: 'Kdokoli' }}>
          <p>
            Na detailu světa je tlačítko <strong>Sdílet</strong> — zkopíruje nebo
            rozešle odkaz na svět, kterým můžeš pozvat přátele. Na mobilu se otevře
            systémové sdílení (vybereš si appku — WhatsApp, Messenger, …), na počítači
            menu s <strong>Kopírovat odkaz</strong>, <strong>Facebook</strong> a{' '}
            <strong>X</strong>. Sdílí se jen adresa světa; u veřejného světa se host
            rovnou podívá, u soukromého požádá o vstup.
          </p>
        </Tool>
        <Tool icon={<Crown size={16} />} title="Role ve světě" audience={{ kind: 'vse', label: 'Členové' }}>
          <p>
            Ve světě jsou role PJ, Pomocný PJ, Korektor, Hráč, Čtenář a Žadatel —
            určují, co kdo smí. Roli ti přiděluje PJ. Plný rozpis pravomocí i matici
            oprávnění najdeš v tabu <strong>Role &amp; oprávnění</strong>.
          </p>
        </Tool>
        <Tool icon={<FileText size={16} />} title="Wiki stránky — čtení" audience={{ kind: 'vse', label: 'Členové' }} accent="corrector">
          <p>
            Encyklopedie světa — lokace, lore, novinky, galerie, rodokmen. Layout se
            mění podle typu stránky. V hlavičce drobečky, hvězdička pro přidání do tvých
            <strong> oblíbených</strong> (klávesa <code>f</code>) a (s oprávněním) Upravit;
            pravý panel má profilový obrázek, datovou tabulku
            a obsah z nadpisů. V textu fungují odkazy mezi stránkami a klik na obrázek
            ho otevře na celou obrazovku. <code>Ctrl+K</code> = rychlé hledání, <code>Ctrl+P</code> = tisk.
          </p>
          <CalloutBox variant="tip">
            Stránky chráněné klíčem (AKJ), ke kterému nemáš přístup, poznáš jako
            zamčenou položku „🔒 AKJ" — klik tě nasměruje na obrazovku s požadovaným
            přístupem, ne na obsah.
          </CalloutBox>
        </Tool>
        <Tool icon={<FileText size={16} />} title="Wiki stránky — editor" audience={{ kind: 'pjasst', label: 'Pomocný PJ+' }} accent="corrector">
          <p>
            Tvorba a úprava stránek. Hlavička s identitou (název, typ, slug z názvu,
            hero obrázek) + pruh datových šablon. Rozbalovací panely: Atributy &amp;
            metadata, typový panel, Textový obsah (rich-text s obrázky, tabulkami a{' '}
            <code>[[odkazy]]</code>), Sekce a Přístupová práva (whitelist + AKJ + role).
            <code>Ctrl+S</code> ukládá, Náhled ukáže živý preview. Rozepsaná stránka
            se uloží jako draft.
          </p>
          <p>
            Datová šablona z pruhu předvyplní tabulku (a u některých i kostru textu —
            nadpisy s nápovědou, ať prázdná stránka nestraší). Osnovu vloží jen do
            prázdného textu, takže ti nikdy nepřepíše, co už máš napsané.
          </p>
        </Tool>
        <Tool icon={<FileText size={16} />} title="Index a Správa stránek" audience={{ kind: 'vse', label: 'Členové (správa PJ)' }} accent="corrector">
          <p>
            <strong>Index stránek</strong> = přehled encyklopedie s kartami, hledáním,
            filtrem typu a sekcí <strong>Oblíbené</strong> (tvoje osobní, s pořadím přes
            přetahování). <strong>Správa stránek</strong> (PJ) =
            tabulková správa s řazením, hledáním, mazáním jednotlivým i hromadným.
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Informace & lidé ───────────────────────────────────────────── */}
      <HelpAccordion icon={<Users size={20} />} title="Informace & lidé" accent="player">
        <Tool icon={<BookOpen size={16} />} title="Pravidla, Magický systém, Technologie" audience={{ kind: 'vse', label: 'Členové (úpravy PJ)' }}>
          <p>
            Tři referenční wiki stránky každého světa (menu Informace). Píše a
            upravuje je PJ stejným editorem jako ostatní stránky. Magický systém a
            Technologii může PJ z menu skrýt v Nastavení → Viditelnost modulů.
          </p>
          <CalloutBox variant="tip" title="Předvyplněno při založení světa">
            Nový svět dostane tyhle stránky rovnou s orientačním textem podle
            voleb z formuláře tvorby: <strong>Pravidla</strong> podle herního
            systému, <strong>Technologie</strong> podle zvoleného pásma
            vyspělosti (TÚ 0–14) a <strong>Magický systém</strong> podle
            zatržených tradic magie. Je to jen startovní bod — PJ text libovolně
            přepíše. Tahle pásma a tradice se volí jen při tvorbě světa, ne
            později v Nastavení.
          </CalloutBox>
        </Tool>
        <Tool icon={<Users size={16} />} title="Hráči světa" audience={{ kind: 'vse', label: 'Členové' }}>
          <p>
            Adresář hráčů: nahoře vedení (PJ, Pomocní PJ), pak skupiny a jejich
            členové. Zobrazují se jen ti s přiřazenou postavou nebo vedení. Karta s
            avatarem vede na osobní kartu; pokud hráč hraje za postavu, je tu i řádek
            „Hraje za &lt;postava&gt;" s odkazem na ni.
          </p>
        </Tool>
        <Tool icon={<Users size={16} />} title="Skupiny" audience={{ kind: 'vse', label: 'Členové' }}>
          <p>
            Stránka jedné skupiny (záložka Informace → Skupiny). Ukáže hráče té
            skupiny s postavami; karta vede na stránku postavy. Skupina může mít znak
            (emblém) — PJ ho nahraje a stane se i ikonou chat kanálu skupiny.
          </p>
        </Tool>
        <Tool icon={<Users size={16} />} title="Adresář postav" audience={{ kind: 'vse', label: 'Členové (tvorba PJ)' }}>
          <p>
            Seznam postav světa ve třech sekcích — Postavy hráčů, NPC a Lokace — s
            filtrem typu. Karta ukazuje avatar, jméno a typ. PJ má Nová postava (typ,
            jméno, slug, avatar, popis; u hráčské výběr hráče); po vytvoření vznikne
            deník a kalendář. Finance a Výbavu mají <strong>jen postavy hráčů</strong>
            {' '}(PC) — NPC a Lokace je nemají.
          </p>
        </Tool>
        <Tool icon={<FileText size={16} />} title="Detail postavy" audience={{ kind: 'vse', label: 'Členové (úpravy PJ/vlastník)' }}>
          <p>
            Karta postavy se šesti záložkami: <strong>Profil</strong> (veřejný) a pět
            soukromých — <strong>Deník, Finance, Výbava, Kalendář, Poznámky</strong>{' '}
            (vidí PJ, Pomocný PJ a vlastník). Finance a Výbavu mají jen postavy hráčů;
            u NPC a Lokací se tyto dvě záložky nezobrazí. Postava může mít chráněné (AKJ) záložky;
            nová rovnou dostane záložku „Soukromé". Deník vypadá podle herního systému
            světa (12 dedikovaných šablon, jinak generická).
          </p>
          <CalloutBox variant="tip" title="Finance">
            Postava má až 20 účtů (osobní/společné/tajné), historii transakcí a
            převody. PJ může hráči povolit samostatný vklad/výběr. „Zaúčtovat měsíc"
            pracuje s herním datem světa. Když PJ změní měnu účtu, může ji nechat{' '}
            <strong>přepočítat kurzem</strong> (zůstatek i historii), nebo jen
            přeznačit.
          </CalloutBox>
        </Tool>
        <Tool icon={<Backpack size={16} />} title="Osobní výbava" audience={{ kind: 'hrac', label: 'Hráč + PJ' }}>
          <p>
            Výbava postavy je sklápěcí sekce s položkami a počítadlem; množství
            upravíš tlačítky − / + přímo u řádku i mimo režim úprav. Nákupy z obchodu
            přibývají do sekce „Nakoupeno z obchodu".
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Mapy & vizuál ──────────────────────────────────────────────── */}
      <HelpAccordion icon={<MapIcon size={20} />} title="Mapy & vizuál" accent="info">
        <Tool icon={<MapIcon size={16} />} title="Mapa vesmíru" audience={{ kind: 'vse', label: 'Členové (editace PJ)' }} accent="info">
          <p>
            3D graf lokací světa — tělesa (planeta, hvězda, mlhovina…) propojená
            cestami. Klik na těleso přiblíží kameru a ukáže panel (frakce, spojení,
            odkaz na wiki). Hráč vidí jen tělesa, která PJ zveřejnil. PJ má editační
            režim (přidat/upravit/smazat tělesa a spojení) s živou synchronizací.
          </p>
        </Tool>
        <Tool icon={<MapIcon size={16} />} title="Mapy (atlas)" audience={{ kind: 'vse', label: 'Členové (správa PJ)' }} accent="info">
          <p>
            Atlas nahraných obrázkových map (kontinent, město, podzemí…) — mřížka
            karet, klik otevře mapu na celou obrazovku. Viditelnost řídí PJ u každé
            mapy (veřejná nebo jen vybraní hráči). PJ má režim Upravit (přidat, upravit,
            smazat, pořadí).
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Taktická mapa (samostatná sekce — klíčový a obsáhlý nástroj) ── */}
      <HelpAccordion
        icon={<Swords size={20} />}
        title="Taktická mapa"
        accent="pj"
        tag={<TagChip kind="hrac" label="Hráč + PJ" />}
      >
        <p>
          Mřížkový prostor pro boj a scény. PJ vytvoří scénu (pozadí + mřížka +
          tokeny + efekty), přiřadí na ni hráče a ti se připojí v reálném čase.
          Rozbal si jednotlivé funkce:
        </p>
        <ScreenshotSlot media="svet.takticka-mapa" />

          <MapFeature icon={<Grid3x3 size={15} />} title="Typ mřížky a měřítko">
            <p>
              U každé scény si PJ v „Upravit scénu" vybere mřížku: <strong>šestiúhelníky</strong>{' '}
              (výchozí), <strong>čtverce</strong>, nebo <strong>žádnou</strong>. Nastaví
              i měřítko — kolik metrů (či jiných jednotek) je jedno políčko. Po okraji
              mapy se pak ukáže stupnice, kterou vidí všichni. PJ si může výchozí
              mřížku a měřítko přednastavit pro celý svět (Nastavení světa → Mapy) —
              nové scény je pak převezmou.
            </p>
          </MapFeature>
          <MapFeature icon={<Ruler size={15} />} title="Pravítko (měření vzdálenosti)">
            <p>
              Nástroj „📏 Měření" v pravém dolním rohu — zapni a táhni z jednoho bodu
              do druhého. Ukáže se vzdálenost v políčkách i v jednotkách scény.
              <strong> Měří hráč i PJ a výsledek vidí všichni</strong>, takže celý stůl
              hned vidí, jestli na cíl dostřelíš nebo dosáhneš.
            </p>
          </MapFeature>
          <MapFeature icon={<Footprints size={15} />} title="Hráčské postavy (PC)">
            <p>
              Token PC z postavy hráče. Drag pro pohyb (hráč hýbe jen vlastním, PJ
              libovolným), pod tokenem HP bar, klik otevře statbar s atributy podle
              systému. PJ může token zamknout (🔒).
            </p>
          </MapFeature>
          <MapFeature icon={<Skull size={15} />} title="NPC a bestie">
            <p>
              NPC postavy a bestie (statbloky bez deníku) spawnuje PJ z palet
              (přetažením na hex nebo klik na řádek a pak na hex). Každá bestie na mapě
              je <strong>samostatná instance</strong> — vlastní životy, schopnosti i
              poznámky. PJ je upravuje přímo u tokenu.
            </p>
          </MapFeature>
          <MapFeature icon={<NotebookPen size={15} />} title="Deníky a poznámky">
            <p>
              Klik na PC/NPC token otevře taby Staty / Deník / Poznámky (ukládají se
              do postavy a propisují do běžného detailu). Tlačítko deníku na mapě:
              PJ má <strong>Deník PJ</strong> (world-level, soukromý), hráč{' '}
              <strong>Poznámky své postavy</strong>.
            </p>
          </MapFeature>
          <MapFeature icon={<Dices size={15} />} title="Hod kostkou">
            <p>
              Tlačítko 🎲 otevře výběr kostky (stejné skiny jako v chatu) — vlastní hod
              nebo hod schopnosti/iniciativy ze statbaru. Kostky přiletí na plochu (3D)
              a zapíšou se do logu. Viditelnost hodů řídí Nastavení světa.
            </p>
          </MapFeature>
          <MapFeature icon={<Crosshair size={15} />} title="Ping (zaměřovač)">
            <p>
              Kdokoli dvojklikem na plochu (na mobilu dvojitým ťuknutím) vyšle barevný
              prstenec, který krátce blikne všem a zmizí. Popisek: u hráče jméno
              postavy, u PJ „PJ". Slouží k rychlému „sem koukni".
            </p>
          </MapFeature>
          <MapFeature icon={<Flame size={15} />} title="Efekty">
            <p>
              Paleta PJ: barevná pole (8 barev), bariéra (stěna s DC) a výbuch/oblast
              (soustředné kruhy se zraněním, varianty oheň/plyn/kouř). Guma maže,
              koš smaže vše. Efekty vidí všichni v reálném čase.
            </p>
          </MapFeature>
          <MapFeature icon={<Triangle size={15} />} title="Šablony oblastí (kouzla)">
            <p>
              V paletě efektů nástroj „📐 Šablona" — vyber tvar (kužel, linie, koule,
              čtverec) a barvu, klikni na začátek a táhni směr a dosah. Vidíš živý
              náhled; po puštění se oblast zafixuje jako barevné pole. Hodí se na
              zásah kouzla, dech příšery, čáru ohně apod.
            </p>
          </MapFeature>
          <MapFeature icon={<Pencil size={15} />} title="Kreslení a poznámky na mapě">
            <p>
              Nástroj „✏️ Kreslení": čára, šipka, kruh a text přímo do scény. U každé
              kresby zvolíš barvu a kdo ji uvidí (<strong>všichni</strong> / <strong>jen
              PJ</strong>). Kreslit smí vždy PJ; <strong>hráči jen když to PJ u scény
              povolí</strong> (v „Upravit scénu"). Smazat můžeš svoje kresby, PJ kterékoli.
            </p>
          </MapFeature>
          <MapFeature icon={<CloudFog size={15} />} title="Mlha války">
            <p>
              PJ zapne mlhu a štětcem (1 / 7 / 19 hexů) odhaluje nebo zahaluje oblasti.
              Hráč vidí jen odhalené; nepřátele v mlze nevidí. Vlastní postava hráče
              kolem sebe kousek mlhy odhaluje. „Zahalit vše" vrátí mapu do mlhy.
            </p>
          </MapFeature>
          <MapFeature icon={<ListOrdered size={15} />} title="Iniciativa a boj">
            <p>
              Nahoře iniciativní lišta — bojovníci podle iniciativy s portrétem a
              pořadím. Kdo je v boji určuje PJ; lišta se skryje, když nikdo nebojuje.
              PJ zahájí boj, posouvá tahy a počítá kola; bojovník „na tahu" má zlatý
              prstenec. Iniciativu lze hodit všem najednou.
            </p>
          </MapFeature>
          <MapFeature icon={<Layers size={15} />} title="Scény a orchestrace">
            <p>
              Více scén může běžet paralelně. PJ je řídí panelem „⚙ Orchestrace" —
              přepíná se mezi nimi, deaktivuje je, přiřazuje hráče. V sekci „Přístup a
              viditelnost" může mapu hráčům skrýt (👁/🚫) nebo zamknout pohyb (🔓/🔒),
              hromadně i jednotlivě. Knihovna map ukládá scénu jako šablonu (per-PJ).
            </p>
          </MapFeature>
          <MapFeature icon={<CloudSun size={15} />} title="Počasí na mapě">
            <p>
              PJ z Generátoru počasí klikne „Vyslat na mapu" — data (teplota, vítr,
              vlhkost, srážky…) se propíšou všem na scéně a u deště/sněhu/bouře se
              zobrazí vizuální atmosféra (každý si ji může vypnout).
            </p>
          </MapFeature>
          <MapFeature icon={<Music size={15} />} title="Ambientní hudba">
            <p>
              PJ přidá zvuky ze Zvukové databáze do playlistu a tlačítkem „Vysílat" je
              spustí všem na scéně (ve smyčce, na pozadí). Hráč při prvním zvuku klikne
              „Aktivovat zvuk" (pravidlo prohlížeče).
            </p>
          </MapFeature>
      </HelpAccordion>

      {/* ── Příběhové nástroje (PJ) ────────────────────────────────────── */}
      <HelpAccordion icon={<ScrollText size={20} />} title="Příběhové nástroje (PJ)" accent="pj">
        <Tool icon={<Skull size={16} />} title="Bestiář" audience={{ kind: 'pj', label: 'Členové (tvorba PJ)' }} accent="pj">
          <p>
            Knihovna statbloků (bestií) pro taktickou mapu. Bestie drží jméno, avatar,
            systémové staty a schopnosti. Tři rozsahy: <strong>Můj</strong> (osobní,
            napříč světy), <strong>Tohoto světa</strong> (PJ tým) a <strong>Systémové</strong>{' '}
            (globální pro herní systém). Vytvoříš, upravíš nebo naklonuješ; mazání je
            do koše. Spawnují se na mapu z palety orchestrace. U obrázku můžeš zvolit{' '}
            <strong>výřez</strong> — klikem vybereš, která část bude vidět (plus
            přiblížení), aby token na mapě i náhled v katalogu ukazovaly to podstatné.
          </p>
          <ScreenshotSlot media="svet.bestiar" />
        </Tool>
        <Tool icon={<Network size={16} />} title="Pavučina" audience={{ kind: 'vse', label: 'Členové (PJ vidí vše)' }} accent="pj">
          <p>
            Vztahový graf kampaně. Každý má svou Pavučinu — síť subjektů (postavy,
            frakce, státy, lokace) a oboustranných vztahů (dvě nezávislé strany,
            emoce, síla, valence). Záložky: Dnes (krize, aktivní linky), Subjekty,
            Síť (2D silový graf) a Linky (příběhové linie). PJ vidí Pavučinu každého
            hráče jen pro čtení.
          </p>
          <ScreenshotSlot media="svet.pavucina" />
        </Tool>
        <Tool icon={<ScrollText size={16} />} title="Storyboard (scénáře)" audience={{ kind: 'pj', label: 'Jen PJ' }} accent="pj">
          <p>
            Příprava příběhu ve stromu míst a scén — a „spustitelná příprava": co
            nachystáš, jedním krokem vypustíš do hry. Strom s větvením podle voleb
            hráčů, editor scény s tajnou zónou pro PJ a mapou scény. Obrázky pošleš
            rovnou do chatu. Na taktické mapě pak „Načíst přípravu" vytvoří scénu ze
            scénáře. Pomocný PJ vidí svoje + sdílené.
          </p>
        </Tool>
        <Tool icon={<NotebookPen size={16} />} title="Deník PJ" audience={{ kind: 'pjasst', label: 'Pomocný PJ+' }} accent="pj">
          <p>
            Soukromý poznámkový blok PJ pro celý svět (Hra → Deník PJ). Je to ten samý
            deník jako tlačítko „Deník" na taktické mapě. Každý PJ má svůj vlastní,
            ukládá se průběžně.
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Svět v čase ────────────────────────────────────────────────── */}
      <HelpAccordion icon={<CalendarDays size={20} />} title="Svět v čase" accent="warning">
        <Tool icon={<CloudSun size={16} />} title="Generátor počasí" audience={{ kind: 'vse', label: 'Členové (generuje PJ)' }} accent="warning">
          <p>
            Generuje počasí pro regiony světa z bohaté databáze presetů (reálná města,
            klimatické zóny, fantasy i sci-fi prostředí). Karta ukazuje teplotu,
            přístroje, barometr a popis. PJ posouvá in-game datum („+1 den" / „+7 dní"),
            generuje pro konkrétní datum i klimatickou éru a vysílá počasí na taktickou
            mapu.
          </p>
        </Tool>
        <Tool icon={<CalendarDays size={16} />} title="Kalendář světa" audience={{ kind: 'vse', label: 'Členové (PJ vidí vše)' }} accent="warning">
          <p>
            Sjednocený měsíční kalendář — akce světa, kalendáře postav, NPC i lokací v
            jedné mřížce. Hustota zobrazení (Detail / Kompakt / Heat) a filtrovací strom
            v sidebaru. V buňkách fáze měsíců a barva sezóny. <strong>Klikni na číslo
            dne</strong> (vedle je počet akcí) a otevře se boční panel s čitelným seznamem
            všech akcí toho dne — užitečné, když je akcí moc a do buňky se nevejdou. Hráč
            vidí jen veřejné zdroje.
          </p>
          <p>
            Každá postava, NPC i lokace má v kalendáři <strong>vlastní barvu</strong> —
            automaticky přidělenou, ale nastavitelnou: PJ klikem na barevný puntík u
            entity ve filtru, hráč u své postavy v záložce Kalendář. Kalendář si také
            pamatuje, na kterém měsíci jsi naposledy skončil, a vrátí tě tam i po obnovení
            stránky.
          </p>
          <ScreenshotSlot media="svet.kalendar" />
        </Tool>
        <Tool icon={<CalendarDays size={16} />} title="Správa kalendářů" audience={{ kind: 'pj', label: 'Jen PJ' }} accent="warning">
          <p>
            Víc souběžných kalendářů per svět (Lidský, Elfí…). Editor: identita, hodiny,
            týden, měsíce, nebeská tělesa (engine spočítá fáze) a sezóny. Wizard
            „+ Přidat kalendář" nabídne 14 historických šablon (Gregoriánský, Juliánský,
            Židovský, Čínský…). Hvězda = výchozí, hodiny 🕐 = kalendář časové osy.
          </p>
        </Tool>
        <Tool icon={<ListOrdered size={16} />} title="Časová osa" audience={{ kind: 'vse', label: 'Členové (správa PJ)' }} accent="warning">
          <p>
            Vertikální historická osa nejdůležitějších událostí světa (nejnovější rok
            nahoře). Karta nese fantasy datum, hero obrázek, text, odkaz a fáze
            nebeských těles. Tlačítko 🔄 převede datum do ostatních kalendářů; sidebar
            „Skok na rok". Záporné roky (př. n. l.) podporované.
          </p>
        </Tool>
        <Tool icon={<CalendarDays size={16} />} title="Akce a Novinky světa" audience={{ kind: 'vse', label: 'Členové (správa PJ)' }} accent="warning">
          <p>
            <strong>Akce světa</strong> — karty herních akcí s odpočtem a tlačítkem
            Zúčastním se; pod akcí vláknové komentáře s reakcemi. Akce může být jen pro
            vybranou skupinu. <strong>Novinky světa</strong> — oznámení s hero obrázkem
            a typem; datum může být reálné nebo herní (fantasy datum). Klikem na
            novinku se otevře okno s celým textem (stejné jako u novinek platformy).
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Ekonomika ──────────────────────────────────────────────────── */}
      <HelpAccordion icon={<Coins size={20} />} title="Ekonomika" accent="success">
        <Tool icon={<Coins size={16} />} title="Převodník měn" audience={{ kind: 'vse', label: 'Členové (správa PJ)' }} accent="success">
          <p>
            Nahoře převodník (zadáš částku a měnu, dopočítá se druhá; ⇅ prohodí), dole
            tabulka měn světa. První měna je základ (kurz 1.0), ostatní relativně k ní.
            Hráč čte; Pomocný PJ upravuje kurzy, PJ přidává/maže měny. Tvoje cílová
            měna se pamatuje per svět.
          </p>
        </Tool>
        <Tool icon={<Coins size={16} />} title="Obchod" audience={{ kind: 'vse', label: 'Členové' }} accent="success">
          <p>
            Obchod světa s kartami zboží. PJ zakládá položky, typy/skupiny a slevy;
            ceny v měnách světa, každý je vidí ve své preferované měně. Hráč nakupuje
            své postavě (peněženka se zůstatkem před/po), PJ komukoli. Nákup přibude do
            výbavy a odečte z účtu; panel „Nákupy" umí vrácení.
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Komunikace & zvuk ──────────────────────────────────────────── */}
      <HelpAccordion icon={<MessageSquare size={20} />} title="Komunikace & zvuk" accent="info">
        <Tool icon={<MessageSquare size={16} />} title="Chat světa" audience={{ kind: 'vse', label: 'Členové' }} accent="info">
          <p>
            Chat uvnitř světa — vlevo kanály a v nich konverzace, uprostřed zprávy,
            vpravo (PJ) panel Přítomní. Kanál <strong>Postavy</strong> je soukromý:
            přiřazená postava ti automaticky založí privátní konverzaci s vedením.
            Pořadí kanálů, konverzací i připnutých si každý řadí sám přetažením
            úchopky (⋮⋮); kanály jsou defaultně sbalené. Připnuté konverzace
            (sekce nahoře) máš ve svém pořadí v každém světě zvlášť.
          </p>
          <ScreenshotSlot media="svet.chat" />
          <CalloutBox variant="tip">
            U zpráv funguje odpověď s citací, emoji reakce, šepot, přílohy, editace,
            <strong>smazání vlastní zprávy</strong>, zmínka <code>@jméno</code>, herní
            datum, PJ NPC mód a hod kostkou (🎲) se 30 skiny. Vzhled svých zpráv i
            kostek si nastavíš přes paletku 🎨 v <strong>hlavičce konverzace</strong>,
            zvlášť pro každý svět. Na mobilu klávesa <strong>Enter</strong> dělá nový
            řádek (odstavec) — zprávu odešleš tlačítkem.
          </CalloutBox>
          <p>
            Vedení světa (PJ i Pomocný PJ) může v chatu vystupovat{' '}
            <strong>anonymně</strong> (všichni jako jedno „PJ" — kvůli tajemství),
            nebo <strong>rozpoznatelně</strong> (každý se svým obrázkem a svou rolí,
            takže poznáš, který PJ ti píše). Režim přepíná PJ v Nastavení světa →{' '}
            <strong>PJ v chatu</strong>; vlastní obrázek vedení si v režimu
            „rozpoznatelně" nastaví každý PJ i Pomocný PJ sám (tamtéž, „Můj obrázek
            vedení"). Projeví se zpětně i na starších zprávách. Když PJ píše „za
            bytost" (NPC mód, razítko 🎭), zůstává tou bytostí.
          </p>
          <CalloutBox variant="tip">
            Jméno bytosti v masce PJ buď napíše ručně, nebo ji vybere z{' '}
            <strong>našeptávače</strong> existujících postav a NPC světa (stačí
            psát část jména). Výběrem se k masce rovnou napojí{' '}
            <strong>obrázek z karty</strong> a jméno bytosti v chatu se stane{' '}
            <strong>klikací</strong> — kdokoli si přes něj otevře její kartu.
          </CalloutBox>
        </Tool>
        <Tool icon={<Music size={16} />} title="Zvuky (jukebox)" audience={{ kind: 'vse', label: 'Členové (správa PJ)' }} accent="info">
          <p>
            Zvuková databáze světa — knihovna hudby a zvuků z YouTube (menu Hra →
            Zvuky). Slyšet a přehrát může každý člen; vytvářet a spravovat PJ. PJ pustí
            zvuk všem na taktické mapě (ambient scény) nebo přímo v chatu („pustit zvuk
            všem").
          </p>
        </Tool>
      </HelpAccordion>

      {/* ── Nastavení & správa (PJ) ────────────────────────────────────── */}
      <HelpAccordion icon={<Settings size={20} />} title="Nastavení & správa" accent="pjasst">
        <Tool icon={<Settings size={16} />} title="Nastavení světa" audience={{ kind: 'pjasst', label: 'PJ / Pomocný PJ' }} accent="pjasst">
          <p>
            Konfigurace světa v tabech: Základní info (název, systém, viditelnost hodů),
            Vzhled (motiv, vlastní pozadí), Členové (skupiny + barvy, role), AKJ úrovně,
            Postavy &amp; NPC (matice typ × tab), Šablony stránek, <strong>PJ v chatu</strong>{' '}
            (jak vystupuje vedení), Přístup světa, Členství (odejít / předat svět),
            Smazat svět. Tab „Můj vzhled" = osobní override motivu.
          </p>
          <CalloutBox variant="pozor" title="Smazání světa je vratné (30 dní)">
            Svět smaže PJ (vlastník) nebo administrátor přes tab <strong>Smazat
            svět</strong>. Svět zmizí z provozu, ale <strong>data zůstanou</strong>.
            Obnovit ho může <strong>do 30 dní jen administrátor</strong> — pokud ho
            chceš zpět, napiš mu. Po 30 dnech se svět i s daty <strong>trvale
            smaže</strong>. (Stejná pojistka platí, když je smazán účet PJ — jeho
            světy nezmizí hned.)
          </CalloutBox>
        </Tool>
        <Tool icon={<Settings size={16} />} title="Hlavní lišta světa" audience={{ kind: 'pj', label: 'Jen PJ' }} accent="pjasst">
          <p>
            Editor horní lišty s živým náhledem. Viditelnost modulů (skryj nepoužívané),
            vlastní navigace (skupiny a odkazy za systémovou navigaci), šablony menu a
            „Last info" box (proužek oznámení pod hlavičkou světa).
          </p>
        </Tool>
        <Tool icon={<NotebookPen size={16} />} title="Šablona deníku světa" audience={{ kind: 'pj', label: 'Jen PJ' }} accent="pjasst">
          <p>
            Definuje atributy postav světa (HP, staty, vlastní bloky). Tři panely:
            seznam bloků s drag&amp;drop, konfigurace bloku, živý náhled. Verzování,
            Import/Export JSON. Pokud má svět jeden z 12 podporovaných systémů, použije
            se dedikovaný systémový sheet místo bloků.
          </p>
        </Tool>
        <Tool icon={<Smile size={16} />} title="Custom emoty světa" audience={{ kind: 'pjasst', label: 'PJ / Pomocný PJ' }} accent="pjasst">
          <p>
            Vlastní obrázkové emoty — <code>:zkratka:</code> v chatu se vykreslí jako
            obrázek (PNG/JPG/GIF/WebP do 512 KB, max 100 na svět). Lze kopírovat do
            jiného světa. Smazání nezmění historii zpráv.
          </p>
        </Tool>
        <Tool icon={<Lock size={16} />} title="AKJ — zamčené záložky" audience={{ kind: 'pjasst', label: 'PJ / Pomocný PJ' }} accent="pjasst">
          <p>
            Stránka může mít vedle Profilu chráněné záložky se zámkem. Záložku s číslem
            utajení (AKJ) vidí v liště <strong>i hráči bez přístupu — zamčenou, včetně
            názvu</strong>; obsah se jim ale neposílá. Jakmile hráč dosáhne potřebné
            úrovně (nebo ho přidáš jmenovitě), zámek se odemkne a obsah se zobrazí.
            Tvoří se v editoru stránky → panel „Chráněné záložky (AKJ)"; přístup řídíš
            číslem clearance (a jmenovitými hráči). <strong>Pojmenuj záložku tak, aby
            název nic neprozradil.</strong>
          </p>
          <CalloutBox variant="tip" title="U vlastní postavy">
            Chráněné záložky své postavy vidíš automaticky — PJ ti tam nechá soukromý
            vzkaz. Nová postava proto rovnou dostane záložku „Soukromé". Záložky „PJ
            informace" a „Soukromé" zůstávají ostatním hráčům úplně skryté.
          </CalloutBox>
        </Tool>
      </HelpAccordion>

      <CalloutBox variant="tip" title="Něco chybí?">
        Některé nástroje jsou dostupné jen určitým rolím — když ho v menu svého světa
        nevidíš, buď ho PJ skryl, nebo na něj nemáš roli. Plný rozpis je v tabu{' '}
        <strong>Role &amp; oprávnění</strong>.
      </CalloutBox>
    </>
  );
}
