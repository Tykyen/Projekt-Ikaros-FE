import { Link } from 'react-router-dom';
import { Globe, Lock } from 'lucide-react';
import type { World, WorldMembership } from '@/shared/types';
import { WorldRoleChip } from '@/features/world/components/WorldRoleChip';
import s from './WorldCard.module.css';

interface WorldCardProps {
  world: World;
  membership?: WorldMembership;
}

function formatPlayers(playerCount: number, maxPlayers?: number | null): string {
  if (maxPlayers != null) {
    return `${playerCount} / ${maxPlayers} hráčů`;
  }
  if (playerCount === 1) return '1 hráč';
  if (playerCount >= 2 && playerCount <= 4) return `${playerCount} hráči`;
  return `${playerCount} hráčů`;
}

export function WorldCard({ world, membership }: WorldCardProps) {
  const isMember = membership !== undefined;
  const mode = world.accessMode;
  // Katalog #3 — private svět nečlenovi jen zamčená karta (detail 404: private
  // vidí jen členi, applyDetailScope). Ostatní vedou na detail (vstup/žádost tam).
  const locked = !isMember && mode === 'private';

  const cta = isMember ? (
    'Vstoupit do světa →'
  ) : mode === 'open' ? (
    'Požádat o vstup →'
  ) : mode === 'private' ? (
    <>
      <Lock size={13} aria-hidden="true" /> Soukromý svět
    </>
  ) : (
    'Detail světa →'
  );

  const body = (
    <>
      <div className={s.top}>
        <div className={s.hero} aria-hidden={!world.imageUrl}>
          {world.imageUrl ? (
            <img
              src={world.imageUrl}
              alt={`${world.name} cover`}
              className={s.heroImg}
            />
          ) : (
            <Globe size={36} strokeWidth={1.5} aria-hidden="true" />
          )}
          {locked && (
            <span className={s.lockBadge} aria-hidden="true">
              <Lock size={15} />
            </span>
          )}
        </div>
        <div className={s.meta}>
          <h4 className={s.name}>{world.name}</h4>
          <div className={s.metaRow}>
            {world.genre && <span>{world.genre}</span>}
            {world.genre && <span aria-hidden="true">·</span>}
            <span>{formatPlayers(world.playerCount, world.maxPlayers)}</span>
          </div>
          {membership && <WorldRoleChip role={membership.role} size="sm" />}
        </div>
      </div>
      {world.description && <p className={s.description}>{world.description}</p>}
      <span className={`${s.cta}${locked ? ` ${s.ctaMuted}` : ''}`}>{cta}</span>
    </>
  );

  if (locked) {
    return (
      <div
        className={`${s.card} ${s.locked}`}
        aria-label={`${world.name} — soukromý svět (jen pro členy)`}
      >
        {body}
      </div>
    );
  }
  return (
    <Link to={`/svet/${world.slug}`} className={s.card}>
      {body}
    </Link>
  );
}
