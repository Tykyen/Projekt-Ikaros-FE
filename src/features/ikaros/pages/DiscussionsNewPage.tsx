import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateDiscussion, usePatchDiscussion } from '../api/useDiscussions';
import s from './DiscussionsNewPage.module.css';

const MAX_TITLE = 200;
const MAX_DESC = 5000;

export default function DiscussionsNewPage() {
  const navigate = useNavigate();
  const create = useCreateDiscussion();
  const patch = usePatchDiscussion();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const isPending = create.isPending || patch.isPending;

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('Zadej název tématu');
      return;
    }
    if (!description.trim()) {
      toast.error('Popiš téma diskuze');
      return;
    }
    try {
      const created = await create.mutateAsync({
        title: title.trim(),
        description: description.trim(),
      });
      // Uzamčení nelze nastavit při create — doplníme PATCHem.
      if (!isOpen) {
        await patch.mutateAsync({ id: created.id, dto: { isOpen: false } });
      }
      toast.success(
        created.isApproved
          ? 'Diskuze vytvořena'
          : 'Diskuze vytvořena — čeká na schválení',
      );
      navigate(`/ikaros/diskuze/${created.id}`);
    } catch {
      toast.error('Nepodařilo se vytvořit diskuzi');
    }
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <Link to="/ikaros/diskuze" className={s.back}>
          <ArrowLeft size={14} /> Zpět
        </Link>
      </header>

      <main className={s.form}>
        <h1 className={s.heading}>Nová diskuze</h1>
        <p className={s.hint}>
          Vytvoříš téma a na to téma se vede vlákno příspěvků. Diskuze projde
          schválením správce.
        </p>

        <label className={s.field}>
          <span className={s.label}>Název tématu</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={MAX_TITLE}
            placeholder="O čem se chceš bavit?"
            className={s.input}
          />
        </label>

        <label className={s.field}>
          <span className={s.label}>Popis tématu</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={MAX_DESC}
            placeholder="Uveď kontext — o co v diskuzi jde, na co se ptáš…"
            className={s.textarea}
            rows={6}
          />
        </label>

        <fieldset className={s.field}>
          <legend className={s.label}>Přístup</legend>
          <label className={s.radio}>
            <input
              type="radio"
              name="access"
              checked={isOpen}
              onChange={() => setIsOpen(true)}
            />
            <span>
              <strong>Otevřená</strong> — přispívat může každý přihlášený
            </span>
          </label>
          <label className={s.radio}>
            <input
              type="radio"
              name="access"
              checked={!isOpen}
              onChange={() => setIsOpen(false)}
            />
            <span>
              <strong>Uzamčená</strong> — jen pozvaní; ostatní musí požádat o
              přidání
            </span>
          </label>
        </fieldset>

        <div className={s.actions}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className={s.btnPrimary}
          >
            <Send size={14} /> Vytvořit diskuzi
          </button>
        </div>
      </main>
    </div>
  );
}
