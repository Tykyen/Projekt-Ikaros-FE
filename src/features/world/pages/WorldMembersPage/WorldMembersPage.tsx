import { useMemo, useState, type ReactNode } from 'react';
import { Crown, Shield, Users, UserPlus, Inbox } from 'lucide-react';
import { Spinner, Button, ErrorState } from '@/shared/ui';
import { WorldRole, type WorldMembership } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useWorldPendingActions } from '@/features/world/api/useWorldPendingActions';
import { useCharacterDirectory } from '@/features/world/pages/api/useCharacterDirectory';
import { isWorldPlayer } from '@/features/world/lib/isWorldPlayer';
import { RequestsList } from '@/features/world/components/WorldRequests';
import { InvitePanel } from '@/features/world/components/InvitePanel';
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
  const { worldId, worldSlug, isPJ, loading } = useWorldContext();
  const membersQuery = useWorldMembers(worldId);
  const settingsQuery = useWorldSettings(worldId);
  const directoryQuery = useCharacterDirectory(worldId);
  // 15.10 — fronta „ke zpracování" (žádosti o vstup) jen pro PJ/co-PJ.
  const pending = useWorldPendingActions(worldId, isPJ);
  const [inviteOpen, setInviteOpen] = useState(false);

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
  // `membersQuery.data` je `undefined` i při 500 → bez tohohle guardu adresář
  // tvrdil „Svět zatím nemá žádné hráče" (lež o složení světa).
  if (membersQuery.isError) {
    return (
      <article className={s.page}>
        <ErrorState
          size="panel"
          title="Hráče světa se nepodařilo načíst"
          description="Adresář teď neumíme zobrazit — neznamená to, že je svět prázdný. Zkus to prosím znovu."
          onRetry={() => void membersQuery.refetch()}
        />
      </article>
    );
  }

  const all = membersQuery.data ?? [];
  // „Hráč" = má přiřazenou postavu NEBO je staff (Korektor+). Žadatelé,
  // čtenáři a hráči bez postavy do adresáře nepatří (viz isWorldPlayer).
  const members = all.filter(isWorldPlayer);

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

  // 15.10 R10 — členové bez postavy a bez staff role (Čtenáři/Žadatelé, které
  // dnešní isWorldPlayer skryje). PJ i hráči tak vidí každého, kdo je v jeskyni.
  const newcomers = all.filter((m) => !isWorldPlayer(m));
  const pendingItems = pending.data ?? [];
  const isEmpty = members.length === 0 && newcomers.length === 0;

  return (
    <article className={s.page}>
      <header className={s.pageHead}>
        <h1 className={s.title}>Hráči světa</h1>
        {isPJ && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus size={16} aria-hidden="true" /> Přidat hráče
          </Button>
        )}
      </header>

      <div className={s.sections}>
        {isPJ && pendingItems.length > 0 && (
          <section className={s.section}>
            <header className={s.sectionHead}>
              <span className={s.sectionIcon} aria-hidden>
                <Inbox size={18} />
              </span>
              <h2 className={s.sectionTitle}>Čekající žádosti</h2>
              <span className={s.count}>{pendingItems.length}</span>
            </header>
            <RequestsList
              worldId={worldId}
              worldSlug={worldSlug}
              items={pendingItems}
            />
          </section>
        )}

        {isEmpty ? (
          <p className={s.empty}>Svět zatím nemá žádné hráče.</p>
        ) : (
          <>
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
            <Section
              icon={<UserPlus size={18} />}
              title="Nováčci"
              members={newcomers}
              delayMs={240 + groupSections.length * 80}
              worldSlug={worldSlug}
              charBySlug={charBySlug}
            />
          </>
        )}
      </div>

      {inviteOpen && (
        <InvitePanel worldId={worldId} onClose={() => setInviteOpen(false)} />
      )}
    </article>
  );
}
