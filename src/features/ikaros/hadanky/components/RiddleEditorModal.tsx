/**
 * 21.5d — editor komunitní hádanky. `create` = návrh; `edit` = plná editace
 * (autor/kurátor — hádanka nemá lore/statblock split, spec R5). Form CSS
 * reuse z kouzel (dynamické řádky nápověd = extraRow styly).
 */
import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import { HeroUploadCard } from '@/features/world/pages/PageEditor/components/HeroUploadCard';
import { useHadankyMutations } from '../hooks/useHadankyMutations';
import { DIFFICULTY_OPTIONS, type GlobalRiddle, type RiddleDifficulty } from '../types';
import s from '../../kouzla/components/KouzlaForms.module.css';

interface Props {
  mode: 'create' | 'edit';
  riddle?: GlobalRiddle;
  onClose: () => void;
  onSaved?: (r: GlobalRiddle) => void;
}

export function RiddleEditorModal({ mode, riddle, onClose, onSaved }: Props) {
  const { create, update } = useHadankyMutations();
  const [question, setQuestion] = useState(riddle?.question ?? '');
  const [answer, setAnswer] = useState(riddle?.answer ?? '');
  const [hints, setHints] = useState<string[]>(
    riddle?.hints?.length ? riddle.hints : [''],
  );
  const [difficulty, setDifficulty] = useState<RiddleDifficulty | ''>(
    riddle?.difficulty ?? '',
  );
  const [origin, setOrigin] = useState(riddle?.origin ?? '');
  const [description, setDescription] = useState(riddle?.description ?? '');
  const [tags, setTags] = useState((riddle?.tags ?? []).join(', '));
  const [imageUrl, setImageUrl] = useState(riddle?.imageUrl ?? '');
  const [formError, setFormError] = useState('');

  const isCreate = mode === 'create';
  const pending = create.isPending || update.isPending;

  const submit = () => {
    setFormError('');
    if (!question.trim()) {
      setFormError('Zadej zadání hádanky.');
      return;
    }
    if (!answer.trim()) {
      setFormError('Zadej odpověď.');
      return;
    }
    if (!difficulty) {
      setFormError('Vyber úroveň obtížnosti.');
      return;
    }
    const hintList = hints.map((h) => h.trim()).filter(Boolean).slice(0, 5);
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = {
      question: question.trim(),
      answer: answer.trim(),
      hints: hintList,
      difficulty,
      origin: origin.trim() || undefined,
      description: description.trim() || undefined,
      tags: tagList.length ? tagList : undefined,
      imageUrl: imageUrl || undefined,
    };

    if (isCreate) {
      create.mutate(payload, {
        onSuccess: (r) => {
          onSaved?.(r);
          onClose();
        },
      });
    } else {
      if (!riddle) return;
      update.mutate(
        {
          id: riddle.id,
          patch: { ...payload, origin: origin.trim(), description: description.trim(), imageUrl: imageUrl || '' },
        },
        {
          onSuccess: (r) => {
            onSaved?.(r);
            onClose();
          },
        },
      );
    }
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Zrušit
      </Button>
      <Button variant="primary" loading={pending} onClick={submit}>
        {isCreate ? 'Vytvořit návrh' : 'Uložit'}
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isCreate ? 'Nová hádanka' : 'Upravit hádanku'}
      size="lg"
      footer={footer}
    >
      {isCreate ? (
        <p className={s.hint}>
          Vytvoří se jako návrh — komunita ji vyladí v diskusi a kurátor pak
          schválí. Piš vlastní hádanky, nepřepisuj chráněné texty.
        </p>
      ) : null}

      <div className={s.field}>
        <label className={s.label} htmlFor="rd-question">
          Zadání <span className={s.req}>*</span>
        </label>
        <textarea
          id="rd-question"
          className={s.textarea}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={2000}
          placeholder="Zubů plnou hubu má, a přece nikdy nekouše…"
        />
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="rd-answer">
            Odpověď <span className={s.req}>*</span>
          </label>
          <input
            id="rd-answer"
            className={s.input}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            maxLength={500}
            placeholder="hřeben"
          />
          <span className={s.fieldHint}>V detailu je skrytá za spoiler.</span>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="rd-difficulty">
            Úroveň <span className={s.req}>*</span>
          </label>
          <select
            id="rd-difficulty"
            className={s.select}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as RiddleDifficulty)}
          >
            <option value="">— vyber —</option>
            {DIFFICULTY_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={s.field}>
        <span className={s.label}>Nápovědy (odkrývají se postupně)</span>
        {hints.map((h, i) => (
          <div className={s.extraRow} key={i}>
            <input
              className={s.input}
              style={{ gridColumn: '1 / 3' }}
              value={h}
              placeholder={`Nápověda ${i + 1}`}
              aria-label={`Nápověda ${i + 1}`}
              maxLength={300}
              onChange={(e) =>
                setHints(hints.map((x, j) => (j === i ? e.target.value : x)))
              }
            />
            <button
              type="button"
              className={s.extraRemove}
              aria-label="Odebrat nápovědu"
              onClick={() => setHints(hints.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        {hints.length < 5 ? (
          <div>
            <button
              type="button"
              className={s.extraAdd}
              onClick={() => setHints([...hints, ''])}
            >
              ＋ Přidat nápovědu
            </button>
          </div>
        ) : null}
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="rd-origin">
            Původ
          </label>
          <input
            id="rd-origin"
            className={s.input}
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            maxLength={200}
            placeholder="lidová / vlastní tvorba…"
          />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="rd-tags">
            Štítky (oddělené čárkou)
          </label>
          <input
            id="rd-tags"
            className={s.input}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="rd-desc">
          Poznámka pro PJ / kontext
        </label>
        <textarea
          id="rd-desc"
          className={s.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          placeholder="Kdy hádanku nasadit, historka k původu…"
        />
      </div>

      <div className={s.field}>
        {/* skupinový popisek uploadu (HeroUploadCard = vlastní widget) → span */}
        <span className={s.label}>Obrázek (volitelný)</span>
        <HeroUploadCard
          value={imageUrl}
          onChange={setImageUrl}
          compact
          uploadCta="Nahrát obrázek k hádance"
        />
      </div>

      {formError ? <p className={s.err}>{formError}</p> : null}
    </Modal>
  );
}
