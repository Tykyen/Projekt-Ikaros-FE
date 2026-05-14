import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Input, Button } from '@/shared/ui';
import { useCreateIkarosNews } from '@/features/ikaros/api/useIkarosNews';
import {
  createNewsSchema,
  type CreateNewsFormValues,
} from '@/features/ikaros/lib/createNewsSchema';
import s from './CreateNewsModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateNewsModal({ open, onClose }: Props) {
  const mutation = useCreateIkarosNews();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateNewsFormValues>({
    resolver: zodResolver(createNewsSchema),
    mode: 'onBlur',
    defaultValues: { title: '', content: '' },
  });

  function close() {
    onClose();
    reset();
  }

  async function onSubmit(values: CreateNewsFormValues) {
    try {
      await mutation.mutateAsync({
        title: values.title.trim(),
        content: values.content.trim(),
      });
      toast.success('Novinka vytvořena.');
      close();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          toast.error('Nemáš oprávnění vytvořit novinku.');
          close();
          return;
        }
      }
      toast.error('Nepodařilo se vytvořit novinku.');
    }
  }

  return (
    <Modal open={open} onClose={close} title="Nová novinka" size="md">
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
            Vytvořit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
