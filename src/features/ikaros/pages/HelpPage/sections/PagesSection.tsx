import { Link } from "react-router-dom";
import s from "../HelpPage.module.css";

type PageStatus = "ok" | "soon";

interface PageDoc {
  path: string;
  name: string;
  status: PageStatus;
  who: string;
  what: string;
  /** Štítek krok-fáze (např. „Fáze 2.2") pro 🚧 položky. */
  fáze?: string;
}

const IKAROS_PAGES: PageDoc[] = [
  {
    path: "/",
    name: "Úvodník",
    status: "ok",
    who: "Všichni (anon i přihlášený)",
    what: "Vstupní stránka platformy. Uvítací karta + dvě sekce vedle sebe: vlevo Akce (první 3 nadcházející globální akce, jen po přihlášení; odkaz Kalendář akcí otevře celý kalendář), vpravo Novinky platformy (první 3, odkaz Všechny novinky otevře archiv). Admin/Superadmin vidí v hlavičkách obou sekcí tlačítko +, kterým rovnou vytvoří novou globální akci / novinku. Akce a novinky tvého konkrétního světa jsou jen v daném světě, nikdy se nemíchají.",
  },
  {
    path: "/ikaros/napoveda",
    name: "Nápověda",
    status: "ok",
    who: "Všichni",
    what: "Tato stránka. Co umí platforma, jaké jsou role a co odkud spustíš.",
  },
  {
    path: "/podminky",
    name: "Podmínky použití",
    status: "ok",
    who: "Všichni",
    what: "Pravidla chování, zpracování osobních údajů, smazání účtu, kontakt.",
  },
  {
    path: "/ikaros/profil",
    name: "Profil",
    status: "ok",
    who: "Přihlášený (vlastník účtu)",
    what: "Sekce: hlavička, něco o mně, postava v Rozcestí, moje světy, moje akce ve světech (cross-world agregátor blížících se herních akcí), komunitní stopa, bezpečnost (heslo, žádost o změnu přezdívky), účet (smazání).",
  },
  {
    path: "/ikaros/vesmiry",
    name: "Přehled vesmírů",
    status: "ok",
    who: "Všichni (anon vidí public/open, přihlášený navíc své)",
    what: "Mřížka aktivních světů platformy. Search podle názvu, filtr Vše / Veřejné / Mé světy (přihlášený), řazení podle data vzniku / abecedy / volných míst. URL si pamatuje nastavení. Kliknutím na kartu otevřeš detail světa.",
  },
  {
    path: "/ikaros/uzivatele",
    name: "Adresář uživatelů",
    status: "ok",
    who: "Přihlášený",
    what: 'Komunitní část — taby Přátelé, Uživatelé, Zpracovat. Tab Přátelé: mřížka přijatých přátel + sbalitelná sekce „Odeslané žádosti". Tab Uživatelé: mřížka karet všech uživatelů (procházení adresáře, žádost o přátelství) se search a řazením. Tab Zpracovat: univerzální fronta žádostí napříč moduly — žádosti o přátelství, změnu přezdívky a postupně i další (Admin tu schvaluje i žádosti o přezdívku). Hloubková správa uživatelů (role, ban, mazání, audit) se přesunula na samostatnou stránku Správa platformy.',
  },
  {
    path: "/admin",
    name: "Správa platformy",
    status: "ok",
    who: "Admin a Superadmin",
    what: 'Platformový admin hub se třemi taby. Přehled: dashboard se statistikami (počet uživatelů — celkem / aktivní za 24 h / noví za 7 dní / čekající na smazání, počet světů, počet článků / obrázků / diskuzí, čekající žádosti o přezdívku) + rychlé odkazy. Uživatelé: plná správa — vyhledávání a filtry, změna role (v rámci hierarchie), ban / odbanování (i dočasný), naplánování smazání účtu (30denní lhůta), hromadné akce a u Superadmina granular oprávnění adminů. Audit log: read-only historie admin akcí s filtry. Stránku otevřeš v pravém panelu odkazem „Správa platformy" (jen Admin+).',
  },
  {
    path: "/ikaros/uzivatel/:id",
    name: "Veřejný profil",
    status: "ok",
    who: "Přihlášený",
    what: 'Read-only zrcadlo profilu jiného uživatele bez citlivých polí (e-mail, motiv, barva chatu, ban/delete metadata). Tlačítko „Přidat do přátel" mění stav podle vztahu (žádost odeslána / čeká rozhodnutí / odebrat z přátel). „Napsat zprávu" čeká na fázi 3.5.',
  },
  {
    path: "—",
    name: "Online indikátor (presence)",
    status: "ok",
    who: "Přihlášený",
    what: 'Zelená tečka u avataru = uživatel má právě otevřenou platformu. Žlutá tečka = uživatel je u počítače, ale ~5 min nebyl aktivní (idle). Žádná tečka = offline. U offline uživatelů na veřejném profilu vidíš „naposledy aktivní před X". Lze skrýt svůj stav přes Soukromí v profilu.',
  },
  {
    path: "—",
    name: "Reset hesla",
    status: "ok",
    who: "Anon (zapomenuté heslo)",
    what: '„Zapomněl/a jsi heslo?" v přihlašovacím dialogu → zadáš e-mail → pokud účet existuje, pošleme e-mail s odkazem na reset (platí 1 hodinu, na jedno použití). Na odkazu nastavíš nové heslo a znovu se přihlásíš. Pokud měl účet naplánované smazání, reset ho zároveň zruší a účet obnoví.',
  },
  {
    path: "/ikaros/novinky",
    name: "Novinky",
    status: "ok",
    who: "Všichni (anon i přihlášený); správa Admin / Superadmin",
    what: "Archiv platformových novinek. Každá novinka má typ — Informace, Upozornění nebo Systémová — který barevně odlišuje nadpis. Karta je ve výchozím stavu sbalená (nadpis, typ, datum); po kliknutí se rozbalí a ukáže obrázek (pokud je), celý text a dole autora s datem. Admin/Superadmin tu novinky rovnou spravuje: přepínač Aktivní/Archiv, tlačítko Nová novinka, na každé kartě upravit / archivovat (vratné) / smazat (nevratné). Novinku lze založit i z Úvodníku tlačítkem + v hlavičce sekce Novinky.",
  },
  {
    path: "/ikaros/akce",
    name: "Akce (kalendář)",
    status: "ok",
    who: "Přihlášený; vytváření Admin / Superadmin",
    what: "Měsíční kalendář globálních platformových akcí — minulých i budoucích. Listuješ mezi měsíci šipkami, tlačítko Dnes skočí na aktuální měsíc. Klik na akci v kalendáři otevře detail s obrázkem, popisem a tlačítkem Zúčastním se. Na mobilu se místo mřížky zobrazí seznam Nadcházející / Proběhlé. Admin/Superadmin zakládá akce tlačítkem Nová akce.",
  },
  {
    path: "/ikaros/clanky",
    name: "Články",
    status: "ok",
    who: "Čtení všichni (anon i přihlášený), psaní přihlášený",
    what: 'Literární archiv komunity. Přehled publikovaných článků s vyhledáváním, řazením (nejnovější / nejlépe hodnocené / nejvíc hodnocených) a filtrem podle kategorie. Tab Moje (po přihlášení) ukazuje tvé články včetně konceptů a souhrn statistik. Nový článek píšeš v editoru s formátováním (tučně, kurzíva, nadpisy, citace, odrážky, odkazy) — text se průběžně ukládá do prohlížeče, kdyby ses odpojil. Workflow: koncept → odeslat ke schválení → publikováno (schvaluje Správce článků). Detail článku má hodnocení hvězdičkami, obsah dlouhých článků a sekci „Více od autora". Publikovaný článek si přidáš do oblíbených ikonou záložky (na kartě i v detailu).',
  },
  {
    path: "/ikaros/posta",
    name: "Pošta",
    status: "ok",
    who: "Přihlášený",
    what: "Soukromé zprávy mezi uživateli. Vlevo přepínáš Doručené / Odeslané, vpravo čteš vybranou zprávu jako vlákno konverzace. Novou zprávu pošleš tlačítkem Nová zpráva — příjemce najdeš našeptávačem podle přezdívky. Na zprávu lze odpovědět (odpovědi se řetězí do jednoho vlákna) a zprávy mazat (zmizí jen tobě). Počet nepřečtených ukazuje odznak u ikony Pošta v hlavičce. V profilu v sekci Soukromí si můžeš zapnout, že ti smí psát jen přátelé.",
  },
  {
    path: "/ikaros/oblibene",
    name: "Oblíbené",
    status: "ok",
    who: "Přihlášený",
    what: 'Tvoje záložky napříč diskuzemi, články a galerií na jednom místě — stránka má tři taby. Položku si přidáš do oblíbených ikonou záložky na jejím detailu nebo na kartě v seznamu. Vybrané oblíbené si můžeš „připnout" (ikona špendlíku) — připnuté položky se zobrazují v pravém panelu, maximálně 5 na každý typ obsahu. Oblíbené je čistě osobní — vidíš je jen ty, neovlivňuje to hodnocení obsahu.',
  },
  {
    path: "/chat",
    name: "Hospoda (globální chat)",
    status: "ok",
    who: "Přihlášený",
    what:
      "Interdimenzionální hospoda — jedna sdílená místnost pro celou platformu, " +
      "napříč všemi světy. Píšeš zprávy v reálném čase, vidíš seznam přítomných " +
      'a indikátor, kdo právě píše. Komu napsat volíš nahoře u pole: „Všem" pošle ' +
      "zprávu veřejně, výběrem konkrétního uživatele pošleš soukromý šepot, který " +
      "uvidí jen on (orámování pole se přebarví, ať víš, že šeptáš). Text zprávy se " +
      "zobrazuje v barvě, kterou máš nastavenou v profilu. V textu fungují emotes " +
      "přes dvojtečkové zkratky (např. :beer: → 🍺). Zprávy mizí po hodině. " +
      "Najetím na zprávu se objeví akce: odpovědět a přidat emoji reakci. " +
      "Odpověď nad sebou ukáže citaci původní zprávy — kliknutím na citaci " +
      "skočíš k originálu. Reakce vybíráš z emoji výběru; opětovný klik na " +
      "svou reakci ji zase odebere. " +
      "Ke zprávě můžeš připnout přílohy — obrázky a dokumenty (tlačítko se " +
      "sponkou u pole, max 10 MB na soubor, až 10 obrázků a 4 dokumenty). " +
      "Obrázky se v chatu zobrazí jako náhledy a kliknutím se otevřou na " +
      "celou obrazovku, dokumenty jako odkaz ke stažení. Zpráva může být " +
      "i jen příloha bez textu. " +
      "Admin a Superadmin mohou nevhodnou zprávu smazat. " +
      "Příchody a odchody se zapisují přímo do chatu jako hláška — vidí je " +
      "i ten, kdo dorazí později. V levém menu je u každé místnosti počet " +
      "lidí, kteří jsou zrovna uvnitř. Jakmile do místnosti vejdeš, zůstáváš " +
      "v ní přihlášený, i když mezitím odejdeš jinam — můžeš tak být v Hospodě " +
      'a Rozcestích zároveň. Odcházíš ručně tlačítkem „Odejít" v záhlaví ' +
      "místnosti; po 60 minutách nečinnosti tě místnost odhlásí sama.",
  },
  {
    path: "/chat/rozcesti",
    name: "Rozcestí I.–III.",
    status: "ok",
    who: "Přihlášený",
    what:
      "Tři nezávislé atmosférické roleplay místnosti — hra na jeden večer bez " +
      "kostek a mechanik. Každá má prostředí: zvolený styl (Fantasy / Sci-fi / " +
      "Mystika) a v něm jednu z 20 lokací, jejíž ilustrace tvoří pozadí chatu a " +
      "popis najdeš v rozbalovacím panelu (tlačítko 📖). Prostředí je sdílené — " +
      "vidí ho všichni v místnosti; měnit styl a lokaci smí jen role s " +
      "platformovou funkcí (správci). Zprávy, soukromý šepot, odpovědi, emoji " +
      "reakce, indikátor psaní, hlášky příchodu/odchodu, počty v menu, odchod " +
      "i odhlášení po nečinnosti fungují stejně jako v Hospodě. Na rozdíl od Hospody se ale v seznamu " +
      "přítomných zobrazuje tvoje postava (jméno a obrázek z profilu), ne účet — " +
      "kdo postavu nevyplnil, vystupuje pod účtem. Kliknutím na osobu v seznamu " +
      "přítomných si otevřeš kartu její postavy — avatar, jméno a popis postavy.",
  },
  {
    path: "/ikaros/diskuze",
    name: "Diskuze",
    status: "ok",
    who: "Jen přihlášení",
    what:
      "Témata k rozhovoru — založ téma a veď vlákno příspěvků (formátovaný text). " +
      "Diskuze může být otevřená nebo uzamčená (pozvánky, žádosti o přidání); " +
      "správce diskuze řeší manažery a pozvánky. Příspěvky lze lajkovat, " +
      "diskuzi přidat do oblíbených a nevhodné příspěvky nahlásit. " +
      "Schvaluje a moderuje Správce diskuzí.",
  },
  {
    path: "/ikaros/admin/emotes",
    name: "Globální emoty (správa)",
    status: "ok",
    who: "Admin a Superadmin",
    what: 'Správa globálních custom emotů platformy — `:shortcode:` dostupné napříč všemi světy. Stejný flow jako per-svět varianta (`/svet/<slug>/admin/emotes`), jen bez tlačítka „Kopírovat" (globální už je všude). Limit 200 emotů. Když nějaký svět vytvoří `:smile:` se stejným shortcode, jeho varianta v daném světě přebíjí globální — ostatní světy dál vidí globální. Položku najdeš v Administraci v pravém panelu (vedle Uživatelů) — viditelná jen pro Admin+.',
  },
  {
    path: "/ikaros/galerie",
    name: "Galerie",
    status: "ok",
    who: "Čtení anon, upload přihlášený",
    what:
      "Obrazový salon komunity — mřížka obrázků s kategoriemi, hledáním a řazením, " +
      "fullscreen prohlížeč (lightbox). Nahraj obrázek, ulož koncept nebo odešli " +
      "ke schválení; po schválení (Správce galerie) ho lze hodnotit hvězdičkami " +
      "a přidat do oblíbených ikonou záložky (na dlaždici i v detailu).",
  },
];

const SOON_IKAROS: PageDoc[] = [
  {
    path: "/ikaros/vytvorit-svet",
    name: "Vytvořit svět",
    status: "soon",
    fáze: "Fáze 2.3",
    who: "Přihlášený",
    what: "Wizard pro založení nového světa (název, žánr, popis, přístupový režim, RPG systém).",
  },
  {
    path: "/svet/:slug",
    name: "Detail světa + vstup",
    status: "soon",
    fáze: "Fáze 2.4",
    who: "Přihlášený",
    what: "Info o světě, tlačítko Vstoupit (public = okamžitě, private = žádost ke schválení PJ).",
  },
];

const SOON_WORLD: PageDoc[] = [
  {
    path: "/svet/:slug/pocasi",
    name: "Generátor počasí",
    status: "ok",
    who: "Členové světa (Hráč read-only, PomocnyPJ+ create/edit/generate/broadcast, PJ+ delete)",
    what: '📦 Sety (page header tlačítko): 14 globálních batch-create balíčků — Svět komplet (8 metropolí 6 kontinentů), Evropa (9), Asie (8), Afrika (6), Severní/Jižní Amerika (6+5), Oceánie (4), Česko (5), Vysokohorská kampaň, Mořeplavecká, Mars expedice (3 lokace), Vesmírná stanice (ISS+interiéry), Vesmírná loď komplet (10 per-room), Solar System tour (8 těles). Klik na set → confirm dialog → vytvoří se najednou 3-10 generátorů. Plus custom sety per-world (PJ+ uloží šablonu globálního setu jako vlastní, příště rovnou aplikuje). Multi-generator grid karet — PJ může mít víc generátorů pro různé regiony světa (sever, jih, hlavní město). Každá karta: hero teplota, instruments (vítr/vlhkost/update), barometr SVG, narrative text, hazards, anomaly chip (🔥 vlna veder / 🥶 mrazivá vlna). Atmospheric overlay per weather type (déšť → rain particles, sníh → snow drift, bouře → lightning flash). Drag-to-reorder (PomocnyPJ+). ⭐ Hvězda = oblíbený generátor (favorited karty sortují nahoru, per-user × per-world v localStorage). Tlačítko „+ Nový generátor" otevře wizard se 4 rozcestími karet (~960 presetů celkem): 🌍 Reálný svět ~840 (Země/města + Köppen klimatické zóny + Mořská prostředí + Reálné extrémy), 🐉 Fantasy & mytologie 53 (literární světy Středozem/Westeros/Faerůn/Witcher/Tamriel, mytologie Olymp/Asgard/Helheim/Hádes/Duat/Avalon, prehistorická prostředí, steampunk, horror/Lovecraft, vzdušné/létající, magické), 🚀 Sci-fi & vesmír 45 (reálná planetární tělesa Mars/Luna/Venuš/Titan/Europa/Pluto/Jupiter, exoplanety, cyberpunk, vesmírné stanice ISS/Mir/Skylab/O\'Neill cylinder, lodní interiéry per-room, typy lodí, EVA exteriéry), ⭐ Mé presety (per-svět custom presety uložené z generator modal pro znovupoužití). Fuzzy search napříč všemi presety, naposledy použité chipsy, 3 trial rolly náhledu (přes world calendar nebo Gregorian fallback). Variance model: Gaussian variance per měsíc + Markov persistence weather type + 5% extrémy. Generování může explicitně zadat měsíc (PJ z UI) nebo BE použije real-world current month. Auto-advance: tlačítka „+1 den" / „+7 dní" v header posunou in-game date a auto-vygenerují počasí pro všechny generátory. Historie počasí: kebab menu „Historie" otevře modal s posledních N snapshots per generátor. WS live update: jiný PJ broadcastuje → ostatní vidí okamžitě. 🌡️ Climate epoch (paleoclimate / IPCC): kebab „Vygenerovat pro datum…" otevře modal s rokem (−25000 až +3000), měsícem a dnem. Live detekce klimatické éry (LGM −5°C, Středověké optimum +0.7°C, Malá doba ledová −0.7°C, Blízká budoucnost +1.2°C, far-future +4.5°C…) — generátor přizpůsobí teploty vědeckým paleoclimate/IPCC datům (Clark 2009, Mann 2009, IPCC AR6 SSP scénáře). Karta po vygenerování zobrazí chip s názvem éry, rokem a offsetem °C. 9.4-J — repair klimatu: pokud generátor produkuje nelogický rozptyl teplot (např. 3°C i 20°C v poledne), chybí mu klimatický model. Edit modal zobrazí žlutý banner „Generátor nemá klimatický model" s tlačítkem „Opravit klimat" — vyber preset/archetyp a klimat se doplní (monthlyTemps + Köppen σ + zóna) bez přepsání ostatních polí (název, weatherTypes, custom fields). Nový generátor bez vybraného presetu nelze uložit — buď vyber preset, nebo vědomě klikni „Prázdný formulář" v Preset tabu.',
  },
];

// 5.5 — světové stránky, které už reálně fungují.
const WORLD_PAGES_OK: PageDoc[] = [
  {
    path: "/svet/:slug/obchod",
    name: "Obchod",
    status: "ok",
    who: "Všichni členové (Hráč prohlíží a nakupuje své postavě; PomocnyPJ/PJ spravují katalog a nakupují komukoli)",
    what: "Obchod světa s kartami zboží. PJ/PomocnyPJ zakládá položky i typy/skupiny (2 úrovně) a může dát slevu na jednotlivou věc i na celou skupinu (sleva na věc má přednost). Ceny se zadávají v měnách světa a každý je vidí ve své preferované měně (převod přes Převodník měn). Položku lze propojit s wiki stránkou světa (např. popis zbraně). Filtrování podle skupiny, hledání, řazení dle ceny. Nákup: v hlavičce je peněženka cílové postavy se zůstatkem; PJ volí „nakupuji pro“ (jen postavy hráčů), hráč nakupuje své postavě. Tlačítko Koupit otevře dialog se zůstatkem před a po nákupu, množstvím a slevou. Po koupi věc přibude do vybavení postavy (sekce „Nakoupeno z obchodu“) a cena se odečte z vybraného účtu. Hráč může nakupovat jen z účtu, kde mu to PJ povolil. Panel „Nákupy“ ukazuje historii a umožní nákup vrátit (peníze zpět na účet, věc zmizí z vybavení).",
  },
  {
    path: "/svet/:slug/scenare",
    name: "Scénáře (Storyboard)",
    status: "ok",
    who: "Jen PJ a pomocný PJ (hráč ani čtenář Storyboard nevidí). Pomocný PJ vidí svoje scénáře a navíc ty, které mu PJ označil jako sdílené — a smí je upravovat.",
    what: 'Nástroj PJ na přípravu a psaní příběhu, uspořádaný do **stromu podle míst a scén** — a zároveň „spustitelná příprava": co si nachystáš, jedním krokem vypustíš do hry. Levý panel = strom: složky (Akt / Kapitola) a scény, libovolná hloubka, **větvení dle voleb hráčů** (podscény s popiskem větve, např. „pokud hráči zradí"). Scény přetáhneš (drag) pro změnu pořadí i zařazení pod jiný uzel; na mobilu přes „Přesunout pod…". Stav scény: koncept / aktivní / volitelná / vyřešená. Storyboard si **pamatuje naposledy otevřený scénář** — po návratu ho rovnou otevře. Pravý panel = **editor scény**: název, text (formátovaný editor s obrázky), **tajná zóna pro PJ a pomocného PJ** (poznámky PJ, cíl a výsledek — hráč nevidí), a **mapa scény** (podkladový obrázek + verze s čísly + vysvětlivky/legenda). Přepínačem **„Sdílet s pomocným PJ"** zpřístupníš scénář pomocnému PJ (smí ho pak číst i upravovat); co nesdílíš, vidíš jen ty. U obrázků galerie: otevřít, zkopírovat odkaz a **poslat rovnou do chatu** (vyber kanál) — i s možností **naplánovat odeslání na pozdější čas**. Dole **provázání se světem**: místo scény, libovolné wiki stránky (postavy, novinky…), bestiář (připravený encounter), subjekty Pavučiny a příběhové linky. „Zobrazit v síti" otevře Pavučinu předfiltrovanou na linku scénáře. Scénu lze **uložit jako šablonu do knihovny** (📑) a jindy ji vložit a upravit. Na **taktické mapě** pak tlačítko **„Načíst přípravu"** jedním krokem **vytvoří novou taktickou scénu** ze scénáře — nastaví podklad mapy a vloží připravené postavy a bestie, scénu aktivuje a přepne tě na ni. Příběhové linie se spravují v Pavučině (záložka Linky).',
  },
  {
    path: "/svet/:slug/mapa",
    name: "Mapa vesmíru",
    status: "ok",
    who: "Členové světa (PJ+ editace)",
    what: "3D graf lokací světa — tělesa (planeta, hvězda, mlhovina, asteroid, měsíc, černá díra) propojená cestami, rozmístěná fyzikální simulací (po ustálení se zastaví kvůli úspoře výkonu). Klik na těleso = přiblížení kamery + detailní panel: frakce, seznam spojení (proklikem přeskočíš na sousední těleso) a odkaz na jeho wiki stránku. Vyhledávání tělesa podle jména, tlačítko „Zobrazit vše“ oddálí na celou mapu. Viditelnost: hráč vidí jen tělesa, která PJ zveřejnil — buď veřejně, nebo jmenovitě konkrétním hráčům; skrytá tělesa i jejich spojení backend hráči vůbec nepošle. PJ může z detailu jedním tlačítkem těleso rychle skrýt/zveřejnit. Editační režim (PJ, 🛠️): přidat/upravit/smazat těleso (jméno, typ, barva, velikost, frakce, prsten, obrázek, odkaz na wiki stránku, viditelnost), přidat/smazat spojení (volitelně oběžná dráha = kratší spojnice), tělesa lze v tomto režimu táhnout a rozmístit; 💾 uloží celou mapu. Pravý klik na těleso v editaci ho smaže. Změny se přes WebSocket propíšou ostatním v reálném čase — v editačním režimu má ale tvůj rozpracovaný stav přednost a dostaneš jen upozornění, že někdo mapu mezitím změnil (uložením jeho změny přepíšeš).",
  },
  {
    path: "/svet/:slug",
    name: "Přehled světa",
    status: "ok",
    who: "Členové světa",
    what: "Vstupní stránka světa — 3 sloupce: vlevo Akce (nadcházející herní akce + tlačítko vytvořit pro PJ), uprostřed Novinky světa (zkrácený výpis + odkaz na archiv), vpravo Oblíbené stránky (max 10 slugů, hvězdičkou ve vieweru). Pro PJ tlačítko + v hlavičkách sekcí (nová akce / oznámení). Anon a Žadatel vidí pre-join verzi s tlačítkem Vstoupit / Požádat.",
  },
  {
    path: "/svet/:slug/takticka-mapa",
    name: "Taktická mapa",
    status: "ok",
    who: "Členové světa (PJ řídí, hráč pohybuje vlastním tokenem)",
    what: 'Hex-grid prostor pro boj nebo orientaci ve scéně. PJ vytvoří scénu (pozadí + grid + tokeny + efekty), přiřadí na ni hráče, ti se připojí přes WS a vidí v reálném čase pohyby ostatních. Klíčové vlastnosti: (1) Více aktivních scén paralelně ve světě — PJ může mít Matrixáře v boji v Matrixu, družinu chránící jeho tělo, a jednoho člena hledajícího útočníka, vše současně. PJ orchestruje scény přes panel „⚙ Orchestrace" (klikne na scénu = přepne se sám, ✕ = deaktivuje scénu a vykopne přiřazené hráče). (2) Hráč vidí jen scénu, na kterou ho PJ přiřadil (privacy gate na BE). Přiřazení i viditelnost řídí PJ v panelu v sekci „Přístup a viditelnost": u každé aktivní scény vidí, kdo na ní je, a přepínači může mapu hráčům skrýt (👁 / 🚫 — hráč pak vidí „Mapa skrytá", hodí se na přípravu scény) nebo zamknout pohyb tokenů (🔓 / 🔒). Jde to nastavit najednou všem na scéně (tlačítka „👁 vše" / „🔒 vše") i jednotlivě konkrétnímu hráči (per-hráč nastavení přebíjí scénu). Hráče přidá na scénu přes „+ přiřadit hráče", odebere ✕. Pokud hráč nemá scénu, vidí prázdný stav s přehledem svých postav ve světě a zprávou „PJ ti ještě nepřiřadil scénu". (3) Tokeny: PC z postav hráčů + NPC postavy + bestie (statbloky bez deníku). Drag-to-move, HP bar pod tokenem, klik na token otevře statbar modal s atributy podle systému (D&D 5e, DrD2, CoC, GURPS, Fate, Příběhy Impéria, generic). Hráč může hýbat jen vlastním tokenem; PJ a Admin libovolným. PJ navíc může jednotlivý token zamknout (klik na „i" u tokenu → tlačítko „🔓 Zamknout") — zamčený token má na mapě 🔒 a hráč jím nepohne (jen PJ), nezávisle na zámku celé scény. (4) Knihovna map (PJ): uloží aktuální scénu jako šablonu (pozadí + grid + NPC + efekty + mlha + zvuky) a později ji načte do jiné scény ve stejném nebo jiném světě. Šablony jsou per-PJ — vidíš jen své. Load přepíše současný stav (s confirm dialogem). PC tokeny se do šablon neukládají. (5) PJ má v panelu sbalitelné palety pro spawn PC postav, NPC postav a bestií (každá v hlavičce ukazuje počet aktivních; rozbalíš kliknutím — díky tomu se vejde i deset bestií, pět NPC a deset PC bez nekonečného scrollování). Spawn na konkrétní hex: buď přetáhni řádek z palety na cílový hex na mapě, nebo klikni na řádek v paletě a pak na hex (banner ti připomene; ESC ruší). U NPC a bestií zůstává režim umístění aktivní pro opakovaný spawn (např. 5 banditů po sobě), PC se umístí jednou a režim se vypne. Pokud cílový hex obsazený, token spadne na nejbližší volný. (6) Klikem na token (vlastní PC nebo libovolný jako PJ) otevřeš statbar modal: pro PC a NPC postavy taby Staty / Deník / Poznámky (deník + poznámky se ukládají do postavy a propisují i do běžného detailu), pro bestie statblok s aktuálními staty (HP, MAX HP, zranění, zbroj, iniciativa), kde PJ navíc rovnou u téhle bestie na mapě upravuje **schopnosti** (přidat, smazat, hodit) a **poznámky** — bestie nemá deník. Každá bestie na mapě je **samostatná**: dvě se stejným jménem mají vlastní životy, schopnosti i poznámky, takže jednu zraníš nebo doupravíš bez vlivu na druhou (poznámky šablony z Bestiáře vidí PJ vedle toho zvlášť). Hráč, který klikne na cizí token, vidí jen jméno + procento HP + zranění (žádné podrobné staty ani deník). (7) Iniciativa a boj: nahoře přes celou šířku je iniciativní lišta — bojovníci seřazení podle iniciativy, u každého portrét, číslo pořadí a hodnota iniciativy. Kdo je do boje zařazený určuje PJ (přepínač „V boji / Mimo boj" u tokenu); lišta se sama skryje, když nikdo nebojuje. PJ zahájí boj, posouvá tahy a počítá kola; bojovník „na tahu" má na mapě výrazný zlatý prstenec. Iniciativu lze zadat ručně nebo ji PJ hodí všem najednou; za běhu boje jde pořadí přeřadit beze ztráty kola. Klik na bojovníka v liště přiblíží jeho token na mapě; když na něj klikne PJ, token se všem na pár vteřin rozsvítí červeným prstencem („tahle bestie / postava“) — užitečné, když je na mapě víc stejných nepřátel. (8) Efekty (PJ): paleta nástrojů vpravo dole nad ovládáním přiblížení. Tři nástroje — Barevná pole (8 barev, klikni na hex pro vyznačení zóny), Bariéra (žlutá stěna s číslem obtížnosti DC; kresli tažením jako štětec, nebo umísti kruh o zvoleném poloměru), a Výbuch / oblast (soustředné kruhy od středu s vlastním zraněním na každém kruhu, ve variantě oheň / plyn / kouř). Aktivní nástroj svítí svou barvou a jemně pulzuje. Čtvrtý nástroj je Guma — klikni nebo táhni přes mapu a maže (barevné pole po jednom hexu, bariéra a výbuch celé); tlačítko koše smaže všechny efekty najednou. Efekty vidí všichni ve scéně v reálném čase. (9) Mlha války (PJ): paleta „🌫️ Mlha" vpravo dole. PJ zapne mlhu přepínačem a štětcem odhaluje (nebo zase zahaluje) oblasti — tři velikosti štětce (1 / 7 / 19 hexů), tažením po mapě. Hráč vidí jen odhalené oblasti, zbytek je zahalený a nepřátelské tokeny v mlze nevidí; PJ vidí mlhu jen poloprůsvitně (ví, kam hráči nevidí) a vidí vše. Vlastní postavy hráče jsou viditelné vždy a kousek mlhy kolem sebe odhalují. „Zahalit vše" vrátí celou mapu do mlhy. (10) Počasí na mapě: PJ v Generátoru počasí klikne „Vyslat na mapu" a počasí se propíše všem na scéně — vpravo nahoře je otvírací panel s daty (teplota, vítr, vlhkost, oblačnost, srážky, tlak, popis). Pokud je počasí deštivé / sněžné / mlhavé / bouřkové, přes hrací plochu se zobrazí vizuální atmosféra (kapky, vločky, blesky); každý si ji může vypnout přepínačem „vizuální efekty" v panelu. PJ může počasí na mapě i přepnout (výběr generátoru) nebo vypnout. (11) Stav spojení: vlevo nahoře je nenápadný indikátor — když je vše v pořádku, jen tichá tečka; při výpadku ukáže „odpojeno" a po obnovení se sám dosynchronizuje (dotáhne, co jsi během výpadku zmeškal). Reálně funkční dnes: scény, tokeny, drag pohyb, drag&drop spawn, statbloky s deníkem postavy inline, per-system schéma, orchestrace, knihovna, iniciativa a tracker boje, efekty, mlha války, počasí na mapě, hod kostkou na mapě, ambientní hudba scény, deníky na mapě a ping. (12) Hod kostkou na mapě: tlačítko 🎲 vlevo dole otevře výběr kostky — stejné skiny a sdílené „vězeň" jako v chatu; hodíš vlastní hod nebo použiješ hod schopnosti / hod iniciativy ze statbaru tokenu. Hozené kostky přiletí na plochu (3D animace) a zapíšou se do logu hodů (panel vlevo dole nad orchestrací). Log si každý promazává sám tlačítkem ✕ — promazání skryje hody jen tobě, ostatním zůstávají; přežije refresh. Viditelnost hodů se nastavuje v Nastavení světa → Základní info: PJ vidí vše vždy; hráč vidí vlastní hody vždy; nastavení řídí, zda hráči vidí hody PJ (výchozí ne), hody NPC a bestií (výchozí ne) a hody spoluhráčů (výchozí ano). (13) Ambientní hudba: PJ má vpravo dole pod panelem „🖥️ Zobrazení" sbalitelný panel „🎵 Ambient". Zvuky přidává do playlistu tlačítkem „+ z katalogu" — otevře se Zvuková databáze světa s vyhledáváním (zvládne i stovky zvuků), klikáním přidáváš (✓ u už přidaných). V playlistu zvuky seřadíš (▲▼) nebo odebereš (×); tlačítkem „Vysílat" je spustíš všem hráčům na scéně (na pozadí, ve smyčce), „Zastavit" ukončí. Co právě hraje vidí všichni jako indikátor vpravo nahoře pod lištou počasí a deníku; hráč při prvním zvuku klikne „Aktivovat zvuk" (pravidlo prohlížeče) a pak si může hlasitost ztlumit. Zvuky se spravují na stránce Zvuky (menu Hra). (14) Ping: kdokoli (PJ i hráč) dvojklikem na plochu (na mobilu dvojitým ťuknutím) vyšle barevný prstenec — krátce blikne všem na scéně a sám zmizí. U prstenu je popisek: u hráče jméno jeho postavy, u PJ „PJ" (skutečné jméno účtu se nikde neukazuje). Slouží k rychlému „sem koukni" bez psaní. Nikam se neukládá.',
  },
  {
    path: "/svet/:slug/denik-pj",
    name: "Deník PJ",
    status: "ok",
    who: "Pomocný PJ a výš (hráč stránku nevidí)",
    what: 'Soukromý poznámkový blok PJ pro celý svět — papír na psaní (Hra → Deník PJ). Je to ten samý deník jako tlačítko „Deník" na taktické mapě: co napíšeš tady, vidíš i tam a naopak. Každý PJ má svůj vlastní (ostatní PJ do něj nevidí). Ukládá se automaticky během psaní.',
  },
  {
    path: "/svet/:slug/nastaveni",
    name: "Nastavení světa",
    status: "ok",
    who: "PJ a Pomocný PJ (některé taby jen PJ)",
    what: 'Správa konfigurace světa rozdělená do tabů: Základní info (název, popis, žánr, RPG systém, počet hráčů — slug je read-only; také nastavení viditelnosti hodů kostkou na taktické mapě: jestli hráči vidí hody PJ, hody NPC a bestií a hody spoluhráčů), Vzhled (motiv světa, custom theme overrides, vlastní pozadí), Členové (skupiny + barvy, role hráčů), AKJ úrovně (5.3d — pojmenování stupňů přístupových klíčů, řídí viditelnost stránek), Postavy & NPC (PJ-only matice typ × tab — určuje, které subdoc sekce (Soukromé, Deník, Finance, Výbava, Kalendář, Poznámky) se zobrazí na detailu Postavy hráče a NPC; výchozí = vše zapnuto; Profil je vždy povinný; skrytí je vratné, data se nemažou), Šablony stránek (Korektor+ — definice vlastních šablon atributové tabulky pro editor stránek: název, ikona, hlavičky; každý svět má svou sadu, nový svět začíná prázdný), Přístup světa (public/private/open/closed), Členství (vlastní role, „Odejít ze světa" pro Čtenář+, „Předat svět" pro vlastníka). Tab Můj vzhled umožňuje per-user override motivu.',
  },
  {
    path: "/svet/:slug/nova-stranka",
    name: "Wiki stránka — editor",
    status: "ok",
    who: "Pomocný PJ a PJ",
    what: 'Editor pro tvorbu a úpravu wiki stránek světa. Stránka má hlavičku s identitou (název, typ z 7 možností, slug = URL automaticky z názvu, příznaky „velký hero" a „Wood-Wide", pořadí v adresáři) a vedle ní kartu hlavního obrázku — hero nahraješ přetažením souboru nebo kliknutím (lze i vložit externí URL ručně). Pod hlavičkou je vodorovný pruh karet datových šablon — „Volný text" + šablony tvého světa; kliknutí na kartu předvyplní hlavičky atributové tabulky. Šablony si svět spravuje sám v Nastavení → Šablony (nový svět žádné nemá, dokud si je nevytvoří). Dále jsou tu collapsible panely v tomto pořadí: (1) Atributy & metadata (klíč-hodnota tabulka zobrazená ve čtenáři v bočním panelu — u každé hodnoty lze tlačítkem 🔗 připojit odkaz na jinou stránku světa nebo externí URL), (2) typově-specifický panel podle typu stránky — Galerie obrázků pro Galerii / Videa pro Obrazovku / Položky menu pro Seznam / Metadata novin (Stát/Vydavatel/Datum) pro Noviny, (3) Textový obsah (rich-text editor s vedlejším panelem Nástroje — tučně, kurzíva, podtržení, přeškrtnutí, horní/dolní index, seznamy, odkaz, barva textu, volba bloku Odstavec/Nadpis; navíc obrázky, tabulky a inline `[[wikilink]]` autocomplete z ostatních stránek světa), (4) Sekce (collapsible bloky s drag-reorder, text + položky), (5) Přístupová práva (whitelist hráčů + AKJ úroveň + role). Klávesa `Ctrl+S` ukládá, tlačítko Náhled vpravo nahoře otevře živý preview vedle editoru. Pokud rozepsanou stránku zavřeš a vrátíš se, editor nabídne obnovu draftu (celý formulář, ne jen text). Při přepínání typu, kdy mizí data jiného typu, se zobrazí varování — data v databázi zůstávají, jen je vidět nezobrazí. Pokud stránku mezitím upravil jiný PJ, dostaneš modal s volbou Načíst aktuální / Přepsat / Zrušit. Mazání má potvrzení — musíš ručně napsat slug stránky. AKJ klíče lze v panelu Přístup vybírat z existujících (dropdown z nastavení světa) nebo přidat tlačítkem „+ Nový AKJ" — modal nabízí najít existující AKJ podle názvu i vytvořit nový se zaškrtávací volbou „vytvořit i meta stránku" (automatický vznik stránky `akj-<klíč>` v typu Ostatní). Při duplicitních názvech modal varuje a navrhne použít existující.',
  },
  {
    path: "/svet/:slug/:stranka",
    name: "Wiki stránka — čtení",
    status: "ok",
    who: "Členové světa (přístup omezují AKJ / role)",
    what: 'Encyklopedická stránka světa — lokace, lore, novinky, galerie, rodokmen, seznam, instruktážní obrazovka. Layout se mění podle typu: Galerie má mřížku obrázků s prohlížečem na celou obrazovku, Rodokmen velký zoomovatelný obrázek (drag, +/− pro zoom 0,25–5×, klávesa 0 reset), Obrazovka video s playlistem, Noviny celostránkový banner s metadaty Stát/Vydavatel/Datum. Lokace má navíc dvě záložky — Profil (encyklopedický obsah) a Kalendář (události vázané k této lokaci; PomocnýPJ+ je může editovat, ostatní jen číst); Postava hráče / NPC mají 6 záložek (Profil, Deník, Finance, Výbava, Kalendář, Poznámky). V hlavičce vidíš drobečky, hvězdičku pro přidání do oblíbených a (pokud máš oprávnění) tlačítko Upravit. Pod titulem odhad doby čtení (~N min). Pravý panel ukazuje profilový obrázek + datovou tabulku a obsah stránky (auto-generovaný z nadpisů, klik skočí na sekci). V textu jsou odkazy mezi stránkami; pokud odkazovaná stránka neexistuje, je odkaz přeškrtnutý červeně. Klik na jakýkoliv obrázek v textu otevře prohlížeč na celou obrazovku. Vyberete-li text, mini popup nabídne Kopírovat citát a Anchor link na sekci. Vpravo dole plovoucí lišta: ⭐ oblíbené, ⬆ nahoru, 🔗 zkopírovat odkaz, ✏️ upravit (jen PomocnýPJ+). Klávesy: `Ctrl+K` rychlé vyhledávání stránek světa, `f` přidat/odebrat z oblíbených, `e` upravit, `g s` přehled stránek, `?` zobrazí kompletní seznam zkratek. Pokud na stránce existuje přístupový klíč (AKJ), nad obsahem se zobrazí banner — kliknutím přejdeš na detail toho AKJ. Stránky chráněné klíčem, ke kterému nemáš přístup, poznáš už v přehledu stránek i v rychlém vyhledávání (`Ctrl+K`) — zobrazí se jako zamčená položka „🔒 AKJ: N — Název" a klik tě nasměruje na obrazovku s požadovanou úrovní přístupu místo na obsah. Pod obsahem najdeš sekci „Odkazuje sem" se všemi stránkami, které na tuto odkazují. Stránku lze přímo vytisknout (`Ctrl+P`) — automaticky se skryje navigace a rozbalí všechny sekce.',
  },
  {
    path: "/svet/:slug/stranky",
    name: "Index stránek",
    status: "ok",
    who: "Členové světa",
    what: "Member-facing přehled encyklopedie světa. Karty stránek s ikonou typu, hledání podle názvu, filtr dle typu (Lokace/Noviny/Seznam/Galerie/Rodokmen/Obrazovka/Ostatní) a řazení (pořadí/abecedně/dle typu). Nahoře samostatná sekce Oblíbené — stránky, které sis označil hvězdičkou. Hvězdičku lze přepnout přímo na kartě. Pomocný PJ a PJ vidí tlačítko Nová stránka.",
  },
  {
    path: "/svet/:slug/admin/stranky",
    name: "Správa stránek",
    status: "ok",
    who: "PJ (Admin/Superadmin bypass)",
    what: "Tabulková správa stránek světa pro PJ. Přehled všech stránek s řazením klikem na hlavičku sloupce (název / typ / pořadí / datum poslední úpravy), hledáním a filtrem typu. Mazání jednotlivé (tlačítko na řádku) i hromadné — zaškrtneš víc stránek a smažeš je najednou, vždy s potvrzením. Z řádku se prokliká do editoru, nahoře tlačítko Nová stránka. Na mobilu se tabulka přeskládá do karet.",
  },
  {
    path: "/svet/:slug/admin/emotes",
    name: "Custom emoty (správa)",
    status: "ok",
    who: "PJ a Pomocný PJ",
    what: "Vlastní obrázkové emoty světa — `:shortcode:` v chatu se vykreslí jako obrázek. Stránku otevřeš tlačítkem `+ Nový emote` nebo přímo `/svet/<slug>/admin/emotes`. Nahráváš obrázek (PNG/JPG/GIF/WebP do 512 KB), zvolíš shortcode (a–z, 0–9, _, 2–32 znaků) a název. Karta v gridu má `:shortcode:`, název a akce — `🗑 Smazat` a `↪ Kopírovat do jiného světa` (užitečné když máš víc světů a chceš sdílet emoty). Limit 100 emotů na svět; progress bar nad gridem ukazuje využití. Smazání nezmění historii zpráv — jen se v nich daný shortcode vykreslí jako prostý text. Nahrané emoty vidí ostatní hráči okamžitě bez F5 (živá synchronizace).",
  },
  {
    path: "/svet/:slug/bestiar",
    name: "Bestiář",
    status: "ok",
    who: "Členové světa (tvorba PJ+; globální Admin+)",
    what: 'Knihovna statbloků (bestií) pro taktickou mapu — předlohy pro Goblina, Draka, Hlídače a podobně. Bestie drží jméno, avatar, systémové staty (dle herního systému světa — např. HP, Zbroj, Zranění, Pohyb, Iniciativa) a seznam schopností. Stránka má tři záložky podle „rozsahu": Můj (osobní bestiář PJ — vidíš ho ve všech svých světech), Tohoto světa (sdílený pro PJ tým daného světa) a Systémové (globální bestiář pro celý herní systém — sdílený napříč všemi světy stejného systému). Bestie vytvoříš tlačítkem „+ Nová bestie", upravíš nebo naklonuješ (klon do Můj / tohoto světa); klonováním do „Můj" si bestii přeneseš mezi světy. Systémové (globální) bestie smí vytvářet/upravovat jen Admin/Superadmin — v záložce Systémové se jim zobrazí „+ Nová bestie" a editor s rozsahem „Globální". Smazání je „soft" (do koše, lze obnovit). Bestie z bestiáře se spawnují na taktickou mapu přes panel orchestrace („Bestiář — spawn na mapu" → „+ z katalogu").',
  },
  {
    path: "/svet/:slug/admin/sablona-deniku",
    name: "Šablona deníku světa",
    status: "ok",
    who: "PJ (Admin/Superadmin bypass)",
    what: 'Editor šablony deníku světa — definuje, jaké atributy mají všechny postavy ve světě (HP, Stamina, Iniciativa, vlastní seznam povolání, libovolné textové bloky). Stránka má tři panely vedle sebe: vlevo seznam bloků s drag&drop pořadím (na mobilu nahrazeno ▲/▼ tlačítky), uprostřed konfigurace zvoleného bloku (label, klíč, typ, popis, min/max, barva, položky výběru, sekce), vpravo živý náhled jak bude blok vypadat u postavy. Typy bloků: stat (číslo), bar (HP/Energie s vizuálním pruhem), list (výběr ze seznamu), text, textarea, number. V hlavičce je přepínač verzí (každé uložení = nová verze, předchozí se archivuje), Import/Export JSON pro přenos schématu mezi světy a tlačítko „Reset overridů" — smaže `personalDiarySchema` u všech postav světa (pokud chceš sjednotit po velké změně schématu). Archivovanou verzi lze prohlížet jako read-only a tlačítkem „Obnovit jako vN+1" ji vrátit do aktivního stavu. Postavy ve světě používají tuto svět-level šablonu jako fallback; pokud postava chce vlastní (např. Boss má extra staty), v jejím deníku v edit režimu klikni „Vlastní šablona" — zkopíruje aktuální svět-level a otevře editor pro tuto postavu. **Pozor:** pokud má svět nastavený herní systém z 12 podporovaných (Matrix RPG — vlastní pro projekt Matrix/Ikaros, CoC, DnD 5e, Drd2, Drd16, DrdH, DrdPlus, Fate, GURPS, JaD, PI, Shadowrun, plus aliasy `dnd`→DnD 5e, `pribehy_imperia`→PI), deník postavy se renderuje přes **dedikovaný systémový sheet** (kompletní data + vlastní vizuál) místo bloků z této šablony — editor schématu se v takovém deníku skryje a místo něj zobrazí badge s názvem systému. Bloková šablona se uplatní jen pro neznámé/vlastní systémy.',
  },
  {
    path: "/svet/:slug/novinky",
    name: "Novinky světa",
    status: "ok",
    who: "Členové světa (správa PomocnyPJ+)",
    what: 'Oznámení daného světa. Karta má 16:9 hero obrázek (volitelně) s nastavitelným středem výřezu, barevný štítek typu (Informace / Důležité / Systémové) a datum. Pomocný PJ a Pán jeskyně tu novinky spravují: přepínač Aktivní/Archiv, tlačítko Nové oznámení, na kartě kebab menu (•••) Upravit / Archivovat / Smazat. Novinka může mít odkaz — buď na konkrétní wiki stránku světa (autocomplete vyhledávání), nebo na externí URL (nelze obojí současně). Klik na interní odkaz tě vezme přímo na stránku ve světě. Stránka se prokliká i z dlaždice Novinky na přehledu světa. **Datum oznámení může být reálné nebo herní** — v editoru je přepínač „Reálné / Ve světě"; ve světě se vybere kalendář a fantasy datum (např. „2. Stříbra 8742"). Karta pak ukazuje fantasy datum a v tooltipu drží reálné datum.',
  },
  {
    path: "/svet/:slug/kalendar",
    name: "Kalendář světa (PJ pohled)",
    status: "ok",
    who: "Členové světa (PJ vidí všechny zdroje, hráč jen veřejné)",
    what: 'Sjednocený měsíční kalendář, který v jedné mřížce zobrazuje akce světa, kalendáře všech postav, NPC i lokací. Listuješ mezi měsíci šipkami. Klik na barevný štítek události otevře detail (s informací z jakého kalendáře pochází). **Density toggle** v toolbaru (od 9.4) přepíná tři hustoty zobrazení: **Detail** (textové chipy s názvy, default), **Kompakt** (4px barevné proužky bez textu — hover ukáže název) a **Heat** (cell má jen barevný gradient podle počtu eventů, číslo vedle dne). Pokud cell překročí 8 events v Detail → automaticky se přepne do Kompakt, při 30+ → Heat (badge umožní vynutit user volbu). Pokud má cell víc eventů než se vejde, „+ N dalších" odkaz / klik na heat cell otevře **side panel zprava** s plným seznamem eventů dne (sortable: Akce → Hráči → NPC → Lokace → čas). ESC nebo klik mimo zavře panel, grid kalendáře zůstává viditelný v pozadí. **Filter Tree** v sidebaru — hierarchický strom s search boxem (1 entita = 1 řádek), 4 collapsible skupiny (Akce světa / Postavy hráčů / NPC / Lokace), tri-state group checkbox (zaškrtnout/odškrtnout celou skupinu), per-entita color swatch + počet eventů. Bulk tlačítka „Schovat vše" / „Reset". Pokud má svět víc kalendářů (Lidský, Elfí…), v horní liště je rozbalovací nabídka „Zobrazený kalendář" — události se přepočítají do zvoleného kalendáře. V buňkách dne se zobrazují fáze měsíců (🌑🌓🌕🌗) a tenká barevná linka podle aktuální sezóny.',
  },
  {
    path: "/svet/:slug/admin/kalendare",
    name: "Správa kalendářů světa",
    status: "ok",
    who: "PJ+ (Pán jeskyně, Admin, Superadmin)",
    what: 'Multi-kalendář per svět — můžeš vytvořit víc souběžných kalendářů (Lidský, Elfí, Drowí…). Vlevo seznam kalendářů, hvězda ⭐ označuje výchozí (dashboardy a novinky), hodiny 🕐 označují kalendář aktivní pro **časovou osu** — historii světa. Najet myší nad řádek a kliknout na 🕐 = přepneš timeline kalendář (nezávisle na výchozím). Editor má 6 sekcí: Identita (slug, název), Hodiny (počet hodin v dni), Týden (libovolný počet dnů s vlastními názvy), Měsíce (počet, název, délka), Nebeská tělesa (orbita, barva, ikona — engine spočítá 8 fází), Sezóny (počátek = měsíc + den, barva, ikona). Smazat lze jen ne-výchozí kalendář. **Tlačítko „+ Přidat kalendář" otevře 2-step wizard:** krok 1 = výběr šablony („Prázdný" nahoře, nebo z databáze 14 historických kalendářů). Solární / lunární s pevnou strukturou: Gregoriánský, Juliánský, Perský (Solar Hidžra), Indický Saka, Etiopský, Koptský, Buddhistický thajský, Staroegyptský civilní, Holocénní, Islámský/Hidžra. **Lunisolární (s přestupným měsícem v Metonic 19-letém cyklu):** Židovský (adar I), Čínský (zjednodušený 13. měsíc), Babylonský (addaru II), Řecký Attický (poseideón II). Šablona pre-fillne kompletní config (měsíce, dny v týdnu, nebeská tělesa, sezóny, přestupné/lunisolární pravidlo). Krok 2 = identita (název + slug se pre-fillne z preset, slug se auto-přejmenuje pokud konflikt — např. `gregorian-2`). Nový svět dostane podle volby v Tvorbě světa — defaultně Gregoriánský s reálným Měsícem.',
  },
  {
    path: "/svet/:slug/admin/headline",
    name: "Hlavní lišta světa",
    status: "ok",
    who: "PJ (Admin/Superadmin bypass)",
    what: 'Editor horní lišty světa s živým náhledem (vpravo na počítači, nahoře na mobilu). Čtyři sekce: **Viditelnost modulů** — zaškrtáváním skryješ z lišty moduly, které svět nepoužívá (Mapa vesmíru, Pavučina, Obchod, Bestiář, …); esenciály (Přehled, Stránky, Novinky, Pravidla) skrýt nelze a skrytá stránka zůstává dostupná přes URL. **Vlastní navigace** — postavíš si vlastní skupiny (rozbalovací menu) a odkazy, které se přidají za systémovou navigaci; každý odkaz míří na stránku světa (vyhledávání) nebo na vlastní URL, řadíš je šipkami ▲/▼. **Šablony menu** — pojmenované sady odkazů, které jedním klikem („Vložit") rozbalíš jako novou skupinu do vlastní navigace. **„Last info" box** — krátké oznámení pro členy (např. termín sezení) zobrazené jako proužek pod hlavičkou světa; člen ho může zavřít, ale po změně textu se objeví znovu. Vše uložíš jedním tlačítkem Uložit. Stránku otevřeš i z Nastavení světa → záložka Hlavní lišta.',
  },
  {
    path: "/svet/:slug/timeline",
    name: "Časová osa světa",
    status: "ok",
    who: "Členové světa (správa Pomocný PJ+)",
    what: 'Vertikální historická osa nejdůležitějších událostí světa. Karty jsou seřazené chronologicky (nejnovější rok nahoře), v rámci roku od nejstaršího po nejnovější. Každá karta nese fantasy datum (např. „Rok 1453, 14. Vědurnu, 14:00" nebo „Rok 487 př. n. l."), volitelný hero obrázek (klik = prohlížeč na celou obrazovku), text s formátováním, odkaz na externí URL nebo na wiki stránku světa a malé ikonky fází nebeských těles pro daný den (úplněk, nov…). **Vedle datum chipu je 🔄 tlačítko „Převést" (zobrazí se jen pokud má svět víc kalendářů)** — kliknutí otevře popup s datem v každém z ostatních kalendářů světa (např. „14. Vědurnu 1453 = 25. května 2026 Gregorian = 12. května 2026 Julián"). Sticky bublina mezi skupinami ukazuje aktuální rok. Vpravo je sidebar „Skok na rok" — seznam všech roků s počty událostí, klik na rok přeskočí přímo k němu. Filtrovat lze rokem (od/do), hledat ve slovech a přepnout pořadí. Pomocný PJ a Pán jeskyně vidí tlačítko „Nová událost" a u každé karty menu (•••) Upravit / Smazat. V editoru lze pro daný den přepsat fáze nebeských těles (sekce „Nebeská tělesa pro tento den" — užitečné pro narativní efekt, např. „úplněk na den bitvy" nebo zatmění). Kalendář pro datum se přebírá z toho, který je v Správě kalendářů označený hodinami 🕐 (nezávisle na výchozím). Záporné roky jsou plně podporované — píše se „před naším letopočtem".',
  },
  {
    path: "/svet/:slug/akce",
    name: "Akce světa",
    status: "ok",
    who: "Členové světa (správa Pomocný PJ+; archiv vidí jen Pomocný PJ a Pán jeskyně)",
    what: 'Seznam herních akcí světa s kartami — hero obrázek, datum, odpočet (DNES / ZÍTRA / za N dní), popis a tlačítko Zúčastním se. Pomocný PJ a Pán jeskyně mají v hlavičce přepínač Nadcházející / Archiv, výběr skupiny a tlačítko Nová akce; v rohu každé karty menu (•••) Upravit / Smazat. Akce může být skupinová (vidí jen členové vybrané skupiny) — to si vybereš v nové akci přes zaškrtnutí „Vidí jen členové této skupiny"; karta pak nese barevný štítek skupiny se zámečkem. Obrázek umí střed výřezu (klikneš v editoru, kam ho chceš mít). Archiv je neomezený dozadu — proběhlé akce zůstávají navždy (cut-off 24 hodin po proběhnutí). Hráč vidí jen Nadcházející; přepínač Archiv pro něj neexistuje. Pod každou akcí jsou komentáře — klik na „Komentovat" rozbalí diskuzi pod kartou. Vláknové komentáře (root + jednoúrovňová odpověď), reakce emoji (👍 ❤️ 😂 😮 😢 🎉) jedním klikem, vlastní komentář upravíš nebo smažeš; Pomocný PJ a Pán jeskyně můžou smazat cizí (moderace). Smazaný komentář zůstane v threadu jako placeholder „Komentář byl smazán" — odpovědi pod ním zůstanou viditelné.',
  },
  {
    path: "/svet/:slug/hraci",
    name: "Hráči světa",
    status: "ok",
    who: "Členové světa",
    what: "Adresář členů světa. Nahoře vedení — Pán jeskyně a Pomocní PJ —, pod tím skupiny a jejich členové, nakonec členové bez skupiny. Každý člen má kartu s avatarem, jménem a rolí. Otevřeš ji i kliknutím na dlaždici Hráčů na přehledu světa. Odkaz na stránku postavy a deníky přibude s krokem postav.",
  },
  {
    path: "/svet/:slug/skupina/:skupina",
    name: "Skupina (seznam hráčů)",
    status: "ok",
    who: "Členové světa",
    what: "Stránka jedné skupiny, dostupná z horní lišty: záložka Informace → rozbalovací Skupiny → konkrétní skupina (skupiny si pojmenuje Pán jeskyně, např. Lumíci / Evropani) nebo Nezařazení. Zobrazí se hráči té skupiny s avatarem a jménem postavy; karta vede na stránku postavy. Ukazují se jen členové, kteří mají přiřazenou postavu (role Hráč a výš); Pán jeskyně a Pomocný PJ bez postavy se nezobrazují. Nezařazení = hrající členové bez skupiny. Seznam se automaticky mění podle přiřazení postav a skupin.",
  },
  {
    path: "/svet/:slug/pravidla",
    name: "Pravidla světa",
    status: "ok",
    who: "Členové světa (úpravy: Pomocný PJ a výš)",
    what: "Pravidla světa jako wiki stránka — příručka, kterou si Pán jeskyně (a Pomocný PJ) sám napíše a kdykoli upraví stejným editorem jako ostatní wiki stránky (text, obrázky, sekce). Otevřeš z horní lišty: Informace → Pravidla. Dokud nejsou nastavena, Pomocný PJ a výš uvidí tlačítko pro vytvoření pravidel, ostatní hlášku, že zatím nejsou nastavena.",
  },
  {
    path: "/svet/:slug/postavy",
    name: "Adresář postav",
    status: "ok",
    who: "Členové světa (tvorba a správa: Pán jeskyně)",
    what: "Seznam všech postav světa rozdělený do tří sekcí — Postavy hráčů, NPC a Lokace. Nad seznamem je filtr typu (Vše / Hráčské / NPC / Lokace). Karta postavy ukazuje avatar, jméno a typ; u hráčských navíc jméno přiřazeného hráče. Klik na kartu otevře detail postavy. Pán jeskyně má v záhlaví tlačítko Nová postava — modal s volbou typu (PC / NPC / Lokace), jménem, URL adresou (slug se automaticky vygeneruje), avatarem a krátkým popisem; u Hráčské postavy navíc výběr hráče. Po vytvoření se automaticky založí přidružený deník, kalendář a podle typu i finance s výbavou. Přiřazení existující postavy hráči (a tvorba postavy přímo pro konkrétního hráče) je v Nastavení světa → Členové.",
  },
  {
    path: "/svet/:slug/postava/:postava",
    name: "Detail postavy",
    status: "ok",
    who: "Členové světa (úpravy: Pomocný PJ a výš, nebo vlastník postavy; mazání a převod typu: Pán jeskyně)",
    what: 'Karta postavy s až sedmi záložkami: Profil (veřejné bio a údaje), Soukromé, Deník, Finance, Výbava, Kalendář a Poznámky. Profil vidí každý člen světa. Šest soukromých záložek — Soukromé, Deník, Finance, Výbava, Kalendář a Poznámky — vidí jen Pán jeskyně, Pomocný PJ a vlastník postavy. Záložka Kalendář zobrazuje měsíční mřížku s fázemi měsíce a sezónami. V editačním režimu klik na prázdnou buňku otevře nové okno pro vytvoření události s předvyplněným datem (datum si pamatuje poslední použité — další nová událost rovnou pokračuje na něj); klik na existující událost otevře úpravu s tlačítkem Smazat. Každá událost má vlastní symbol (volný emoji 🗡️/🥂/🔒), který odlišuje typ; barva je společná pro všechny události postavy a nastavuje se v Nastavení nad kalendářem. **Deník vypadá podle herního systému světa** — Ikaros podporuje 12 dedikovaných systémových šablon (Matrix RPG cyberpunk-magie — vlastní pro projekt Matrix/Ikaros, CoC parchment, DnD 5e Arcane, Drd2 Dark Forest, Drd16 Klasická Jeskyně, DrdH Heroic Golden, DrdPlus Mystical Arcane, Fate Neural Sleek, GURPS Cold Steel, JaD Pergamen, PI Victorian Brass, Shadowrun Cyberpunk Neon). Každý systém má vlastní vizuál + strukturu (atributy, dovednosti, HP/mana trackery, profession-cards, schopnosti, …). Pokud svět používá neznámý systém nebo žádný, deník se renderuje přes generickou šablonu z editoru schématu (`/svet/<slug>/admin/sablona-deniku`). Soukromé obsahuje skryté informace k postavě (tajný kontakt, motivace, dohody s PJ) — řádky se štítkem a hodnotou + volný RichText pod nimi; vše se ukládá průběžně automaticky (cca po vteřině klidu). Stejně tak Poznámky — jsou vizuálně zápisník na linkovaném papíře, píše se v něm rovnou (jako tužkou), bez režimu úprav, ukládá se průběžně. Finance podporují víc účtů — postava může mít až 20 účtů (osobní, společné, tajné). Mezi účty se přepíná v hlavičce; nahoře vidíš souhrn za všechny účty napříč měnami. U každého účtu je hero karta s aktuálním zůstatkem, split Příjmy / Výdaje, historie transakcí a tlačítko Poslat — peníze můžeš převést na jiný účet (vlastní nebo jiné postavy, musí být ve stejné měně). Účet může být sdílený mezi víc postavami (společný měšec party); spoluvlastníci s ním pracují stejně. Hero karta zobrazuje částku se symbolem měny z **Převodníku měn světa**; pokud má účet měnu, která ve světě není definovaná, vedle zůstatku se objeví ⚠ chip „kontaktuj PJ". Souhrn nad účty ukazuje **Celkem v hráčově preferované měně** (volba se sdílí s Převodníkem 11.4) + rozklad per měně. „Nastavení účtu" dole obsahuje typ, „Vedeno u" (banka/správce), měnu a spoluvlastníky — všechno smí měnit jen PJ, hráč to vidí read-only. **Pán jeskyně může v Nastavení účtu povolit hráči samostatný vklad i výběr** (povinný důvod do historie); pak má hráč v hlavičce účtu tlačítko „💰 Vklad / Výběr". Pán jeskyně má tlačítko vždy. **Zaúčtovat měsíc** otevře okno s přehledem (kolik se přičte / odečte) a polem pro **herní datum**; defaultně se předvyplní aktuální in-game datum světa (nastavuje Generátor počasí, sdílí napříč všemi nástroji). Stejné herní datum nese i Poslání peněz a Vklad/Výběr — v historii transakcí vidíš primárně herní datum (📅 ikona), reálné datum zápisu je v tooltipu. Výbava: sklápěcí sekce s položkami a počítadlem; množství u položky můžeš upravit i mimo režim úprav přes tlačítka − / + přímo u řádku. Postava libovolného typu — Postava hráče, NPC i Lokace — má Finance a Výbavu vždy k dispozici. Pán jeskyně navíc nastavuje přístupová pravidla — kdo postavu uvidí. Pán jeskyně má v hlavičce vedle Upravit i menu se třemi tečkami: Převést na NPC, Převést na hráčskou postavu (vybere se hráč) a Smazat postavu (vč. všech přidružených dokumentů a účtů). Neuložené změny hlídá potvrzení při odchodu (Soukromé a Poznámky se navíc průběžně samy ukládají).',
  },
  {
    path: "/svet/:slug/prevodnik-men",
    name: "Převodník měn",
    status: "ok",
    who: "Členové světa (převod každý; úprava existujících měn Pomocný PJ a výš; přidat/smazat měnu jen Pán jeskyně)",
    what: 'Stránka má dvě sekce nad sebou. Nahoře **Převodník** — zadáš částku a měnu „z" a vlevo/vpravo se okamžitě dopočítá v měně „do". Tlačítko ⇅ uprostřed prohodí měny. Tvoje volba cílové měny se uloží per svět (příště se otevře tahle měna jako default — později ji bude používat i obchod a účty postav). Dole **Měny ve světě** — tabulka s kódem, názvem, symbolem a kurzem. První měna je **základ** (kurz 1.0), všechny ostatní mají kurz relativně k ní (např. 1 zlaťák = 10 stříbrňáků → ZL má rate 1.0 a ST má rate 0.1). Hráč jen čte. Pomocný PJ má u každé měny kebab menu (•••) s **Upravit** (rate, název, symbol) a **Nastavit jako základ** (přepočítá kurzy ostatních měn tak, aby poměry zůstaly stejné). Pán jeskyně navíc vidí tlačítko **+ Přidat měnu** a v kebab **Smazat**. Pokud má svět 0 nebo 1 měnu, převodník se skryje. Kód měny musí být 1–8 znaků A–Z 0–9 a unikátní ve světě.',
  },
  {
    path: "/svet/:slug/chat",
    name: "Světový chat",
    status: "ok",
    who: "Členové světa (konverzace podle přístupu)",
    what: 'Chat uvnitř světa — vlevo kanály a v nich konverzace, uprostřed zprávy, vpravo (jen pro PJ) panel Přítomní podle role. Konverzace přepínáš, oblíbené si připneš nahoru. U každé konverzace je odznak nepřečtených a náhled poslední zprávy. Globální konverzace jsou pro hráče a výš; PJ a Pomocný PJ zakládají kanály a konverzace (veřejné, podle rolí, nebo soukromé pro vybrané členy — včetně hromadného 1:1 se všemi hráči), zpětně je upravují (přejmenovat, vyměnit obrázek, zvolit jednu z 12 barev a 24 ikon, změnit přístup, přesunout konverzaci, smazat) a libovolně **přetahují drag-and-drop** — kanály v sidebaru i konverzace uvnitř kanálu. Drag handle (3 puntíky vlevo od názvu) vidí jen PJ; přesun konverzace **mezi** kanály se dělá přes nastavení konverzace, ne dragem. U zpráv funguje odpověď s citací (klik na citaci skočí na originál), emoji reakce, šepot (jen pro vybraného člena; PJ vidí všechny šepoty), přílohy obrázků a dokumentů (do 10 MB; max 10 obrázků + 4 dokumenty na zprávu), inline editace vlastní zprávy — text i přílohy (existující odebereš ×, nové přidáš sponkou 📎; hod kostkou nelze upravit) a označení smazaných zpráv. Hráč zmíníš `@jménoÚčtu` — autocomplete pod composerem nabídne členy, vybranému přijde upozornění. K dispozici je `📅 datum ve hře` (badge nad zprávou) a pro PJ `🎭 NPC mód` (libovolné jméno + URL avataru; zpráva pak nese tag NPC). Vzhled mojí zprávy v tomto světě (`🎨` v composeru) — barva + písmo (8 fontů na výběr), uloží se zvlášť pro každý svět. **Hod kostkou** přes `🎲` v composeru — nabídka kostek (Fate / k4 / k6 / k8 / k10 / k12 / k20 / k%) podle toho, co PJ ve světě povolil; Pool a Mixed režim pro více kostek; můžeš zadat popisek a modifier. Kostka se vykreslí jako 3D scéna (čerstvý hod se zatočí, starší stojí), výsledek má glow podle úspěchu/botche; smazat hod můžou jen PJ/Admin, editace dice je zakázaná. Vzhled svých kostek si vybíráš ze 30 skinů v 5 kategoriích (`⚙ Vzhled mých kostek` v dice popoveru) — per typ kostky zvlášť, uloží se per svět. Zpráva se ti zobrazí ihned po Enter (s tečkou „posílá se"); když se neodešle, pruh nabídne „Zkusit znovu / Smazat" bez rizika duplikátu. Panel Přítomní si PJ otevírá tlačítkem 👥 v hlavičce konverzace — badge ukazuje počet online i když je panel zavřený, volba se pamatuje per svět. Vlastní emoty světa: PJ a Pomocný PJ nahrávají v `Administraci → Custom emoty` (PNG/JPG/GIF/WebP do 512 KB, max 100 na svět); v chatu pak píšeš jejich `:shortcode:` (např. `:smile:`) a vykreslí se jako obrázek. Pod tlačítkem 😊 v composeru najdeš picker se třemi sekcemi (Tohoto světa / Globální platforma / Statické Unicode emoji) s vyhledáváním — klik vloží shortcode na pozici kurzoru.',
  },
  {
    path: "/svet/:slug/pavucina",
    name: "Pavučina",
    status: "ok",
    who: "Členové světa (každý má vlastní Pavučinu; PJ navíc vidí Pavučinu každého hráče jen pro čtení)",
    what: 'Vztahový graf kampaně. **Každý má svou vlastní Pavučinu** — síť subjektů (Postava, CP, Frakce, Organizace, Stát, Lokace, Ostatní) a **oboustranných vztahů** mezi nimi. PJ má svou pracovní vrstvu a přepínačem nahoře si zobrazí Pavučinu kteréhokoli hráče (jen pro čtení — needituje ji, ale jednotlivé subjekty si může tlačítkem 📋 zkopírovat do své vrstvy). Vztah má **dvě nezávislé strany** (A může milovat, B nenávidět): u každé strany zvolíš pojmenovanou emoci (paleta se liší pro osoby vs. organizace/státy), sílu 1–10 a valenci −3…+3 (nenávist ↔ láska / válka ↔ spojenectví); PJ má navíc tajná pole (záměr, pozadí), která hráč nevidí. Tři záložky: **◉ Dnes** (vztahy v krizi, aktivní linky, poslední změny), **Subjekty** (3-panel — seznam, vztahy vybraného subjektu, detail) a **Síť** — 2D silový graf, kde uzly mají barvu dle typu a hrany barvu dle emoce (červená nepřátelství → zelená přátelství) a tloušťku dle síly. V grafu klikni na uzel pro **fokus** (zvýrazní jeho okolí, zbytek ztlumí), filtruj dle typu/emoce nebo hledej a vycentruj. Záložka **Linky** = příběhové linky kampaně: úroveň (makro/střední/mikro), status, shrnutí, co se stalo, co si myslí hráči, další krok a zapojené subjekty (hledatelný výběr); PJ má navíc tajná pole (pravda, záměr). Aktivní linky se ukazují v „Dnes". Strom scénářů (Storyboard) najdeš na záložce **Scénáře**; rychlé poznámky přijdou v dalším kroku.',
  },
];

function StatusPill({ status }: { status: PageStatus }) {
  if (status === "ok") {
    return (
      <span className={`${s.statusPill} ${s.statusPillOk}`}>✅ Funguje</span>
    );
  }
  return (
    <span className={`${s.statusPill} ${s.statusPillSoon}`}>
      🚧 Připravujeme
    </span>
  );
}

function PageItem({ doc }: { doc: PageDoc }) {
  const isLink =
    doc.status === "ok" && doc.path.startsWith("/") && !doc.path.includes(":");
  return (
    <div className={`${s.pageItem} ${doc.status === "ok" ? s.pageItemOk : ""}`}>
      <h3>
        {doc.name}
        <span className={s.pagePath}>{doc.path}</span>
        <StatusPill status={doc.status} />
      </h3>
      <p className={s.pageWho}>
        <strong>Komu:</strong> {doc.who}
        {doc.fáze && (
          <>
            {" "}
            &middot; <em>{doc.fáze}</em>
          </>
        )}
      </p>
      <p>{doc.what}</p>
      {isLink && (
        <p>
          <Link to={doc.path}>Otevřít stránku →</Link>
        </p>
      )}
    </div>
  );
}

export function PagesSection() {
  return (
    <>
      <p>
        Seznam stránek platformy s tím, co reálně dělají dnes. Položky se
        štítkem{" "}
        <span className={`${s.statusPill} ${s.statusPillSoon}`}>
          🚧 Připravujeme
        </span>{" "}
        jsou plánované &mdash; uvádíme je jen pro orientaci.
      </p>

      <div className={s.pageGroup}>
        <h2>Ikaros — to, co teď funguje</h2>
        {IKAROS_PAGES.map((doc) => (
          <PageItem key={doc.path + doc.name} doc={doc} />
        ))}
      </div>

      <div className={s.pageGroup}>
        <h2>Ikaros — připravujeme</h2>
        {SOON_IKAROS.map((doc) => (
          <PageItem key={doc.path + doc.name} doc={doc} />
        ))}
      </div>

      <div className={s.pageGroup}>
        <h2>Světová vrstva — to, co funguje</h2>
        <p>
          Stránky uvnitř konkrétního světa (URL <code>/svet/:slug/...</code>),
          které jsou už hotové. Každý svět má vlastní motiv, role a obsah
          nezávisle na Ikaru.
        </p>
        {WORLD_PAGES_OK.map((doc) => (
          <PageItem key={doc.path + doc.name} doc={doc} />
        ))}
      </div>

      <div className={s.pageGroup}>
        <h2>Světová vrstva — připravujeme</h2>
        <p>
          Vše níže běží uvnitř konkrétního světa (URL{" "}
          <code>/svet/:slug/...</code>). Každý svět má vlastní motiv, role a
          obsah nezávisle na Ikaru.
        </p>
        {SOON_WORLD.map((doc) => (
          <PageItem key={doc.path + doc.name} doc={doc} />
        ))}
      </div>
    </>
  );
}
