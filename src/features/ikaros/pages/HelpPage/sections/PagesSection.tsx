import { Link } from 'react-router-dom';
import s from '../HelpPage.module.css';

type PageStatus = 'ok' | 'soon';

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
    path: '/',
    name: 'Úvodník',
    status: 'ok',
    who: 'Všichni (anon i přihlášený)',
    what: 'Vstupní stránka platformy. Anonymní vidí uvítací kartu a novinky platformy. Po přihlášení nahrazuje uvítání rozcestník: Moje světy (karty s obrázkem, tvou rolí ve světě a tlačítkem Vstoupit), Blížící se schůzky (až 5 nejbližších eventů napříč všemi tvými světy, s tlačítkem Půjdu) a Novinky platformy.',
  },
  {
    path: '/ikaros/napoveda',
    name: 'Nápověda',
    status: 'ok',
    who: 'Všichni',
    what: 'Tato stránka. Co umí platforma, jaké jsou role a co odkud spustíš.',
  },
  {
    path: '/podminky',
    name: 'Podmínky použití',
    status: 'ok',
    who: 'Všichni',
    what: 'Pravidla chování, zpracování osobních údajů, smazání účtu, kontakt.',
  },
  {
    path: '/ikaros/profil',
    name: 'Profil',
    status: 'ok',
    who: 'Přihlášený (vlastník účtu)',
    what: 'Sedm sekcí: hlavička, něco o mně, postava v Rozcestí, moje světy, komunitní stopa, bezpečnost (heslo, žádost o změnu přezdívky), účet (smazání).',
  },
  {
    path: '/ikaros/uzivatele',
    name: 'Adresář uživatelů',
    status: 'ok',
    who: 'Přihlášený (Admin/Superadmin vidí navíc tab Audit)',
    what: 'Taby Přátelé, Uživatelé, Zpracovat (univerzální fronta žádostí napříč moduly — žádosti o přátelství, změnu přezdívky a postupně i další), Audit log. Tab Přátelé: mřížka přijatých přátel + sbalitelná sekce „Odeslané žádosti". Tab Uživatelé: mřížka karet pro hráče, admin navíc přepínač Karty/Tabulka a „Zobrazit smazané". Admin/Superadmin navíc vidí Audit.',
  },
  {
    path: '/ikaros/uzivatel/:id',
    name: 'Veřejný profil',
    status: 'ok',
    who: 'Přihlášený',
    what: 'Read-only zrcadlo profilu jiného uživatele bez citlivých polí (e-mail, motiv, barva chatu, ban/delete metadata). Tlačítko „Přidat do přátel" mění stav podle vztahu (žádost odeslána / čeká rozhodnutí / odebrat z přátel). „Napsat zprávu" čeká na fázi 3.5.',
  },
  {
    path: '—',
    name: 'Online indikátor (presence)',
    status: 'ok',
    who: 'Přihlášený',
    what: 'Zelená tečka u avataru = uživatel má právě otevřenou platformu. Žlutá tečka = uživatel je u počítače, ale ~5 min nebyl aktivní (idle). Žádná tečka = offline. U offline uživatelů na veřejném profilu vidíš „naposledy aktivní před X". Lze skrýt svůj stav přes Soukromí v profilu.',
  },
];

const SOON_IKAROS: PageDoc[] = [
  {
    path: '/ikaros/vesmiry',
    name: 'Přehled vesmírů',
    status: 'soon',
    fáze: 'Fáze 2.2',
    who: 'Všichni',
    what: 'Mřížka veřejných + vlastních světů, filtry (public/private/closed), search.',
  },
  {
    path: '/ikaros/vytvorit-svet',
    name: 'Vytvořit svět',
    status: 'soon',
    fáze: 'Fáze 2.3',
    who: 'Přihlášený',
    what: 'Wizard pro založení nového světa (název, žánr, popis, přístupový režim, RPG systém).',
  },
  {
    path: '/svet/:worldId',
    name: 'Detail světa + vstup',
    status: 'soon',
    fáze: 'Fáze 2.4',
    who: 'Přihlášený',
    what: 'Info o světě, tlačítko Vstoupit (public = okamžitě, private = žádost ke schválení PJ).',
  },
  {
    path: '/ikaros/clanky',
    name: 'Články',
    status: 'soon',
    fáze: 'Fáze 3.2',
    who: 'Čtení anon, psaní přihlášený',
    what: 'Komunitní články s TipTap editorem. Workflow draft → pending → published (schvaluje Správce článků).',
  },
  {
    path: '/ikaros/galerie',
    name: 'Galerie',
    status: 'soon',
    fáze: 'Fáze 3.3',
    who: 'Čtení anon, upload přihlášený',
    what: 'Sdílené obrázky. Workflow pending → approved (schvaluje Správce galerie).',
  },
  {
    path: '/ikaros/diskuze',
    name: 'Diskuze',
    status: 'soon',
    fáze: 'Fáze 3.4',
    who: 'Čtení anon, zápis přihlášený',
    what: 'Vlákna diskuzí, manažeři, pozvánky, hlášení moderaci. Moderuje Správce diskuzí.',
  },
  {
    path: '/ikaros/posta',
    name: 'Pošta',
    status: 'soon',
    fáze: 'Fáze 3.5',
    who: 'Přihlášený',
    what: 'Soukromé zprávy + RSVP na eventy. Počítadlo nepřečtených v hlavičce.',
  },
  {
    path: '/chat/hospoda',
    name: 'Hospoda (globální chat)',
    status: 'soon',
    fáze: 'Fáze 4',
    who: 'Přihlášený',
    what: 'Interdimenzionální chat napříč světy. Kanály, emotes, typing indikátory.',
  },
  {
    path: '/ikaros/uzivatele?tab=pratele',
    name: 'Přátelé',
    status: 'soon',
    fáze: 'Fáze 1.8',
    who: 'Přihlášený',
    what: 'Žádosti, akceptace, blokace. Fronta žádostí v tabu Zpracovat.',
  },
  {
    path: '—',
    name: 'Reset hesla',
    status: 'soon',
    fáze: 'Fáze 1.7',
    who: 'Anon (zapomenuté heslo)',
    what: '„Zapomněl jsem heslo" v Login modalu → e-mail s reset linkem. Zatím přes administrátora.',
  },
];

const SOON_WORLD: PageDoc[] = [
  {
    path: '/svet/:worldId',
    name: 'Světový dashboard',
    status: 'soon',
    fáze: 'Fáze 5.2',
    who: 'Členové světa',
    what: 'Novinky světa, poslední stránky, blížící se eventy.',
  },
  {
    path: '/svet/:worldId/chat',
    name: 'Světový chat',
    status: 'soon',
    fáze: 'Fáze 6',
    who: 'Členové světa',
    what: 'Chat uvnitř světa, kanály, kostky (dice), whispers, reakce.',
  },
  {
    path: '/svet/:worldId/stranky',
    name: 'Wiki stránky',
    status: 'soon',
    fáze: 'Fáze 7',
    who: 'Členové světa (editace podle role)',
    what: 'TipTap stránky světa: lokace, frakce, příběhy, pravidla.',
  },
  {
    path: '/svet/:worldId/postavy',
    name: 'Postavy a deníky',
    status: 'soon',
    fáze: 'Fáze 8',
    who: 'Členové světa',
    what: 'Adresář postav, deníky, dynamické fieldy podle RPG systému světa.',
  },
  {
    path: '/svet/:worldId/mapa',
    name: 'Mapy (Universe + taktická)',
    status: 'soon',
    fáze: 'Fáze 10',
    who: 'Členové světa',
    what: '3D Universe mapa lokací + 2D taktická mapa pro boj (hex grid, tokeny, fog of war).',
  },
  {
    path: '/svet/:worldId/kalendar',
    name: 'Kalendář & časová osa',
    status: 'soon',
    fáze: 'Fáze 9',
    who: 'Členové světa',
    what: 'Fantasy kalendář, per-postava deníky, historická timeline, počasí, eventy s RSVP.',
  },
  {
    path: '/svet/:worldId/pavucina',
    name: 'Kampaně',
    status: 'soon',
    fáze: 'Fáze 11',
    who: 'PJ (PomocnyPJ na úrovni čtení)',
    what: 'Pavučina vztahů (2D graf), scénáře, storylines, quick notes, ekonomika světa.',
  },
];

function StatusPill({ status }: { status: PageStatus }) {
  if (status === 'ok') {
    return (
      <span className={`${s.statusPill} ${s.statusPillOk}`}>✅ Funguje</span>
    );
  }
  return (
    <span className={`${s.statusPill} ${s.statusPillSoon}`}>🚧 Připravujeme</span>
  );
}

function PageItem({ doc }: { doc: PageDoc }) {
  const isLink = doc.status === 'ok' && doc.path.startsWith('/') && !doc.path.includes(':');
  return (
    <div className={`${s.pageItem} ${doc.status === 'ok' ? s.pageItemOk : ''}`}>
      <h3>
        {doc.name}
        <span className={s.pagePath}>{doc.path}</span>
        <StatusPill status={doc.status} />
      </h3>
      <p className={s.pageWho}>
        <strong>Komu:</strong> {doc.who}
        {doc.fáze && <> &middot; <em>{doc.fáze}</em></>}
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
        štítkem <span className={`${s.statusPill} ${s.statusPillSoon}`}>🚧 Připravujeme</span>{' '}
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
        <h2>Světová vrstva — připravujeme</h2>
        <p>
          Vše níže běží uvnitř konkrétního světa (URL <code>/svet/:worldId/...</code>).
          Každý svět má vlastní motiv, role a obsah nezávisle na Ikaru.
        </p>
        {SOON_WORLD.map((doc) => (
          <PageItem key={doc.path + doc.name} doc={doc} />
        ))}
      </div>
    </>
  );
}
