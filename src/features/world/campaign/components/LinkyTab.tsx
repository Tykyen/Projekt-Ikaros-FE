import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Badge, Button, ConfirmDialog } from '@/shared/ui';
import { parseApiError } from '@/shared/api/client';
import {
  useCreateStoryline,
  useDeleteStoryline,
  useUpdateStoryline,
} from '../api';
import {
  STORYLINE_LEVELS,
  STORYLINE_LEVEL_LABELS,
  STORYLINE_STATUSES,
  STORYLINE_STATUS_LABELS,
} from '../labels';
import type {
  CampaignStoryline,
  CampaignStorylineLevel,
  CampaignStorylineStatus,
  CampaignSubject,
  CreateStorylineInput,
} from '../types';
import { StorylineForm } from './StorylineForm';
import s from './campaign.module.css';

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  active: 'success',
  escalating: 'warning',
  climax: 'danger',
  dormant: 'default',
  closed: 'default',
};

export function LinkyTab({
  worldId,
  storylines,
  subjects,
  readOnly,
  isPJ,
  onGoSubject,
}: {
  worldId: string;
  storylines: CampaignStoryline[];
  subjects: CampaignSubject[];
  readOnly: boolean;
  isPJ: boolean;
  onGoSubject: (id: string) => void;
}) {
  const createStoryline = useCreateStoryline(worldId);
  const updateStoryline = useUpdateStoryline(worldId);
  const deleteStoryline = useDeleteStoryline(worldId);

  const [selId, setSelId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<CampaignStorylineLevel | ''>('');
  const [statusFilter, setStatusFilter] = useState<CampaignStorylineStatus | ''>(
    '',
  );
  const [form, setForm] = useState<{ open: boolean; editing?: CampaignStoryline }>(
    { open: false },
  );
  const [del, setDel] = useState<CampaignStoryline | null>(null);

  const filtered = useMemo(
    () =>
      storylines.filter(
        (x) =>
          (!levelFilter || x.level === levelFilter) &&
          (!statusFilter || x.status === statusFilter),
      ),
    [storylines, levelFilter, statusFilter],
  );
  const selected = storylines.find((x) => x.id === selId) ?? null;
  const nameOf = (id: string) => subjects.find((x) => x.id === id)?.name ?? '?';

  function onError(e: unknown) {
    toast.error(parseApiError(e));
  }

  function submit(input: CreateStorylineInput) {
    const editing = form.editing;
    if (editing) {
      updateStoryline.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            toast.success('Linka upravena');
            setForm({ open: false });
          },
          onError,
        },
      );
    } else {
      createStoryline.mutate(input, {
        onSuccess: (created) => {
          toast.success('Linka vytvořena');
          setForm({ open: false });
          setSelId(created.id);
        },
        onError,
      });
    }
  }

  return (
    <div className={s.linkyLayout}>
      <div className={s.rail}>
        <div className={s.railHead}>
          <span className={s.railTitle}>Linky</span>
          {!readOnly && (
            <Button size="sm" onClick={() => setForm({ open: true })} aria-label="Přidat linku">
              +
            </Button>
          )}
        </div>
        <div className={s.chips}>
          <button
            type="button"
            className={clsx(s.chip, !levelFilter && s.chipOn)}
            onClick={() => setLevelFilter('')}
          >
            Vše
          </button>
          {STORYLINE_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              className={clsx(s.chip, levelFilter === l && s.chipOn)}
              onClick={() => setLevelFilter(l)}
            >
              {STORYLINE_LEVEL_LABELS[l]}
            </button>
          ))}
        </div>
        <div className={s.chips}>
          <button
            type="button"
            className={clsx(s.chip, !statusFilter && s.chipOn)}
            onClick={() => setStatusFilter('')}
          >
            Vše
          </button>
          {STORYLINE_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              className={clsx(s.chip, statusFilter === st && s.chipOn)}
              onClick={() => setStatusFilter(st)}
            >
              {STORYLINE_STATUS_LABELS[st]}
            </button>
          ))}
        </div>
        <div className={s.railList}>
          {filtered.map((x) => (
            <button
              type="button"
              key={x.id}
              className={clsx(s.railItem, selId === x.id && s.railItemOn)}
              onClick={() => setSelId(x.id)}
            >
              <span className={s.railItemBody}>
                <span className={s.railItemName}>{x.title}</span>
                <span className={s.detailMeta}>
                  <Badge>{STORYLINE_LEVEL_LABELS[x.level]}</Badge>
                  <Badge variant={STATUS_VARIANT[x.status] ?? 'default'}>
                    {STORYLINE_STATUS_LABELS[x.status]}
                  </Badge>
                </span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && <div className={s.empty}>Žádné linky</div>}
        </div>
      </div>

      <div className={s.detailPanel}>
        {!selected ? (
          <div className={s.empty}>Vyber linku nebo přidej novou</div>
        ) : (
          <div className={s.detail}>
            <div className={s.detailHead}>
              <div>
                <div className={s.detailTitle}>{selected.title}</div>
                <div className={s.detailMeta}>
                  <Badge>{STORYLINE_LEVEL_LABELS[selected.level]}</Badge>
                  <Badge variant={STATUS_VARIANT[selected.status] ?? 'default'}>
                    {STORYLINE_STATUS_LABELS[selected.status]}
                  </Badge>
                </div>
              </div>
            </div>

            {selected.subjectIds.length > 0 && (
              <div className={s.tagRow}>
                {selected.subjectIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={s.tag}
                    onClick={() => onGoSubject(id)}
                  >
                    {nameOf(id)}
                  </button>
                ))}
              </div>
            )}

            {selected.summary && (
              <section className={s.section}>
                <div className={s.sectionLabel}>Shrnutí</div>
                <p className={s.sectionText}>{selected.summary}</p>
              </section>
            )}
            {selected.whatHappened && (
              <section className={s.section}>
                <div className={s.sectionLabel}>Co se stalo</div>
                <p className={s.sectionText}>{selected.whatHappened}</p>
              </section>
            )}
            {isPJ && selected.truth && (
              <section className={s.section}>
                <div className={s.sectionLabel}>🔒 Pravda</div>
                <p className={s.secretText}>{selected.truth}</p>
              </section>
            )}
            {selected.playersBelief && (
              <section className={s.section}>
                <div className={s.sectionLabel}>👁 Co si myslí hráči</div>
                <p className={s.sectionText}>{selected.playersBelief}</p>
              </section>
            )}
            {isPJ && selected.gmIntent && (
              <section className={s.section}>
                <div className={s.sectionLabel}>🔒 Záměr PJ</div>
                <p className={s.secretText}>{selected.gmIntent}</p>
              </section>
            )}
            {selected.nextStep && (
              <section className={s.section}>
                <div className={s.sectionLabel}>→ Další krok</div>
                <p className={s.sectionText}>{selected.nextStep}</p>
              </section>
            )}

            {!readOnly && (
              <div className={s.detailActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setForm({ open: true, editing: selected })}
                >
                  Upravit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDel(selected)}>
                  Smazat
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <StorylineForm
        key={`sl-${form.open ? form.editing?.id ?? 'new' : 'closed'}`}
        open={form.open}
        subjects={subjects}
        initial={form.editing}
        isPJ={isPJ}
        isPending={createStoryline.isPending || updateStoryline.isPending}
        onClose={() => setForm({ open: false })}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        title="Smazat linku"
        message={`Opravdu smazat linku „${del?.title}"?`}
        confirmLabel="Smazat"
        confirmVariant="danger"
        isPending={deleteStoryline.isPending}
        onConfirm={() => {
          if (!del) return;
          deleteStoryline.mutate(del.id, {
            onSuccess: () => {
              toast.success('Linka smazána');
              if (selId === del.id) setSelId(null);
              setDel(null);
            },
            onError,
          });
        }}
      />
    </div>
  );
}
