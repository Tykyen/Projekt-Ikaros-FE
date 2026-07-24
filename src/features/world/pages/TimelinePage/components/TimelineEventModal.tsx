import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import axios from 'axios';
import { ImagePlus, X } from 'lucide-react';
import {
  Modal,
  Button,
  Input,
  FantasyDatePicker,
} from '@/shared/ui';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { PagePicker } from '@/features/world/components/PagePicker/PagePicker';
// Světový obsah → content-image upload (PomocnyPJ+ není globální Admin, takže
// admin-gated /upload/image vracel 403). Modal je gated na world roli.
import { useUploadImage } from '@/shared/api/useUploadImage';
import type { CalendarConfig, FantasyDate } from '@/shared/lib/calendarEngine';
import {
  useCreateTimelineEvent,
  useUpdateTimelineEvent,
} from '../api/useTimelineEvents';
import { useAllWorldGameEvents } from '@/features/world/api/useGameEvents';
import {
  timelineEventSchema,
  type TimelineEventFormValues,
} from '../lib/timelineEventSchema';
import { CelestialOverrideSection } from './CelestialOverrideSection';
import type {
  CelestialOverride,
  TimelineEventResponse,
} from '../api/types';
import s from './TimelineEventModal.module.css';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

interface Props {
  open: boolean;
  onClose: () => void;
  worldId: string;
  config: CalendarConfig | null;
  /** Pokud chybí → create mode; jinak edit mode. */
  event?: TimelineEventResponse;
}

/**
 * 9.3 — modal pro vytvoření/editaci timeline události (PomocnyPJ+).
 *
 * Q11 markdown → reuse RichTextEditor (HTML output, TipTap).
 * Q13 prázdné defaults v create mode, year accept záporné (BC).
 * Q8 celestial overrides per body — collapsible.
 */
export function TimelineEventModal({
  open,
  onClose,
  worldId,
  config,
  event,
}: Props) {
  const isEdit = !!event;
  const create = useCreateTimelineEvent(worldId);
  const update = useUpdateTimelineEvent(worldId);
  const upload = useUploadImage();
  // 27.1b — herní události světa pro dropdown „Vzešlo z události" (zlatá cesta ④).
  const { data: gameEvents } = useAllWorldGameEvents(worldId);

  const [imageUrl, setImageUrl] = useState<string | null>(
    event?.imageUrl ?? null,
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [focal, setFocal] = useState<{ x: number; y: number }>({
    x: event?.imageFocalX ?? 50,
    y: event?.imageFocalY ?? 50,
  });

  // Default FantasyDate pro picker: edit → existující, create → prázdné
  // (PJ vize Q13: žádné auto-default, nutí explicit zadání).
  const defaultDate: FantasyDate | null = event
    ? {
        year: event.year,
        monthIndex: event.month - 1,
        day: event.day,
        hour: event.hour ?? undefined,
      }
    : null;

  const [fantasyDate, setFantasyDate] = useState<FantasyDate | null>(
    defaultDate,
  );

  const defaultValues: TimelineEventFormValues = event
    ? {
        title: event.title,
        year: event.year,
        month: event.month,
        day: event.day,
        hour: event.hour ?? null,
        text: event.text,
        link: event.link ?? '',
        pageSlug: event.pageSlug ?? '',
        sourceGameEventId: event.sourceGameEventId ?? null,
        celestialOverrides: event.celestialOverrides,
      }
    : {
        title: '',
        year: 0,
        month: 0,
        day: 0,
        hour: null,
        text: '',
        link: '',
        pageSlug: '',
        sourceGameEventId: null,
        celestialOverrides: [],
      };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm<TimelineEventFormValues>({
    resolver: zodResolver(timelineEventSchema),
    mode: 'onBlur',
    defaultValues,
  });

  function resetAll() {
    reset(defaultValues);
    setFantasyDate(defaultDate);
    setImageUrl(event?.imageUrl ?? null);
    setImageError(null);
    setFocal({
      x: event?.imageFocalX ?? 50,
      y: event?.imageFocalY ?? 50,
    });
  }

  function close() {
    onClose();
    resetAll();
  }

  function onDateChange(next: FantasyDate | null) {
    setFantasyDate(next);
    if (next) {
      setValue('year', next.year, { shouldValidate: true });
      setValue('month', next.monthIndex + 1, { shouldValidate: true });
      setValue('day', next.day, { shouldValidate: true });
      setValue('hour', next.hour ?? null, { shouldValidate: true });
    } else {
      setValue('year', 0);
      setValue('month', 0);
      setValue('day', 0);
      setValue('hour', null);
    }
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
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setImageError('Nemáš oprávnění nahrávat obrázky.');
        return;
      }
      setImageError('Nepodařilo se nahrát obrázek.');
    }
  }

  async function onSubmit(values: TimelineEventFormValues) {
    if (!fantasyDate) {
      toast.error('Vyber datum události.');
      return;
    }
    try {
      const cleanLink =
        values.link && values.link.trim() ? values.link.trim() : null;
      const cleanPageSlug =
        values.pageSlug && values.pageSlug.trim()
          ? values.pageSlug.trim()
          : null;
      if (isEdit && event) {
        await update.mutateAsync({
          id: event.id,
          dto: {
            title: values.title.trim(),
            year: values.year,
            month: values.month,
            day: values.day,
            hour: values.hour ?? null,
            text: values.text.trim(),
            imageUrl: imageUrl ?? null,
            imageFocalX: imageUrl ? focal.x : null,
            imageFocalY: imageUrl ? focal.y : null,
            link: cleanLink,
            pageSlug: cleanPageSlug,
            sourceGameEventId: values.sourceGameEventId ?? null,
            celestialOverrides: values.celestialOverrides,
          },
        });
        toast.success('Událost upravena.');
      } else {
        await create.mutateAsync({
          worldId,
          title: values.title.trim(),
          year: values.year,
          month: values.month,
          day: values.day,
          hour: values.hour ?? undefined,
          text: values.text.trim(),
          imageUrl: imageUrl ?? undefined,
          imageFocalX: imageUrl ? focal.x : undefined,
          imageFocalY: imageUrl ? focal.y : undefined,
          link: cleanLink ?? undefined,
          pageSlug: cleanPageSlug ?? undefined,
          sourceGameEventId: values.sourceGameEventId ?? undefined,
          celestialOverrides: values.celestialOverrides,
        });
        toast.success('Událost vytvořena.');
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
          toast.error('Událost neexistuje.');
          close();
          return;
        }
      }
      toast.error(
        isEdit
          ? 'Nepodařilo se uložit změny.'
          : 'Nepodařilo se vytvořit událost.',
      );
    }
  }

  const submitting =
    create.isPending || update.isPending || upload.isPending;

  return (
    <Modal
      open={open}
      onClose={close}
      title={isEdit ? 'Upravit událost' : 'Nová událost'}
      size="md"
    >
      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* eslint-disable jsx-a11y/no-autofocus -- autofocus na první pole je záměr: modal trapuje fokus */}
        <Input
          label="Název *"
          type="text"
          autoFocus
          maxLength={200}
          aria-invalid={errors.title ? 'true' : 'false'}
          error={errors.title?.message}
          {...register('title')}
        />
        {/* eslint-enable jsx-a11y/no-autofocus */}

        <div className={s.fieldWrap}>
          {/* Skupinový popisek pro FantasyDatePicker (víc controlů) → span, ne label */}
          <span className={s.label}>Datum *</span>
          {config ? (
            <FantasyDatePicker
              config={config}
              value={fantasyDate}
              onChange={onDateChange}
              allowHour
              required={false}
              ariaLabel="Datum události"
            />
          ) : (
            <p className={s.warning}>
              Svět nemá kalendář — datum nelze vybrat.
            </p>
          )}
          {(errors.year || errors.month || errors.day) && (
            <span className={s.errorMsg}>
              {errors.year?.message ??
                errors.month?.message ??
                errors.day?.message}
            </span>
          )}
        </div>

        <div className={s.fieldWrap}>
          {/* Skupinový popisek pro obrázkovou sekci (náhled/tlačítka/file picker) → span */}
          <span className={s.label}>Obrázek (volitelně, max 10 MB)</span>
          {imageUrl ? (
            <>
              <div className={s.imagePreview}>
                <img
                  src={imageUrl}
                  alt=""
                  className={s.previewImg}
                  style={{
                    objectPosition: `${focal.x}% ${focal.y}%`,
                  }}
                />
                <button
                  type="button"
                  className={s.focalOverlay}
                  aria-label="Klikni kam má být střed výřezu"
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
                    aria-hidden
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
              <span className={s.hint}>
                Klikni na obrázek tam, kde má být střed výřezu na kartě.
              </span>
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
              <ImagePlus size={20} aria-hidden />
              <span>
                {upload.isPending ? 'Nahrávám…' : 'Vybrat obrázek'}
              </span>
            </label>
          )}
          {imageError && <span className={s.errorMsg}>{imageError}</span>}
        </div>

        <div className={s.fieldWrap}>
          {/* Skupinový popisek pro RichTextEditor (víc controlů) → span, ne label */}
          <span className={s.label}>Obsah *</span>
          <Controller
            control={control}
            name="text"
            render={({ field }) => (
              <RichTextEditor
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Co se stalo? Co je důležité?"
                maxLength={50000}
                ariaLabel="Obsah události"
              />
            )}
          />
          {errors.text?.message && (
            <span className={s.errorMsg}>{errors.text.message}</span>
          )}
        </div>

        <Input
          label="Externí odkaz (volitelně, https://…)"
          type="url"
          placeholder="https://…"
          aria-invalid={errors.link ? 'true' : 'false'}
          error={errors.link?.message}
          {...register('link')}
        />

        <div className={s.fieldWrap}>
          {/* Skupinový popisek pro PagePicker (víc controlů) → span, ne label */}
          <span className={s.label}>Související wiki stránka (volitelně)</span>
          <Controller
            control={control}
            name="pageSlug"
            render={({ field }) => (
              <PagePicker
                worldId={worldId}
                value={field.value && field.value.trim() ? field.value : null}
                onChange={(slug) => field.onChange(slug ?? '')}
              />
            )}
          />
          {errors.pageSlug?.message && (
            <span className={s.errorMsg}>{errors.pageSlug.message}</span>
          )}
        </div>

        {/* 27.1b — vazba na herní událost (zlatá cesta ④): „vzešlo ze session". */}
        <div className={s.fieldWrap}>
          <label htmlFor="tl-source-event" className={s.label}>
            Vzešlo z herní události (volitelně)
          </label>
          <Controller
            control={control}
            name="sourceGameEventId"
            render={({ field }) => (
              <select
                id="tl-source-event"
                className={s.select}
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? null : e.target.value,
                  )
                }
              >
                <option value="">— Žádná —</option>
                {(gameEvents ?? []).map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <Controller
          control={control}
          name="celestialOverrides"
          render={({ field }) => (
            <CelestialOverrideSection
              config={config}
              value={(field.value as CelestialOverride[]) ?? []}
              onChange={field.onChange}
            />
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
