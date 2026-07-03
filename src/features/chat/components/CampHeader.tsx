import { BookOpen, Lock } from 'lucide-react';
import clsx from 'clsx';
import { ROOM_STYLES, CAMP_PLACES } from '../lib/campPlaces';
import type { RoomEnvironment, RoomStyle } from '../lib/types';
import s from './CampHeader.module.css';

export interface CampHeaderProps {
  environment: RoomEnvironment;
  /** Smí měnit prostředí — role s platformovou funkcí (spec 4.2a §4.3). */
  canEdit: boolean;
  onChange: (env: RoomEnvironment) => void;
  descOpen: boolean;
  onToggleDesc: () => void;
}

/**
 * Záhlaví scény Campu — výběr stylu a lokace + přepínač popisu (📖).
 * Bez oprávnění jsou selecty „zamčená cedule" (read-only).
 *
 * Stylizovaný nativní `<select>` (ne custom dropdown) — drží přístupnost
 * a nativní mobilní picker.
 */
export function CampHeader({
  environment,
  canEdit,
  onChange,
  descOpen,
  onToggleDesc,
}: CampHeaderProps) {
  const places = CAMP_PLACES[environment.style];

  const handleStyle = (style: RoomStyle) => {
    // Nový styl má jiné lokace → reset na první.
    onChange({ style, placeId: '1' });
  };

  return (
    <div className={s.bar}>
      <div className={s.controls}>
        <label className={clsx(s.cartouche, !canEdit && s.locked)}>
          <span className={s.cartoucheLabel}>Styl</span>
          <select
            className={s.select}
            value={environment.style}
            disabled={!canEdit}
            onChange={(e) => handleStyle(e.target.value as RoomStyle)}
          >
            {ROOM_STYLES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </label>

        <label className={clsx(s.cartouche, s.cartouchePlace, !canEdit && s.locked)}>
          <span className={s.cartoucheLabel}>Lokace</span>
          <select
            className={s.select}
            value={environment.placeId}
            disabled={!canEdit}
            onChange={(e) =>
              onChange({ style: environment.style, placeId: e.target.value })
            }
          >
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        {!canEdit && (
          <span
            className={s.lockHint}
            title="Prostředí scény mění správci"
          >
            <Lock size={13} /> Scénu řídí správci
          </span>
        )}
      </div>

      <button
        type="button"
        className={clsx(s.descBtn, descOpen && s.descBtnActive)}
        onClick={onToggleDesc}
        aria-pressed={descOpen}
        aria-label="Popis místa"
        title="Popis místa"
      >
        <BookOpen size={16} />
      </button>
    </div>
  );
}
