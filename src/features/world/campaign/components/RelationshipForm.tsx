import { useMemo, useState } from 'react';
import { Button, Modal } from '@/shared/ui';
import { clampValence, defaultValenceFor, emotionsFor } from '../emotions';
import { REL_STATUSES, REL_STATUS_LABELS } from '../labels';
import type {
  CampaignRelationship,
  CampaignRelationshipStatus,
  CampaignSubject,
  CreateRelationshipInput,
  RelationshipSide,
} from '../types';
import s from './campaign.module.css';

interface SideState {
  emotionTag: string;
  valence: number;
  strength: number;
  behavior: string;
  gmIntent: string;
}

function fromSide(side: RelationshipSide | undefined): SideState {
  return {
    emotionTag: side?.emotionTag ?? '',
    valence: clampValence(side?.valence),
    strength: side?.strength ?? 5,
    behavior: side?.behavior ?? '',
    gmIntent: side?.gmIntent ?? '',
  };
}

function toSide(st: SideState): RelationshipSide {
  return {
    emotionTag: st.emotionTag || undefined,
    valence: st.valence,
    strength: st.strength,
    behavior: st.behavior.trim() || undefined,
    gmIntent: st.gmIntent.trim() || undefined,
  };
}

/** Editor jedné strany vztahu (A→B nebo B→A). Asymetrický — nezávislý na druhé. */
function SideEditor({
  title,
  sideKey,
  emotions,
  state,
  isPJ,
  onChange,
}: {
  title: string;
  sideKey: 'A' | 'B';
  emotions: { tag: string; valence: number }[];
  state: SideState;
  isPJ: boolean;
  onChange: (next: SideState) => void;
}) {
  return (
    <div className={s.sideEditor}>
      <div className={s.sideTitle}>{title}</div>
      <label className={s.field}>
        <span className={s.fieldLabel}>Emoce</span>
        <select
          className={s.select}
          value={state.emotionTag}
          aria-label={`Emoce strany ${sideKey}`}
          onChange={(e) => {
            const tag = e.target.value;
            onChange({ ...state, emotionTag: tag, valence: defaultValenceFor(tag) });
          }}
        >
          <option value="">— bez emoce —</option>
          {emotions.map((o) => (
            <option key={o.tag} value={o.tag}>
              {o.tag}
            </option>
          ))}
        </select>
      </label>
      <label className={s.field}>
        <span className={s.fieldLabel}>
          Valence <strong>{state.valence > 0 ? `+${state.valence}` : state.valence}</strong>
        </span>
        <input
          className={s.range}
          type="range"
          min={-3}
          max={3}
          step={1}
          value={state.valence}
          onChange={(e) => onChange({ ...state, valence: Number(e.target.value) })}
          aria-label={`Valence strany ${sideKey}`}
        />
      </label>
      <label className={s.field}>
        <span className={s.fieldLabel}>
          Síla <strong>{state.strength}</strong>
        </span>
        <input
          className={s.range}
          type="range"
          min={1}
          max={10}
          step={1}
          value={state.strength}
          onChange={(e) => onChange({ ...state, strength: Number(e.target.value) })}
          aria-label={`Síla strany ${sideKey}`}
        />
      </label>
      <label className={s.field}>
        <span className={s.fieldLabel}>Chování</span>
        <input
          className={s.input}
          value={state.behavior}
          aria-label={`Chování strany ${sideKey}`}
          onChange={(e) => onChange({ ...state, behavior: e.target.value })}
          placeholder="Jak se navenek chová…"
        />
      </label>
      {isPJ && (
        <label className={s.field}>
          <span className={s.fieldLabel}>🔒 Záměr PJ (tajné)</span>
          <input
            className={s.input}
            value={state.gmIntent}
            aria-label={`Záměr PJ strany ${sideKey}`}
            onChange={(e) => onChange({ ...state, gmIntent: e.target.value })}
            placeholder="Co s tím PJ plánuje…"
          />
        </label>
      )}
    </div>
  );
}

/**
 * Formulář vztahu (modal). Dvě nezávislé strany s emoční hodnotou.
 * Výběr emoce předvyplní valenci (lze přepsat sliderem). Tajná pole jen PJ.
 */
export function RelationshipForm({
  open,
  subjects,
  subjectAId,
  initial,
  isPJ,
  isPending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  subjects: CampaignSubject[];
  subjectAId: string;
  initial?: CampaignRelationship;
  isPJ: boolean;
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateRelationshipInput) => void;
}) {
  // Stav z `initial` při mountu; rodič remountuje přes `key` při otevření.
  const [subjectBId, setSubjectBId] = useState(initial?.subjectBId ?? '');
  const [status, setStatus] = useState<CampaignRelationshipStatus>(
    initial?.status ?? 'active',
  );
  const [priority, setPriority] = useState(initial?.priority ?? 3);
  const [sideA, setSideA] = useState<SideState>(fromSide(initial?.sideA));
  const [sideB, setSideB] = useState<SideState>(fromSide(initial?.sideB));
  const [whatHappened, setWhatHappened] = useState(
    initial?.shared?.whatHappened ?? '',
  );
  const [behindTheScenes, setBehindTheScenes] = useState(
    initial?.shared?.behindTheScenes ?? '',
  );
  const [error, setError] = useState('');

  const subjectA = subjects.find((x) => x.id === subjectAId);
  const subjectB = subjects.find((x) => x.id === subjectBId);
  const nameOf = (id: string) => subjects.find((x) => x.id === id)?.name ?? '?';

  const emotions = useMemo(
    () => emotionsFor(subjectA?.type ?? 'OTHER', subjectB?.type ?? 'OTHER'),
    [subjectA?.type, subjectB?.type],
  );

  const bOptions = subjects.filter((x) => x.id !== subjectAId);

  function submit() {
    if (!subjectBId) {
      setError('Vyber druhý subjekt');
      return;
    }
    onSubmit({
      subjectAId,
      subjectBId,
      status,
      priority,
      shared: {
        whatHappened: whatHappened.trim() || undefined,
        behindTheScenes: behindTheScenes.trim() || undefined,
      },
      sideA: toSide(sideA),
      sideB: toSide(sideB),
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={initial?.id ? 'Upravit vztah' : 'Nový vztah'}
      footer={
        <div className={s.formActions}>
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button onClick={submit} loading={isPending}>
            {initial?.id ? 'Uložit' : 'Vytvořit'}
          </Button>
        </div>
      }
    >
      <div className={s.form}>
        <div className={s.formRow}>
          <label className={s.field}>
            <span className={s.fieldLabel}>Subjekt A</span>
            <div className={s.readonlyField}>{subjectA?.name ?? '?'}</div>
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>Druhý subjekt</span>
            <select
              className={s.select}
              value={subjectBId}
              onChange={(e) => setSubjectBId(e.target.value)}
              aria-label="Druhý subjekt"
            >
              <option value="">— vyber —</option>
              {bOptions.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <div className={s.formError}>{error}</div>}

        <div className={s.formRow}>
          <label className={s.field}>
            <span className={s.fieldLabel}>Status</span>
            <select
              className={s.select}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as CampaignRelationshipStatus)
              }
            >
              {REL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {REL_STATUS_LABELS[st]}
                </option>
              ))}
            </select>
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>Priorita {priority}</span>
            <input
              className={s.range}
              type="range"
              min={1}
              max={5}
              step={1}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              aria-label="Priorita"
            />
          </label>
        </div>

        <div className={s.sides}>
          <SideEditor
            title={`${subjectA?.name ?? 'A'} → ${subjectB?.name ?? 'B'}`}
            sideKey="A"
            emotions={emotions}
            state={sideA}
            isPJ={isPJ}
            onChange={setSideA}
          />
          <SideEditor
            title={`${subjectB?.name ?? 'B'} → ${subjectA?.name ?? 'A'}`}
            sideKey="B"
            emotions={emotions}
            state={sideB}
            isPJ={isPJ}
            onChange={setSideB}
          />
        </div>

        <label className={s.field}>
          <span className={s.fieldLabel}>Co se stalo (veřejné)</span>
          <textarea
            className={s.textarea}
            value={whatHappened}
            onChange={(e) => setWhatHappened(e.target.value)}
            rows={2}
          />
        </label>
        {isPJ && (
          <label className={s.field}>
            <span className={s.fieldLabel}>🔒 Pozadí pro PJ (tajné)</span>
            <textarea
              className={s.textarea}
              value={behindTheScenes}
              onChange={(e) => setBehindTheScenes(e.target.value)}
              rows={3}
            />
          </label>
        )}
        {subjectBId && (
          <p className={s.hint}>
            Vztah mezi {nameOf(subjectAId)} a {nameOf(subjectBId)} — strany jsou
            nezávislé (A může milovat, B nenávidět).
          </p>
        )}
      </div>
    </Modal>
  );
}
