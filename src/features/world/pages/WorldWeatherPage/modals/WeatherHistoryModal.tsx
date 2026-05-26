/**
 * 9.4 dluh #2 — Modal s historií snapshotů počasí pro generátor.
 *
 * Otevírá se z kebab menu karty generátoru (položka „Historie").
 * Compact rows s teplotou, weatherType, datetime + trigger label.
 * Paginace: „Načíst další" 50 per stránku (offset increment).
 */
import { useMemo, useState } from 'react';
import {
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Clock,
  RefreshCw,
  Settings,
  FastForward,
} from 'lucide-react';
import { Modal, Button, Spinner } from '@/shared/ui';
import { useWeatherHistory } from '@/features/world/api/useWeatherGenerators';
import type {
  WeatherGenerator,
  WeatherHistoryEntry,
  WeatherHistoryTrigger,
} from '@/shared/types';
import s from './WeatherHistoryModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  worldId: string;
  generator: WeatherGenerator;
}

const WEATHER_ICON_MAP: Record<string, typeof CloudSun> = {
  clear: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  snow: CloudSnow,
  fog: CloudFog,
};

const TRIGGER_LABEL: Record<WeatherHistoryTrigger, string> = {
  generate: 'Vygenerováno',
  manual: 'Ručně nastaveno',
  'advance-day': 'Posun dne',
};

const TRIGGER_ICON: Record<WeatherHistoryTrigger, typeof RefreshCw> = {
  generate: RefreshCw,
  manual: Settings,
  'advance-day': FastForward,
};

const PAGE_SIZE = 50;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function pickIcon(type: string) {
  return WEATHER_ICON_MAP[type] ?? Cloud;
}

export function WeatherHistoryModal({ open, onClose, worldId, generator }: Props) {
  const [pageCount, setPageCount] = useState(1);

  // Accumulator pro již načtené stránky. React Query nemá out-of-box infinite
  // bez useInfiniteQuery, takže jednoduchá implementace: re-fetch celý chunk
  // s `limit = pageCount * PAGE_SIZE`, offset = 0. Trade-off: vždy refetch all,
  // ale historie je malá (50–200 snapshotů typicky).
  const limit = pageCount * PAGE_SIZE;
  const query = useWeatherHistory(worldId, generator.id, {
    limit,
    offset: 0,
    enabled: open,
  });

  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const total = query.data?.total ?? 0;
  const hasMore = items.length < total;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Historie počasí — ${generator.name}`}
      size="lg"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Zavřít
        </Button>
      }
    >
      <div className={s.root}>
        {query.isLoading ? (
          <div className={s.loading}>
            <Spinner /> Načítám historii…
          </div>
        ) : query.isError ? (
          <p className={s.error}>Historie se nepodařila načíst.</p>
        ) : items.length === 0 ? (
          <p className={s.empty}>
            Pro tento generátor zatím není žádný záznam. Historie se vytváří
            po každém vygenerování, ručním nastavení nebo posunu dne.
          </p>
        ) : (
          <>
            <p className={s.summary}>
              Zobrazeno {items.length} z {total} záznamů
            </p>
            <ul className={s.list}>
              {items.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} />
              ))}
            </ul>
            {hasMore && (
              <div className={s.loadMore}>
                <Button
                  variant="ghost"
                  onClick={() => setPageCount((n) => n + 1)}
                  disabled={query.isFetching}
                >
                  {query.isFetching ? 'Načítám…' : 'Načíst další'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

function HistoryRow({ entry }: { entry: WeatherHistoryEntry }) {
  const w = entry.weather;
  // Dynamic icon lookup z weather type — pickIcon vrací existing icon component
  // (Sun/Cloud/CloudRain/atd.), ne inline-definovanou komponentu. Lint má false positive.
  const Icon = pickIcon(w?.weatherIcon ?? w?.weatherType ?? '');
  const TriggerIcon = TRIGGER_ICON[entry.trigger];
  return (
    <li className={s.row} data-trigger={entry.trigger}>
      <div className={s.rowIcon} aria-hidden="true">
        {/* eslint-disable-next-line react-hooks/static-components -- viz komentář u pickIcon */}
        <Icon size={22} />
      </div>
      <div className={s.rowMain}>
        <div className={s.rowTitle}>
          <span className={s.rowTemp}>
            {Math.round(w?.temperature ?? 0)}°{w?.tempUnit ?? 'C'}
          </span>
          <span className={s.rowType}>{w?.weatherType ?? '—'}</span>
        </div>
        <div className={s.rowMeta}>
          <span className={s.rowMetaItem}>
            <Clock size={12} aria-hidden="true" />
            {formatDateTime(entry.recordedAt)}
          </span>
          <span className={s.rowMetaItem}>
            <TriggerIcon size={12} aria-hidden="true" />
            {TRIGGER_LABEL[entry.trigger]}
          </span>
          {entry.inGameDate && (
            <span className={s.rowMetaItem} title="In-game datum">
              In-game: {formatDateTime(entry.inGameDate)}
            </span>
          )}
        </div>
      </div>
      <div className={s.rowDetails}>
        {w?.wind && (
          <span className={s.detailChip}>
            Vítr {Math.round(w.wind.speed)} km/h
          </span>
        )}
        {w?.humidity !== undefined && (
          <span className={s.detailChip}>Vlhkost {Math.round(w.humidity)}%</span>
        )}
        {w?.pressure && (
          <span className={s.detailChip}>{w.pressure.value} hPa</span>
        )}
      </div>
    </li>
  );
}
