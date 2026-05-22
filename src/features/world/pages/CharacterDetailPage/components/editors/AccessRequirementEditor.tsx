import { Plus, Trash2 } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useWorldMembers } from '@/features/world/api/useWorldMembers';
import { WorldRole } from '@/shared/types';
import type { AccessRequirement } from '../../../api/pages.types';
import s from './editors.module.css';

interface Props {
  requirements: AccessRequirement[];
  onChange: (next: AccessRequirement[]) => void;
}

type ReqType = AccessRequirement['type'];

const TYPE_LABELS: Record<ReqType, string> = {
  Role: 'Minimální role',
  AKJType: 'AKJ skupina',
  AKJ: 'AKJ úroveň (číslo)',
  UserId: 'Konkrétní hráč',
};

const WORLD_ROLE_LABELS: Record<number, string> = {
  [WorldRole.Zadatel]: 'Žadatel',
  [WorldRole.Ctenar]: 'Čtenář',
  [WorldRole.Hrac]: 'Hráč',
  [WorldRole.Korektor]: 'Korektor',
  [WorldRole.PomocnyPJ]: 'Pomocný PJ',
  [WorldRole.PJ]: 'Pán jeskyně',
};

/**
 * 8.1 — Editor přístupových pravidel postavy (`accessRequirements`). Řádkový
 * editor `{type, value}`; hodnota se zadává dle typu (role / AKJ skupina /
 * číselná AKJ / hráč). Lehčí varianta `PageEditor` AccessPanelu.
 */
export function AccessRequirementEditor({ requirements, onChange }: Props) {
  const { worldId } = useWorldContext();
  const { data: settings } = useWorldSettings(worldId);
  const { data: members = [] } = useWorldMembers(worldId);
  const akjTypes = settings?.akjTypes ?? [];

  const patch = (index: number, next: AccessRequirement) =>
    onChange(requirements.map((r, i) => (i === index ? next : r)));
  const remove = (index: number) =>
    onChange(requirements.filter((_, i) => i !== index));
  const add = () => onChange([...requirements, { type: 'Role', value: '' }]);

  /** Změna typu resetuje hodnotu — value je typově závislé. */
  const changeType = (index: number, type: ReqType) =>
    patch(index, { type, value: '' });

  function valueInput(req: AccessRequirement, index: number) {
    if (req.type === 'Role') {
      return (
        <select
          className={`${s.field} ${s.rowGrow}`}
          value={req.value}
          aria-label="Hodnota pravidla"
          onChange={(e) => patch(index, { ...req, value: e.target.value })}
        >
          <option value="">Vybrat roli…</option>
          {Object.entries(WORLD_ROLE_LABELS).map(([level, label]) => (
            <option key={level} value={level}>
              {label} (≥ {level})
            </option>
          ))}
        </select>
      );
    }
    if (req.type === 'AKJType') {
      return (
        <select
          className={`${s.field} ${s.rowGrow}`}
          value={req.value}
          aria-label="Hodnota pravidla"
          onChange={(e) => patch(index, { ...req, value: e.target.value })}
        >
          <option value="">Vybrat AKJ skupinu…</option>
          {akjTypes.map((a) => (
            <option key={a.key} value={a.key}>
              {a.name} (level {a.level})
            </option>
          ))}
        </select>
      );
    }
    if (req.type === 'UserId') {
      return (
        <select
          className={`${s.field} ${s.rowGrow}`}
          value={req.value}
          aria-label="Hodnota pravidla"
          onChange={(e) => patch(index, { ...req, value: e.target.value })}
        >
          <option value="">Vybrat hráče…</option>
          {members.map((m) => (
            <option key={m.user?.id ?? m.id} value={m.user?.id ?? ''}>
              {m.user?.username || m.user?.id}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        className={`${s.field} ${s.rowGrow}`}
        type="number"
        min={0}
        value={req.value}
        placeholder="≥ N"
        aria-label="Hodnota pravidla"
        onChange={(e) => patch(index, { ...req, value: e.target.value })}
      />
    );
  }

  return (
    <div className={s.stack}>
      {requirements.length === 0 && (
        <p className={s.empty}>
          Bez pravidel — postavu uvidí kdokoli ve světě.
        </p>
      )}
      {requirements.map((req, i) => (
        <div key={i} className={s.row}>
          <select
            className={s.field}
            value={req.type}
            aria-label="Typ pravidla"
            onChange={(e) => changeType(i, e.target.value as ReqType)}
          >
            {(Object.keys(TYPE_LABELS) as ReqType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          {valueInput(req, i)}
          <button
            type="button"
            className={s.iconBtn}
            onClick={() => remove(i)}
            title="Smazat pravidlo"
            aria-label="Smazat pravidlo"
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </div>
      ))}
      <button type="button" className={s.addBtn} onClick={add}>
        <Plus size={13} aria-hidden /> Přidat pravidlo
      </button>
    </div>
  );
}
