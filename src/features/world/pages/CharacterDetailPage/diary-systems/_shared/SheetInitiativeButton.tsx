/**
 * 10.2c-edit-9g — sdílený „+ Iniciativa" quick-roll button.
 *
 * Mountovaný v top headeru každého per-system sheet, vyrenderuje se jen
 * pokud `onRoll` provrahován (tactical-map embed). CharacterDetailPage
 * default = bez button (onRoll undefined).
 *
 * Per-system default dice kind:
 *   - matrix / fate / pi  → fate (4dF)
 *   - drd2 / drd16 / drdh / drdplus / coc / dnd5e / gurps / jad / shadowrun → d20
 */
import type { SystemSheetProps } from '../types';

interface Props {
  onRoll: NonNullable<SystemSheetProps['onRoll']>;
  kind?: 'fate' | 'd20' | 'd6' | 'd10';
  modifier?: number;
}

export function SheetInitiativeButton({
  onRoll,
  kind = 'd20',
  modifier = 0,
}: Props): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => onRoll({ label: 'Iniciativa', modifier, kind })}
      style={{
        padding: '6px 14px',
        background: 'rgba(120, 100, 255, 0.22)',
        color: '#fff',
        border: '1px solid rgba(120, 100, 255, 0.6)',
        borderRadius: 5,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        cursor: 'pointer',
        marginBottom: 8,
      }}
      title={`Hodit iniciativu (${kind === 'fate' ? '4dF' : kind})`}
    >
      ⚡ Iniciativa
    </button>
  );
}
