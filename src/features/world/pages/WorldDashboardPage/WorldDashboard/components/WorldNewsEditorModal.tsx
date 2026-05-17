import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal, Button, Input } from '@/shared/ui';
import type { WorldNewsItem } from '@/shared/types';
import {
  useCreateWorldNews,
  useUpdateWorldNews,
} from '@/features/world/api/useWorldNews';
import s from './WorldNewsEditorModal.module.css';

const schema = z.object({
  title: z.string().trim().min(1, 'Zadej nadpis.').max(200),
  content: z.string().trim().min(1, 'Zadej obsah.').max(10000),
  type: z.enum(['info', 'alert', 'system']),
  link: z.string().trim().max(500),
  date: z.string().min(1, 'Zadej datum.'),
});

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
 * 5.2 — modal pro tvorbu/editaci oznámení světa (PomocnyPJ+).
 */
export function WorldNewsEditorModal({
  open,
  onClose,
  worldId,
  editing,
}: Props) {
  const createMut = useCreateWorldNews(worldId);
  const updateMut = useUpdateWorldNews(worldId);
  const isEdit = !!editing;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: editing?.title ?? '',
      content: editing?.content ?? '',
      type: editing?.type ?? 'info',
      link: editing?.link ?? '',
      date: editing
        ? isoToLocal(editing.date)
        : isoToLocal(new Date().toISOString()),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const date = new Date(values.date).toISOString();
    try {
      if (isEdit && editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          patch: {
            title: values.title.trim(),
            content: values.content.trim(),
            type: values.type,
            link: values.link.trim() || undefined,
            date,
          },
        });
        toast.success('Oznámení upraveno.');
      } else {
        await createMut.mutateAsync({
          worldId,
          title: values.title.trim(),
          content: values.content.trim(),
          type: values.type,
          link: values.link.trim() || undefined,
          date,
        });
        toast.success('Oznámení vytvořeno.');
      }
      onClose();
    } catch {
      toast.error('Uložení oznámení selhalo.');
    }
  });

  const pending = createMut.isPending || updateMut.isPending;

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
            <label htmlFor="wn-date" className={s.label}>
              Datum
            </label>
            <input
              id="wn-date"
              type="datetime-local"
              className={s.select}
              {...register('date')}
            />
            {errors.date && <p className={s.error}>{errors.date.message}</p>}
          </div>
        </div>

        <Input
          label="Odkaz (nepovinné)"
          placeholder="https://…"
          maxLength={500}
          {...register('link')}
        />
      </form>
    </Modal>
  );
}
