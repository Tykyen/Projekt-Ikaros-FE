/**
 * 21.2a — záložka „Jména": výběr sady + parametry + výsledky se zámky (V9
 * seed, V2 zipf, V7 přízviska). Generuje se čistě na klientu.
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { useNameSet, useNameSetsList } from '../hooks/useNameSets';
import { generateNames, type GeneratedName } from '../engine/names';
import { randomSeedString, rngFromSeed } from '../engine/random';
import {
  NAME_SET_CATEGORY_LABELS,
  type NameSetCategory,
  type NameSetSummary,
} from '../types';
import s from '../Generatory.module.css';

interface ResultRow {
  name: GeneratedName;
  locked: boolean;
}

/** Select sady seskupený po kategoriích. */
export function NameSetSelect({
  value,
  onChange,
  sets,
  id,
}: {
  value: string;
  onChange: (id: string) => void;
  sets: NameSetSummary[];
  id: string;
}) {
  const groups = useMemo(() => {
    const byCat = new Map<NameSetCategory, NameSetSummary[]>();
    for (const set of sets) {
      if (!byCat.has(set.category)) byCat.set(set.category, []);
      byCat.get(set.category)!.push(set);
    }
    return [...byCat.entries()];
  }, [sets]);

  return (
    <select
      id={id}
      className={s.select}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— vyber sadu —</option>
      {groups.map(([cat, items]) => (
        <optgroup key={cat} label={NAME_SET_CATEGORY_LABELS[cat]}>
          {items.map((set) => (
            <option key={set.id} value={set.id}>
              {set.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export function JmenaTab() {
  const { data: sets = [], isLoading } = useNameSetsList({
    status: 'approved',
  });
  const [setId, setSetId] = useState('');
  const { data: fullSet } = useNameSet(setId || null);

  const [count, setCount] = useState(10);
  const [gender, setGender] = useState<'m' | 'f' | 'mix'>('mix');
  const [format, setFormat] = useState<'full' | 'given' | 'surname'>('full');
  const [zipf, setZipf] = useState(true);
  const [withEpithet, setWithEpithet] = useState(false);
  const [seed, setSeed] = useState('');
  const [usedSeed, setUsedSeed] = useState<string | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);

  const generate = () => {
    if (!fullSet) return;
    const effectiveSeed = seed.trim() || randomSeedString();
    setUsedSeed(effectiveSeed);
    const rng = rngFromSeed(effectiveSeed);
    const fresh = generateNames(rng, fullSet, {
      count,
      gender,
      format,
      zipf,
      withEpithet,
    });
    // zámky: zamčené řádky zůstávají, nezamčené se nahradí novými
    setRows((prev) => {
      const out: ResultRow[] = [];
      for (let i = 0; i < fresh.length; i++) {
        const old = prev[i];
        out.push(
          old?.locked ? old : { name: fresh[i], locked: false },
        );
      }
      // zamčené řádky za novým počtem nezahazuj
      for (let i = fresh.length; i < prev.length; i++) {
        if (prev[i].locked) out.push(prev[i]);
      }
      return out;
    });
    if (!seed.trim()) setSeed('');
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(rows.map((r) => r.name.text).join('\n'));
    toast.success('Jména zkopírována.');
  };

  const noSurnames = fullSet ? fullSet.surnames.length === 0 : false;

  return (
    <div data-generator-jmena="">
      <div className={s.panel}>
        <div className={s.paramGrid}>
          <div className={s.field}>
            <label className={s.label} htmlFor="gen-set">
              Jmenná sada
            </label>
            <NameSetSelect
              id="gen-set"
              value={setId}
              onChange={setSetId}
              sets={sets}
            />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="gen-count">
              Počet
            </label>
            <input
              id="gen-count"
              className={s.input}
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="gen-gender">
              Pohlaví
            </label>
            <select
              id="gen-gender"
              className={s.select}
              value={gender}
              onChange={(e) => setGender(e.target.value as typeof gender)}
            >
              <option value="mix">Mix</option>
              <option value="m">Muži</option>
              <option value="f">Ženy</option>
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="gen-format">
              Formát
            </label>
            <select
              id="gen-format"
              className={s.select}
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
            >
              <option value="full">Jméno + příjmení</option>
              <option value="given">Jen jméno</option>
              <option value="surname">Jen příjmení</option>
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="gen-seed">
              Seed (volitelný)
            </label>
            <input
              id="gen-seed"
              className={s.input}
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="náhodný"
            />
          </div>
        </div>

        <div className={s.checkRow}>
          <label>
            <input
              type="checkbox"
              checked={zipf && Boolean(fullSet?.frequencySorted)}
              disabled={!fullSet?.frequencySorted}
              onChange={(e) => setZipf(e.target.checked)}
            />
            Běžná jména častěji
          </label>
          <label>
            <input
              type="checkbox"
              checked={withEpithet && Boolean(fullSet?.epithets.length)}
              disabled={!fullSet?.epithets.length}
              onChange={(e) => setWithEpithet(e.target.checked)}
            />
            Přízviska
          </label>
        </div>
        {fullSet?.surnameNote ? (
          <p className={s.hint}>Příjmení: {fullSet.surnameNote}</p>
        ) : null}

        <div className={s.actions}>
          <Button
            variant="primary"
            disabled={!fullSet || (format !== 'given' && noSurnames && format === 'surname')}
            onClick={generate}
          >
            🎲 Vygenerovat
          </Button>
          <Button
            variant="secondary"
            disabled={rows.length === 0}
            onClick={copyAll}
          >
            Kopírovat vše
          </Button>
          {usedSeed ? (
            <span className={s.seedNote}>
              seed: <code>{usedSeed}</code> (stejný seed = stejný výsledek)
            </span>
          ) : null}
        </div>
      </div>

      {isLoading ? <p className={s.state}>Načítám sady…</p> : null}
      {rows.length > 0 ? (
        <ul className={s.resultList}>
          {rows.map((row, i) => (
            <li key={i} className={s.resultRow} data-locked={row.locked}>
              <span className={s.genderChip} aria-hidden="true">
                {row.name.gender === 'm' ? '♂' : '♀'}
              </span>
              <span className={s.resultName}>{row.name.text}</span>
              <button
                type="button"
                className={s.iconBtn}
                aria-pressed={row.locked}
                title={row.locked ? 'Odemknout' : 'Zamknout (přežije přegenerování)'}
                onClick={() =>
                  setRows((prev) =>
                    prev.map((r, j) =>
                      j === i ? { ...r, locked: !r.locked } : r,
                    ),
                  )
                }
              >
                {row.locked ? '🔒' : '🔓'}
              </button>
              <button
                type="button"
                className={s.iconBtn}
                title="Kopírovat"
                onClick={() => {
                  void navigator.clipboard.writeText(row.name.text);
                  toast.success('Zkopírováno.');
                }}
              >
                ⧉
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
