import { PinMarker } from './PinMarker';
import type { PinClusterItem } from './lib/clusterPins';
import type { WorldMapPin } from '../types';
import { pinColor, DEAD_PIN_COLOR } from '../constants/pinAppearance';
import s from './viewer.module.css';

interface Props {
  clusters: PinClusterItem[];
  /** Piny s nedostupným cílem → šedé, neklikací. */
  deadIds: Set<string>;
  onPinPointerDown: (e: React.PointerEvent, pin: WorldMapPin) => void;
  onPinEnter: (pin: WorldMapPin) => void;
  onPinLeave: () => void;
  onClusterClick: (c: PinClusterItem) => void;
}

/**
 * 16.5 — vrstva vlaječek nad obrázkem (uvnitř transformovaného canvasu, takže
 * sedí na mapě při zoomu/posunu). Osamocený pin = `PinMarker`, shluk = bublinka
 * s počtem (klik přiblíží).
 */
export function PinLayer({
  clusters,
  deadIds,
  onPinPointerDown,
  onPinEnter,
  onPinLeave,
  onClusterClick,
}: Props) {
  return (
    <div className={s.pinHost}>
      {clusters.map((c) => {
        if (c.pins.length === 1) {
          const pin = c.pins[0]!;
          const dead = deadIds.has(pin.id);
          return (
            <div
              key={pin.id}
              className={s.pinWrap}
              style={
                {
                  left: `${pin.x * 100}%`,
                  top: `${pin.y * 100}%`,
                  '--pin-c': dead ? DEAD_PIN_COLOR : pinColor(pin.color),
                } as React.CSSProperties
              }
              onPointerDown={(e) => onPinPointerDown(e, pin)}
              onPointerEnter={() => onPinEnter(pin)}
              onPointerLeave={onPinLeave}
            >
              <PinMarker pin={pin} dead={dead} />
            </div>
          );
        }
        return (
          <button
            key={c.id}
            type="button"
            className={s.cluster}
            style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
            onClick={() => onClusterClick(c)}
            title={`${c.pins.length} vlaječek — přiblížit`}
          >
            {c.pins.length}
          </button>
        );
      })}
    </div>
  );
}
