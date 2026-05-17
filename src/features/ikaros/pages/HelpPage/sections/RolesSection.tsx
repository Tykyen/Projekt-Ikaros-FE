import type { ReactNode } from 'react';
import { Check, Star } from 'lucide-react';
import { RoleStar, WorldRoleIcon, type WorldRoleKey } from '@/shared/ui';
import { UserRole } from '@/shared/types';
import s from '../HelpPage.module.css';

// ── Karty (data-driven) ────────────────────────────────────────────────

type GlobalCardKey =
  | 'ikaros'
  | 'superadmin'
  | 'admin'
  | 'spravce-diskuzi'
  | 'spravce-clanku'
  | 'spravce-galerie';

type GlobalCard = {
  key: GlobalCardKey;
  cardCls: string;
  title: string;
  badge: string;
  desc: string;
  icon: ReactNode;
};

const IKAROS_ICON = (
  <Star size={24} strokeWidth={1.5} aria-hidden="true" />
);

const GLOBAL_CARDS: GlobalCard[] = [
  {
    key: 'ikaros',
    cardCls: s.roleCardIkaros,
    title: 'Ikaros',
    badge: 'Základní uživatel',
    desc:
      'Každý registrovaný uživatel. Vlastní profil, postava v Rozcestí, ' +
      'účast v komunitě. Sám o sobě nemá moderační oprávnění — ta nastavuje Superadmin.',
    icon: IKAROS_ICON,
  },
  {
    key: 'superadmin',
    cardCls: s.roleCardSuperadmin,
    title: 'Superadmin',
    badge: 'Zakladatel platformy',
    desc:
      'Plný přístup ke všem funkcím platformy. Jediný, kdo nastavuje Admin role ' +
      'a granular permissions (canManageAdmins, canModerateContent, canEditPlatformPages).',
    icon: <RoleStar role={UserRole.Superadmin} size="lg" />,
  },
  {
    key: 'admin',
    cardCls: s.roleCardAdmin,
    title: 'Admin',
    badge: 'Důvěryhodný moderátor',
    desc:
      'Adresář uživatelů, ban/role/smazání (s hierarchií), schvalování žádostí ' +
      'o přezdívku, čtení audit logu. Nemůže měnit Admina ani Superadmina.',
    icon: <RoleStar role={UserRole.Admin} size="lg" />,
  },
  {
    key: 'spravce-diskuzi',
    cardCls: s.roleCardSpravceDiskuzi,
    title: 'Správce diskuzí',
    badge: 'Moderátor diskuzí',
    desc:
      'Schvaluje a zamítá pending diskuze, moderuje příspěvky a vlákna. ' +
      'Dostává notifikaci při nové čekající diskuzi.',
    icon: <RoleStar role={UserRole.SpravceDiskuzi} size="lg" />,
  },
  {
    key: 'spravce-clanku',
    cardCls: s.roleCardSpravceClanku,
    title: 'Správce článků',
    badge: 'Moderátor článků',
    desc:
      'Schvaluje a zamítá články, moderuje literární obsah a autory. ' +
      'Dostává notifikaci při novém článku ke schválení.',
    icon: <RoleStar role={UserRole.SpravceClanku} size="lg" />,
  },
  {
    key: 'spravce-galerie',
    cardCls: s.roleCardSpravceGalerie,
    title: 'Správce galerie',
    badge: 'Moderátor galerie',
    desc:
      'Schvaluje obrázky, moderuje galerii a nahrávaný obsah. ' +
      'Dostává notifikaci při novém obrázku ke schválení.',
    icon: <RoleStar role={UserRole.SpravceGalerie} size="lg" />,
  },
];

type WorldCard = {
  key: WorldRoleKey;
  cardCls: string;
  title: string;
  badge: string;
  desc: string;
};

const WORLD_CARDS: WorldCard[] = [
  {
    key: 'pj',
    cardCls: s.roleCardPj,
    title: 'PJ (Průvodce hrou)',
    badge: 'Vlastník světa',
    desc:
      'Plná správa světa: členové, role, obsah, mapy, kampaně, kalendář, nastavení.',
  },
  {
    key: 'pj-asst',
    cardCls: s.roleCardPjAsst,
    title: 'Pomocný PJ',
    badge: 'Zástupce PJ',
    desc:
      'Stejné pravomoci jako PJ kromě mazání obsahu a nastavení světa. ' +
      'Když PJ smaže účet, Pomocný PJ se automaticky povýší na PJ.',
  },
  {
    key: 'corrector',
    cardCls: s.roleCardCorrector,
    title: 'Korektor',
    badge: 'Editor',
    desc:
      'Read + úprava dat světa (texty, stránky, postavy). Bez mazání obsahu ' +
      'a bez správy členů.',
  },
  {
    key: 'player',
    cardCls: s.roleCardPlayer,
    title: 'Hráč',
    badge: 'Základní role',
    desc:
      'Účastní se hry, prohlíží obsah, spravuje svou postavu. ' +
      'Nemůže upravovat data světa.',
  },
  {
    key: 'reader',
    cardCls: s.roleCardReader,
    title: 'Čtenář',
    badge: 'Pasivní účastník',
    desc:
      'Jen prohlíží obsah světa. Nemůže spravovat ani svou postavu. ' +
      'Dříve označovaný jako „Nezařazený".',
  },
  {
    key: 'applicant',
    cardCls: s.roleCardApplicant,
    title: 'Žadatel',
    badge: 'Čeká na schválení',
    desc:
      'Požádal o přístup do uzavřeného světa a čeká na schválení od PJ. ' +
      'Zatím není členem světa.',
  },
];

// ── Matice oprávnění (data-driven) ─────────────────────────────────────

type MatrixHeader = {
  key: string;
  label: string;
  colorVar: string;
  icon: ReactNode;
};

type MatrixRow = {
  label: string;
  cells: boolean[];
};

const GLOBAL_HEADERS: MatrixHeader[] = [
  { key: 'superadmin',      label: 'Superadmin',   colorVar: '--role-star-superadmin',      icon: <RoleStar role={UserRole.Superadmin} size="md" /> },
  { key: 'admin',           label: 'Admin',        colorVar: '--role-star-admin',           icon: <RoleStar role={UserRole.Admin} size="md" /> },
  { key: 'spravce-diskuzi', label: 'Spr. diskuzí', colorVar: '--role-star-spravce-diskuzi', icon: <RoleStar role={UserRole.SpravceDiskuzi} size="md" /> },
  { key: 'spravce-clanku',  label: 'Spr. článků',  colorVar: '--role-star-spravce-clanku',  icon: <RoleStar role={UserRole.SpravceClanku} size="md" /> },
  { key: 'spravce-galerie', label: 'Spr. galerie', colorVar: '--role-star-spravce-galerie', icon: <RoleStar role={UserRole.SpravceGalerie} size="md" /> },
];

const GLOBAL_ROWS: MatrixRow[] = [
  { label: 'Schvalování diskuzí',      cells: [true,  true,  true,  false, false] },
  { label: 'Schvalování článků',       cells: [true,  true,  false, true,  false] },
  { label: 'Schvalování galerie',      cells: [true,  true,  false, false, true ] },
  { label: 'Správa příspěvků',         cells: [true,  true,  true,  true,  true ] },
  { label: 'Úprava profilů uživatelů', cells: [true,  true,  false, false, false] },
  { label: 'Správa uživatelů',         cells: [true,  true,  false, false, false] },
  { label: 'Správa obsahu platformy',  cells: [true,  true,  false, false, false] },
  { label: 'Systémová nastavení',      cells: [true,  false, false, false, false] },
];

const WORLD_HEADERS: MatrixHeader[] = [
  { key: 'pj',        label: 'PJ',       colorVar: '--role-world-pj',        icon: <WorldRoleIcon role="pj"        size="md" /> },
  { key: 'pj-asst',   label: 'Pom. PJ',  colorVar: '--role-world-pj-asst',   icon: <WorldRoleIcon role="pj-asst"   size="md" /> },
  { key: 'corrector', label: 'Korektor', colorVar: '--role-world-corrector', icon: <WorldRoleIcon role="corrector" size="md" /> },
  { key: 'player',    label: 'Hráč',     colorVar: '--role-world-player',    icon: <WorldRoleIcon role="player"    size="md" /> },
  { key: 'reader',    label: 'Čtenář',   colorVar: '--role-world-reader',    icon: <WorldRoleIcon role="reader"    size="md" /> },
  { key: 'applicant', label: 'Žadatel',  colorVar: '--role-world-applicant', icon: <WorldRoleIcon role="applicant" size="md" /> },
];

const WORLD_ROWS: MatrixRow[] = [
  { label: 'Prohlížení obsahu',  cells: [true,  true,  true,  true,  true,  false] },
  { label: 'Správa své postavy', cells: [true,  true,  true,  true,  false, false] },
  { label: 'Úprava dat světa',   cells: [true,  true,  true,  false, false, false] },
  { label: 'Vytváření obsahu',   cells: [true,  true,  false, false, false, false] },
  { label: 'Správa členů',       cells: [true,  true,  false, false, false, false] },
  { label: 'Mazání obsahu',      cells: [true,  false, false, false, false, false] },
  { label: 'Nastavení světa',    cells: [true,  false, false, false, false, false] },
];

// ── Privátní komponenty ────────────────────────────────────────────────

function RoleCard({ cardCls, icon, title, badge, desc }: {
  cardCls: string; icon: ReactNode; title: string; badge: string; desc: string;
}) {
  return (
    <div className={`${s.roleCard} ${cardCls}`}>
      <span className={s.roleCardIcon}>{icon}</span>
      <div className={s.roleCardBody}>
        <div className={s.roleCardTitle}>
          <span>{title}</span>
          <span className={s.roleCardBadge}>{badge}</span>
        </div>
        <p className={s.roleCardDesc}>{desc}</p>
      </div>
    </div>
  );
}

function PermissionMatrix({ headers, rows, caption }: {
  headers: MatrixHeader[]; rows: MatrixRow[]; caption: string;
}) {
  return (
    <div className={s.matrixWrap}>
      <table className={s.matrix} aria-label={caption}>
        <thead>
          <tr>
            <th scope="col">Oprávnění</th>
            {headers.map(h => (
              <th key={h.key} scope="col">
                <span className={s.matrixHeaderCell}>
                  {h.icon}
                  <span className={s.matrixHeaderLabel}>{h.label}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label}>
              <td>{row.label}</td>
              {row.cells.map((has, idx) => {
                const h = headers[idx];
                return (
                  <td key={h.key}>
                    {has ? (
                      <span
                        className={s.matrixCheck}
                        style={{ ['--cell-color' as string]: `var(${h.colorVar})` }}
                        aria-label="ano"
                      >
                        <Check size={18} strokeWidth={2.5} aria-hidden="true" />
                      </span>
                    ) : (
                      <span className={s.matrixEmpty} aria-label="ne">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Hlavní export ──────────────────────────────────────────────────────

export function RolesSection() {
  return (
    <>
      <p>
        Ikaros má dvě úrovně rolí: <strong>globální</strong> (napříč
        platformou) a <strong>světová</strong> (uvnitř konkrétního světa).
        Globální role řídí oprávnění v rámci celé platformy; světová role
        platí jen v daném světě a každý uživatel může být v různých světech
        v různých rolích.
      </p>

      <h2>Globální role</h2>
      <p>
        Platí napříč celou platformou. Každý registrovaný má jednu globální
        roli; další oprávnění (granular permissions) k ní volitelně přidává
        Superadmin.
      </p>
      <div className={s.roleCardGrid}>
        {GLOBAL_CARDS.map(c => (
          <RoleCard
            key={c.key}
            cardCls={c.cardCls}
            icon={c.icon}
            title={c.title}
            badge={c.badge}
            desc={c.desc}
          />
        ))}
      </div>

      <h3>Matice oprávnění</h3>
      <PermissionMatrix
        headers={GLOBAL_HEADERS}
        rows={GLOBAL_ROWS}
        caption="Matice oprávnění globálních rolí"
      />

      <h2>Hierarchie a omezení adminů</h2>
      <p>Hlavní pravidla, která BE vynucuje při admin akcích:</p>
      <ul>
        <li>
          Admin <strong>nemůže měnit role / banovat / mazat jiného Admina</strong>{' '}
          ani Superadmina. To smí jen Superadmin.
        </li>
        <li>
          Admin <strong>nemůže povyšovat jiné na Admin</strong>, dokud nemá flag{' '}
          <code>canManageAdmins</code> (uděluje Superadmin).
        </li>
        <li>Nikdo nemůže banovat nebo smazat sám sebe.</li>
        <li>
          Granular permissions (<code>canManageAdmins</code>, ...) nastavuje
          výhradně Superadmin.
        </li>
        <li>
          Každá admin akce se zapisuje do <strong>Audit logu</strong> (přístupný
          v <code>/ikaros/uzivatele?tab=audit</code>).
        </li>
      </ul>

      <h2>Co kdo smí udělat s kým</h2>
      <div className={s.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Akce →<br />Aktér ↓</th>
              <th>Hráč</th>
              <th>PJ</th>
              <th>Admin</th>
              <th>Superadmin</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Hráč</strong></td>
              <td>✕</td>
              <td>✕</td>
              <td>✕</td>
              <td>✕</td>
            </tr>
            <tr>
              <td><strong>Admin</strong> (bez flagu)</td>
              <td>Ban / role / smazání</td>
              <td>Ban / role / smazání</td>
              <td>✕</td>
              <td>✕</td>
            </tr>
            <tr>
              <td><strong>Admin</strong> (s <code>canManageAdmins</code>)</td>
              <td>Ban / role / smazání</td>
              <td>Ban / role / smazání</td>
              <td>Ban / role / smazání</td>
              <td>✕</td>
            </tr>
            <tr>
              <td><strong>Superadmin</strong></td>
              <td>Vše</td>
              <td>Vše</td>
              <td>Vše + granular flagy</td>
              <td>✕ (sám sebe ne)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Role ve světech</h2>
      <p>
        World role platí jen v daném světě. Uživatel může být ve více
        světech v různých rolích — světovou roli ti přidělí PJ daného světa.
      </p>
      <div className={s.roleCardGrid}>
        {WORLD_CARDS.map(c => (
          <RoleCard
            key={c.key}
            cardCls={c.cardCls}
            icon={<WorldRoleIcon role={c.key} size="lg" />}
            title={c.title}
            badge={c.badge}
            desc={c.desc}
          />
        ))}
      </div>

      <h3>Matice oprávnění</h3>
      <PermissionMatrix
        headers={WORLD_HEADERS}
        rows={WORLD_ROWS}
        caption="Matice oprávnění světových rolí"
      />
      <p className={s.matrixNote}>
        Matice je orientační — některé sekce mají jemnější práh (viz Nastavení
        světa níže). Plná funkčnost rolí ve světech se dotváří v průběhu fáze 5+.
      </p>

      <h2>Přístup k nastavení světa</h2>
      <p>
        Stránka <code>/svet/&lt;svět&gt;/nastaveni</code> je členěná do tabů a
        každý tab se zobrazí podle světové role — co uživatel neuvidí, to mu
        ani server neuloží:
      </p>
      <ul>
        <li>
          <strong>Základní info, Přístup, Vzhled</strong> — od role{' '}
          <strong>Korektor</strong> výš. Metadata světa, přístupový režim a
          motiv (theme).
        </li>
        <li>
          <strong>Členové, AKJ úrovně</strong> — od role{' '}
          <strong>Pomocný PJ</strong> výš. Správa rolí, skupin a stupňované
          „prověrky" (AKJ) viditelnosti stránek.
        </li>
        <li>
          <strong>Barvy skupin</strong> (uvnitř tabu Členové) — jen{' '}
          <strong>PJ</strong>.
        </li>
        <li>
          <strong>Členství</strong> (odchod ze světa) — kdokoli od{' '}
          <strong>Čtenáře</strong> výš. PJ svět opustit nemůže — musel by ho
          předat nebo smazat.
        </li>
      </ul>

      <div className={s.callout}>
        <strong>Tip:</strong> Pokud chceš svůj svět dlouhodobě, založ si v něm{' '}
        <strong>Pomocného PJ</strong>. Když budeš muset účet smazat, svět
        nezůstane bez vlastníka.
      </div>
    </>
  );
}
