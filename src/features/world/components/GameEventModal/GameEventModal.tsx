import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import axios from 'axios';
import { ImagePlus, X } from 'lucide-react';
import { Modal, Input, Button, ImageZoomSlider, ImageFitToggle } from '@/shared/ui';
import { getImageStyle, type ImageFit } from '@/shared/lib/imageStyle';
import {
  useCreateGameEvent,
  useUpdateGameEvent,
} from '@/features/world/api/useGameEvents';
import { useCampaignScenarios } from '@/features/world/campaign/api';
// Světový obsah → content-image upload (PomocnyPJ+ není globální Admin, takže
// admin-gated /upload/image vracel 403). Modal je gated na world roli.
import { useUploadImage } from '@/shared/api/useUploadImage';
import {
  createGameEventSchema,
  type CreateGameEventFormValues,
} from '@/features/world/lib/createGameEventSchema';
import type { GameEvent } from '@/shared/types';
import s from './GameEventModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  worldId: string;
  /** Pokud chybí → create mode; jinak edit mode. */
  event?: GameEvent;
  customGroups: string[];
  groupColors: Record<string, string>;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 9.1-I — modal pro vytvoření / editaci herní akce světa.
 *
 * Vychází z `IkarosEventModal` (copy-adapt). Odlišnosti:
 * - `targetGroup` select (z `customGroups`)
 * - `groupOnly` checkbox (disabled pokud `targetGroup === null`)
 * - Validace přes `createGameEventSchema`
 * - Mutations `useCreateGameEvent` / `useUpdateGameEvent`
 */
export function GameEventModal({
  open,
  onClose,
  worldId,
  event,
  customGroups,
  groupColors,
}: Props) {
  const isEdit = !!event;
  const create = useCreateGameEvent();
  const update = useUpdateGameEvent();
  const upload = useUploadImage();
  // 27.1b — scénáře světa pro dropdown „Hraný scénář" (zlatá cesta ④).
  const { data: scenarios } = useCampaignScenarios(worldId);

  const [imageUrl, setImageUrl] = useState<string | null>(
    event?.imageUrl ?? null,
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [focal, setFocal] = useState<{ x: number; y: number }>({
    x: event?.imageFocalX ?? 50,
    y: event?.imageFocalY ?? 50,
  });
  const [imageZoom, setImageZoom] = useState<number | null>(
    event?.imageZoom ?? null,
  );
  const [imageFit, setImageFit] = useState<ImageFit | null>(
    event?.imageFit ?? null,
  );

  const defaultValues: CreateGameEventFormValues = event
    ? {
        title: event.title,
        date: toDatetimeLocal(event.date),
        description: event.description ?? '',
        targetGroup: event.targetGroup,
        groupOnly: event.groupOnly,
        confirmable: event.confirmable,
        scenarioId: event.scenarioId ?? null,
      }
    : {
        title: '',
        date: '',
        description: '',
        targetGroup: null,
        groupOnly: false,
        confirmable: true,
        scenarioId: null,
      };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
  } = useForm<CreateGameEventFormValues>({
    resolver: zodResolver(createGameEventSchema),
    mode: 'onBlur',
    defaultValues,
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch() = R19 false positive
  const watchedGroup = watch('targetGroup');

  function close() {
    onClose();
    reset({
      title: '',
      date: '',
      description: '',
      targetGroup: null,
      groupOnly: false,
      confirmable: true,
      scenarioId: null,
    });
    setImageUrl(null);
    setImageError(null);
    setFocal({ x: 50, y: 50 });
    setImageZoom(null);
    setImageFit(null);
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setImageError(null);
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Obrázek je větší než 10 MB.');
      return;
    }
    try {
      const result = await upload.mutateAsync(file);
      setImageUrl(result.url);
      setFocal({ x: 50, y: 50 });
      setImageZoom(null);
      setImageFit(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setImageError('Nemáš oprávnění nahrávat obrázky.');
        return;
      }
      setImageError('Nepodařilo se nahrát obrázek.');
    }
  }

  async function onSubmit(values: CreateGameEventFormValues) {
    try {
      const normalizedGroup =
        values.targetGroup === '' ? null : (values.targetGroup ?? null);
      if (isEdit && event) {
        await update.mutateAsync({
          id: event.id,
          dto: {
            title: values.title.trim(),
            date: values.date,
            description: values.description?.trim() || undefined,
            imageUrl: imageUrl ?? null,
            imageFocalX: imageUrl ? focal.x : null,
            imageFocalY: imageUrl ? focal.y : null,
            imageZoom: imageUrl ? imageZoom : null,
            imageFit: imageUrl ? imageFit : null,
            targetGroup: normalizedGroup,
            groupOnly: values.groupOnly,
            confirmable: values.confirmable,
            scenarioId: values.scenarioId ?? null,
          },
        });
        toast.success('Akce upravena.');
      } else {
        await create.mutateAsync({
          worldId,
          title: values.title.trim(),
          date: values.date,
          description: values.description?.trim() || undefined,
          imageUrl: imageUrl ?? undefined,
          imageFocalX: imageUrl ? focal.x : undefined,
          imageFocalY: imageUrl ? focal.y : undefined,
          imageZoom: imageUrl && imageZoom != null ? imageZoom : undefined,
          imageFit: imageUrl && imageFit != null ? imageFit : undefined,
          targetGroup: normalizedGroup,
          groupOnly: values.groupOnly,
          confirmable: values.confirmable,
          scenarioId: values.scenarioId ?? null,
        });
        toast.success('Akce vytvořena.');
      }
      close();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          toast.error('Nemáš oprávnění.');
          close();
          return;
        }
        if (status === 404) {
          toast.error('Akce neexistuje.');
          close();
          return;
        }
      }
      toast.error(
        isEdit
          ? 'Nepodařilo se uložit změny.'
          : 'Nepodařilo se vytvořit akci.',
      );
    }
  }

  const submitting =
    create.isPending || update.isPending || upload.isPending;

  return (
    <Modal
      open={open}
      onClose={close}
      title={isEdit ? 'Upravit akci' : 'Nová akce'}
      size="md"
    >
      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* eslint-disable jsx-a11y/no-autofocus -- autofocus na první pole je záměr: modal trapuje fokus */}
        <Input
          label="Název akce *"
          type="text"
          autoFocus
          maxLength={200}
          aria-invalid={errors.title ? 'true' : 'false'}
          error={errors.title?.message}
          {...register('title')}
        />
        {/* eslint-enable jsx-a11y/no-autofocus */}

        <div className={s.fieldWrap}>
          <label htmlFor="ge-date" className={s.label}>
            Datum a čas *
          </label>
          <input
            id="ge-date"
            type="datetime-local"
            className={s.input}
            aria-invalid={errors.date ? 'true' : 'false'}
            {...register('date')}
          />
          {errors.date?.message && (
            <span className={s.errorMsg}>{errors.date.message}</span>
          )}
        </div>

        <div className={s.fieldWrap}>
          {/* skupinový popisek uploadu obrázku (víc controlů) → span, ne label */}
          <span className={s.label}>Obrázek (volitelně, max 10 MB)</span>
          {imageUrl ? (
            <>
              <div className={s.imagePreview}>
                <img
                  src={imageUrl}
                  alt=""
                  className={s.previewImg}
                  style={getImageStyle(focal.x, focal.y, imageZoom, imageFit)}
                />
                <button
                  type="button"
                  className={s.focalOverlay}
                  aria-label="Klikni kam má být střed výřezu obrázku"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.round(
                      ((e.clientX - rect.left) / rect.width) * 100,
                    );
                    const y = Math.round(
                      ((e.clientY - rect.top) / rect.height) * 100,
                    );
                    setFocal({
                      x: Math.max(0, Math.min(100, x)),
                      y: Math.max(0, Math.min(100, y)),
                    });
                  }}
                >
                  <span
                    className={s.focalMarker}
                    style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  className={s.removeImage}
                  onClick={() => setImageUrl(null)}
                  aria-label="Odstranit obrázek"
                >
                  <X size={16} />
                </button>
              </div>
              <span className={s.focalHint}>
                Klikni na obrázek tam, kde má být střed výřezu na kartě.
              </span>
              <ImageFitToggle value={imageFit} onChange={setImageFit} />
              <ImageZoomSlider
                value={imageZoom}
                onChange={setImageZoom}
                onReset={() => setImageZoom(null)}
              />
            </>
          ) : (
            <label className={s.imagePicker}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                disabled={upload.isPending}
              />
              <ImagePlus size={20} aria-hidden="true" />
              <span>
                {upload.isPending ? 'Nahrávám…' : 'Vybrat obrázek'}
              </span>
            </label>
          )}
          {imageError && <span className={s.errorMsg}>{imageError}</span>}
        </div>

        <div className={s.fieldWrap}>
          <label htmlFor="ge-description" className={s.label}>
            Popis (volitelně)
          </label>
          <textarea
            id="ge-description"
            className={s.textarea}
            rows={5}
            maxLength={5000}
            aria-invalid={errors.description ? 'true' : 'false'}
            {...register('description')}
          />
          {errors.description?.message && (
            <span className={s.errorMsg}>{errors.description.message}</span>
          )}
        </div>

        <div className={s.fieldWrap}>
          <label htmlFor="ge-group" className={s.label}>
            Skupina (volitelně)
          </label>
          <Controller
            control={control}
            name="targetGroup"
            render={({ field }) => (
              <select
                id="ge-group"
                className={s.input}
                value={field.value ?? ''}
                onChange={(e) => {
                  const v = e.target.value === '' ? null : e.target.value;
                  field.onChange(v);
                  if (v === null) {
                    setValue('groupOnly', false);
                  }
                }}
                aria-invalid={errors.targetGroup ? 'true' : 'false'}
              >
                <option value="">— Pro všechny —</option>
                {customGroups.map((g) => (
                  <option
                    key={g}
                    value={g}
                    style={
                      groupColors[g]
                        ? { color: groupColors[g] }
                        : undefined
                    }
                  >
                    {g}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.targetGroup?.message && (
            <span className={s.errorMsg}>{errors.targetGroup.message}</span>
          )}
        </div>

        {/* 27.1b — vazba na scénář (zlatá cesta ④): „tato session hraje…". */}
        <div className={s.fieldWrap}>
          <label htmlFor="ge-scenario" className={s.label}>
            Hraný scénář (volitelně)
          </label>
          <Controller
            control={control}
            name="scenarioId"
            render={({ field }) => (
              <select
                id="ge-scenario"
                className={s.input}
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? null : e.target.value,
                  )
                }
              >
                <option value="">— Žádný —</option>
                {(scenarios ?? []).map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.title}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <Controller
          control={control}
          name="groupOnly"
          render={({ field }) => (
            <label
              className={s.checkboxRow}
              data-disabled={!watchedGroup ? 'true' : 'false'}
            >
              <input
                type="checkbox"
                checked={field.value}
                disabled={!watchedGroup}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              <span>
                Vidí jen členové této skupiny
                {!watchedGroup && (
                  <em className={s.checkboxHint}>
                    {' '}
                    (nejdřív vyber skupinu)
                  </em>
                )}
              </span>
            </label>
          )}
        />

        <Controller
          control={control}
          name="confirmable"
          render={({ field }) => (
            <label className={s.checkboxRow}>
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              <span>Povolit potvrzení účasti (RSVP)</span>
            </label>
          )}
        />

        <div className={s.actions}>
          <Button type="button" variant="ghost" onClick={close}>
            Zrušit
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {isEdit ? 'Uložit změny' : 'Vytvořit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
