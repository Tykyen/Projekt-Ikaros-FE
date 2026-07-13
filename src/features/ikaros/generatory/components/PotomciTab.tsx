/**
 * 21.2a — záložka „Potomci": demografický generátor rodiny (R4) s presety
 * úmrtnosti, rokem světa (V4), generacemi (V8), seedem (V9) a pojmenováním
 * ze jmenné sady (V3, V6 — profil sady ovlivní demografii).
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { useNameSet, useNameSetsList } from '../hooks/useNameSets';
import {
  applySetDemography,
  defaultParams,
  generateFamily,
  MORTALITY_PRESETS,
  type DemographyParams,
  type GeneratedFamily,
  type ChildPerson,
  type MortalityPresetId,
} from '../engine/demography';
import { nameFamily } from '../engine/familyNames';
import { randomSeedString, rngFromSeed } from '../engine/random';
import { NameSetSelect } from './JmenaTab';
import s from '../Generatory.module.css';

function fmtYearOrAge(
  worldYear: number | null,
  birthYearRel: number,
  value: number,
): string {
  // value = věk; birthYearRel = relativní rok narození vůči založení rodiny
  if (worldYear === null) return `${value} let`;
  return `${worldYear + birthYearRel + value}`;
}

export function PotomciTab() {
  const { data: sets = [] } = useNameSetsList({ status: 'approved' });
  const [setId, setSetId] = useState('');
  const { data: fullSet } = useNameSet(setId || null);

  const [preset, setPreset] = useState<MortalityPresetId>('stredovek');
  const [generations, setGenerations] = useState(1);
  const [worldYearRaw, setWorldYearRaw] = useState('');
  const [showDead, setShowDead] = useState(true);
  const [autoName, setAutoName] = useState(true);
  const [seed, setSeed] = useState('');
  const [usedSeed, setUsedSeed] = useState<string | null>(null);
  const [family, setFamily] = useState<GeneratedFamily | null>(null);

  const worldYear = worldYearRaw.trim() ? Number(worldYearRaw) : null;

  const generate = () => {
    const effectiveSeed = seed.trim() || randomSeedString();
    setUsedSeed(effectiveSeed);
    let params: DemographyParams = {
      ...defaultParams(),
      infantMortality: MORTALITY_PRESETS[preset].infantMortality,
      childMortality: MORTALITY_PRESETS[preset].childMortality,
      generations,
    };
    params = applySetDemography(params, fullSet?.demography);
    const fam = generateFamily(rngFromSeed(effectiveSeed), params);
    if (autoName && fullSet) {
      nameFamily(rngFromSeed(effectiveSeed + ':jmena'), fam, fullSet, {
        zipf: fullSet.frequencySorted,
      });
    }
    setFamily(fam);
  };

  const famToText = (fam: GeneratedFamily, indent = ''): string => {
    const lines: string[] = [];
    lines.push(
      `${indent}${fam.father.name ?? 'Otec'} (†${fam.father.ageAtDeath}, ${fam.father.deathCause}) ⚭ ${fam.mother.name ?? 'Matka'} (sňatek v ${fam.mother.marriageAge}, †${fam.mother.ageAtDeath}, ${fam.mother.deathCause})`,
    );
    for (const ch of fam.children) {
      if (!showDead && ch.fate !== 'dospělý') continue;
      const bits = [
        ch.gender === 'm' ? '♂' : '♀',
        ch.name ?? (ch.gender === 'm' ? 'syn' : 'dcera'),
        `nar. (matce ${ch.motherAgeAtBirth})`,
        ch.fate === 'dospělý'
          ? `†${ch.ageAtDeath} (${ch.deathCause})`
          : `zemřel${ch.gender === 'f' ? 'a' : ''} v dětství: †${ch.ageAtDeath} (${ch.deathCause})`,
      ];
      if (ch.twin) bits.push('dvojče');
      if (ch.spouse)
        bits.push(
          `⚭ ${ch.spouse.name ?? 'partner'} (${ch.spouse.ageDiff >= 0 ? '+' : ''}${ch.spouse.ageDiff} let, †${ch.spouse.ageAtDeath})`,
        );
      lines.push(`${indent}  • ${bits.join(' · ')}`);
      if (ch.family) lines.push(famToText(ch.family, indent + '    '));
    }
    return lines.join('\n');
  };

  return (
    <div data-generator-potomci="">
      <div className={s.panel}>
        <div className={s.paramGrid}>
          <div className={s.field}>
            <label className={s.label} htmlFor="pot-set">
              Jmenná sada (jména + demografie)
            </label>
            <NameSetSelect
              id="pot-set"
              value={setId}
              onChange={setSetId}
              sets={sets}
            />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="pot-preset">
              Úmrtnost
            </label>
            <select
              id="pot-preset"
              className={s.select}
              value={preset}
              onChange={(e) => setPreset(e.target.value as MortalityPresetId)}
            >
              {Object.entries(MORTALITY_PRESETS).map(([id, p]) => (
                <option key={id} value={id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="pot-gen">
              Generace (1–3)
            </label>
            <input
              id="pot-gen"
              className={s.input}
              type="number"
              min={1}
              max={3}
              value={generations}
              onChange={(e) =>
                setGenerations(Math.max(1, Math.min(3, Number(e.target.value))))
              }
            />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="pot-year">
              Rok světa (volitelný)
            </label>
            <input
              id="pot-year"
              className={s.input}
              type="number"
              value={worldYearRaw}
              onChange={(e) => setWorldYearRaw(e.target.value)}
              placeholder="např. 1587"
            />
          </div>
          <div className={s.field}>
            <label className={s.label} htmlFor="pot-seed">
              Seed (volitelný)
            </label>
            <input
              id="pot-seed"
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
              checked={showDead}
              onChange={(e) => setShowDead(e.target.checked)}
            />
            Zobrazit děti zemřelé v dětství
          </label>
          <label>
            <input
              type="checkbox"
              checked={autoName}
              disabled={!fullSet}
              onChange={(e) => setAutoName(e.target.checked)}
            />
            Rovnou pojmenovat
          </label>
        </div>
        {fullSet?.demography ? (
          <p className={s.hint}>
            Sada nese vlastní demografii (dožití ×
            {fullSet.demography.lifespanMult ?? 1}
            {fullSet.demography.fertilityFrom !== undefined
              ? `, plodnost ${fullSet.demography.fertilityFrom}–${fullSet.demography.fertilityTo}`
              : ''}
            ).
          </p>
        ) : null}

        <div className={s.actions}>
          <Button variant="primary" onClick={generate}>
            🎲 Vygenerovat rodinu
          </Button>
          <Button
            variant="secondary"
            disabled={!family}
            onClick={async () => {
              await navigator.clipboard.writeText(famToText(family!));
              toast.success('Rodina zkopírována.');
            }}
          >
            Kopírovat vše
          </Button>
          {usedSeed ? (
            <span className={s.seedNote}>
              seed: <code>{usedSeed}</code>
            </span>
          ) : null}
        </div>
      </div>

      {family ? (
        <FamilyView family={family} showDead={showDead} worldYear={worldYear} />
      ) : (
        <p className={s.state}>
          Nastav parametry a vygeneruj rodinu — počet dětí vychází z porodní
          řady (historická demografie), ne z hodu kostkou.
        </p>
      )}
    </div>
  );
}

function ChildLine({
  child,
  worldYear,
  showDead,
}: {
  child: ChildPerson;
  worldYear: number | null;
  showDead: boolean;
}) {
  if (!showDead && child.fate !== 'dospělý') return null;
  const dead = child.fate !== 'dospělý';
  const birth =
    worldYear !== null
      ? `nar. ${worldYear + child.motherAgeAtBirth}`
      : `nar. (matce ${child.motherAgeAtBirth})`;
  const death =
    worldYear !== null
      ? `†${fmtYearOrAge(worldYear, child.motherAgeAtBirth, child.ageAtDeath)}`
      : `†${child.ageAtDeath} let`;
  return (
    <li className={s.childRow}>
      <span className={dead ? s.childDead : undefined}>
        {child.gender === 'm' ? '♂' : '♀'}{' '}
        <strong>{child.name ?? (child.gender === 'm' ? 'syn' : 'dcera')}</strong>
        {child.twin ? ' (dvojče)' : ''} <span className={s.meta}>{birth}</span>
        {' · '}
        <span className={s.meta}>
          {dead ? `zemřel${child.gender === 'f' ? 'a' : ''} v dětství — ` : ''}
          {death} ({child.deathCause})
        </span>
        {child.spouse ? (
          <span className={s.meta}>
            {' '}
            ⚭ {child.spouse.name ?? 'partner'} (
            {child.spouse.ageDiff >= 0 ? '+' : ''}
            {child.spouse.ageDiff} let, †{child.spouse.ageAtDeath},{' '}
            {child.spouse.deathCause})
          </span>
        ) : null}
      </span>
      {child.family ? (
        <div className={s.subFamily}>
          <FamilyView
            family={child.family}
            showDead={showDead}
            worldYear={
              worldYear !== null ? worldYear + child.motherAgeAtBirth + 20 : null
            }
            nested
          />
        </div>
      ) : null}
    </li>
  );
}

function FamilyView({
  family,
  showDead,
  worldYear,
  nested = false,
}: {
  family: GeneratedFamily;
  showDead: boolean;
  worldYear: number | null;
  nested?: boolean;
}) {
  const hiddenCount = showDead
    ? 0
    : family.children.filter((c) => c.fate !== 'dospělý').length;
  return (
    <div className={nested ? undefined : s.familyBlock} data-generator-family="">
      <div className={s.parents}>
        {family.father.name ?? 'Otec'}{' '}
        <span className={s.meta}>
          (†{family.father.ageAtDeath}, {family.father.deathCause})
        </span>{' '}
        ⚭ {family.mother.name ?? 'Matka'}{' '}
        <span className={s.meta}>
          (sňatek v {family.mother.marriageAge}, †{family.mother.ageAtDeath},{' '}
          {family.mother.deathCause}
          {family.mother.diedInChildbirthAt !== undefined
            ? ` — při ${family.mother.diedInChildbirthAt}. porodu`
            : ''}
          )
        </span>
      </div>
      {family.children.length === 0 ? (
        <p className={s.meta}>Bez potomků.</p>
      ) : (
        <ul className={s.childList}>
          {family.children.map((ch, i) => (
            <ChildLine
              key={i}
              child={ch}
              worldYear={worldYear}
              showDead={showDead}
            />
          ))}
        </ul>
      )}
      {hiddenCount > 0 ? (
        <p className={s.meta}>
          (+{hiddenCount} dětí zemřelých v dětství — skryto)
        </p>
      ) : null}
    </div>
  );
}
