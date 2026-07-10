/**
 * 16.2d — sdílené stavební prvky DrD+ deníku (pergamen-kodex).
 * Vše controlled / napojené na cdAccess; ve view mode (disabled) read-only.
 */
import { useId } from 'react';
import { activateOnKey } from '@/shared/lib/a11y';
import type { CdAccess } from '../../_shared/cdAccess';
import { PRIEST_PRINCIPLES, PRIEST_PRINCIPLE_BUDGET } from './constants';

/* ── vizuální stupnice (kosočtverce / kostičky) ───────────────── */
export function Scale({
  value,
  max,
  onChange,
  disabled,
  box,
  label,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  box?: boolean;
  label?: string;
}) {
  const pips = [];
  for (let i = 1; i <= max; i++) {
    const set = () => onChange(i === value ? 0 : i);
    pips.push(
      <span
        key={i}
        className={'dp-pip' + (i <= value ? ' is-on' : '')}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Nastavit ${i}`}
        aria-pressed={i <= value}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : set}
        onKeyDown={disabled ? undefined : activateOnKey(set)}
      />,
    );
  }
  const scale = <span className={'dp-scale' + (box ? ' dp-box' : '')}>{pips}</span>;
  if (label === undefined) return scale;
  return (
    <div className="dp-scale-row">
      <span className="dp-lbl">{label}</span>
      {scale}
    </div>
  );
}

/* ── znalost / stupeň 1–3 ─────────────────────────────────────── */
export function Tri({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <span className="dp-tri">
      {[1, 2, 3].map((i) => {
        const set = () => onChange(i === value ? 0 : i);
        return (
          <span
            key={i}
            className={'dp-pip' + (i <= value ? ' is-on' : '')}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={`Nastavit ${i}`}
            aria-pressed={i <= value}
            aria-disabled={disabled || undefined}
            onClick={disabled ? undefined : set}
            onKeyDown={disabled ? undefined : activateOnKey(set)}
          />
        );
      })}
    </span>
  );
}

/* ── lišta zranění / únavy (řádky po „mezi", volitelný 4. řádek Smrt) ── */
export function WoundGrid({
  cda,
  prefix,
  label,
  disabled,
}: {
  cda: CdAccess;
  prefix: string;
  label: string;
  disabled?: boolean;
}) {
  const uid = useId();
  const mez = Math.max(1, parseInt(cda.g(`${prefix}_mez`, '10'), 10) || 10);
  const smrt = cda.bool(`${prefix}_smrt`);
  const filled = parseInt(cda.g(`${prefix}_val`, '0'), 10) || 0;
  const rows: [string, string][] = [
    ['dp-bez', 'Bez postihu'],
    ['dp-postih', 'Postih'],
    ['dp-vyr', 'Bezvědomí'],
  ];
  if (smrt) rows.push(['dp-smrt', 'Smrt']);
  let idx = 0;
  return (
    <div className="dp-wound">
      <div className="dp-wctl">
        <label>{label}</label>
        <input
          type="number"
          min={1}
          value={mez}
          disabled={disabled}
          aria-label={label}
          onChange={(e) =>
            cda.set(`${prefix}_mez`, Math.max(1, parseInt(e.target.value, 10) || 1))
          }
        />
        <span className="dp-tau">= políček (životů) na řádek</span>
        <label className="dp-wchk">
          <input
            type="checkbox"
            checked={smrt}
            disabled={disabled}
            onChange={(e) => cda.set(`${prefix}_smrt`, e.target.checked)}
          />{' '}
          4. řádek — Smrt
        </label>
      </div>
      {rows.map(([cls, lbl]) => (
        <div key={cls} className={'dp-wrow ' + cls}>
          <span className="dp-rlbl">{lbl}</span>
          <div className="dp-wcells">
            {Array.from({ length: mez }, () => {
              const cellIndex = idx++;
              const set = () =>
                cda.set(
                  `${prefix}_val`,
                  cellIndex + 1 === filled ? 0 : cellIndex + 1,
                );
              return (
                <span
                  key={cellIndex}
                  className={'dp-wcell' + (cellIndex < filled ? ' is-on' : '')}
                  role="button"
                  tabIndex={disabled ? -1 : 0}
                  aria-label={`Zranění ${cellIndex + 1}`}
                  aria-pressed={cellIndex < filled}
                  aria-disabled={disabled || undefined}
                  onClick={disabled ? undefined : set}
                  onKeyDown={disabled ? undefined : activateOnKey(set)}
                />
              );
            })}
          </div>
        </div>
      ))}
      {/* 16.2d-mapa — postih za toto pásmo (číslo, odečítá se od hodů; sdíleno s TM panelem) */}
      <div className="dp-wctl" style={{ marginTop: 8 }}>
        <label htmlFor={`${uid}-postih`}>Postih</label>
        <input
          id={`${uid}-postih`}
          type="number"
          value={cda.g(`${prefix}_postih`, '0')}
          disabled={disabled}
          aria-label={`Postih (${label})`}
          onChange={(e) =>
            cda.set(`${prefix}_postih`, parseInt(e.target.value, 10) || 0)
          }
        />
        <span className="dp-tau">odečítá se od hodů (i na taktické mapě)</span>
      </div>
    </div>
  );
}

/* ── nakloněnost theurga (záporná | 0 | kladná, nastavitelný rozsah) ── */
export function SignedScale({
  cda,
  kVal,
  kMax,
  label,
  defMax,
  negMax,
  disabled,
}: {
  cda: CdAccess;
  kVal: string;
  kMax: string;
  label: string;
  defMax: number;
  negMax: number;
  disabled?: boolean;
}) {
  const posMax = Math.max(1, parseInt(cda.g(kMax, String(defMax)), 10) || defMax);
  const v = parseInt(cda.g(kVal, '0'), 10) || 0;
  const setV = (n: number) => cda.set(kVal, n);
  const neg = [];
  for (let i = negMax; i >= 1; i--) {
    const n = -i;
    const set = () => setV(v === n ? 0 : n);
    neg.push(
      <span
        key={n}
        className={'dp-naklo-pip dp-neg' + (v < 0 && n >= v ? ' is-on' : '')}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Nastavit ${n}`}
        aria-pressed={v < 0 && n >= v}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : set}
        onKeyDown={disabled ? undefined : activateOnKey(set)}
      />,
    );
  }
  const pos = [];
  for (let i = 1; i <= posMax; i++) {
    const set = () => setV(v === i ? 0 : i);
    pos.push(
      <span
        key={i}
        className={'dp-naklo-pip dp-pos' + (v > 0 && i <= v ? ' is-on' : '')}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Nastavit ${i}`}
        aria-pressed={v > 0 && i <= v}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : set}
        onKeyDown={disabled ? undefined : activateOnKey(set)}
      />,
    );
  }
  return (
    <div className="dp-naklo-row">
      <span className="dp-naklo-lbl">{label}</span>
      <input
        className="dp-naklo-max"
        type="number"
        min={1}
        value={posMax}
        disabled={disabled}
        aria-label={`${label} rozsah`}
        onChange={(e) =>
          cda.set(kMax, Math.max(1, parseInt(e.target.value, 10) || 1))
        }
      />
      <div className="dp-naklo-scale">
        {negMax > 0 && <span className="dp-naklo-seg dp-neg-seg">{neg}</span>}
        <span
          className="dp-naklo-zero"
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Vynulovat"
          aria-disabled={disabled || undefined}
          onClick={disabled ? undefined : () => setV(0)}
          onKeyDown={disabled ? undefined : activateOnKey(() => setV(0))}
        >
          0
        </span>
        <span className="dp-naklo-seg dp-pos-seg">{pos}</span>
      </div>
      <span className={'dp-naklo-val' + (v < 0 ? ' dp-neg' : '')}>
        {v > 0 ? `+${v}` : v === 0 ? '±0' : `−${Math.abs(v)}`}
      </span>
    </div>
  );
}

/* ── princip-hexagon (kněz): rozpočet 6 bodů, segmenty se rozsvěcí ── */
export function PrincipHex({
  cda,
  disabled,
}: {
  cda: CdAccess;
  disabled?: boolean;
}) {
  const budget = PRIEST_PRINCIPLE_BUDGET;
  const vals = PRIEST_PRINCIPLES.map(
    (_, i) => parseInt(cda.g(`pri_b_${i}`, '0'), 10) || 0,
  );
  const total = vals.reduce((a, b) => a + b, 0);
  const setVal = (i: number, n: number) => {
    const others = total - vals[i];
    let t = n;
    if (t + others > budget) t = budget - others;
    if (t < 0) t = 0;
    cda.set(`pri_b_${i}`, t);
  };

  // hexagon segmenty
  const cx = 100,
    cy = 87,
    r = 82;
  const segs = PRIEST_PRINCIPLES.map((label, i) => {
    const a1 = (Math.PI / 180) * (60 * i - 90);
    const a2 = (Math.PI / 180) * (60 * (i + 1) - 90);
    const am = (a1 + a2) / 2;
    const x1 = cx + r * Math.cos(a1),
      y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2),
      y2 = cy + r * Math.sin(a2);
    const lx = cx + r * 0.6 * Math.cos(am),
      ly = cy + r * 0.6 * Math.sin(am);
    const pts = vals[i];
    const op = pts ? 0.15 + (pts / 6) * 0.85 : 0;
    return (
      <g key={label}>
        <path
          className="dp-seg"
          d={`M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} Z`}
          style={{ fill: 'var(--dp-acc)', fillOpacity: op }}
        />
        <text
          className="dp-lab"
          x={lx.toFixed(1)}
          y={ly.toFixed(1)}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {label}
        </text>
      </g>
    );
  });

  return (
    <div className="dp-princip-grid">
      <div className="dp-hex-wrap">
        <div className="dp-hexagon">
          <svg viewBox="0 0 200 174" width="100%" height="100%">
            {segs}
          </svg>
        </div>
      </div>
      <div>
        {PRIEST_PRINCIPLES.map((p, i) => (
          <Scale
            key={p}
            label={p}
            max={6}
            box
            value={vals[i]}
            disabled={disabled}
            onChange={(n) => setVal(i, n)}
          />
        ))}
        <div className={'dp-princip-budget' + (total >= budget ? ' dp-full' : '')}>
          Rozdělené body: <b>{total}</b> / {budget}
        </div>
      </div>
    </div>
  );
}

/* ── generická JSON tabulka (text / num / tri sloupce) ────────── */
export interface JsonCol {
  key: string;
  label: string;
  type?: 'text' | 'num' | 'tri';
  width?: string;
}
export function JsonTable({
  cda,
  arrKey,
  cols,
  addLabel,
  disabled,
}: {
  cda: CdAccess;
  arrKey: string;
  cols: JsonCol[];
  addLabel: string;
  disabled?: boolean;
}) {
  const rows = cda.parseJsonArr<Record<string, string | number>>(arrKey);
  const template = cols.reduce<Record<string, string>>(
    (a, c) => ({ ...a, [c.key]: '' }),
    {},
  );
  return (
    <div>
      <table className="dp-tbl">
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c.key}
                className={c.type === 'num' ? 'dp-num' : undefined}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.label}
              </th>
            ))}
            {!disabled && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c.key}>
                  {c.type === 'tri' ? (
                    <Tri
                      value={Number(row[c.key]) || 0}
                      disabled={disabled}
                      onChange={(n) => cda.updateArr(arrKey, i, { [c.key]: n })}
                    />
                  ) : (
                    <input
                      className={c.type === 'num' ? 'dp-num' : undefined}
                      value={String(row[c.key] ?? '')}
                      disabled={disabled}
                      aria-label={`${c.label} ${i + 1}`}
                      onChange={(e) =>
                        cda.updateArr(arrKey, i, { [c.key]: e.target.value })
                      }
                    />
                  )}
                </td>
              ))}
              {!disabled && (
                <td>
                  <button
                    type="button"
                    className="dp-del"
                    onClick={() => cda.removeArr(arrKey, i)}
                    aria-label="Smazat řádek"
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!disabled && (
        <button
          type="button"
          className="dp-addrow"
          onClick={() => cda.addArr(arrKey, template)}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}
