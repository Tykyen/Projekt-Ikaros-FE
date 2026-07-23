/**
 * Spec 26.6 — 21 hlubokých Tier 0 topiků (kanonický číselník 06 §5.1b).
 * Hlas: platformní routy = Ishida, world routy = Joe (02 §2 — věcně,
 * bez vykřičníků v instrukcích, humor nikdy u chyb). Každé tvrzení kryje
 * kapitola docs/funkce/ (source) — topik NIKDY netvrdí, co tam není.
 * Chat/TM topiky nabízíme i na dashboardu světa — na kolizních plochách
 * je FAB skrytý (03 §5) a karta by tam nebyla k mání.
 */
import type { HelpTopic } from './types';
import { INSITU_TOPIKY } from './insitu';

export const TOPIKY: readonly HelpTopic[] = [
  // MVP-B: in-situ taháky („?" chat/TM) jako topiky — adaptéry viz insitu.tsx.
  ...INSITU_TOPIKY,
  // ── Role (příčná vrstva — zákys č. 1) ──────────────────────────────────
  {
    id: 'role.dve-patra',
    title: 'Dvě patra rolí: platforma vs. svět',
    tags: ['role', 'admin', 'pj', 'opravneni', 'prava'],
    routes: ['/svet/:worldSlug', '/svet/:worldSlug/hraci', '/ikaros/uzivatele'],
    body: {
      odstavce: [
        'Role tu žijí ve dvou patrech. Platformní role (Ikarus, Admin, Superadmin) platí pro celý web — světové role (Čtenář až PJ) platí jen uvnitř jednoho světa.',
        'Důležité pravidlo: platformní Admin je v cizím světě nikdo. Vládu nad světem má vždy jeho PJ — správa platformy do hry nezasahuje.',
        'Proto můžeš být PJ ve svém světě a obyčejný Hráč v sousedním. Každý svět ti přiděluje roli zvlášť.',
      ],
    },
    source: { kapitola: '09' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'role.svetove',
    title: 'Světové role: kdo co smí',
    tags: ['role', 'ctenar', 'hrac', 'korektor', 'pomocny pj', 'hierarchie'],
    routes: ['/svet/:worldSlug/hraci', '/svet/:worldSlug/nastaveni', '/svet/:worldSlug'],
    body: {
      odstavce: [
        'Hierarchie světa odspodu: Čtenář (jen čte) → Hráč (postava, chat, hraní) → Korektor (pomáhá se správou části nastavení) → Pomocný PJ (většina nástrojů PJ) → PJ (vládne světu).',
        'Pozor na asymetrii: Pomocný PJ vede hru a spravuje obsah, ale žádosti o vstup schvaluje jen PJ. A předat svět umí výhradně jeho vlastník.',
      ],
      kroky: [
        'Roli člena mění PJ nebo Pomocný PJ v Nastavení světa, záložka Členové.',
        'Stránka Hráči slouží k žádostem a pozvánkám — role se mění jinde.',
      ],
    },
    akce: [
      { label: 'Otevřít Hráče', to: '/svet/:worldSlug/hraci' },
      {
        label: 'Role v plné nápovědě',
        to: '/ikaros/napoveda?sekce=role&topik=role-svetove',
      },
    ],
    minAudienceNote: 'Role přiděluje PJ — pokud potřebuješ vyšší, napiš mu.',
    source: { kapitola: '09' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'role.admin-elevace',
    title: 'Admin ve světě: elevace',
    tags: ['admin', 'elevace', 'aktivovat admina', 'bypass'],
    routes: ['/svet/:worldSlug'],
    audience: ['admin'],
    body: {
      odstavce: [
        'Jako platformní Admin nemáš ve světě automatickou moc — nejdřív musíš „nahodit práva" (elevaci) pro konkrétní svět.',
        'Elevace dává plnou moc PJ — nastavení, členy i schvalování žádostí. Jediné, co neobejde, je předání světa: to zůstává vlastníkovi. Obnova smazaného světa je naopak čistě platformní akce Admina — jde i bez elevace.',
      ],
    },
    source: { kapitola: '08' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },

  // ── Vstup do světa ─────────────────────────────────────────────────────
  {
    id: 'svet.vstup',
    title: 'Jak se vstupuje do světa',
    tags: ['vstup', 'pristup', 'accessmode', 'pozvanka', 'zadost', 'brana'],
    routes: ['/ikaros/vesmiry', '/svet/:worldSlug', '/invite/:token'],
    body: {
      odstavce: [
        'Každý svět má jeden ze čtyř režimů přístupu: Veřejný (vstoupíš rovnou), Veřejný se schválením (klepeš — žádost schvaluje PJ), Soukromý (jen na pozvání) a Uzavřený (nikdo nový nevstoupí).',
        'K tomu může mít svět zapnutou výkladní skříň — ta není režim, ale samostatné okno pro čtení vybraných sekcí bez vstupu.',
        'Pozvánka nebo pozvací odkaz tě přivede jako Čtenáře — o vyšší roli pak rozhoduje PJ.',
        'Tlačítko na úvodní stránce světa odpovídá jeho režimu: „Vstoupit do světa", dvojice „Chci hrát" / „Jen číst", nebo nic (uzavřený svět nikoho nového nepustí).',
      ],
    },
    akce: [{ label: 'Katalog světů', to: '/ikaros/vesmiry' }],
    source: { kapitola: '09' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'svet.vstup.hrat-vs-cist',
    title: '„Chci hrát" vs. „Jen číst"',
    tags: ['hrat', 'cist', 'zadost', 'postava', 'ctenar'],
    routes: ['/ikaros/vesmiry', '/svet/:worldSlug'],
    body: {
      odstavce: [
        'Dvě různé cesty dovnitř. „Chci hrát" podá žádost o vstup — po schválení ti PJ založí postavu a hraješ.',
        '„Jen číst" podá žádost o čtení — Čtenářem se stáváš po schválení PJ (jen u Veřejného světa vstoupíš rovnou). Čtenář vidí obsah, ale nemá postavu ani chat hráčů.',
        'Čtenář se může na Hráče doptat kdykoli později — rozhodnutí je na PJ.',
      ],
    },
    source: { kapitola: '09' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'svet.zadatel',
    title: 'Čekání na schválení',
    tags: ['zadatel', 'zadost', 'ceka', 'schvaleni', 'pending'],
    routes: ['/svet/:worldSlug'],
    body: {
      odstavce: [
        'Žadatel není role — je to stav mezi podáním žádosti a rozhodnutím PJ. Dokud PJ nerozhodne, dovnitř nesmí nikdo.',
        'Stav žádosti vidíš na dashboardu světa; tam ji můžeš i zrušit. Čekání není chyba — PJ jsou lidé a schvalují, až se dostanou k počítači.',
        'Mezitím se můžeš rozhlédnout jinde: Putyka je otevřená všem a katalog světů má i veřejné světy bez čekání.',
      ],
    },
    akce: [
      { label: 'Katalog světů', to: '/ikaros/vesmiry' },
      { label: 'Napsat PJ (Pošta)', to: '/ikaros/posta' },
    ],
    source: { kapitola: '09' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },

  // ── Založení a stavba světa (PJ) ───────────────────────────────────────
  {
    id: 'svet.zalozeni',
    title: 'Založení světa: co je nevratné',
    tags: ['zalozeni', 'wizard', 'technologicka uroven', 'magie', 'nabozenstvi'],
    routes: ['/ikaros/vytvorit-svet'],
    body: {
      odstavce: [
        'Povinná jsou jen tři pole: název, žánr a herní systém — všechno ostatní má rozumné výchozí hodnoty.',
        'Jedna past: technologická úroveň, magie a náboženství se volí JEN při založení. Později je změníš už jen přepsáním seedovaných stránek, ne přepínačem.',
        'Svět vzniká Soukromý — nikdo cizí ho nevidí, dokud sám neotevřeš bránu v Nastavení.',
      ],
    },
    source: { kapitola: '03' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'svet.neni-prazdny',
    title: 'Nový svět není prázdný',
    tags: ['seed', 'pravidla', 'meny', 'kalendar', 'zaklad'],
    routes: ['/svet/:worldSlug'],
    audience: ['pj', 'pomocnyPJ', 'admin'],
    body: {
      odstavce: [
        'Se světem se ti předchystalo šest základních stránek (pravidla, magie, technologie, náboženství, FAQ, videa), měny i kalendář.',
        'Nic z toho není definitivní — všechno jsou obyčejné stránky a nastavení, které přepíšeš podle svého. Ber je jako lešení, ne jako zeď.',
      ],
      kroky: [
        'Projdi Encyklopedii a uprav seedované stránky.',
        'Zkontroluj měny v Převodníku a kalendář světa.',
      ],
    },
    akce: [{ label: 'Encyklopedie', to: '/svet/:worldSlug/stranky' }],
    source: { kapitola: '11' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'svet.sprava-lidi',
    title: 'Správa lidí: tři místa',
    tags: ['hraci', 'clenove', 'clenstvi', 'zadosti', 'pozvanky', 'skupiny'],
    routes: ['/svet/:worldSlug/hraci', '/svet/:worldSlug/nastaveni'],
    audience: ['pomocnyPJ', 'pj', 'admin'],
    minAudienceNote: 'Tohle je kuchyně PJ — tebe se týká jen výsledek (tvoje role).',
    body: {
      odstavce: [
        'Lidi světa spravuješ na třech místech a každé dělá něco jiného.',
      ],
      kroky: [
        'Hráči — žádosti o vstup, pozvánky a pozvací odkazy.',
        'Nastavení → Členové — role, skupiny a přiřazení AKJ prověrek.',
        'Nastavení → Členství — předání světa a odchody.',
      ],
    },
    akce: [{ label: 'Otevřít Hráče', to: '/svet/:worldSlug/hraci' }],
    source: { kapitola: '09' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'svet.nastaveni.taby',
    title: 'Proč nevidím záložku v Nastavení',
    tags: ['nastaveni', 'taby', 'zalozky', 'role gate', 'system'],
    routes: ['/svet/:worldSlug/nastaveni'],
    body: {
      odstavce: [
        'Nastavení světa má bezmála dvacet záložek, ale nikdy je nevidíš všechny: část je vázaná na roli (většina patří PJ) a část na herní systém světa — třeba šablona deníku se ukazuje jen tam, kde dává smysl.',
        'Chybějící záložka tedy není chyba. Pokud potřebuješ něco, co vidí jen PJ, požádej ho — role jsou popsané v topiku o světových rolích.',
      ],
    },
    source: { kapitola: '10' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },

  // ── Chat světa ─────────────────────────────────────────────────────────
  {
    id: 'svet.chat.kanal-vs-konverzace',
    title: 'Kanály a konverzace',
    tags: ['chat', 'kanal', 'konverzace', 'postavy', 'globalni konverzace'],
    routes: ['/svet/:worldSlug/chat', '/svet/:worldSlug'],
    body: {
      odstavce: [
        'Chat světa má dvě úrovně: kanál je tematická skupina (například Globální, Postavy) a uvnitř kanálu žijí jednotlivé konverzace.',
        'Kanál Postavy je zvláštní — konverzace v něm bývají soukromé mezi hráčem a PJ, proto nevidíš cizí vlákna.',
        'Když nevíš kam psát, Globální konverzace je společný stůl hráčů světa (Čtenář ji nevidí — chat se otevírá s rolí Hráč).',
      ],
    },
    source: { kapitola: '13' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'svet.chat.kostky',
    title: 'Kostky: kde házíš a kdo je povoluje',
    tags: ['kostky', 'dice', 'hod', 'whitelist', '🎲'],
    routes: ['/svet/:worldSlug/chat', '/svet/:worldSlug'],
    body: {
      odstavce: [
        'Hází se ikonou 🎲 v chatu světa a na taktické mapě; klikací hody má i deník v chatu a bojové panely. Samostatná stránka postavy je na čtení a správu.',
        'Které kostky jsou k dispozici, určuje PJ whitelistem v Nastavení světa. Prázdný whitelist znamená, že se zatím neháže — připomeň to PJ.',
      ],
    },
    minAudienceNote: 'Whitelist kostek nastavuje PJ v Nastavení světa.',
    source: { kapitola: '13' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },

  // ── Postavy ────────────────────────────────────────────────────────────
  {
    id: 'postava.zaklada-pj',
    title: 'Postavu ti zakládá PJ',
    tags: ['postava', 'moje postava', 'zalozeni postavy', 'prideleni'],
    routes: ['/svet/:worldSlug/moje-postava', '/svet/:worldSlug/postavy'],
    body: {
      odstavce: [
        'Hráč si postavu sám nezakládá — to je záměr, ne omezení. Postavu tvoří a přiděluje PJ, aby seděla do světa i pravidel.',
        'Nejrychlejší cesta: v žádosti o vstup zvol „Chci hrát" a přilož návrh postavy — jedno schválení PJ ti dá roli Hráče i živou postavu najednou. Kdo vstoupil jako Čtenář, domluví se s PJ dodatečně — nejlíp Poštou nebo osobně; konverzace v kanálu Postavy vzniká až s přidělenou postavou.',
        'Jakmile ji máš, najdeš ji pod Moje postava a v adresáři Postav.',
      ],
    },
    akce: [{ label: 'Otevřít Poštu', to: '/ikaros/posta' }],
    source: { kapitola: '12' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'postava.3-tier',
    title: 'PC, NPC a Bestie — tři druhy postav',
    tags: ['npc', 'pc', 'bestie', 'finance', 'vybava', 'token'],
    routes: ['/svet/:worldSlug/postavy', '/svet/:worldSlug/bestiar'],
    body: {
      odstavce: [
        'Postava hráče (PC) má plnou výbavu: deník, finance, inventář a vlastníka-hráče.',
        'NPC je postava vyprávění — schválně bez financí a výbavy, protože účetnictví kulis by PJ jen zdržovalo.',
        'Bestie je šablona v bestiáři: na mapu se pokládá jako token-kopie, takže úprava šablony zpětně nezmění už položené tokeny.',
      ],
    },
    source: { kapitola: '12' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },

  // ── Stránky a AKJ ──────────────────────────────────────────────────────
  {
    id: 'akj.zamky',
    title: 'Zamčené záložky (AKJ)',
    tags: ['akj', 'zamek', 'clearance', 'proverka', '🔒', 'tajne'],
    routes: ['/svet/:worldSlug/:slug', '/svet/:worldSlug/nastaveni'],
    body: {
      odstavce: [
        'Záložka se zámkem 🔒 znamená obsah za prověrkou (AKJ) — vidíš, ŽE tajemství existuje, ale ne co v něm je.',
        'Úrovně prověrek definuje vedení světa (PJ i Pomocný PJ) v Nastavení, záložka AKJ, a lidem je přiděluje v Členech. PJ a Pomocný PJ vidí za zámky automaticky.',
        'Chceš-li dovnitř, je to herní záležitost: získej prověrku od PJ, ne technickou fintu.',
      ],
    },
    minAudienceNote: 'Prověrky uděluje vedení světa v Nastavení → Členové.',
    source: { kapitola: '11' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'stranky.navrhy',
    title: 'Návrhy stránek: kam zmizel můj text',
    tags: ['navrh', 'pending', 'schvaleni', 'nova stranka', 'wiki'],
    routes: ['/svet/:worldSlug/stranky', '/svet/:worldSlug/nova-stranka'],
    body: {
      odstavce: [
        'Hráč tvoří stránky přes „+ Navrhnout" — návrh čeká na schválení PJ a do té doby ho ostatní nevidí. Tvůj text tedy nezmizel, jen stojí ve frontě.',
        'PJ a Pomocný PJ tvoří i upravují rovnou, bez schvalování — editace stránek je od Pomocného PJ výš.',
        'Schválený návrh se objeví v Encyklopedii jako běžná stránka.',
      ],
    },
    source: { kapitola: '11' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },

  // ── Rozcestníky (3 mapy, 3 kalendáře, dvojí oblíbené, vzhled) ──────────
  {
    id: 'rozcestnik.mapy',
    title: 'Tři „mapy" — která je která',
    tags: ['mapa', 'atlas', 'takticka mapa', 'stavitel', 'podzemi'],
    routes: ['/svet/:worldSlug/mapa', '/svet/:worldSlug/mapy', '/svet/:worldSlug'],
    body: {
      odstavce: [
        'Slovo „mapa" tu nese tři různé nástroje.',
      ],
      kroky: [
        'Mapa (vesmír) — graf lokací a vazeb; Atlas map — obrázkové mapy s piny.',
        'Taktická mapa — živé hraní: tokeny, iniciativa, mlha války.',
        'Stavitel — generátor podzemí, města i krajiny; výsledek exportuješ na taktickou mapu.',
      ],
    },
    source: { kapitola: '14' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'rozcestnik.kalendare',
    title: 'Tři „kalendáře" — který kdy',
    tags: ['kalendar', 'akce', 'timeline', 'cas', 'udalosti'],
    routes: ['/svet/:worldSlug/kalendar', '/svet/:worldSlug/timeline', '/svet/:worldSlug/akce', '/ikaros/akce'],
    body: {
      odstavce: [
        'Kalendáře jsou tři a každý měří jiný čas.',
      ],
      kroky: [
        'Platformní akce (/ikaros/akce) — reálné termíny hráčů a komunity.',
        'Kalendář světa — přehled akcí a událostí postav pro vedení světa (Pomocný PJ a výš). In-game datum posouvá modul Počasí.',
        'Timeline — historická osa světa; na herní akce ani postavy se neváže.',
      ],
    },
    minAudienceNote: 'Kalendář světa vidí až Pomocný PJ — hráčům čas oznamuje PJ.',
    source: { kapitola: '15' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'oblibene.dvoji',
    title: 'Dvojí oblíbené',
    tags: ['oblibene', 'hvezdicka', 'zalozky', 'favorites'],
    routes: ['/ikaros/oblibene', '/svet/:worldSlug/stranky'],
    body: {
      odstavce: [
        'Oblíbené existují dvakrát a nemíchají se. Platformní záložky (/ikaros/oblibene) sbírají diskuze, články a obrázky z celého webu.',
        'Hvězdička uvnitř světa je jiný seznam — připíchne stránku na dashboard světa, jen pro tebe.',
      ],
    },
    akce: [{ label: 'Moje oblíbené', to: '/ikaros/oblibene' }],
    source: { kapitola: '06' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'vzhled.tri-urovne',
    title: 'Tři úrovně vzhledu',
    tags: ['vzhled', 'motiv', 'skin', 'theme', 'barvy'],
    routes: ['/ikaros/profil', '/svet/:worldSlug/nastaveni'],
    body: {
      odstavce: [
        'Vzhled se skládá ze tří vrstev. Globální motiv si volíš v profilu a platí na platformě.',
        'Vzhled světa nastavuje PJ nebo Pomocný PJ pro všechny členy; a Můj vzhled je tvoje osobní odchylka uvnitř světa — dokud ji nezapneš, sleduješ vzhled od PJ.',
        'Když se ti tedy svět „přebarvil sám", nejspíš PJ změnil sdílený vzhled.',
      ],
    },
    source: { kapitola: '10' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },

  // ── Worldbuilding (kroky cesty 26.3) ───────────────────────────────────
  {
    id: 'svet.wiki.wikilinky',
    title: 'Wikilinky: stránky se propojují samy',
    tags: ['wikilink', 'odkaz', 'propojeni', 'wiki', '[['],
    routes: ['/svet/:worldSlug/nova-stranka', '/svet/:worldSlug/stranky', '/svet/:worldSlug/:slug'],
    body: {
      odstavce: [
        'Napiš v textu stránky [[Název stránky]] a vznikne odkaz. Když cílová stránka existuje, propojí se; když ne, odkaz ti ji nabídne založit.',
        'Takhle svět roste přirozeně — píšeš příběh a struktura se plete sama. Encyklopedie pak drží všechno pohromadě.',
      ],
    },
    akce: [{ label: 'Nová stránka', to: '/svet/:worldSlug/nova-stranka' }],
    source: { kapitola: '11' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'svet.pavucina',
    title: 'Pavučina: vztahy světa',
    tags: ['pavucina', 'vztahy', 'subjekt', 'graf', 'kampan'],
    routes: ['/svet/:worldSlug/pavucina', '/svet/:worldSlug'],
    body: {
      odstavce: [
        'Pavučina je graf vztahů tvého světa: subjekty (postavy, frakce, místa) a vazby mezi nimi.',
        'Subjekt můžeš materializovat na plnou stránku Encyklopedie — a naopak stránky zapojovat do grafu. Jedna síť, dva pohledy.',
        'Začni prvním subjektem a propoj ho s tím, co už máš — od tří vazeb výš začne graf vyprávět sám.',
      ],
    },
    akce: [{ label: 'Otevřít Pavučinu', to: '/svet/:worldSlug/pavucina' }],
    source: { kapitola: '11' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  {
    id: 'svet.vykladni-skrin',
    title: 'Výkladní skříň: ukázat bez otevření',
    tags: ['vykladni skrin', 'showcase', 'verejne', 'sdileni', 'ctenari'],
    routes: ['/svet/:worldSlug/nastaveni', '/svet/:worldSlug'],
    audience: ['pj', 'pomocnyPJ', 'admin'],
    minAudienceNote: 'Výkladní skříň zapíná PJ v Nastavení přístupu.',
    body: {
      odstavce: [
        'Výkladní skříň pustí návštěvníky k vybraným částem světa jen ke čtení — aniž bys otevíral vstup nebo rozdával role.',
        'Zapíná se v Nastavení světa (záložka Přístup) a vystaví pevné sekce ke čtení: novinky, stránky, postavy, mapy a bestiář. Tajnosti dál chrání zámky AKJ.',
        'Hodí se jako vizitka: ukážeš, na čem stavíš, a zájemci si řeknou o vstup.',
      ],
    },
    akce: [{ label: 'Nastavení přístupu', to: '/svet/:worldSlug/nastaveni' }],
    source: { kapitola: '09' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },

  // ── Globální chat ──────────────────────────────────────────────────────
  {
    id: 'chat.globalni',
    title: 'Putyka, Campy a Voice',
    tags: ['putyka', 'camp', 'voice', 'ttl', 'host', 'globalni chat'],
    routes: ['/chat', '/chat/camp', '/chat/camp2', '/chat/camp3', '/'],
    body: {
      odstavce: [
        'Putyka je společná hospoda celé platformy — zprávy v ní žijí hodinu a pak mizí, je to místo na potkávání, ne archiv. Nakouknout smí i host bez účtu.',
        'Campy jsou tři roleplay místnosti se sdílenou scénou, která rotuje v poledne a o půlnoci; rozehranou scénu si můžeš uložit do jednoho slotu.',
        'Voice krčma je hlasová místnost pro registrované. Emoty světů fungují jen uvnitř světů.',
      ],
    },
    akce: [{ label: 'Do Putyky', to: '/chat' }],
    source: { kapitola: '05' },
    verifiedAt: '2026-07-22',
    status: 'funkcni',
  },
  // ── Podporovatel (revize 07/23 — cíl dvou chybových topiků byl bez obsahu) ──
  {
    id: 'platforma.podporovatel',
    title: 'Co dává podpora platformy',
    tags: ['podporovatel', 'supporter', 'kvota', 'limit svetu', 'skiny', 'stavitel'],
    routes: ['/ikaros/podporovatele'],
    body: {
      odstavce: [
        'Platforma běží z podpory hráčů — bez reklam a bez prodeje dat. Podporovatel je poděkování s výhodami, ne brána k obsahu.',
        'Co podpora otevírá: až 30 světů místo 3, Stavitele map (podzemí, město, krajina) a sadu skinů navíc. Ke hře samotné ale podporu nepotřebuješ.',
        'Podporovatele poznáš podle odznaku Ikara u jména.',
      ],
    },
    source: { kapitola: '02' },
    verifiedAt: '2026-07-23',
    status: 'funkcni',
  },
] as const;

/** Nabídka „K věci" (blok B): topiky pro routu, filtrované publikem. */
export function topikyProRoutu(
  route: string | null,
  audience: string,
): HelpTopic[] {
  if (!route) return [];
  return TOPIKY.filter(
    (t) =>
      (t.routes as readonly string[]).includes(route) &&
      (!t.audience || (t.audience as readonly string[]).includes(audience)),
  );
}

export function topikPodleId(id: string): HelpTopic | undefined {
  return TOPIKY.find((t) => t.id === id);
}
