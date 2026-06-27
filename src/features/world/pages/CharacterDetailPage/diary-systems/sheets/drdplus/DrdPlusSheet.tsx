/**
 * 16.2d — Dračí doupě Plus (DrdPlus) deník: jednotný „iluminovaný kodex".
 *
 * Jeden souvislý list (bez tabů): Postava → Boj → Na cesty → Profese.
 * Povolání se volí ERBEM (klik na štít → popover s 6 erby); erb řídí akcent
 * celého listu (`data-prof`) i proměnlivou spodní sekci Profese.
 * Pergamen je základní vzhled (NE skin-reaktivní), scoped přes `.dp-sheet`.
 * Print = stejný list read-only (disabled), žádný separátní PrintView.
 *
 * Data v `customData` s prefixem `drdp_` přes makeCdAccess (delta-merge).
 */
import { useEffect, useState } from 'react';
import { usePrintMode } from '@/features/world/export/print';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess } from '../../_shared/cdAccess';
import { SheetInitiativeButton } from '../../_shared/SheetInitiativeButton';
import {
  DRDPLUS_PROFESSIONS,
  DRDPLUS_STATS,
  DRDPLUS_DERIVED,
  DRDPLUS_DERIVED_FORMULAS,
  type DrdPlusProfessionId,
} from './constants';
import { WoundGrid, JsonTable } from './DrdPlusShared';
import {
  WarriorSection,
  WizardSection,
  RangerSection,
  PriestSection,
  TheurgSection,
  ThiefSection,
} from './DrdPlusProfessions';

export function DrdPlusSheet({ diary, mode, onChange, onRoll }: SystemSheetProps) {
  const printMode = usePrintMode();
  const disabled = mode === 'view' || printMode;
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'drdp_', onChange);
  const { g, set } = cda;
  const [pickOpen, setPickOpen] = useState(false);

  const prof = (g('profession') || 'bojovnik') as DrdPlusProfessionId;
  const profDef =
    DRDPLUS_PROFESSIONS.find((p) => p.id === prof) ?? DRDPLUS_PROFESSIONS[0];

  // klik mimo erb → zavři popover výběru povolání
  useEffect(() => {
    if (!pickOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest?.('.dp-shield')) setPickOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [pickOpen]);

  return (
    <div className={'dp-sheet' + (disabled ? ' is-view' : '')} data-prof={prof}>
      {onRoll && <SheetInitiativeButton onRoll={onRoll} kind="2d6+" />}

      <header className="dp-head">
        <div className="dp-eyebrow">Dračí doupě Plus</div>
        <h1>Osobní deník</h1>
      </header>
      <hr className="dp-rule" />

      {/* ════════ POSTAVA ════════ */}
      <section className="dp-page">
        <h2 className="dp-page-title">Postava</h2>
        <div className="dp-identity">
          <div className="dp-shield">
            <div className="dp-pname">{profDef.label}</div>
            <svg
              viewBox="0 0 96 112"
              role="button"
              aria-label="Vybrat povolání (erb)"
              onClick={() => !disabled && setPickOpen((o) => !o)}
            >
              <path className="dp-crest" d="M6 6 H90 V64 Q90 96 48 108 Q6 96 6 64 Z" />
              <text className="dp-glyph" x="48" y="68">
                {profDef.glyph}
              </text>
            </svg>
            {!disabled && <span className="dp-hint-click">▾ klikni a vyber povolání</span>}
            <div className={'dp-crest-pick' + (pickOpen ? ' is-open' : '')}>
              <span className="dp-pick-lbl">Vyber povolání</span>
              {DRDPLUS_PROFESSIONS.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  className={p.id === prof ? 'is-on' : undefined}
                  title={p.label}
                  onClick={() => {
                    set('profession', p.id);
                    setPickOpen(false);
                  }}
                >
                  {p.glyph}
                </button>
              ))}
            </div>
          </div>
          <div className="dp-idfields">
            <div className="dp-field dp-wide">
              <label>Jméno</label>
              <input value={g('name')} disabled={disabled} aria-label="Jméno" onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="dp-field">
              <label>Rasa</label>
              <input value={g('race')} disabled={disabled} aria-label="Rasa" onChange={(e) => set('race', e.target.value)} />
            </div>
            <div className="dp-field">
              <label>Úroveň</label>
              <input value={g('uroven')} disabled={disabled} aria-label="Úroveň" onChange={(e) => set('uroven', e.target.value)} />
            </div>
            <div className="dp-field">
              <label>Zkušenosti</label>
              <input value={g('xp')} disabled={disabled} aria-label="Zkušenosti" onChange={(e) => set('xp', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="dp-grid dp-g2">
          <div className="dp-panel">
            <h3>Hlavní vlastnosti</h3>
            <div className="dp-statrow">
              {DRDPLUS_STATS.map((s) => (
                <div className="dp-stat dp-big" key={s}>
                  <span className="dp-k">{s}</span>
                  <input className="dp-v" value={g(`stat_${s}`)} disabled={disabled} aria-label={s} onChange={(e) => set(`stat_${s}`, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
          <div className="dp-panel">
            <h3>Odvozené vlastnosti</h3>
            <div className="dp-statrow">
              {DRDPLUS_DERIVED.map((s) => (
                <div className="dp-stat" key={s}>
                  <span className="dp-k">{s}</span>
                  <input className="dp-v" value={g(`odv_${s}`)} disabled={disabled} aria-label={s} onChange={(e) => set(`odv_${s}`, e.target.value)} />
                  {DRDPLUS_DERIVED_FORMULAS[s] && <span className="dp-note">{DRDPLUS_DERIVED_FORMULAS[s]}</span>}
                </div>
              ))}
            </div>
            <p className="dp-hint" style={{ marginTop: 12, marginBottom: 0 }}>
              Krása / Nebezpečnost / Důstojnost se počítají ze zadaných vlastností.
            </p>
          </div>
        </div>
      </section>

      {/* ════════ BOJ ════════ */}
      <section className="dp-page">
        <h2 className="dp-page-title">Boj</h2>
        <div className="dp-quartet">
          {([['boj_b', 'Boj'], ['boj_u', 'Útok'], ['boj_s', 'Střelba'], ['boj_o', 'Obrana']] as [string, string][]).map(([k, l]) => (
            <div className="dp-cbig" key={k}>
              <span className="dp-k">{l}</span>
              <input value={g(k)} disabled={disabled} aria-label={l} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="dp-grid dp-g3">
          <div className="dp-panel dp-span2">
            <h3>Kombinace zbraní</h3>
            <JsonTable
              cda={cda}
              arrKey="zbrane"
              disabled={disabled}
              addLabel="+ Přidat kombinaci"
              cols={[
                { key: 'zbran', label: 'Kombinace / zbraň' },
                { key: 'bc', label: 'BČ', type: 'num', width: '54px' },
                { key: 'uc', label: 'ÚČ', type: 'num', width: '54px' },
                { key: 'zz', label: 'ZZ', type: 'num', width: '54px' },
                { key: 'oc', label: 'OČ', type: 'num', width: '54px' },
              ]}
            />
          </div>
          <div className="dp-panel">
            <h3>Zbroj a ochrana</h3>
            <JsonTable
              cda={cda}
              arrKey="zbroje"
              disabled={disabled}
              addLabel="+ Přidat zbroj"
              cols={[
                { key: 'typ', label: 'Zbroj' },
                { key: 'kvalita', label: 'Kvalita' },
                { key: 'ochrana', label: 'Ochrana', type: 'num', width: '64px' },
              ]}
            />
          </div>
          <div className="dp-panel dp-span3">
            <h3>Lišta zranění</h3>
            <WoundGrid cda={cda} prefix="zraneni" label="Mez zranění" disabled={disabled} />
            <h4>Velká zranění a postižení</h4>
            <JsonTable
              cda={cda}
              arrKey="postizeni"
              disabled={disabled}
              addLabel="+ Přidat postižení"
              cols={[
                { key: 'domena', label: 'Doména / zdroj' },
                { key: 'ucinek', label: 'Účinek' },
                { key: 'trvani', label: 'Trvání' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ════════ NA CESTY ════════ */}
      <section className="dp-page">
        <h2 className="dp-page-title">Na cesty</h2>
        <div className="dp-grid dp-g2">
          <div className="dp-panel dp-span2">
            <h3>Pohybová rychlost</h3>
            <div className="dp-statrow">
              {([['spd_chuze', 'Chůze'], ['spd_spech', 'Spěch'], ['spd_beh', 'Běh'], ['spd_sprint', 'Sprint']] as [string, string][]).map(([k, l]) => (
                <div className="dp-stat" key={k}>
                  <span className="dp-k">{l}</span>
                  <input className="dp-v" value={g(k)} disabled={disabled} aria-label={l} onChange={(e) => set(k, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
          <div className="dp-panel dp-span2">
            <h3>Lišta únavy</h3>
            <WoundGrid cda={cda} prefix="unava" label="Mez únavy" disabled={disabled} />
          </div>
          <div className="dp-panel dp-span2">
            <h3>Dovednosti</h3>
            <JsonTable
              cda={cda}
              arrKey="dovednosti"
              disabled={disabled}
              addLabel="+ Naučit dovednost"
              cols={[
                { key: 'dovednost', label: 'Dovednost' },
                { key: 'vlastnost', label: 'Vlastnost' },
                { key: 'bonus', label: 'Bonus', type: 'num' },
                { key: 'note', label: 'Poznámka' },
              ]}
            />
          </div>
          <div className="dp-panel dp-span2">
            <h3>Poznámky</h3>
            <div className="dp-field">
              <textarea rows={4} value={g('poznamky')} disabled={disabled} aria-label="Poznámky" onChange={(e) => set('poznamky', e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════ PROFESE (proměnlivá dle erbu) ════════ */}
      <section className="dp-page">
        <h2 className="dp-page-title">Profese</h2>
        <div className="dp-prof-title">
          <h2>{profDef.label}</h2>
          <span className="dp-prof-points">
            <label>{profDef.pointsLabel}</label>
            <input
              value={g(profDef.pointsKey)}
              disabled={disabled}
              aria-label={profDef.pointsLabel}
              onChange={(e) => set(profDef.pointsKey, e.target.value)}
            />
          </span>
        </div>
        {prof === 'bojovnik' && <WarriorSection cda={cda} disabled={disabled} />}
        {prof === 'carodej' && <WizardSection cda={cda} disabled={disabled} />}
        {prof === 'hranicar' && <RangerSection cda={cda} disabled={disabled} />}
        {prof === 'knez' && <PriestSection cda={cda} disabled={disabled} />}
        {prof === 'theurg' && <TheurgSection cda={cda} disabled={disabled} />}
        {prof === 'zlodej' && <ThiefSection cda={cda} disabled={disabled} />}
      </section>
    </div>
  );
}
