import { ArrowUpRight, Layers, Info } from 'lucide-react';
import type { WorldMapPin } from '../types';
import { pinIcon, pinColor, DEAD_PIN_COLOR } from '../constants/pinAppearance';
import s from './viewer.module.css';

interface Props {
  pin: WorldMapPin;
  /** Cíl už neexistuje / není dostupný → šedý, neklikací. */
  dead?: boolean;
  /** Velikost vlaječky v px (default 30). */
  size?: number;
}

/**
 * 16.5 — vizuál jedné vlaječky: tvar vlajky (konzistentní) + zvolená ikona a
 * barva; roli (page/map/none) nese malý rohový odznáček. Tajná = přerušovaný
 * okraj, mrtvý cíl = šedá. Pozicování řeší rodič (PinLayer / list).
 */
export function PinMarker({ pin, dead = false, size = 30 }: Props) {
  const Icon = pinIcon(pin.icon);
  const color = dead ? DEAD_PIN_COLOR : pinColor(pin.color);
  const BadgeIcon =
    pin.targetType === 'map'
      ? Layers
      : pin.targetType === 'page'
        ? ArrowUpRight
        : Info;

  return (
    <span
      className={`${s.flag} ${pin.isPublic ? '' : s.flagSecret} ${dead ? s.flagDead : ''}`}
      style={
        {
          '--pin-c': color,
          width: `${size}px`,
          height: `${size}px`,
        } as React.CSSProperties
      }
    >
      <Icon size={Math.round(size * 0.52)} strokeWidth={2} aria-hidden />
      <span className={s.flagBadge}>
        <BadgeIcon size={Math.round(size * 0.34)} strokeWidth={2.4} aria-hidden />
      </span>
    </span>
  );
}
