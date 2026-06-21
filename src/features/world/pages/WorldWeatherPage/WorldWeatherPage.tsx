/**
 * 9.4-I M3.1 — `/svet/:worldSlug/pocasi` page.
 *
 * Layout: header (breadcrumb + title + akce) → grid karet generátorů (3/2/1
 * dle viewport) → „+ Nový generátor" tile na konci (PJ+) → modaly.
 *
 * Role gating:
 *  - Hráč (Hrac+) → read-only, žádné kebab/akce/drag/add
 *  - PomocnyPJ+ → generovat, broadcast, ručně nastavit, drag, vytvořit/edit
 *  - PJ+ → mazat (přes kebab)
 *
 * WS subscribe (`useWeatherWsSubscribe`) auto-patchuje cache na BE broadcast
 * eventy — karta se okamžitě překreslí v jiném tabu/zařízení.
 *
 * Drag-to-reorder: `@dnd-kit` přes `useWeatherDragOrder` + `SortableContext`.
 * Optimistic update řeší `useReorderGenerators` mutace v API hooku.
 *
 * Modaly (Create/Edit, Manual, Broadcast) jsou prozatím placeholdery —
 * M3b je přidá samostatně.
 */
import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Plus, FastForward, Package, CalendarClock } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Button, ConfirmDialog, Spinner, EmptyState, ErrorState } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { WorldRole, type WeatherGenerator } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import {
  useWeatherGenerators,
  useGenerateWeather,
  useDeleteWeatherGenerator,
  useAdvanceDay,
} from '@/features/world/api/useWeatherGenerators';
import { useWeatherWsSubscribe } from '@/features/world/api/useWeatherWsSubscribe';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { SortableWeatherCard } from './components/SortableWeatherCard';
import { useWeatherDragOrder } from './hooks/useWeatherDragOrder';
import { useFavorites } from './hooks/useFavorites';
import {
  WeatherGeneratorModal,
  ManualWeatherModal,
  BroadcastModal,
  WeatherHistoryModal,
  WeatherSetsModal,
  SetInGameDateModal,
} from './modals';
import s from './WorldWeatherPage.module.css';

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; id: string }
  | { kind: 'manual'; id: string }
  | { kind: 'broadcast'; id: string }
  | { kind: 'history'; id: string };

/**
 * 9.4 dluh #1 — formátuje in-game date pro header display.
 * Pokud má svět custom kalendář (`timelineCalendarSlug`), použij prvních pár
 * generátorů jako fallback (calendarMonth z weather currentWeather)
 * — jinak Gregorian cs-CZ.
 *
 * 9.4 — Zahrnuje i čas (HH:MM v UTC, aby čas byl stabilní napříč klienty).
 * User chce vidět datum + čas najednou.
 */
function formatInGameDate(
  iso: string | null | undefined,
  hasCustomCalendar: boolean,
  customMonthName: string | null,
): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;
  if (hasCustomCalendar && customMonthName) {
    // Custom calendar UX — den + měsíc + rok (rok = real-world) + čas
    return `${customMonthName}, den ${d.getUTCDate()} (Rok ${d.getUTCFullYear()}), ${timeStr}`;
  }
  const datePart = d.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${datePart}, ${timeStr}`;
}

export default function WorldWeatherPage() {
  const { worldId, worldSlug, world, userRole, loading } = useWorldContext();
  const currentUser = useAtomValue(currentUserAtom);

  // Elevation — admin má world bypass jen když je v tomto světě „nahozený".
  const isElevatedHere = world?.elevated === true;
  const role = userRole ?? WorldRole.Zadatel;
  const canManage = isElevatedHere || role >= WorldRole.PomocnyPJ;
  const canDelete = isElevatedHere || role >= WorldRole.PJ;

  // Data + WS.
  const listQuery = useWeatherGenerators(worldId);
  useWeatherWsSubscribe(worldId);
  const generateMut = useGenerateWeather(worldId);
  const deleteMut = useDeleteWeatherGenerator(worldId);
  // 9.4 dluh #1 — advance-day + in-game date display
  const advanceDayMut = useAdvanceDay(worldId);
  const settingsQuery = useWorldSettings(worldId);

  // Modaly + smazat confirm.
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });
  const [toDelete, setToDelete] = useState<WeatherGenerator | null>(null);
  // 9.4 — sety modal (samostatný state — může běžet vedle create wizardu).
  const [setsModalOpen, setSetsModalOpen] = useState(false);
  // 9.4 — set in-game date modal (samostatný state — header button kdykoli).
  const [setDateModalOpen, setSetDateModalOpen] = useState(false);

  const rawGenerators = useMemo(
    () => listQuery.data ?? [],
    [listQuery.data],
  );

  // 9.4 dluh #4 — favorites (FE-only, localStorage, per-user × per-world).
  // Drag-and-drop pracuje s `rawGenerators` (manipuluje displayOrder na BE);
  // favorites sort se aplikuje až nad výsledkem — drag funguje napříč zónami,
  // ale visual řazení vždy posune favorited nahoru.
  const { favorites, isFavorite, toggle: toggleFavorite } = useFavorites(
    currentUser?.id ?? null,
    worldId,
  );

  const generators = useMemo(() => {
    if (favorites.length === 0) return rawGenerators;
    const favSet = new Set(favorites);
    // Stable sort: uvnitř fav i non-fav bloku zachováme původní (displayOrder)
    // pořadí — `Array.prototype.sort` je v moderních JS enginech stable.
    return [...rawGenerators].sort((a, b) => {
      const aFav = favSet.has(a.id);
      const bFav = favSet.has(b.id);
      if (aFav === bFav) return 0;
      return aFav ? -1 : 1;
    });
  }, [rawGenerators, favorites]);

  // Drag-to-reorder.
  const { sensors, ids, handleDragEnd, isReordering } = useWeatherDragOrder({
    worldId,
    generators,
    canManage,
  });

  if (loading) {
    return <Spinner center />;
  }

  // ── Handlers ────────────────────────────────────────────────────────
  async function handleGenerate(id: string) {
    try {
      await generateMut.mutateAsync({ id });
      toast.success('Počasí vygenerováno.');
    } catch {
      toast.error('Vygenerování selhalo.');
    }
  }

  async function handleDeleteConfirm() {
    if (!toDelete) return;
    try {
      await deleteMut.mutateAsync(toDelete.id);
      toast.success('Generátor smazán.');
    } catch {
      toast.error('Smazání selhalo.');
    }
    setToDelete(null);
  }

  async function handleAdvanceDay(days: number) {
    try {
      const result = await advanceDayMut.mutateAsync(days);
      const suffix = days === 1 ? 'den' : days < 5 ? 'dny' : 'dní';
      toast.success(
        `Posunuto o ${days} ${suffix} — ${result.monthName} ${result.day}. Počasí aktualizováno.`,
      );
    } catch {
      toast.error('Posun dne selhal.');
    }
  }

  // ── Render branches ────────────────────────────────────────────────
  const editing =
    modal.kind === 'edit'
      ? generators.find((g) => g.id === modal.id)
      : undefined;
  const manualTarget =
    modal.kind === 'manual'
      ? generators.find((g) => g.id === modal.id)
      : undefined;
  const broadcastTarget =
    modal.kind === 'broadcast'
      ? generators.find((g) => g.id === modal.id)
      : undefined;
  const historyTarget =
    modal.kind === 'history'
      ? generators.find((g) => g.id === modal.id)
      : undefined;

  // 9.4 dluh #1 — in-game date display data
  const settings = settingsQuery.data;
  const hasCustomCalendar = !!settings?.timelineCalendarSlug;
  // Pokud máme custom kalendář, využij `calendarMonth.name` z prvního
  // generátoru (BE už ho vyplnil dle worldSettings).
  const customMonthName =
    rawGenerators[0]?.currentWeather?.calendarMonth?.name ?? null;
  const inGameDateLabel = formatInGameDate(
    settings?.currentInGameDate ?? null,
    hasCustomCalendar,
    customMonthName,
  );

  return (
    <article className={s.page}>
      <header className={s.header}>
        <div className={s.headerText}>
          <div className={s.breadcrumb}>
            Svět {world?.name ? `/ ${world.name}` : ''} /{' '}
            <span>Počasí</span>
          </div>
          <h1 className={s.title}>Počasí</h1>
          <p className={s.subtitle}>
            Generátory atmosférických podmínek napříč regiony světa. Klikni
            „Vygenerovat" pro aktualizaci, nebo „Broadcast" pro odeslání hráčům.
          </p>
          {inGameDateLabel && (
            <p
              className={s.inGameDate}
              data-testid="weather-ingame-date"
              title="In-game datum světa (advance-day mechanism)"
            >
              In-game: <strong>{inGameDateLabel}</strong>
            </p>
          )}
        </div>
        {canManage && generators.length > 0 && (
          <div className={s.headerActions}>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setSetDateModalOpen(true)}
              title="Explicit nastavit in-game datum světa (rok / měsíc / den)"
              aria-label="Nastavit in-game datum"
            >
              <CalendarClock size={16} aria-hidden="true" />
              <span>Nastavit datum</span>
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => void handleAdvanceDay(1)}
              disabled={advanceDayMut.isPending}
              title="Posunout in-game den o 1 (+ vygenerovat počasí pro všechny generátory)"
              aria-label="Posunout in-game den o 1"
            >
              <FastForward size={16} aria-hidden="true" />
              <span>{advanceDayMut.isPending ? 'Posouvám…' : '+1 den'}</span>
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => void handleAdvanceDay(7)}
              disabled={advanceDayMut.isPending}
              title="Posunout in-game o 7 dní"
              aria-label="Posunout in-game o 7 dní"
            >
              <FastForward size={16} aria-hidden="true" />
              <span>+7 dní</span>
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setSetsModalOpen(true)}
              title="Předpřipravené balíčky generátorů — 1 klik = X regionů"
              aria-label="Otevřít sety generátorů"
            >
              <Package size={16} aria-hidden="true" />
              <span>Sety</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setModal({ kind: 'create' })}
            >
              <Plus size={16} aria-hidden="true" />
              <span>Nový generátor</span>
            </Button>
          </div>
        )}
      </header>

      {listQuery.isError ? (
        <ErrorState
          size="panel"
          status={500}
          title="Nepodařilo se načíst počasí"
          onRetry={() => void listQuery.refetch()}
        />
      ) : listQuery.isLoading ? (
        <Spinner center />
      ) : generators.length === 0 ? (
        <div data-testid="weather-empty">
          {canManage ? (
            <EmptyState
              size="panel"
              illustration="generic-empty"
              title="Zatím žádný generátor"
              description="Vytvoř první generátor počasí — můžeš začít s reálným světem (Praha, Reykjavík…) nebo s archetypem (Mírné oceánské, Poušť…)."
              action={{
                label: 'Vytvořit první generátor',
                onClick: () => setModal({ kind: 'create' }),
              }}
            />
          ) : (
            <EmptyState
              size="panel"
              illustration="generic-empty"
              title="Počasí ještě není nastaveno"
              description="PJ světa ještě nenastavil žádné generátory počasí."
            />
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className={s.grid}>
              {generators.map((g) => (
                <SortableWeatherCard
                  key={g.id}
                  generator={g}
                  canManage={canManage}
                  canDelete={canDelete}
                  disabled={isReordering}
                  generatePending={
                    generateMut.isPending && generateMut.variables?.id === g.id
                  }
                  isFavorite={isFavorite(g.id)}
                  onToggleFavorite={
                    currentUser?.id ? () => toggleFavorite(g.id) : undefined
                  }
                  onGenerate={() => void handleGenerate(g.id)}
                  onBroadcast={() => setModal({ kind: 'broadcast', id: g.id })}
                  onEdit={() => setModal({ kind: 'edit', id: g.id })}
                  onManual={() => setModal({ kind: 'manual', id: g.id })}
                  onDelete={() => setToDelete(g)}
                  onHistory={() => setModal({ kind: 'history', id: g.id })}
                />
              ))}

              {canManage && (
                <button
                  type="button"
                  className={s.addTile}
                  onClick={() => setModal({ kind: 'create' })}
                  aria-label="Vytvořit nový generátor počasí"
                >
                  <span className={s.addPlus} aria-hidden="true">
                    +
                  </span>
                  <span className={s.addLabel}>Nový generátor</span>
                  <span className={s.addHint}>
                    Vyber z presetů nebo nakonfiguruj ručně
                  </span>
                </button>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {modal.kind === 'create' && (
        <WeatherGeneratorModal
          open
          onClose={() => setModal({ kind: 'closed' })}
          worldId={worldId}
          onSwitchToSets={() => {
            // 9.4 — wizard rozcestí karta „📦 Sety" → zavřít generator modal,
            // otevřít sets modal. Single-generator flow → batch-create flow.
            setModal({ kind: 'closed' });
            setSetsModalOpen(true);
          }}
        />
      )}
      {modal.kind === 'edit' && editing && (
        <WeatherGeneratorModal
          open
          onClose={() => setModal({ kind: 'closed' })}
          worldId={worldId}
          editingGenerator={editing}
        />
      )}
      {setsModalOpen && (
        <WeatherSetsModal
          open
          onClose={() => setSetsModalOpen(false)}
          worldId={worldId}
          readOnly={!canManage}
        />
      )}
      {modal.kind === 'manual' && manualTarget && (
        <ManualWeatherModal
          open
          onClose={() => setModal({ kind: 'closed' })}
          worldId={worldId}
          generator={manualTarget}
        />
      )}
      {modal.kind === 'broadcast' && broadcastTarget && (
        <BroadcastModal
          open
          onClose={() => setModal({ kind: 'closed' })}
          worldId={worldId}
          generator={broadcastTarget}
        />
      )}
      {modal.kind === 'history' && historyTarget && (
        <WeatherHistoryModal
          open
          onClose={() => setModal({ kind: 'closed' })}
          worldId={worldId}
          generator={historyTarget}
        />
      )}
      {setDateModalOpen && (
        <SetInGameDateModal
          open
          onClose={() => setSetDateModalOpen(false)}
          worldId={worldId}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Smazat generátor?"
        message={`Generátor „${toDelete?.name}" bude trvale smazán včetně aktuálního počasí.`}
        confirmLabel="Smazat"
        confirmVariant="danger"
        isPending={deleteMut.isPending}
        onConfirm={() => void handleDeleteConfirm()}
      />
      {/* worldSlug is unused intentionally — preserved for breadcrumb future. */}
      {worldSlug && null}
    </article>
  );
}
