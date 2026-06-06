import { useMemo, type ReactNode } from 'react';
import { Crown, Shield, Users } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { WorldRole, type WorldMembership } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useCharacterDirectory } from '@/features/world/pages/api/useCharacterDirectory';
import { MemberCard } from './MemberCard';
import s from './WorldMembersPage.module.css';

/** Postava per slug (jméno + avatar) — pro „Hraje za" na kartě hráče. */
type CharBySlug = Map<string, { name: string; imageUrl?: string }>;

interface SectionProps {
  icon: ReactNode;
  title: string;
  /** Barva skupiny (hex z groupColors); undefined u vedení / bez skupiny. */
  color?: string;
  members: WorldMembership[];
  delayMs: number;
  worldSlug?: string;
  charBySlug: CharBySlug;
}

function Section({
  icon,
  title,
  color,
  members,
  delayMs,
  worldSlug,
  charBySlug,
}: SectionProps) {
  if (members.length === 0) return null;
  return (
    <section
      className={s.section}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <header className={s.sectionHead}>
        <span className={s.sectionIcon} aria-hidden>
          {icon}
        </span>
        {color && (
          <span
            className={s.dot}
            style={{ background: color }}
            aria-hidden
          />
        )}
        <h2 className={s.sectionTitle}>{title}</h2>
        <span className={s.count}>{members.length}</span>
      </header>
      <div className={s.grid}>
        {members.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            worldSlug={worldSlug}
            character={
              m.characterPath ? charBySlug.get(m.characterPath) : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Spec 5.6 — adresář členů světa (`/svet/:worldSlug/hraci`). Vedení (PJ,
 * Pomocní PJ) zvlášť nahoře, pod tím skupiny a jejich členové, nakonec
 * „Bez skupiny". Zadatelé (pending vstup) se nezobrazují. Jen pro čtení —
 * správa rolí/skupin je v nastavení světa.
 */
export default function WorldMembersPage() {
  const { worldId, worldSlug, loading } = useWorldContext();
  const membersQuery = useWorldMembers(worldId);
  const settingsQuery = useWorldSettings(worldId);
  const directoryQuery = useCharacterDirectory(worldId);

  // characterPath (slug) → jméno + avatar postavy (pro „Hraje za" na kartě).
  const charBySlug = useMemo<CharBySlug>(() => {
    const map: CharBySlug = new Map();
    for (const e of directoryQuery.data ?? []) {
      map.set(e.slug, { name: e.name, imageUrl: e.imageUrl });
    }
    return map;
  }, [directoryQuery.data]);

  if (loading || membersQuery.isLoading) {
    return <Spinner center />;
  }

  const all = membersQuery.data ?? [];
  // Zadatelé (pending vstup) nejsou plnými členy → skrýt.
  const members = all.filter((m) => m.role !== WorldRole.Zadatel);

  const pj = members.filter((m) => m.role === WorldRole.PJ);
  const pomocni = members.filter((m) => m.role === WorldRole.PomocnyPJ);
  const leadershipIds = new Set([...pj, ...pomocni].map((m) => m.id));
  const rest = members.filter((m) => !leadershipIds.has(m.id));

  const customGroups = settingsQuery.data?.customGroups ?? [];
  const groupColors = settingsQuery.data?.groupColors ?? {};

  const groupSections = customGroups.map((g) => ({
    name: g,
    color: groupColors[g],
    members: rest.filter((m) => m.group === g),
  }));

  const ungrouped = rest.filter(
    (m) => !m.group || !customGroups.includes(m.group),
  );

  const isEmpty = members.length === 0;

  return (
    <article className={s.page}>
      <header className={s.pageHead}>
        <h1 className={s.title}>Hráči světa</h1>
      </header>

      {isEmpty ? (
        <p className={s.empty}>Svět zatím nemá žádné členy.</p>
      ) : (
        <div className={s.sections}>
          <Section
            icon={<Crown size={18} />}
            title="Pán jeskyně"
            members={pj}
            delayMs={0}
            worldSlug={worldSlug}
            charBySlug={charBySlug}
          />
          <Section
            icon={<Shield size={18} />}
            title="Pomocní PJ"
            members={pomocni}
            delayMs={80}
            worldSlug={worldSlug}
            charBySlug={charBySlug}
          />
          {groupSections.map((g, i) => (
            <Section
              key={g.name}
              icon={<Users size={18} />}
              title={g.name}
              color={g.color}
              members={g.members}
              delayMs={160 + i * 80}
              worldSlug={worldSlug}
              charBySlug={charBySlug}
            />
          ))}
          <Section
            icon={<Users size={18} />}
            title="Bez skupiny"
            members={ungrouped}
            delayMs={160 + groupSections.length * 80}
            worldSlug={worldSlug}
            charBySlug={charBySlug}
          />
        </div>
      )}
    </article>
  );
}
