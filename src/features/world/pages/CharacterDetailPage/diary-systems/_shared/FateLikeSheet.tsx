/**
 * Fate — sdílený list postavy pro celou Fate rodinu.
 *
 * Jeden komponent, dvě varianty (liší se JEDINÝ blok schopností):
 *   - `variant='fae'`  → Fate Accelerated: 6 fixních Přístupů (Pečlivě…Lstivě)
 *   - `variant='core'` → Fate Core: volný seznam Dovedností + žebříček
 *
 * Vše ostatní (Hlavní koncept + Problém + další aspekty, Triky, Stres,
 * Následky, Obnova, Deník) je sdílené 1:1 — proto jeden komponent místo dvou
 * kopií (oprava následků/stresu platí pro obě varianty, žádný drift).
 *
 * Vizuál: „Karty osudu" — stará slonovina + sépiové serify, signature
 * ornament = řada 4dF kostek (−/0/+). Scoped v `styles/fate.css` na
 * `[data-diary-system='fate']` i `[data-diary-system='fae']`.
 *
 * Data v `diary.customData` s prefixem (`fae_*` / `fate_*`) přes makeCdAccess.
 * Deník = záznam, ne boj → ŽÁDNÝ hod kostkou na listu (hází se na mapě).
 */
import { usePrintMode } from '@/features/world/export/print';
import { useCharacter } from '@/features/world/pages/api/useCharacter';
import type { SystemSheetProps } from '../types';
import { makeCdAccess, type CdAccess } from './cdAccess';

export type FateVariant = 'fae' | 'core';

interface Props extends SystemSheetProps {
  /** Per-systémový prefix (`fae_` / `fate_`). */
  prefix: string;
  /** Která varianta bloku schopností se vykreslí. */
  variant: FateVariant;
}

interface AspectRow {
  name: string;
}
interface SkillRow {
  name: string;
  val: string;
}
interface StuntRow {
  name: string;
  desc: string;
}
interface StressBox {
  size: string;
  on: string; // 'true' / 'false'
}

/** 6 přístupů Fate Accelerated (pevné pořadí + lokalizace). */
export const APPROACHES = [
  { key: 'careful', label: 'Pečlivě' },
  { key: 'clever', label: 'Chytře' },
  { key: 'flashy', label: 'Oslnivě' },
  { key: 'forceful', label: 'Rázně' },
  { key: 'quick', label: 'Rychle' },
  { key: 'sneaky', label: 'Lstivě' },
] as const;

/** 3 fixní sloty následků (Drobný 2 / Mírný 4 / Vážný 6). */
const CONSEQUENCES = [
  { key: 'mild', label: 'Drobný', value: 2 },
  { key: 'moderate', label: 'Mírný', value: 4 },
  { key: 'severe', label: 'Vážný', value: 6 },
] as const;

/** Výchozí stres track (3 čtverečky o velikosti 1/2/3). */
const DEFAULT_STRESS: StressBox[] = [
  { size: '1', on: 'false' },
  { size: '2', on: 'false' },
  { size: '3', on: 'false' },
];

/** Žebříček Fate (−2…+8) — slovní stupně pro Core dovednosti. */
const LADDER: Record<number, string> = {
  [-2]: 'Hrozný',
  [-1]: 'Mizerný',
  0: 'Tuctový',
  1: 'Průměrný',
  2: 'Slušný',
  3: 'Dobrý',
  4: 'Skvělý',
  5: 'Vynikající',
  6: 'Fantastický',
  7: 'Epický',
  8: 'Legendární',
};
const clampBonus = (n: number) => Math.max(-2, Math.min(8, n));
const ladderName = (n: number) => LADDER[clampBonus(n)] ?? '';
const fmt = (n: number) => (n >= 0 ? '+' : '') + n;

export function FateLikeSheet({
  prefix,
  variant,
  diary,
  mode,
  worldId,
  characterSlug,
  onChange,
}: Props) {
  const printMode = usePrintMode();
  const { data: character } = useCharacter(worldId, characterSlug);
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, prefix, onChange);

  if (printMode) {
    return <FatePrintView cda={cda} variant={variant} characterName={character?.name} />;
  }

  const editing = mode === 'edit';
  const name = character?.name || cda.g('name') || 'Bez jména';

  return (
    <div className="fate-sheet" data-mode={mode} data-variant={variant}>
      <Hero cda={cda} editing={editing} name={name} />

      <AspectsSection cda={cda} editing={editing} />

      {variant === 'fae' ? (
        <ApproachesSection cda={cda} editing={editing} />
      ) : (
        <SkillsSection cda={cda} editing={editing} />
      )}

      <div className="fate-cols">
        <StuntsSection cda={cda} editing={editing} />
        <div>
          <StressSection cda={cda} editing={editing} />
          <ConsequencesSection cda={cda} editing={editing} />
        </div>
      </div>

      <NotesSection cda={cda} editing={editing} />
    </div>
  );
}

// ── stavební díly ──────────────────────────────────────────

interface SubProps {
  cda: CdAccess;
  editing: boolean;
}

const FudgeRow = () => (
  <span className="fate-fudge-row" aria-hidden>
    <i className="fate-fudge plus" />
    <i className="fate-fudge minus" />
    <i className="fate-fudge zero" />
    <i className="fate-fudge plus" />
  </span>
);

function SectionHead({ title }: { title: string }) {
  return (
    <div className="fate-sec__h">
      <h2>{title}</h2>
      <span className="fate-rule" />
    </div>
  );
}

// ── Hero ───────────────────────────────────────────────────

function Hero({ cda, editing, name }: SubProps & { name: string }) {
  const refresh = parseInt(cda.g('refresh', '3'), 10) || 0;
  const stars = Array.from({ length: Math.max(0, Math.min(6, refresh)) }, () => '✦').join(' ');

  return (
    <header className="fate-hero">
      <div className="fate-hero__id">
        <div className="fate-hero__kicker">
          <span>Fate · postava</span>
          <FudgeRow />
        </div>
        <h1 className="fate-hero__name">{name}</h1>
      </div>
      <div className="fate-hero__stats">
        <div className="fate-badge">
          <span className="fate-badge__lab">Obnova</span>
          {editing ? (
            <input
              className="fate-badge__in"
              type="number"
              min={0}
              max={6}
              value={refresh}
              onChange={(e) =>
                cda.set('refresh', String(Math.max(0, Math.min(6, parseInt(e.target.value, 10) || 0))))
              }
              aria-label="Obnova"
            />
          ) : (
            <span className="fate-badge__val">{refresh}</span>
          )}
          <span className="fate-badge__stars">{stars}</span>
        </div>
      </div>
    </header>
  );
}

// ── Aspekty (Hlavní koncept + Problém + další) ─────────────

function AspectsSection({ cda, editing }: SubProps) {
  const { g, set, parseJsonArr, updateArr, addArr, removeArr } = cda;
  const aspects = parseJsonArr<AspectRow>('aspects');

  return (
    <section className="fate-sec">
      <SectionHead title="Aspekty" />
      <div className="fate-aspect-defining">
        <div className="fate-aspect-card">
          <div className="fate-aspect-card__lab">Hlavní koncept</div>
          <input
            className="fate-aspect-card__txt"
            value={g('highConcept')}
            disabled={!editing}
            onChange={(e) => set('highConcept', e.target.value)}
            placeholder="Kdo postava je (např. Princezna s dračí krví)…"
            aria-label="Hlavní koncept"
          />
        </div>
        <div className="fate-aspect-card trouble">
          <div className="fate-aspect-card__lab">⚠ Problém</div>
          <input
            className="fate-aspect-card__txt"
            value={g('trouble')}
            disabled={!editing}
            onChange={(e) => set('trouble', e.target.value)}
            placeholder="Co postavě komplikuje život…"
            aria-label="Problém"
          />
        </div>
      </div>

      <div className="fate-aspect-list">
        {aspects.map((row, i) => (
          <div className="fate-aspect-row" key={i}>
            <span className="fate-aspect-row__bullet" aria-hidden>
              ◆
            </span>
            <input
              className="fate-aspect-row__txt"
              value={row.name || ''}
              disabled={!editing}
              onChange={(e) => updateArr<AspectRow>('aspects', i, { name: e.target.value })}
              placeholder="Další aspekt…"
              aria-label={`Aspekt ${i + 1}`}
            />
            {editing && (
              <button
                type="button"
                className="fate-del"
                onClick={() => removeArr('aspects', i)}
                aria-label="Smazat aspekt"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
      {editing && (
        <button type="button" className="fate-add" onClick={() => addArr<AspectRow>('aspects', { name: '' })}>
          + Další aspekt
        </button>
      )}
    </section>
  );
}

// ── Přístupy (FAE) ─────────────────────────────────────────

function ApproachesSection({ cda, editing }: SubProps) {
  const { g, set } = cda;
  const bump = (key: string, delta: number) => {
    const next = clampBonus((parseInt(g(`appr_${key}`, '0'), 10) || 0) + delta);
    set(`appr_${key}`, String(next));
  };

  return (
    <section className="fate-sec">
      <SectionHead title="Přístupy" />
      <div className="fate-approaches">
        {APPROACHES.map(({ key, label }) => {
          const v = parseInt(g(`appr_${key}`, '0'), 10) || 0;
          return (
            <div className={`fate-appr${v >= 3 ? ' hi' : ''}`} key={key}>
              <div className="fate-appr__name">{label}</div>
              <div className="fate-appr__ctrl">
                {editing && (
                  <button
                    type="button"
                    className="fate-step"
                    onClick={() => bump(key, -1)}
                    aria-label={`${label} −`}
                  >
                    −
                  </button>
                )}
                <span className="fate-appr__bonus">{fmt(v)}</span>
                {editing && (
                  <button
                    type="button"
                    className="fate-step"
                    onClick={() => bump(key, 1)}
                    aria-label={`${label} +`}
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Dovednosti (Core) ──────────────────────────────────────

function SkillsSection({ cda, editing }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const skills = parseJsonArr<SkillRow>('skills');
  const bump = (i: number, delta: number) => {
    const cur = parseInt(skills[i]?.val ?? '0', 10) || 0;
    updateArr<SkillRow>('skills', i, { val: String(clampBonus(cur + delta)) });
  };

  return (
    <section className="fate-sec">
      <SectionHead title="Dovednosti" />
      <div className="fate-skills">
        {skills.map((row, i) => {
          const v = parseInt(row.val, 10) || 0;
          return (
            <div className="fate-skill" key={i}>
              <input
                className="fate-skill__nm"
                value={row.name || ''}
                disabled={!editing}
                onChange={(e) => updateArr<SkillRow>('skills', i, { name: e.target.value })}
                placeholder="Název dovednosti…"
                aria-label={`Dovednost ${i + 1}`}
              />
              <span className="fate-skill__ladder">{ladderName(v)}</span>
              <div className="fate-appr__ctrl">
                {editing && (
                  <button
                    type="button"
                    className="fate-step"
                    onClick={() => bump(i, -1)}
                    aria-label={`${row.name || `Dovednost ${i + 1}`} −`}
                  >
                    −
                  </button>
                )}
                <span className="fate-skill__bonus">{fmt(v)}</span>
                {editing && (
                  <button
                    type="button"
                    className="fate-step"
                    onClick={() => bump(i, 1)}
                    aria-label={`${row.name || `Dovednost ${i + 1}`} +`}
                  >
                    +
                  </button>
                )}
              </div>
              {editing && (
                <button
                  type="button"
                  className="fate-del"
                  onClick={() => removeArr('skills', i)}
                  aria-label="Smazat dovednost"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
      {editing && (
        <button
          type="button"
          className="fate-add"
          onClick={() => addArr<SkillRow>('skills', { name: '', val: '0' })}
        >
          + Nová dovednost
        </button>
      )}
    </section>
  );
}

// ── Triky ──────────────────────────────────────────────────

function StuntsSection({ cda, editing }: SubProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const stunts = parseJsonArr<StuntRow>('stunts');

  return (
    <section className="fate-sec">
      <SectionHead title="Triky" />
      <div className="fate-stunts">
        {stunts.map((row, i) => (
          <div className="fate-stunt" key={i}>
            {editing && (
              <button
                type="button"
                className="fate-del fate-stunt__del"
                onClick={() => removeArr('stunts', i)}
                aria-label="Smazat trik"
              >
                ✕
              </button>
            )}
            <input
              className="fate-stunt__nm"
              value={row.name || ''}
              disabled={!editing}
              onChange={(e) => updateArr<StuntRow>('stunts', i, { name: e.target.value })}
              placeholder="Název triku…"
              aria-label={`Trik ${i + 1} název`}
            />
            <textarea
              className="fate-stunt__desc"
              value={row.desc || ''}
              disabled={!editing}
              onChange={(e) => updateArr<StuntRow>('stunts', i, { desc: e.target.value })}
              placeholder="Co trik dělá…"
              aria-label={`Trik ${i + 1} popis`}
            />
          </div>
        ))}
      </div>
      {editing && (
        <button
          type="button"
          className="fate-add"
          onClick={() => addArr<StuntRow>('stunts', { name: '', desc: '' })}
        >
          + Nový trik
        </button>
      )}
    </section>
  );
}

// ── Stres ──────────────────────────────────────────────────

function StressSection({ cda, editing }: SubProps) {
  const { parseJsonArr, set } = cda;
  const raw = parseJsonArr<StressBox>('stress');
  const stress = raw.length ? raw : DEFAULT_STRESS;
  const write = (next: StressBox[]) => set('stress', JSON.stringify(next));

  return (
    <section className="fate-sec">
      <SectionHead title="Stres" />
      <div className="fate-stress">
        {stress.map((box, i) => {
          const on = box.on === 'true';
          return (
            <div className={`fate-stress-box${on ? ' on' : ''}`} key={i}>
              <button
                type="button"
                className="fate-stress-box__hit"
                disabled={!editing}
                onClick={() =>
                  write(stress.map((b, j) => (j === i ? { ...b, on: on ? 'false' : 'true' } : b)))
                }
                aria-label={`Stres ${box.size} ${on ? 'zaškrtnutý' : 'volný'}`}
                aria-pressed={on}
              >
                <span className="fate-stress-box__sz">{box.size}</span>
              </button>
              {editing && (
                <button
                  type="button"
                  className="fate-del fate-stress-box__del"
                  onClick={() => write(stress.filter((_, j) => j !== i))}
                  aria-label="Odebrat čtvereček stresu"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
        {editing && (
          <button
            type="button"
            className="fate-stress-add"
            onClick={() => write([...stress, { size: '4', on: 'false' }])}
            aria-label="Přidat čtvereček stresu"
          >
            +
          </button>
        )}
      </div>
    </section>
  );
}

// ── Následky ───────────────────────────────────────────────

function ConsequencesSection({ cda, editing }: SubProps) {
  const { g, set } = cda;
  return (
    <section className="fate-sec">
      <SectionHead title="Následky" />
      <div className="fate-consq">
        {CONSEQUENCES.map(({ key, label, value }) => {
          const txt = g(`cons_${key}`);
          return (
            <div className={`fate-cons${txt.trim() ? ' filled' : ''}`} key={key}>
              <div className="fate-cons__slot">
                <div className="fate-cons__nm">{label}</div>
                <div className="fate-cons__v">{value}</div>
              </div>
              <input
                className="fate-cons__txt"
                value={txt}
                disabled={!editing}
                onChange={(e) => set(`cons_${key}`, e.target.value)}
                placeholder="— volný —"
                aria-label={`Následek ${label}`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Deník / Poznámky ───────────────────────────────────────

function NotesSection({ cda, editing }: SubProps) {
  const { g, set } = cda;
  return (
    <section className="fate-sec">
      <SectionHead title="Deník / Poznámky" />
      <textarea
        className="fate-notes"
        value={g('notes')}
        disabled={!editing}
        onChange={(e) => set('notes', e.target.value)}
        placeholder="Vztahy, tajnosti, dějové stopy, výbava…"
        aria-label="Deník / poznámky"
      />
    </section>
  );
}

// ════════════════════════════════════════════════════════════
// PRINT — statický čitelný dokument (čte stejná `<prefix>_*` data)
// ════════════════════════════════════════════════════════════

function FatePrintView({
  cda,
  variant,
  characterName,
}: {
  cda: CdAccess;
  variant: FateVariant;
  characterName?: string;
}) {
  const { g } = cda;
  const aspects = cda.parseJsonArr<AspectRow>('aspects');
  const skills = cda.parseJsonArr<SkillRow>('skills');
  const stunts = cda.parseJsonArr<StuntRow>('stunts');
  const rawStress = cda.parseJsonArr<StressBox>('stress');
  const stress = rawStress.length ? rawStress : DEFAULT_STRESS;
  const notes = g('notes').trim();
  const name = characterName || g('name') || '—';

  return (
    <div className="fate-print">
      <dl>
        <div>
          <dt>Jméno</dt>
          <dd>{name}</dd>
        </div>
        <div>
          <dt>Hlavní koncept</dt>
          <dd>{g('highConcept') || '—'}</dd>
        </div>
        <div>
          <dt>Problém</dt>
          <dd>{g('trouble') || '—'}</dd>
        </div>
        <div>
          <dt>Obnova</dt>
          <dd>{g('refresh', '3')}</dd>
        </div>
      </dl>

      {aspects.length > 0 && (
        <>
          <h2>Aspekty</h2>
          <ul className="fate-print__plain">
            {aspects.map((a, i) => (
              <li key={i}>{a.name || '—'}</li>
            ))}
          </ul>
        </>
      )}

      <h2>{variant === 'fae' ? 'Přístupy' : 'Dovednosti'}</h2>
      {variant === 'fae' ? (
        <ul className="fate-print__plain">
          {APPROACHES.map(({ key, label }) => (
            <li key={key} className="fate-print__row">
              <span>{label}</span>
              <span>{fmt(parseInt(g(`appr_${key}`, '0'), 10) || 0)}</span>
            </li>
          ))}
        </ul>
      ) : skills.length > 0 ? (
        <ul className="fate-print__plain">
          {skills.map((s, i) => {
            const v = parseInt(s.val, 10) || 0;
            return (
              <li key={i} className="fate-print__row">
                <span>{s.name || '—'}</span>
                <span>
                  {fmt(v)} — {ladderName(v)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>—</p>
      )}

      {stunts.length > 0 && (
        <>
          <h2>Triky</h2>
          <ul className="fate-print__plain">
            {stunts.map((s, i) => (
              <li key={i}>
                <b>{s.name || '—'}</b>
                {s.desc ? ` — ${s.desc}` : ''}
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Stres</h2>
      <p>{stress.map((b) => `[${b.on === 'true' ? '✗' : ' '}${b.size}]`).join(' ')}</p>

      <h2>Následky</h2>
      <ul className="fate-print__plain">
        {CONSEQUENCES.map(({ key, label, value }) => (
          <li key={key} className="fate-print__row">
            <span>
              {label} ({value})
            </span>
            <span>{g(`cons_${key}`) || '—'}</span>
          </li>
        ))}
      </ul>

      {notes && (
        <>
          <h2>Deník / Poznámky</h2>
          <p style={{ whiteSpace: 'pre-wrap' }}>{notes}</p>
        </>
      )}
    </div>
  );
}
