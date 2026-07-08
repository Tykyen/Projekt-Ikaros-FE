import type { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { Link } from 'react-router-dom';
import { currentUserAtom } from '@/shared/store/authStore';
import { isEffectiveSupporter } from '@/shared/lib/supporter';
import { useSupporters } from '../api/useSupporters';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import { CornerOrnament } from '@/shared/ui/CornerOrnament/CornerOrnament';
import { UserAvatar, SupporterBadge, Spinner } from '@/shared/ui';
import s from './SupportersPage.module.css';

/** 19.4 — freemium limit světů pro nepodporovatele (zrcadlo BE konstanty). */
const FREE_WORLD_LIMIT = 3;

const PERKS = [
  {
    icon: '🌍',
    title: 'Víc světů',
    free: 'Zdarma: až 3 světy (vlastní i členství).',
    up: 'Podporovatel: bez tohoto stropu.',
  },
  {
    icon: '🎲',
    title: 'Prémiové kostky',
    free: 'Zdarma: 18 běžných materiálů.',
    up: 'Podporovatel: +51 skinů — kámen, kov, dračí, živly, mystické.',
  },
  {
    icon: '⛓️',
    title: 'Vězení kostek',
    free: 'Pošli skin, co ti hodil smůlu, „do vězení".',
    up: 'Odemčeno podporovatelům.',
  },
  {
    icon: '🕊️',
    title: 'Odznak Ikara',
    free: 'Viditelné poděkování u jména — chat, profil, zeď.',
    up: 'Tvůj status navenek.',
  },
];

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`${s.panel} ${className ?? ''}`}
      data-frame-panel="card"
    >
      <CornerOrnament position="tl" />
      <CornerOrnament position="tr" />
      <CornerOrnament position="bl" />
      <CornerOrnament position="br" />
      {children}
    </div>
  );
}

function formatSince(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('cs-CZ', { month: 'numeric', year: 'numeric' });
}

export default function SupportersPage() {
  const me = useAtomValue(currentUserAtom);
  const supporter = me ? isEffectiveSupporter(me.role, me.isSupporter) : false;
  const { data: supporters, isLoading } = useSupporters();
  const { data: myWorlds } = useMyWorlds();
  const worldCount = myWorlds?.length ?? 0;

  return (
    <div className={s.page}>
      {/* HERO */}
      <header className={s.hero}>
        <img className={s.crest} src="/brand/ikaros-seal.webp" alt="Ikaros" />
        <h1 className={s.heroTitle}>Drž Ikara ve vzduchu</h1>
        <p className={s.lead}>
          Projekt Ikaros je český, nezávislý a zdarma. Servery a vývoj ale něco
          stojí. Kdo přispěje na provoz, stává se{' '}
          <strong>Podporovatelem</strong> — a nese odznak Ikara.
        </p>
      </header>

      {/* CO STATUS DÁVÁ */}
      <section className={s.section}>
        <div className={s.secHead}>
          <span className={s.kicker}>Co status dává</span>
          <h2>Poděkování, ne herní výhoda</h2>
          <p>
            Základ zůstává plný a zdarma. Podporovatel má navíc pár drobností
            pro pohodlí a parádu.
          </p>
        </div>
        <div className={s.perks}>
          {PERKS.map((perk) => (
            <Panel key={perk.title} className={s.perk}>
              <div className={s.perkTop}>
                <span className={s.perkIco} aria-hidden="true">
                  {perk.icon}
                </span>
                <h3>{perk.title}</h3>
              </div>
              <p className={s.free}>{perk.free}</p>
              <p className={s.up}>{perk.up}</p>
            </Panel>
          ))}
        </div>
        <p className={s.fair}>
          <strong>Žádná mechanická herní výhoda.</strong> Nikdy neprodáváme sílu
          ve hře — jen kapacitu a parádu.
        </p>
      </section>

      {/* JAK PODPOŘIT */}
      <section className={s.section}>
        <div className={s.secHead}>
          <span className={s.kicker}>Jak podpořit</span>
          <h2>Dobrovolný dar na provoz</h2>
        </div>
        <Panel className={s.give}>
          <p className={s.giveIntro}>
            Přispěj, kolik uznáš — jednorázově i opakovaně. Kanál na dar (účet /
            QR / Ko-fi) sem doplníme.
          </p>
          <div className={s.disclaimer}>
            <span className={s.disclaimerLabel}>Právní ujednání</span>
            Tento příspěvek je dobrovolnou podporou provozu Projektu Ikaros.
            Nejde o cenu za digitální službu ani o předplatné. Poskytnutím
            příspěvku nevzniká nárok na konkrétní funkci, kapacitu, technickou
            podporu ani protihodnotu.
          </div>
        </Panel>
      </section>

      {/* MŮJ STAV */}
      {me && (
        <section className={s.section}>
          <div className={s.secHead}>
            <span className={s.kicker}>Můj stav</span>
          </div>
          {supporter ? (
            <Panel className={s.stateYes}>
              <img
                className={s.stateSeal}
                src="/brand/ikaros-seal.webp"
                alt=""
              />
              <h3>Jsi Podporovatel</h3>
              <p>
                Díky, že držíš Ikara ve vzduchu. Máš odemčené světy bez stropu,
                všechny kostky, vězení i odznak.
              </p>
            </Panel>
          ) : (
            <Panel className={s.stateNo}>
              <h3>
                Čerpáš {Math.min(worldCount, FREE_WORLD_LIMIT)} ze{' '}
                {FREE_WORLD_LIMIT} světů
              </h3>
              <div className={s.worldsBar}>
                {Array.from({ length: FREE_WORLD_LIMIT }).map((_, i) => (
                  <span
                    key={i}
                    className={`${s.slot} ${i < worldCount ? s.slotFull : ''}`}
                  />
                ))}
              </div>
              <p>
                Chceš další svět, prémiové kostky nebo odznak? Staň se
                podporovatelem.
              </p>
            </Panel>
          )}
        </section>
      )}

      {/* ZEĎ PODPOROVATELŮ */}
      <section className={s.section}>
        <div className={s.secHead}>
          <span className={s.kicker}>Děkujeme</span>
          <h2>Zeď podporovatelů</h2>
          <p>Ti, kdo drží Ikara ve vzduchu. Řazeno od nejnovějších.</p>
        </div>
        {isLoading ? (
          <div className={s.center}>
            <Spinner />
          </div>
        ) : supporters && supporters.length > 0 ? (
          <div className={s.wall}>
            {supporters.map((sup) => (
              <Panel key={sup.id} className={s.sup}>
                <div className={s.supAv}>
                  <UserAvatar
                    src={sup.avatarUrl}
                    defaultType={sup.defaultAvatarType}
                    size="lg"
                    alt={sup.username}
                  />
                  <span className={s.supOv}>
                    <SupporterBadge size="sm" />
                  </span>
                </div>
                <div className={s.supName}>
                  {sup.displayName || sup.username}
                </div>
                {sup.supporterSince && (
                  <div className={s.supSince}>
                    od {formatSince(sup.supporterSince)}
                  </div>
                )}
              </Panel>
            ))}
          </div>
        ) : (
          <p className={s.center}>
            Zatím tu nikdo není. Buď první, kdo podpoří.{' '}
            <Link to="/">Zpět na úvod</Link>
          </p>
        )}
      </section>
    </div>
  );
}
