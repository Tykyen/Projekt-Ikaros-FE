import { useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import axios from 'axios';
import { Modal, Input, Button } from '@/shared/ui';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import {
  useCreateIkarosNews,
  useUpdateIkarosNews,
} from '@/features/ikaros/api/useIkarosNews';
import { useUploadImage } from '@/features/ikaros/api/useUploadImage';
import {
  createNewsSchema,
  type CreateNewsFormValues,
} from '@/features/ikaros/lib/createNewsSchema';
import type { IkarosNewsType } from '@/shared/types';
import s from './NewsFormModal.module.css';

type Mode = 'create' | 'edit';

interface InitialData {
  id: string;
  title: string;
  content: string;
  /** Volitelné — fallback na 'info' / bez obrázku, pokud volající nepředá. */
  type?: IkarosNewsType;
  imageUrl?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  /** Required pro mode='edit'. */
  initialData?: InitialData;
}

const EMPTY_VALUES: CreateNewsFormValues = {
  title: '',
  content: '',
  type: 'info',
  imageUrl: '',
};

const TYPE_OPTIONS: { value: IkarosNewsType; label: string }[] = [
  { value: 'info', label: 'Informace' },
  { value: 'warning', label: 'Upozornění' },
  { value: 'system', label: 'Systémová' },
];

export function NewsFormModal({ open, onClose, mode, initialData }: Props) {
  const createMutation = useCreateIkarosNews();
  const updateMutation = useUpdateIkarosNews();
  const uploadMutation = useUploadImage();
  const mutation = mode === 'edit' ? updateMutation : createMutation;

  function valuesFromInitial(data: InitialData): CreateNewsFormValues {
    return {
      title: data.title,
      content: data.content,
      type: data.type ?? 'info',
      imageUrl: data.imageUrl ?? '',
    };
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
    watch,
  } = useForm<CreateNewsFormValues>({
    resolver: zodResolver(createNewsSchema),
    mode: 'onBlur',
    defaultValues:
      mode === 'edit' && initialData
        ? valuesFromInitial(initialData)
        : EMPTY_VALUES,
  });

  // Re-sync form pokud se změní initialData (edit přes jiný řádek tabulky).
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset(valuesFromInitial(initialData));
    } else if (mode === 'create' && open) {
      reset(EMPTY_VALUES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialData, open, reset]);

  const imageUrl = watch('imageUrl');

  function close() {
    onClose();
    reset(EMPTY_VALUES);
  }

  async function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // umožní znovu vybrat týž soubor
    if (!file) return;
    try {
      const result = await uploadMutation.mutateAsync(file);
      setValue('imageUrl', result.url, { shouldDirty: true });
    } catch {
      toast.error('Nepodařilo se nahrát obrázek.');
    }
  }

  function removeImage() {
    setValue('imageUrl', '', { shouldDirty: true });
  }

  async function onSubmit(values: CreateNewsFormValues) {
    const type: IkarosNewsType = values.type ?? 'info';
    const trimmedImage = values.imageUrl?.trim() ?? '';
    try {
      if (mode === 'edit') {
        if (!initialData) return;
        await updateMutation.mutateAsync({
          id: initialData.id,
          dto: {
            title: values.title.trim(),
            content: values.content.trim(),
            type,
            // prázdné = odebrat obrázek (BE přijímá null)
            imageUrl: trimmedImage === '' ? null : trimmedImage,
          },
        });
        toast.success('Novinka uložena.');
      } else {
        await createMutation.mutateAsync({
          title: values.title.trim(),
          content: values.content.trim(),
          type,
          ...(trimmedImage !== '' && { imageUrl: trimmedImage }),
        });
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

        <fieldset className={s.typeField}>
          <legend className={s.label}>Typ novinky</legend>
          <div className={s.typeOptions}>
            {TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={s.typeOption}
                data-type={opt.value}
              >
                <input
                  type="radio"
                  value={opt.value}
                  {...register('type')}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={s.imageField}>
          <span className={s.label}>Obrázek</span>
          {imageUrl ? (
            <div className={s.imagePreview}>
              <img src={imageUrl} alt="Náhled obrázku novinky" />
              <Button type="button" variant="ghost" onClick={removeImage}>
                Odebrat obrázek
              </Button>
            </div>
          ) : (
            <label className={s.imageUpload}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={uploadMutation.isPending}
                hidden
              />
              <span>
                {uploadMutation.isPending ? 'Nahrávám…' : 'Vybrat obrázek'}
              </span>
            </label>
          )}
        </div>

        <div className={s.textareaWrap}>
          <span className={s.label}>Obsah</span>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Napiš obsah novinky…"
                maxLength={10000}
                ariaLabel="Obsah"
                className={s.editor}
              />
            )}
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
