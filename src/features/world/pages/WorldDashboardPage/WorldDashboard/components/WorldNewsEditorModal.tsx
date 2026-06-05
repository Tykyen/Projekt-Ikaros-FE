import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import axios from 'axios';
import { ImagePlus, X } from 'lucide-react';
import {
  Modal,
  Button,
  Input,
  ImageZoomSlider,
  ImageFitToggle,
  FantasyDatePicker,
} from '@/shared/ui';
import { getImageStyle, type ImageFit } from '@/shared/lib/imageStyle';
import type { WorldNewsItem } from '@/shared/types';
import {
  useCreateWorldNews,
  useUpdateWorldNews,
} from '@/features/world/api/useWorldNews';
// Světový obsah → content-image upload (PomocnyPJ+ není globální Admin, takže
// admin-gated /upload/image vracel 403). Modal je gated na world roli.
import { useUploadImage } from '@/shared/api/useUploadImage';
import { useCalendarConfigs } from '@/features/world/api/useCalendarConfigs';
import { GREGORIAN_DEFAULT_CONFIG } from '@/shared/lib/calendarEngine';
import type { FantasyDate } from '@/shared/lib/calendarEngine';
import { PagePicker } from '@/features/world/components/PagePicker/PagePicker';
import s from './WorldNewsEditorModal.module.css';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

const schema = z
  .object({
    title: z.string().trim().min(1, 'Zadej nadpis.').max(200),
    content: z.string().trim().min(1, 'Zadej obsah.').max(10000),
    type: z.enum(['info', 'alert', 'system']),
    link: z.string().trim().max(500).optional().or(z.literal('')),
    linkPageSlug: z.string().nullable().optional(),
    date: z.string().min(1, 'Zadej datum.'),
  })
  .refine(
    (v) =>
      !(
        v.linkPageSlug &&
        v.linkPageSlug.trim() &&
        v.link &&
        v.link.trim()
      ),
    {
      message: 'Vyber jen jedno — buď stránku, nebo externí odkaz.',
      path: ['link'],
    },
  );

type FormValues = z.infer<typeof schema>;

/** ISO → hodnota pro `<input type="datetime-local">` (YYYY-MM-DDTHH:mm). */
function isoToLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  worldId: string;
  /** Editovaná novinka; `undefined` = tvorba nové. */
  editing?: WorldNewsItem;
}

/**
 * 5.2 / 9.5 — modal pro tvorbu/editaci oznámení světa (PomocnyPJ+).
 *
 * 9.5 refactor: image upload + focal overlay + PagePicker (mutual exclusive
 * s externí URL). Vzor: GameEventModal.
 */
export function WorldNewsEditorModal({
  open,
  onClose,
  worldId,
  editing,
}: Props) {
  const createMut = useCreateWorldNews(worldId);
  const updateMut = useUpdateWorldNews(worldId);
  const upload = useUploadImage();
  const isEdit = !!editing;

  const [imageUrl, setImageUrl] = useState<string | null>(
    editing?.imageUrl ?? null,
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [focal, setFocal] = useState<{ x: number; y: number }>({
    x: editing?.imageFocalX ?? 50,
    y: editing?.imageFocalY ?? 50,
  });
  const [imageZoom, setImageZoom] = useState<number | null>(
    editing?.imageZoom ?? null,
  );
  const [imageFit, setImageFit] = useState<ImageFit | null>(
    editing?.imageFit ?? null,
  );

  // 9.2e — fantasy datum toggle.
  const { data: calendarConfigs = [] } = useCalendarConfigs(worldId);
  const [dateMode, setDateMode] = useState<'real' | 'fantasy'>(
    editing?.calendarDate ? 'fantasy' : 'real',
  );
  const [fantasyConfigSlug, setFantasyConfigSlug] = useState<string>(
    editing?.calendarConfigId ?? calendarConfigs[0]?.slug ?? 'gregorian',
  );
  const [fantasyDate, setFantasyDate] = useState<FantasyDate | null>(
    editing?.calendarDate ?? null,
  );
  const activeFantasyConfig =
    calendarConfigs.find((c) => c.slug === fantasyConfigSlug)
      ?? calendarConfigs[0]
      ?? GREGORIAN_DEFAULT_CONFIG;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: editing?.title ?? '',
      content: editing?.content ?? '',
      type: editing?.type ?? 'info',
      link: editing?.link ?? '',
      linkPageSlug: editing?.linkPageSlug ?? null,
      date: editing
        ? isoToLocal(editing.date)
        : isoToLocal(new Date().toISOString()),
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch() = R19 false positive
  const watchedPageSlug = watch('linkPageSlug');
  const watchedLink = watch('link');
  const pageSlugActive = !!(watchedPageSlug && watchedPageSlug.trim());
  const linkActive = !!(watchedLink && watchedLink.trim());

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

  const onSubmit = handleSubmit(async (values) => {
    const date = new Date(values.date).toISOString();
    const normalizedLink = values.link?.trim() ? values.link.trim() : undefined;
    const normalizedPageSlug =
      values.linkPageSlug && values.linkPageSlug.trim()
        ? values.linkPageSlug.trim()
        : undefined;

    try {
      // 9.2e — fantasy datum payload. dateMode='fantasy' + valid pick → set,
      // jinak null (clear). Real-world `date` (ISO) zůstává jako audit field.
      const calendarConfigId =
        dateMode === 'fantasy' && fantasyDate ? fantasyConfigSlug : null;
      const calendarDate =
        dateMode === 'fantasy' && fantasyDate ? fantasyDate : null;

      if (isEdit && editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          patch: {
            title: values.title.trim(),
            content: values.content.trim(),
            type: values.type,
            link: normalizedLink ?? null,
            linkPageSlug: normalizedPageSlug ?? null,
            imageUrl: imageUrl ?? null,
            imageFocalX: imageUrl ? focal.x : null,
            imageFocalY: imageUrl ? focal.y : null,
            imageZoom: imageUrl ? imageZoom : null,
            imageFit: imageUrl ? imageFit : null,
            date,
            calendarConfigId,
            calendarDate,
          },
        });
        toast.success('Oznámení upraveno.');
      } else {
        await createMut.mutateAsync({
          worldId,
          title: values.title.trim(),
          content: values.content.trim(),
          type: values.type,
          link: normalizedLink,
          linkPageSlug: normalizedPageSlug,
          imageUrl: imageUrl ?? undefined,
          imageFocalX: imageUrl ? focal.x : undefined,
          imageFocalY: imageUrl ? focal.y : undefined,
          imageZoom: imageUrl && imageZoom != null ? imageZoom : undefined,
          imageFit: imageUrl && imageFit != null ? imageFit : undefined,
          date,
          calendarConfigId: calendarConfigId ?? undefined,
          calendarDate: calendarDate ?? undefined,
        });
        toast.success('Oznámení vytvořeno.');
      }
      onClose();
    } catch {
      toast.error('Uložení oznámení selhalo.');
    }
  });

  const pending = createMut.isPending || updateMut.isPending || upload.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Upravit oznámení' : 'Nové oznámení'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Zrušit
          </Button>
          <Button onClick={() => void onSubmit()} loading={pending}>
            {isEdit ? 'Uložit' : 'Vytvořit'}
          </Button>
        </>
      }
    >
      <form className={s.form} onSubmit={onSubmit} noValidate>
        <Input
          label="Nadpis"
          maxLength={200}
          error={errors.title?.message}
          {...register('title')}
        />

        <div className={s.field}>
          <label htmlFor="wn-content" className={s.label}>
            Obsah
          </label>
          <textarea
            id="wn-content"
            className={s.textarea}
            rows={5}
            maxLength={10000}
            {...register('content')}
          />
          {errors.content && (
            <p className={s.error}>{errors.content.message}</p>
          )}
        </div>

        <div className={s.row}>
          <div className={s.field}>
            <label htmlFor="wn-type" className={s.label}>
              Typ
            </label>
            <select id="wn-type" className={s.select} {...register('type')}>
              <option value="info">Informace</option>
              <option value="alert">Důležité</option>
              <option value="system">Systémové</option>
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label}>Datum</label>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              <button
                type="button"
                onClick={() => setDateMode('real')}
                className={s.select}
                style={{
                  flex: 1,
                  borderColor:
                    dateMode === 'real' ? 'var(--theme-accent)' : undefined,
                  fontWeight: dateMode === 'real' ? 600 : 400,
                }}
              >
                Reálné
              </button>
              <button
                type="button"
                onClick={() => setDateMode('fantasy')}
                disabled={calendarConfigs.length === 0}
                className={s.select}
                style={{
                  flex: 1,
                  borderColor:
                    dateMode === 'fantasy' ? 'var(--theme-accent)' : undefined,
                  fontWeight: dateMode === 'fantasy' ? 600 : 400,
                }}
                title={
                  calendarConfigs.length === 0
                    ? 'Nejdřív vytvoř kalendář ve světě'
                    : ''
                }
              >
                Ve světě
              </button>
            </div>
            {dateMode === 'real' ? (
              <>
                <input
                  id="wn-date"
                  type="datetime-local"
                  className={s.select}
                  {...register('date')}
                />
                {errors.date && (
                  <p className={s.error}>{errors.date.message}</p>
                )}
              </>
            ) : (
              <>
                {calendarConfigs.length > 1 && (
                  <select
                    className={s.select}
                    value={fantasyConfigSlug}
                    onChange={(e) => setFantasyConfigSlug(e.target.value)}
                    style={{ marginBottom: 6 }}
                  >
                    {calendarConfigs.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                <FantasyDatePicker
                  config={activeFantasyConfig}
                  value={fantasyDate}
                  onChange={setFantasyDate}
                  ariaLabel="Fantasy datum oznámení"
                />
              </>
            )}
          </div>
        </div>

        {/* 9.5 — image upload + focal */}
        <div className={s.field}>
          <label className={s.label}>Obrázek (volitelně, max 10 MB)</label>
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
          {imageError && <p className={s.error}>{imageError}</p>}
        </div>

        {/* 9.5 — page picker + externí URL (mutual exclusive) */}
        <div className={s.field}>
          <label className={s.label}>Odkaz na stránku (volitelně)</label>
          <Controller
            control={control}
            name="linkPageSlug"
            render={({ field }) => (
              <PagePicker
                worldId={worldId}
                value={field.value ?? null}
                onChange={(slug) => {
                  field.onChange(slug);
                  if (slug) {
                    setValue('link', '');
                  }
                }}
                disabled={linkActive}
                placeholder={
                  linkActive
                    ? 'Nelze kombinovat s externím odkazem'
                    : 'Vyhledej stránku světa…'
                }
              />
            )}
          />
        </div>

        <div className={s.field}>
          <Input
            label="Externí odkaz (volitelně)"
            placeholder={
              pageSlugActive
                ? 'Nelze kombinovat se stránkou'
                : 'https://…'
            }
            maxLength={500}
            disabled={pageSlugActive}
            error={errors.link?.message}
            {...register('link')}
          />
        </div>
      </form>
    </Modal>
  );
}
