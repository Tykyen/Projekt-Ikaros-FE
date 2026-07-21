/**
 * Spec 26.1 — kotva Vypravěče (FAB, pravý dolní roh).
 * Mimo svět mluví Ishida (silueta cylindr), ve světě Joe (silueta lucerna) —
 * placeholder siluety do dodání grafiky (02a). Stav „spí" = jen na zavolání.
 */
import { SiluetaCylindr, SiluetaLucerna } from './siluety';
import s from './Vypravec.module.css';

export function VypravecFab({
  scope,
  otevreny,
  spi,
  onClick,
}: {
  scope: 'ikaros' | 'world';
  otevreny: boolean;
  spi?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={s.fab}
      data-spi={spi || undefined}
      data-vypravec-fab=""
      aria-label="Vypravěč — nápověda a průvodce"
      aria-expanded={otevreny}
      aria-haspopup="dialog"
      onClick={onClick}
    >
      {scope === 'world' ? <SiluetaLucerna /> : <SiluetaCylindr />}
    </button>
  );
}
