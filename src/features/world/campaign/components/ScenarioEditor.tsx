import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Button, ImageLightbox } from '@/shared/ui';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { useUploadImage } from '@/shared/api';
import { createSceneFromImage } from '@/features/world/tactical-map/api/mapApi';
import { useUpdateScenario } from '../api';
import {
  useSaveScenarioTemplate,
  toTemplateContentData,
} from '../scenarioTemplates';
import { SendImageToChatDialog } from './SendImageToChatDialog';
import {
  SCENARIO_STATUSES,
  SCENARIO_STATUS_LABELS,
  getMeta,
  mergeMeta,
  type ScenarioStatus,
} from '../scenarioMeta';
import type { CampaignScenario, CreateScenarioInput } from '../types';
import s from './storyboard.module.css';

interface LegendRow {
  label: string;
  text: string;
}

interface Draft {
  title: string;
  status: ScenarioStatus;
  branchLabel: string;
  body: string;
  gmNotes: string;
  objective: string;
  outcome: string;
  images: string[];
  mapImageUrl: string;
  mapNumberedUrl: string;
  mapLegend: LegendRow[];
}

function toDraft(scenario: CampaignScenario): Draft {
  const m = getMeta(scenario);
  return {
    title: scenario.title ?? '',
    status: m.status,
    branchLabel: m.branchLabel ?? '',
    body: m.body ?? '',
    gmNotes: m.gmNotes ?? '',
    objective: m.objective ?? '',
    outcome: m.outcome ?? '',
    images: scenario.images ?? [],
    mapImageUrl: m.mapPrep?.imageUrl ?? '',
    mapNumberedUrl: m.mapPrep?.numberedImageUrl ?? '',
    mapLegend: m.mapPrep?.legend ?? [],
  };
}

/**
 * Editor scény. Explicit „Uložit" + dirty guard (záměrná volba — bezpečnější
 * proti `$set` přepisu než autosave). Provázání (links panel) se ukládá zvlášť;
 * `onSave` zachová first-class linky i meta provázání přes `mergeMeta` nad
 * aktuálním scénářem.
 *
 * Mount na `key={scenario.id}` → výběr jiného uzlu = čistý draft.
 */
export function ScenarioEditor({
  scenario,
  isPJ,
  readOnly,
  isSaving,
  linksPanel,
  onSave,
}: {
  scenario: CampaignScenario;
  isPJ: boolean;
  readOnly: boolean;
  isSaving: boolean;
  /** Panel provázání (Step 4) — vkládá orchestrátor. */
  linksPanel?: ReactNode;
  onSave: (input: CreateScenarioInput) => void;
}) {
  const initial = useMemo(() => toDraft(scenario), [scenario]);
  const [draft, setDraft] = useState<Draft>(initial);
  const [lightbox, setLightbox] = useState<{
    images: { url: string }[];
    index: number;
  } | null>(null);
  const [sendUrl, setSendUrl] = useState<string | null>(null);
  const meta = getMeta(scenario);
  const isFolder = meta.kind === 'folder';
  const hasParent = meta.parentId !== null;
  const uploadImage = useUploadImage();

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Odkaz zkopírován');
    } catch {
      toast.error('Kopírování selhalo');
    }
  }

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initial),
    [draft, initial],
  );

  // Varování při zavření okna/tabu s neuloženými změnami.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const saveTemplate = useSaveScenarioTemplate();
  function onSaveAsTemplate() {
    saveTemplate.mutate(
      {
        name: draft.title.trim() || 'Šablona scény',
        scenarioTitle: draft.title.trim() || 'Scéna',
        contentData: toTemplateContentData(scenario.contentData),
      },
      {
        onSuccess: () => toast.success('Uloženo do knihovny scén'),
        onError: () => toast.error('Uložení šablony selhalo'),
      },
    );
  }

  function save() {
    const input: CreateScenarioInput = {
      title: draft.title.trim() || 'Bez názvu',
      images: draft.images,
      // First-class linky mění links panel zvlášť → zachováme aktuální stav.
      linkedPageSlug: scenario.linkedPageSlug,
      subjectIds: scenario.subjectIds,
      storylineIds: scenario.storylineIds,
      isShared: scenario.isShared,
      // mergeMeta zachová meta provázání (pageSlugs/bestieIds/mapSceneIds) i
      // neměněná pole — chrání proti `$set` přepisu.
      contentData: mergeMeta(scenario, {
        status: draft.status,
        branchLabel: draft.branchLabel.trim() || undefined,
        body: draft.body || undefined,
        gmNotes: draft.gmNotes || undefined,
        objective: draft.objective.trim() || undefined,
        outcome: draft.outcome.trim() || undefined,
        mapPrep: {
          imageUrl: draft.mapImageUrl || undefined,
          numberedImageUrl: draft.mapNumberedUrl || undefined,
          legend: draft.mapLegend.filter((l) => l.label.trim() || l.text.trim()),
        },
      }),
    };
    onSave(input);
  }

  async function handleUpload(file: File) {
    try {
      const result = await uploadImage.mutateAsync(file);
      set('images', [...draft.images, result.url]);
    } catch {
      toast.error('Nahrání selhalo');
    }
  }

  async function uploadInto(file: File, apply: (url: string) => void) {
    try {
      const result = await uploadImage.mutateAsync(file);
      apply(result.url);
    } catch {
      toast.error('Nahrání selhalo');
    }
  }

  // C (11.2-ext): vytvoř taktickou scénu z mapy-podkladu + propoj zpět.
  const updateScenario = useUpdateScenario(scenario.worldId);
  const createScene = useMutation({
    mutationFn: () =>
      createSceneFromImage(
        scenario.worldId,
        scenario.title || 'Scéna',
        draft.mapImageUrl,
      ),
    onSuccess: (created) => {
      updateScenario.mutate({
        id: scenario.id,
        input: {
          title: scenario.title,
          images: scenario.images,
          linkedPageSlug: scenario.linkedPageSlug,
          subjectIds: scenario.subjectIds,
          storylineIds: scenario.storylineIds,
          isShared: scenario.isShared,
          contentData: mergeMeta(scenario, {
            mapSceneIds: [...meta.mapSceneIds, created.id],
          }),
        },
      });
      toast.success('Taktická scéna vytvořena — aktivuj ji na mapě.');
    },
    onError: () => toast.error('Vytvoření scény selhalo'),
  });

  function setLegend(idx: number, patch: Partial<LegendRow>) {
    set(
      'mapLegend',
      draft.mapLegend.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    );
  }

  return (
    <div className={s.editor}>
      <div className={s.editorHeadRow}>
        <input
          className={s.editorTitle}
          value={draft.title}
          placeholder={isFolder ? 'Název složky / aktu' : 'Název scény'}
          disabled={readOnly}
          onChange={(e) => set('title', e.target.value)}
        />
        {!readOnly && (
          <div className={s.editorSaveBox}>
            {dirty && <span className={s.dirtyDot} title="Neuložené změny" />}
            {!isFolder && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onSaveAsTemplate}
                disabled={saveTemplate.isPending || dirty}
                title={
                  dirty
                    ? 'Nejdřív ulož scénu'
                    : 'Uložit scénu do knihovny jako šablonu'
                }
              >
                📑 Šablona
              </Button>
            )}
            <Button onClick={save} disabled={!dirty || isSaving}>
              {isSaving ? 'Ukládám…' : 'Uložit'}
            </Button>
          </div>
        )}
      </div>

      <div className={s.editorMetaRow}>
        <label className={s.fieldInline}>
          <span className={s.fieldLabel}>Stav</span>
          <select
            className={s.select}
            value={draft.status}
            disabled={readOnly}
            onChange={(e) => set('status', e.target.value as ScenarioStatus)}
          >
            {SCENARIO_STATUSES.map((st) => (
              <option key={st} value={st}>
                {SCENARIO_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
        </label>
        {hasParent && (
          <label className={s.fieldInline}>
            <span className={s.fieldLabel}>Větev (volba hráčů)</span>
            <input
              className={s.input}
              value={draft.branchLabel}
              placeholder="např. pokud hráči zradí"
              disabled={readOnly}
              onChange={(e) => set('branchLabel', e.target.value)}
            />
          </label>
        )}
      </div>

      <section className={s.editorSection}>
        <div className={s.sectionLabel}>{isFolder ? 'Popis' : 'Scéna'}</div>
        <RichTextEditor
          value={draft.body}
          readOnly={readOnly}
          ariaLabel="Tělo scény"
          placeholder="Napiš, co se ve scéně děje…"
          onChange={(html) => set('body', html)}
          onImageUpload={async (file) =>
            (await uploadImage.mutateAsync(file)).url
          }
        />
      </section>

      {!isFolder && (
        <section className={s.gallery}>
          <div className={s.sectionLabel}>🖼 Obrázky scény</div>
          <div className={s.galleryGrid}>
            {draft.images.map((url, i) => (
              <div key={`${url}-${i}`} className={s.galleryItem}>
                <img src={url} alt="" />
                <div className={s.galleryActions}>
                  <button
                    type="button"
                    className={s.galleryAction}
                    aria-label="Otevřít obrázek"
                    title="Otevřít"
                    onClick={() =>
                      setLightbox({
                        images: draft.images.map((u) => ({ url: u })),
                        index: i,
                      })
                    }
                  >
                    🔍
                  </button>
                  <button
                    type="button"
                    className={s.galleryAction}
                    aria-label="Kopírovat odkaz"
                    title="Kopírovat odkaz"
                    onClick={() => void copyUrl(url)}
                  >
                    📋
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      className={s.galleryAction}
                      aria-label="Poslat do chatu"
                      title="Poslat do chatu"
                      onClick={() => setSendUrl(url)}
                    >
                      💬
                    </button>
                  )}
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    className={s.galleryRemove}
                    aria-label="Odebrat obrázek"
                    onClick={() =>
                      set(
                        'images',
                        draft.images.filter((_, idx) => idx !== i),
                      )
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {!readOnly && (
              <label className={s.galleryAdd}>
                {uploadImage.isPending ? 'Nahrávám…' : '+ Obrázek'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    Array.from(files).forEach((f) => void handleUpload(f));
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        </section>
      )}

      {!isFolder && (
        <section className={s.editorSection}>
          <div className={s.sectionLabel}>🗺 Mapa scény</div>
          <div className={s.mapSlots}>
            <MapSlot
              label="Podklad mapy"
              url={draft.mapImageUrl}
              readOnly={readOnly}
              uploading={uploadImage.isPending}
              onUpload={(f) => void uploadInto(f, (u) => set('mapImageUrl', u))}
              onClear={() => set('mapImageUrl', '')}
              onOpen={() =>
                draft.mapImageUrl &&
                setLightbox({ images: [{ url: draft.mapImageUrl }], index: 0 })
              }
            />
            <MapSlot
              label="Verze s čísly"
              url={draft.mapNumberedUrl}
              readOnly={readOnly}
              uploading={uploadImage.isPending}
              onUpload={(f) =>
                void uploadInto(f, (u) => set('mapNumberedUrl', u))
              }
              onClear={() => set('mapNumberedUrl', '')}
              onOpen={() =>
                draft.mapNumberedUrl &&
                setLightbox({
                  images: [{ url: draft.mapNumberedUrl }],
                  index: 0,
                })
              }
            />
          </div>

          <div className={s.legend}>
            <div className={s.fieldLabel}>Vysvětlivky (číslo → popis)</div>
            {draft.mapLegend.map((row, i) => (
              <div key={i} className={s.legendRow}>
                <input
                  className={s.legendLabel}
                  value={row.label}
                  placeholder="#"
                  disabled={readOnly}
                  onChange={(e) => setLegend(i, { label: e.target.value })}
                />
                <AutoTextarea
                  className={s.legendText}
                  value={row.text}
                  placeholder="popis místa/značky"
                  disabled={readOnly}
                  onChange={(e) => setLegend(i, { text: e.target.value })}
                />
                {!readOnly && (
                  <button
                    type="button"
                    className={s.legendRemove}
                    aria-label="Odebrat řádek"
                    onClick={() =>
                      set(
                        'mapLegend',
                        draft.mapLegend.filter((_, idx) => idx !== i),
                      )
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {!readOnly && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  set('mapLegend', [...draft.mapLegend, { label: '', text: '' }])
                }
              >
                + Vysvětlivka
              </Button>
            )}
          </div>

          {!readOnly && draft.mapImageUrl && (
            <Button
              size="sm"
              variant="secondary"
              disabled={createScene.isPending}
              onClick={() => createScene.mutate()}
            >
              {createScene.isPending
                ? 'Vytvářím…'
                : '🗺 Vytvořit taktickou scénu z této mapy'}
            </Button>
          )}
        </section>
      )}

      {isPJ && !isFolder && (
        <section className={clsx(s.editorSection, s.secretZone)}>
          <div className={s.secretHead}>🔒 Jen PJ</div>
          <div className={s.sectionLabel}>Poznámky PJ</div>
          <RichTextEditor
            value={draft.gmNotes}
            readOnly={readOnly}
            ariaLabel="Tajné poznámky PJ"
            placeholder="Tajné poznámky, pravda za scénou…"
            onChange={(html) => set('gmNotes', html)}
          />
          <div className={s.secretGrid}>
            <label className={s.field}>
              <span className={s.fieldLabel}>🎯 Cíl scény</span>
              <textarea
                className={s.textarea}
                value={draft.objective}
                disabled={readOnly}
                onChange={(e) => set('objective', e.target.value)}
              />
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>🏁 Výsledek</span>
              <textarea
                className={s.textarea}
                value={draft.outcome}
                disabled={readOnly}
                onChange={(e) => set('outcome', e.target.value)}
              />
            </label>
          </div>
        </section>
      )}

      {linksPanel && <section className={s.editorSection}>{linksPanel}</section>}

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(index) =>
            setLightbox((prev) => (prev ? { ...prev, index } : null))
          }
        />
      )}

      <SendImageToChatDialog
        worldId={scenario.worldId}
        imageUrl={sendUrl}
        onClose={() => setSendUrl(null)}
      />
    </div>
  );
}

/** Textarea, která roste do výšky s obsahem (dlouhý text je celý vidět). */
function AutoTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);
  return <textarea ref={ref} rows={1} {...props} />;
}

/** Jeden upload slot mapy (podklad / očíslovaná verze). */
function MapSlot({
  label,
  url,
  readOnly,
  uploading,
  onUpload,
  onClear,
  onOpen,
}: {
  label: string;
  url: string;
  readOnly: boolean;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
  onOpen: () => void;
}) {
  return (
    <div className={s.mapSlot}>
      <div className={s.fieldLabel}>{label}</div>
      {url ? (
        <div className={s.mapSlotImgWrap}>
          <button type="button" className={s.mapSlotOpen} onClick={onOpen}>
            <img src={url} alt={label} className={s.mapSlotImg} />
          </button>
          {!readOnly && (
            <button
              type="button"
              className={s.galleryRemove}
              aria-label="Odebrat mapu"
              onClick={onClear}
            >
              ×
            </button>
          )}
        </div>
      ) : readOnly ? (
        <div className={s.linkEmpty}>—</div>
      ) : (
        <label className={s.mapUpload}>
          {uploading ? 'Nahrávám…' : '+ Nahrát mapu'}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}
