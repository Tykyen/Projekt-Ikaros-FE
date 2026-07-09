import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Save, Send } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { parseApiError } from '@/shared/api/client';
import {
  useCreateGalleryImage,
  useUpdateGalleryImage,
  useGalleryImage,
} from '../api/useGallery';
import { useGalleryCategories } from '../api/useGalleryCategories';
import { cloudinaryThumb } from '@/shared/lib/cloudinary';
import s from './GalleryUploadPage.module.css';

const MAX_FILE_MB = 10;

/**
 * 3.3c — nahrání obrázku (`/nahrat`) i editace metadat (`/:id/upravit`).
 * Upload je inline multipart; editace mění jen title/description/category
 * (soubor po nahrání nelze vyměnit — odpovídá BE).
 */
export default function GalleryUploadPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const { data: existing, isLoading: loadingExisting } = useGalleryImage(id);
  const { data: categories = [] } = useGalleryCategories();
  const create = useCreateGalleryImage();
  const update = useUpdateGalleryImage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ostatni');
  // 20D (D1) — povinné prohlášení práv + volitelný self-declare AI (jen upload).
  const [rightsDeclared, setRightsDeclared] = useState(false);
  const [isAiImage, setIsAiImage] = useState(false);

  // Edit mód — předvyplnit z existujícího obrázku. Render-time pattern
  // (stráž přes prev id) místo useEffect → žádný extra render, hydratace
  // proběhne jakmile query dodá data.
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  if (existing && existing.id !== hydratedId) {
    setHydratedId(existing.id);
    setTitle(existing.title);
    setDescription(existing.description ?? '');
    setCategory(existing.category);
    setPreview(cloudinaryThumb(existing.imageUrl, 800));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (picked.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Soubor je větší než ${MAX_FILE_MB} MB`);
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  }

  const isPending = create.isPending || update.isPending;

  function validate(): boolean {
    if (!title.trim()) {
      toast.error('Zadej název obrázku');
      return false;
    }
    if (!isEdit && !file) {
      toast.error('Vyber obrázek k nahrání');
      return false;
    }
    // 20D (D1) — bez prohlášení práv nelze nahrát (jen nový upload).
    if (!isEdit && !rightsDeclared) {
      toast.error('Potvrď prohlášení o právech k obsahu');
      return false;
    }
    return true;
  }

  function handleSubmit(submit: boolean) {
    if (!validate()) return;

    if (isEdit && id) {
      update.mutate(
        { id, dto: { title: title.trim(), description, category } },
        {
          onSuccess: () => {
            toast.success('Změny uloženy');
            navigate(`/ikaros/galerie/${id}`);
          },
          onError: (err) => toast.error(parseApiError(err)),
        },
      );
      return;
    }

    create.mutate(
      {
        file: file as File,
        title: title.trim(),
        description,
        category,
        submit,
        rightsDeclared,
        aiOrigin: isAiImage ? 'ai_image' : 'none',
      },
      {
        onSuccess: () => {
          toast.success(
            submit ? 'Obrázek odeslán ke schválení' : 'Koncept uložen',
          );
          navigate('/ikaros/galerie?tab=moje');
        },
        onError: (err) => toast.error(parseApiError(err)),
      },
    );
  }

  if (isEdit && loadingExisting) return <Spinner center />;

  return (
    <div className={s.page}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className={s.back}
      >
        <ArrowLeft size={14} /> Zpět
      </button>

      <h1 className={s.title}>
        {isEdit ? 'Upravit obrázek' : 'Nahrát obrázek'}
      </h1>

      {/* File picker / preview */}
      <div className={s.field}>
        <span className={s.label}>Obrázek</span>
        {preview ? (
          <div className={s.previewWrap}>
            <img src={preview} alt="Náhled" className={s.preview} />
            {!isEdit && (
              <button
                type="button"
                className={s.changeBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                Změnit soubor
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className={s.dropzone}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={28} aria-hidden />
            <span>Klikni pro výběr obrázku</span>
            <span className={s.hint}>JPG, PNG, GIF, WebP — max {MAX_FILE_MB} MB</span>
          </button>
        )}
        {isEdit && (
          <p className={s.hint}>
            Soubor obrázku nelze po nahrání vyměnit — uprav jen popisné údaje.
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className={s.fileInput}
          aria-label="Vybrat obrázek"
        />
      </div>

      {/* Title */}
      <div className={s.field}>
        <label className={s.label} htmlFor="gal-title">
          Název
        </label>
        <input
          id="gal-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
          className={s.input}
          placeholder="Název obrázku"
        />
      </div>

      {/* Category */}
      <div className={s.field}>
        <label className={s.label} htmlFor="gal-category">
          Kategorie
        </label>
        <select
          id="gal-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={s.input}
        >
          {categories.map((cat) => (
            <option key={cat.key} value={cat.key}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className={s.field}>
        <label className={s.label} htmlFor="gal-desc">
          Popis <span className={s.optional}>(nepovinný)</span>
        </label>
        <textarea
          id="gal-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          className={s.textarea}
          placeholder="Krátký popis obrázku…"
        />
      </div>

      {/* 20D (D1) — prohlášení práv + AI self-declare (jen nový upload) */}
      {!isEdit && (
        <fieldset className={s.consent}>
          <legend className={s.consentLegend}>Prohlášení autora</legend>
          <label className={s.check}>
            <input
              type="checkbox"
              checked={rightsDeclared}
              onChange={(e) => setRightsDeclared(e.target.checked)}
            />
            <span>
              Mám práva k obsahu / neobsahuje cizí chráněný materiál bez licence.
              <span className={s.required}> (povinné)</span>
            </span>
          </label>
          <label className={s.check}>
            <input
              type="checkbox"
              checked={isAiImage}
              onChange={(e) => setIsAiImage(e.target.checked)}
            />
            <span>Tento obrázek je vytvořený AI.</span>
          </label>
        </fieldset>
      )}

      {/* Actions */}
      <div className={s.actions}>
        {isEdit ? (
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isPending}
            className={s.btnPrimary}
          >
            <Save size={16} /> Uložit změny
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isPending || !rightsDeclared}
              className={s.btnSecondary}
            >
              <Save size={16} /> Uložit koncept
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isPending || !rightsDeclared}
              className={s.btnPrimary}
            >
              <Send size={16} /> Odeslat ke schválení
            </button>
          </>
        )}
      </div>
    </div>
  );
}
