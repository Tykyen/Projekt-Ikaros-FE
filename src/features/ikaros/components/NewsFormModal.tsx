import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Input, Button } from '@/shared/ui';
import {
  useCreateIkarosNews,
  useUpdateIkarosNews,
} from '@/features/ikaros/api/useIkarosNews';
import {
  createNewsSchema,
  type CreateNewsFormValues,
} from '@/features/ikaros/lib/createNewsSchema';
import s from './NewsFormModal.module.css';

type Mode = 'create' | 'edit';

interface Props {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  /** Required pro mode='edit'. */
  initialData?: { id: string; title: string; content: string };
}

const EMPTY_VALUES: CreateNewsFormValues = { title: '', content: '' };

export function NewsFormModal({ open, onClose, mode, initialData }: Props) {
  const createMutation = useCreateIkarosNews();
  const updateMutation = useUpdateIkarosNews();
  const mutation = mode === 'edit' ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateNewsFormValues>({
    resolver: zodResolver(createNewsSchema),
    mode: 'onBlur',
    defaultValues:
      mode === 'edit' && initialData
        ? { title: initialData.title, content: initialData.content }
        : EMPTY_VALUES,
  });

  // Re-sync form pokud se změní initialData (edit přes jiný řádek tabulky).
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({ title: initialData.title, content: initialData.content });
    } else if (mode === 'create' && open) {
      reset(EMPTY_VALUES);
    }
  }, [mode, initialData, open, reset]);

  function close() {
    onClose();
    reset(EMPTY_VALUES);
  }

  async function onSubmit(values: CreateNewsFormValues) {
    const payload = {
      title: values.title.trim(),
      content: values.content.trim(),
    };
    try {
      if (mode === 'edit') {
        if (!initialData) return;
        await updateMutation.mutateAsync({ id: initialData.id, dto: payload });
        toast.success('Novinka uložena.');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Novinka vytvořena.');
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
          toast.error('Novinka nenalezena.');
          close();
          return;
        }
      }
      toast.error(
        mode === 'edit'
          ? 'Nepodařilo se uložit novinku.'
          : 'Nepodařilo se vytvořit novinku.',
      );
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={mode === 'edit' ? 'Upravit novinku' : 'Nová novinka'}
      size="md"
    >
      <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Nadpis"
          type="text"
          autoFocus
          maxLength={300}
          aria-invalid={errors.title ? 'true' : 'false'}
          error={errors.title?.message}
          {...register('title')}
        />

        <div className={s.textareaWrap}>
          <label htmlFor="news-content" className={s.label}>
            Obsah
          </label>
          <textarea
            id="news-content"
            className={s.textarea}
            rows={8}
            maxLength={10000}
            aria-invalid={errors.content ? 'true' : 'false'}
            {...register('content')}
          />
          {errors.content?.message && (
            <span className={s.errorMsg}>{errors.content.message}</span>
          )}
        </div>

        <div className={s.actions}>
          <Button type="button" variant="ghost" onClick={close}>
            Zrušit
          </Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            {mode === 'edit' ? 'Uložit' : 'Vytvořit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
