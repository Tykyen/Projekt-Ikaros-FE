import { Smartphone } from 'lucide-react';
import {
  usePushSubscriptions,
  useUnsubscribeDevice,
} from '../api/usePushSubscriptions';
import s from './PushDevicesList.module.css';

/** Hrubý odhad „prohlížeč · OS" z user-agentu pro lidsky čitelný název. */
function describeDevice(ua?: string): string {
  if (!ua) return 'Neznámé zařízení';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Prohlížeč';
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad|iOS/.test(ua)
        ? 'iOS'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : '';
  return os ? `${browser} · ${os}` : browser;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

interface PushDevicesListProps {
  /** Endpoint aktuální subscription — pro označení „toto zařízení". */
  currentEndpoint: string | null;
}

/**
 * D-030 — seznam vlastních push zařízení s možností odhlásit vzdálená. Aktuální
 * zařízení se ovládá přepínačem výše (disable() unsubscribne i lokálně), proto
 * tu jen badge bez tlačítka. Skryje se, dokud uživatel nemá žádné zařízení.
 */
export function PushDevicesList({ currentEndpoint }: PushDevicesListProps) {
  const { data: devices } = usePushSubscriptions();
  const unsub = useUnsubscribeDevice();

  if (!devices || devices.length === 0) return null;

  return (
    <div className={s.wrap}>
      <div className={s.head}>Tvá zařízení ({devices.length})</div>
      <ul className={s.list}>
        {devices.map((d) => {
          const isCurrent = !!currentEndpoint && d.endpoint === currentEndpoint;
          const removing = unsub.isPending && unsub.variables === d.id;
          return (
            <li key={d.id} className={s.row}>
              <div className={s.info}>
                <span className={s.name}>
                  <Smartphone size={13} aria-hidden="true" />
                  {describeDevice(d.userAgent)}
                  {isCurrent && <span className={s.badge}>toto zařízení</span>}
                </span>
                <span className={s.meta}>
                  Naposledy: {formatDate(d.lastUsedAt)}
                </span>
              </div>
              {isCurrent ? (
                <span className={s.hint}>↑ přepínač</span>
              ) : (
                <button
                  type="button"
                  className={s.removeBtn}
                  onClick={() => unsub.mutate(d.id)}
                  disabled={removing}
                >
                  {removing ? '…' : 'Odhlásit'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
