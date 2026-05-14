import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
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
  return (
    <Link to={`/svet/${world.id}`} className={s.card}>
      <div className={s.top}>
        <div className={s.hero} aria-hidden={!world.imageUrl}>
          {world.imageUrl ? (
            <img src={world.imageUrl} alt={`${world.name} cover`} className={s.heroImg} />
          ) : (
            <Globe size={36} strokeWidth={1.5} aria-hidden="true" />
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
      <span className={s.cta}>
        {isMember ? 'Vstoupit do světa →' : 'Detail světa →'}
      </span>
    </Link>
  );
}
