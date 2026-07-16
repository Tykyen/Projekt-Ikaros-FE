import { UserAvatar } from '@/shared/ui';
import {
  useApproveAccessRequest,
  useRejectAccessRequest,
} from '@/features/world/api/useWorldJoin';
import type { WorldPendingActionItem } from '@/features/world/api/useWorldPendingActions';
import s from './RequestsList.module.css';

interface Props {
  worldId: string;
  items: WorldPendingActionItem[];
}

/** Štítek podnětu per typ. Fáze C přidá `character-request`. */
const TYPE_LABEL: Record<WorldPendingActionItem['type'], string> = {
  'access-request': 'Žádá o vstup',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'právě teď';
  if (min < 60) return `před ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `před ${h} h`;
  const d = Math.floor(h / 24);
  return `před ${d} d`;
}

/**
 * 15.10 — seznam podnětů „ke zpracování" pro daný svět. Sdílený stránkou Hráči
 * i drawerem v hlavičce. Multi-typ (R16): zatím jen `access-request`
 * (Přijmout → membership Čtenář / Odmítnout → smaž); fáze C přidá
 * `character-request` s vlastními akcemi.
 */
export function RequestsList({ worldId, items }: Props) {
  const approve = useApproveAccessRequest();
  const reject = useRejectAccessRequest();
  const busy = approve.isPending || reject.isPending;

  if (items.length === 0) {
    return <p className={s.empty}>Nic ke zpracování.</p>;
  }

  return (
    <ul className={s.list}>
      {items.map((it) => (
        <li key={`${it.type}:${it.id}`} className={s.row}>
          <UserAvatar src={it.avatarUrl} size="md" alt={it.displayName} />
          <div className={s.body}>
            <span className={s.name}>{it.displayName}</span>
            <span className={s.meta}>
              {it.characterName
                ? `Chce hrát jako ${it.characterName}`
                : TYPE_LABEL[it.type]}{' '}
              · {timeAgo(it.createdAt)}
            </span>
          </div>
          <div className={s.actions}>
            <button
              type="button"
              className={s.approve}
              disabled={busy}
              onClick={() => approve.mutate({ worldId, requestId: it.id })}
            >
              Přijmout
            </button>
            <button
              type="button"
              className={s.reject}
              disabled={busy}
              onClick={() => reject.mutate({ worldId, requestId: it.id })}
            >
              Odmítnout
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
