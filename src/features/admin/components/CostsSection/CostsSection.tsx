import {
  HardDrive,
  Wifi,
  Wand2,
  Coins,
  Database,
  Globe,
  Cpu,
} from 'lucide-react';
import { useCostStats } from '../../api/useCostStats';
import { StatCard } from '../OverviewTab/StatCard';
import s from './CostsSection.module.css';

/** CZ popisky typů blobů. */
const TYPE_LABELS: Record<string, string> = {
  gallery: 'Galerie',
  worldMaps: 'Mapy světů',
  scenes: 'Taktické scény',
  emotes: 'Emotky',
  pages: 'Obrázky stránek',
  bestiae: 'Bestie',
  worldImages: 'Obrázky světů',
};

/** Byty → čitelné (B/kB/MB/GB), CZ desetinná čárka. */
function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'kB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / 1024 ** i;
  return `${val.toFixed(i === 0 ? 0 : 1).replace('.', ',')} ${units[i]}`;
}

/**
 * 19.2 — sekce „Náklady" v admin Přehledu. Tři vrstvy (spec 19.2): počty blobů
 * (odvozené z DB), přesné byty kde je známe, skutečný provoz Cloudinary.
 * ⚠️ Poctivost: počet blobů ≠ velikost; Cloudinary usage je jediný skutečný náklad.
 */
export function CostsSection() {
  const { data, isLoading, isError } = useCostStats();
  const c = data?.cloudinary;
  const typeMax = Math.max(1, ...(data?.blobs.byType ?? []).map((b) => b.count));
  const worldMax = Math.max(
    1,
    ...(data?.blobs.topWorlds ?? []).map((w) => w.count),
  );

  return (
    <section className={s.section}>
      <div className={s.head}>
        <h2 className={s.sectionTitle}>Náklady</h2>
      </div>

      {isError && (
        <p className={s.error} role="alert">
          Náklady se nepodařilo načíst. Zkus obnovit stránku.
        </p>
      )}

      {/* ── Vrstva C — Cloudinary skutečný provoz ───────────────────── */}
      {c?.available ? (
        <div className={s.block}>
          <span className={s.blockLabel}>
            Cloudinary{' '}
            <span className={s.blockNote}>(skutečné využití účtu{c.plan ? ` · ${c.plan}` : ''})</span>
          </span>
          <div className={s.grid}>
            <StatCard
              label="Úložiště"
              value={formatBytes(c.storageBytes ?? 0)}
              icon={<HardDrive />}
              index={0}
              loading={isLoading}
            />
            <StatCard
              label="Přenos"
              value={formatBytes(c.bandwidthBytes ?? 0)}
              icon={<Wifi />}
              index={1}
              loading={isLoading}
            />
            <StatCard
              label="Transformace"
              value={(c.transformations ?? 0).toLocaleString('cs-CZ')}
              icon={<Wand2 />}
              index={2}
              loading={isLoading}
            />
            {c.credits && (
              <StatCard
                label="Kredity"
                value={`${c.credits.used.toLocaleString('cs-CZ')} / ${c.credits.limit.toLocaleString('cs-CZ')}`}
                icon={<Coins />}
                tone={
                  c.credits.limit > 0 &&
                  c.credits.used / c.credits.limit > 0.8
                    ? 'accent'
                    : 'default'
                }
                index={3}
                loading={isLoading}
              />
            )}
          </div>
        </div>
      ) : (
        !isLoading &&
        !isError && (
          <p className={s.muted}>
            Cloudinary usage nedostupné (běh bez credentials nebo lokální disk).
          </p>
        )
      )}

      {/* ── Vrstva A — počty blobů ──────────────────────────────────── */}
      <div className={s.grid}>
        <StatCard
          label="Nahraných blobů celkem"
          value={data?.blobs.total ?? 0}
          icon={<Database />}
          index={0}
          loading={isLoading}
        />
      </div>

      {data && data.blobs.byType.length > 0 && (
        <div className={s.cols}>
          <div className={s.block}>
            <span className={s.blockLabel}>
              Podle typu{' '}
              <span className={s.blockNote}>(počet souborů, ne velikost)</span>
            </span>
            <ul className={s.barList}>
              {data.blobs.byType.map((b) => (
                <li key={b.type} className={s.barRow}>
                  <span
                    className={s.barFill}
                    style={{
                      width: `${Math.round((b.count / typeMax) * 100)}%`,
                    }}
                    aria-hidden
                  />
                  <span className={s.barText}>
                    {TYPE_LABELS[b.type] ?? b.type}
                  </span>
                  <span className={s.barValue}>
                    {b.count.toLocaleString('cs-CZ')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {data.blobs.topWorlds.length > 0 && (
            <div className={s.block}>
              <span className={s.blockLabel}>
                Nejnáročnější světy{' '}
                <span className={s.blockNote}>(blobů ve světě)</span>
              </span>
              <ul className={s.barList}>
                {data.blobs.topWorlds.map((w) => (
                  <li key={w.worldId} className={s.barRow}>
                    <span
                      className={s.barFill}
                      style={{
                        width: `${Math.round((w.count / worldMax) * 100)}%`,
                      }}
                      aria-hidden
                    />
                    <span className={s.barText} title={w.worldName}>
                      <Globe size={13} aria-hidden /> {w.worldName}
                    </span>
                    <span className={s.barValue}>
                      {w.count.toLocaleString('cs-CZ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Vrstva B — přesně změřené byty ──────────────────────────── */}
      {data && (
        <p className={s.measured}>
          Přesně změřeno:{' '}
          <b>{formatBytes(data.measuredBytes.chatAttachments)}</b> chat příloh ·{' '}
          <b>{formatBytes(data.measuredBytes.adminDocuments)}</b> dokumentů.{' '}
          <span className={s.blockNote}>
            Velikost obrázků v DB neevidujeme — spolehlivé číslo je Cloudinary výše.
          </span>
        </p>
      )}

      {/* ── AI (Fáze 18) ────────────────────────────────────────────── */}
      <p className={s.muted}>
        <Cpu size={14} aria-hidden /> AI zatím nezavedeno (Fáze 18) — nic ke
        změření.
      </p>
    </section>
  );
}
