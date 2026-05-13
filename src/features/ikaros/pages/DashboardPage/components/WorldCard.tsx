import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import type { World, WorldMembership } from '@/shared/types';
import { WorldRoleChip } from '@/features/world/components/WorldRoleChip';
import s from './WorldCard.module.css';

interface WorldCardProps {
  world: World;
  membership: WorldMembership;
}

export function WorldCard({ world, membership }: WorldCardProps) {
  const players =
    world.playerCount === 1
      ? '1 hráč'
      : world.playerCount >= 2 && world.playerCount <= 4
        ? `${world.playerCount} hráči`
        : `${world.playerCount} hráčů`;

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
            <span>{players}</span>
          </div>
          <WorldRoleChip role={membership.role} size="sm" />
        </div>
      </div>
      {world.description && <p className={s.description}>{world.description}</p>}
      <span className={s.cta}>Vstoupit do světa →</span>
    </Link>
  );
}
