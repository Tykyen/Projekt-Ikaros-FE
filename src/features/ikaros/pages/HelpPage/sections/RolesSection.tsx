import type { ReactNode } from 'react';
import { Star, Globe, Crown } from 'lucide-react';
import { RoleStar, WorldRoleIcon, type WorldRoleKey } from '@/shared/ui';
import { UserRole } from '@/shared/types';
import {
  HelpAccordion,
  PermissionTable,
  CalloutBox,
  type PermissionColumn,
  type PermissionRow,
} from '../components';
import s from '../HelpPage.module.css';

// ── Karty rolí (data-driven) ───────────────────────────────────────────

type GlobalCard = {
  key: string;
  cardCls: string;
  title: string;
  badge: string;
  desc: string;
  icon: ReactNode;
};

const GLOBAL_CARDS: GlobalCard[] = [
  {
    key: 'ikaros',
    cardCls: s.roleCardIkaros,
    title: 'Ikaros',
    badge: 'Základní uživatel',
    desc:
      'Každý registrovaný uživatel. Vlastní profil, postava v Campu, ' +
      'účast v komunitě. Sám o sobě nemá moderační oprávnění — ta nastavuje Superadmin.',
    icon: <Star size={24} strokeWidth={1.5} aria-hidden="true" />,
  },
  {
    key: 'superadmin',
    cardCls: s.roleCardSuperadmin,
    title: 'Superadmin',
    badge: 'Zakladatel platformy',
    desc:
      'Plný přístup ke všem funkcím platformy. Jediný, kdo nastavuje Admin role ' +
      'a jemná oprávnění (správa adminů, moderace obsahu, úpravy platformových stránek).',
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
      'Jako „správce komunity" navíc řeší nahlášený obsah napříč platformou ' +
      '(kromě zásahů do účtu — ty patří adminům).',
    icon: <RoleStar role={UserRole.SpravceDiskuzi} size="lg" />,
  },
  {
    key: 'spravce-clanku',
    cardCls: s.roleCardSpravceClanku,
    title: 'Správce článků',
    badge: 'Moderátor článků',
    desc:
      'Schvaluje a zamítá články, moderuje literární obsah a autory. ' +
      'Jako „správce komunity" navíc řeší nahlášený obsah napříč platformou ' +
      '(kromě zásahů do účtu — ty patří adminům).',
    icon: <RoleStar role={UserRole.SpravceClanku} size="lg" />,
  },
  {
    key: 'spravce-galerie',
    cardCls: s.roleCardSpravceGalerie,
    title: 'Správce galerie',
    badge: 'Moderátor galerie',
    desc:
      'Schvaluje obrázky, moderuje galerii a nahrávaný obsah. ' +
      'Jako „správce komunity" navíc řeší nahlášený obsah napříč platformou ' +
      '(kromě zásahů do účtu — ty patří adminům).',
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
    title: 'PJ (Pán jeskyně)',
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
    badge: 'Editor (v přípravě)',
    desc:
      'Čtení + úprava dat světa (texty, stránky, postavy). Bez mazání obsahu ' +
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
    badge: 'Pasivní účastník (v přípravě)',
    desc:
      'Jen prohlíží obsah světa. Nemůže spravovat ani svou postavu. ' +
      'Dříve označovaný jako „Nezařazený".',
  },
  {
    key: 'applicant',
    cardCls: s.roleCardApplicant,
    title: 'Žadatel',
    badge: 'Čeká na schválení (v přípravě)',
    desc:
      'Požádal o přístup do uzavřeného světa a čeká na schválení od PJ. ' +
      'Zatím není členem světa.',
  },
];

// ── Matice oprávnění (data-driven) ─────────────────────────────────────

const GLOBAL_COLUMNS: PermissionColumn[] = [
  { key: 'superadmin', label: 'Superadmin', colorVar: '--role-star-superadmin', icon: <RoleStar role={UserRole.Superadmin} size="md" /> },
  { key: 'admin', label: 'Admin', colorVar: '--role-star-admin', icon: <RoleStar role={UserRole.Admin} size="md" /> },
  { key: 'diskuze', label: 'Spr. diskuzí', colorVar: '--role-star-spravce-diskuzi', icon: <RoleStar role={UserRole.SpravceDiskuzi} size="md" /> },
  { key: 'clanky', label: 'Spr. článků', colorVar: '--role-star-spravce-clanku', icon: <RoleStar role={UserRole.SpravceClanku} size="md" /> },
  { key: 'galerie', label: 'Spr. galerie', colorVar: '--role-star-spravce-galerie', icon: <RoleStar role={UserRole.SpravceGalerie} size="md" /> },
];

const GLOBAL_ROWS: PermissionRow[] = [
  { action: 'Schvalování diskuzí', allow: { superadmin: true, admin: true, diskuze: true, clanky: false, galerie: false } },
  { action: 'Schvalování článků', allow: { superadmin: true, admin: true, diskuze: false, clanky: true, galerie: false } },
  { action: 'Schvalování galerie', allow: { superadmin: true, admin: true, diskuze: false, clanky: false, galerie: true } },
  { action: 'Správa příspěvků', allow: { superadmin: true, admin: true, diskuze: true, clanky: true, galerie: true } },
  { action: 'Úprava profilů uživatelů', allow: { superadmin: true, admin: true, diskuze: false, clanky: false, galerie: false } },
  { action: 'Správa uživatelů', allow: { superadmin: true, admin: true, diskuze: false, clanky: false, galerie: false } },
  { action: 'Správa obsahu platformy', allow: { superadmin: true, admin: true, diskuze: false, clanky: false, galerie: false } },
  { action: 'Systémová nastavení', allow: { superadmin: true, admin: false, diskuze: false, clanky: false, galerie: false } },
];

const WORLD_COLUMNS: PermissionColumn[] = [
  { key: 'pj', label: 'PJ', colorVar: '--role-world-pj', icon: <WorldRoleIcon role="pj" size="md" /> },
  { key: 'pj-asst', label: 'Pom. PJ', colorVar: '--role-world-pj-asst', icon: <WorldRoleIcon role="pj-asst" size="md" /> },
  { key: 'corrector', label: 'Korektor', colorVar: '--role-world-corrector', icon: <WorldRoleIcon role="corrector" size="md" /> },
  { key: 'player', label: 'Hráč', colorVar: '--role-world-player', icon: <WorldRoleIcon role="player" size="md" /> },
  { key: 'reader', label: 'Čtenář', colorVar: '--role-world-reader', icon: <WorldRoleIcon role="reader" size="md" /> },
  { key: 'applicant', label: 'Žadatel', colorVar: '--role-world-applicant', icon: <WorldRoleIcon role="applicant" size="md" /> },
];

const WORLD_ROWS: PermissionRow[] = [
  { action: 'Prohlížení obsahu', allow: { pj: true, 'pj-asst': true, corrector: true, player: true, reader: true, applicant: false } },
  { action: 'Správa své postavy', allow: { pj: true, 'pj-asst': true, corrector: true, player: true, reader: false, applicant: false } },
  { action: 'Úprava dat světa', allow: { pj: true, 'pj-asst': true, corrector: true, player: false, reader: false, applicant: false } },
  { action: 'Vytváření obsahu', allow: { pj: true, 'pj-asst': true, corrector: false, player: false, reader: false, applicant: false } },
  { action: 'Správa členů', allow: { pj: true, 'pj-asst': true, corrector: false, player: false, reader: false, applicant: false } },
  { action: 'Mazání obsahu', allow: { pj: true, 'pj-asst': false, corrector: false, player: false, reader: false, applicant: false } },
  { action: 'Nastavení světa', allow: { pj: true, 'pj-asst': false, corrector: false, player: false, reader: false, applicant: false } },
];

// ── Karta role ─────────────────────────────────────────────────────────

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

// ── Hlavní export ──────────────────────────────────────────────────────

export function RolesSection() {
  return (
    <>
      <p>
        Ikaros má dvě úrovně rolí: <strong>globální</strong> (napříč platformou)
        a <strong>světová</strong> (uvnitř konkrétního světa). Globální role řídí
        oprávnění v rámci celé platformy; světová role platí jen v daném světě a
        každý uživatel může být v různých světech v různých rolích. Rozbal si
        skupinu níže.
      </p>

      <HelpAccordion
        icon={<Globe size={20} />}
        title="Globální role"
        accent="accent"
        id="role-globalni"
        defaultOpen
      >
        <p>
          Platí napříč celou platformou. Každý registrovaný má jednu globální
          roli; další oprávnění k ní volitelně přidává Superadmin.
        </p>
        <div className={s.roleCardGrid}>
          {GLOBAL_CARDS.map((c) => (
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
        <PermissionTable
          columns={GLOBAL_COLUMNS}
          rows={GLOBAL_ROWS}
          caption="Matice oprávnění globálních rolí"
        />

        <h3>Hierarchie a omezení adminů</h3>
        <p>Hlavní pravidla, která platforma vynucuje při admin akcích:</p>
        <ul>
          <li>
            Admin <strong>nemůže měnit role / banovat / mazat jiného Admina</strong>{' '}
            ani Superadmina. To smí jen Superadmin.
          </li>
          <li>
            Admin <strong>nemůže povyšovat jiné na Admina</strong>, dokud mu to
            Superadmin výslovně nepovolí.
          </li>
          <li>Nikdo nemůže banovat nebo smazat sám sebe.</li>
          <li>Každá admin akce se zapisuje do auditního logu.</li>
        </ul>

        <h3>Admin ve světě — „nahození práv"</h3>
        <p>
          Admin i Superadmin se v cizím světě <strong>chovají jako běžný hráč</strong>{' '}
          — jejich admin pravomoci jsou ve světě uspané. Když potřebují něco
          vyřešit, kliknou v hlavičce světa na tlačítko zámku{' '}
          <strong>„Aktivovat admina"</strong> a získají plná práva vypravěče (PJ) v
          tom světě. Stejným tlačítkem (<strong>„Admin režim"</strong>) je zase
          složí.
        </p>
        <ul>
          <li>
            Nahození platí <strong>jen pro daný svět</strong> — v ostatních
            světech zůstávají pořád hráčem.
          </li>
          <li>
            Trvá, dokud ho admin sám nesloží — nebo <strong>do odhlášení</strong>{' '}
            (po novém přihlášení je zase uspané).
          </li>
          <li>Každé nahození i složení se zapisuje do auditního logu.</li>
          <li>
            Bez nahození vidí ve světě jen to co běžný hráč (obsah uzavřeného
            světa zůstává skrytý).
          </li>
        </ul>

        <h3>Co kdo smí udělat s kým</h3>
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
                <td>✕</td><td>✕</td><td>✕</td><td>✕</td>
              </tr>
              <tr>
                <td><strong>Admin</strong> (bez práva na adminy)</td>
                <td>Ban / role / smazání</td>
                <td>Ban / role / smazání</td>
                <td>✕</td><td>✕</td>
              </tr>
              <tr>
                <td><strong>Admin</strong> (s právem na adminy)</td>
                <td>Ban / role / smazání</td>
                <td>Ban / role / smazání</td>
                <td>Ban / role / smazání</td>
                <td>✕</td>
              </tr>
              <tr>
                <td><strong>Superadmin</strong></td>
                <td>Vše</td><td>Vše</td><td>Vše + jemná oprávnění</td>
                <td>✕ (sám sebe ne)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </HelpAccordion>

      <HelpAccordion
        icon={<Crown size={20} />}
        title="Světové role"
        accent="pj"
        id="role-svetove"
      >
        <p>
          Světová role platí jen v daném světě. Uživatel může být ve více světech
          v různých rolích — světovou roli ti přidělí PJ daného světa.
        </p>
        <div className={s.roleCardGrid}>
          {WORLD_CARDS.map((c) => (
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
        <PermissionTable
          columns={WORLD_COLUMNS}
          rows={WORLD_ROWS}
          caption="Matice oprávnění světových rolí"
        />
        <p className={s.matrixNote}>
          Matice je orientační — některé sekce mají jemnější práh (viz Nastavení
          světa). Plná funkčnost rolí Korektor, Čtenář a Žadatel se ještě dotváří.
        </p>

        <h3>Přístup k nastavení světa</h3>
        <p>
          Stránka Nastavení světa je členěná do tabů a každý tab se zobrazí podle
          světové role — co uživatel neuvidí, to mu ani server neuloží:
        </p>
        <ul>
          <li>
            <strong>Základní info, Přístup, Vzhled</strong> — od role{' '}
            <strong>Korektor</strong> výš. Metadata světa, přístupový režim a motiv.
          </li>
          <li>
            <strong>Členové, AKJ úrovně</strong> — od role <strong>Pomocný PJ</strong>{' '}
            výš. Správa rolí, skupin a stupňovaných „prověrek" (AKJ) viditelnosti stránek.
          </li>
          <li>
            <strong>Barvy skupin</strong> (uvnitř tabu Členové) — jen <strong>PJ</strong>.
          </li>
          <li>
            <strong>Členství</strong> (odchod ze světa) — kdokoli od{' '}
            <strong>Čtenáře</strong> výš. PJ svět opustit nemůže — musel by ho
            předat nebo smazat.
          </li>
        </ul>

        <CalloutBox variant="tip">
          Pokud chceš svůj svět dlouhodobě, založ si v něm <strong>Pomocného PJ</strong>.
          Když budeš muset účet smazat, svět nezůstane bez vlastníka.
        </CalloutBox>
      </HelpAccordion>
    </>
  );
}
