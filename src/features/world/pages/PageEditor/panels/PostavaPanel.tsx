import { User } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import type { PageType } from '../../api/pages.types';
import s from './PostavaPanel.module.css';

interface Props {
  type: PageType;
  ownerUserId: string;
  onOwnerChange: (userId: string) => void;
}

/**
 * 9.1 — Editor PC/NPC pro PageEditor. Jen pro PC: přiřazení hráče (owner).
 *
 * Soukromé bio se po sjednocení (spec-akj-protected-tabs) řeší přes AKJ
 * chráněné záložky („PJ informace") v panelu „Chráněné záložky" — viz AkjTabsPanel.
 * Veřejné bio (`content`/`table`) řeší ContentPanel + TablePanel.
 */
export function PostavaPanel({ type, ownerUserId, onOwnerChange }: Props) {
  const { worldId } = useWorldContext();
  const isPC = type === 'Postava hráče';
  const { data: members = [] } = useWorldMembers(worldId);

  if (!isPC) return null;

  return (
    <CollapsiblePanel title="Hráč postavy" icon={<User size={18} aria-hidden />}>
      <p className={s.hint}>
        Vyber člena světa, kterému postava patří. Hráč pak postavu uvidí v „Moje
        postava".
      </p>
      <select
        value={ownerUserId}
        onChange={(e) => onOwnerChange(e.target.value)}
        className={s.select}
      >
        <option value="">— Bez přiřazení (zatím) —</option>
        {members.map((m) => (
          <option key={m.userId} value={m.userId}>
            {m.user?.username ?? m.userId}
          </option>
        ))}
      </select>
    </CollapsiblePanel>
  );
}
