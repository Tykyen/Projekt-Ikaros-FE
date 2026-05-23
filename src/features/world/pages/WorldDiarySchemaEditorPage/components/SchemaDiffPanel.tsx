import { useMemo } from 'react';
import type { DiarySchemaBlock } from '../../api/diarySchema.types';
import s from './DiarySchemaEditor.module.css';

interface Props {
  previous: DiarySchemaBlock[];
  next: DiarySchemaBlock[];
}

/**
 * 8.5 D-DIARY-4 — diff viewer mezi předchozí (uloženou) verzí a aktuálním
 * pracovním stavem. Detekce přes `id` (stable UUID) s fallbackem na `key`.
 */
export function SchemaDiffPanel({ previous, next }: Props) {
  const diff = useMemo(() => computeDiff(previous, next), [previous, next]);

  if (diff.added.length + diff.removed.length + diff.changed.length === 0) {
    return null;
  }

  return (
    <div className={s.diffPanel}>
      <h4>Změny proti uložené verzi</h4>
      <ul className={s.diffList}>
        {diff.added.map((b) => (
          <li key={`a-${b.id ?? b.key}`} className={s.diffAdded}>
            + Přidáno: <strong>{b.label}</strong> ({b.type})
          </li>
        ))}
        {diff.removed.map((b) => (
          <li key={`r-${b.id ?? b.key}`} className={s.diffRemoved}>
            − Odebráno: <strong>{b.label}</strong> ({b.type})
          </li>
        ))}
        {diff.changed.map((c) => (
          <li key={`c-${c.id}`} className={s.diffChanged}>
            ~ <strong>{c.label}</strong>: {c.reasons.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}

function computeDiff(
  previous: DiarySchemaBlock[],
  next: DiarySchemaBlock[],
): {
  added: DiarySchemaBlock[];
  removed: DiarySchemaBlock[];
  changed: { id: string; label: string; reasons: string[] }[];
} {
  const idOf = (b: DiarySchemaBlock) => b.id ?? b.key;
  const prevMap = new Map(previous.map((b) => [idOf(b), b]));
  const nextMap = new Map(next.map((b) => [idOf(b), b]));

  const added = next.filter((b) => !prevMap.has(idOf(b)));
  const removed = previous.filter((b) => !nextMap.has(idOf(b)));

  const changed: { id: string; label: string; reasons: string[] }[] = [];
  for (const [id, n] of nextMap) {
    const p = prevMap.get(id);
    if (!p) continue;
    const reasons: string[] = [];
    if (p.label !== n.label) reasons.push(`label "${p.label}" → "${n.label}"`);
    if (p.key !== n.key) reasons.push(`klíč "${p.key}" → "${n.key}"`);
    if (p.type !== n.type) reasons.push(`typ ${p.type} → ${n.type}`);
    if (p.order !== n.order) reasons.push(`pořadí ${p.order} → ${n.order}`);
    if (JSON.stringify(p.config) !== JSON.stringify(n.config)) {
      reasons.push('konfigurace změněna');
    }
    if (reasons.length > 0) {
      changed.push({ id, label: n.label, reasons });
    }
  }

  return { added, removed, changed };
}
