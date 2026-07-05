/**
 * 16.2d — karty DrD+ deníku: Kouzla (čaroděj), Formule + Démoni (theurg).
 * Data jsou JSON pole objektů v customData; editace přes cda.updateArr.
 * Sbalování formulí/démonů je lokální UI stav (neukládá se).
 */
import { useState } from 'react';
import type { CdAccess } from '../../_shared/cdAccess';
import { FORMA_AXES, DEMON_KINDS } from './constants';

type Row = Record<string, unknown>;

const pnum = (v: unknown): number => {
  if (v == null) return 0;
  const s = String(v).replace(/[−–]/g, '-').replace(/[^0-9.-]/g, '');
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
};
const fmt = (x: number): string => (x > 0 ? `+${x}` : x < 0 ? `−${Math.abs(x)}` : '±0');
const arr = (v: unknown): unknown[][] => (Array.isArray(v) ? (v as unknown[][]) : []);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);

/* ════════════════ KOUZLA (čaroděj) ════════════════ */
function SpellCard({
  row,
  onPatch,
  onDel,
  disabled,
}: {
  row: Row;
  onPatch: (p: Row) => void;
  onDel: () => void;
  disabled?: boolean;
}) {
  const naroc = arr(row.naroc).length ? arr(row.naroc) : [['', '']];
  const setNaroc = (a: unknown[][]) => onPatch({ naroc: a });
  return (
    <div className="dp-spell">
      <div className="dp-spell-head">
        <button
          type="button"
          className={'dp-spell-star' + (row.direct ? ' is-on' : '')}
          disabled={disabled}
          title="Přímá / nepřímá magie"
          onClick={() => onPatch({ direct: !row.direct })}
        >
          {row.direct ? '✦' : '✧'}
        </button>
        <input
          className="dp-spell-name"
          value={String(row.name ?? '')}
          disabled={disabled}
          placeholder="Název kouzla"
          aria-label="Název kouzla"
          onChange={(e) => onPatch({ name: e.target.value })}
        />
        {!disabled && (
          <button type="button" className="dp-del" onClick={onDel} aria-label="Smazat kouzlo">
            ✕
          </button>
        )}
      </div>
      <div className="dp-spell-params">
        {([
          ['mg', 'Magenergie (mg)'],
          ['sfera', 'Sféra'],
          ['vyvolani', 'Vyvolání'],
          ['dosah', 'Dosah'],
          ['rozsah', 'Rozsah'],
          ['trvani', 'Trvání'],
        ] as [string, string][]).map(([k, l]) => (
          <div className="dp-sp" key={k}>
            <span className="dp-k">{l}</span>
            <input
              value={String(row[k] ?? '')}
              disabled={disabled}
              aria-label={l}
              onChange={(e) => onPatch({ [k]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <span className="dp-sub-lbl">Náročnost → Kvalita (1–3)</span>
      <table className="dp-naroc">
        <tbody>
          {naroc.map((nr, j) => (
            <tr key={j}>
              <td>
                <input
                  className="dp-num"
                  value={String(nr[0] ?? '')}
                  disabled={disabled}
                  placeholder="Náročnost"
                  onChange={(e) =>
                    setNaroc(naroc.map((x, k) => (k === j ? [e.target.value, x[1]] : x)))
                  }
                />
              </td>
              <td>
                <input
                  className="dp-num"
                  value={String(nr[1] ?? '')}
                  disabled={disabled}
                  placeholder="Kvalita"
                  onChange={(e) =>
                    setNaroc(naroc.map((x, k) => (k === j ? [x[0], e.target.value] : x)))
                  }
                />
              </td>
              {!disabled && naroc.length > 1 && (
                <td>
                  <button
                    type="button"
                    className="dp-del"
                    aria-label="Smazat řádek náročnosti"
                    onClick={() => setNaroc(naroc.filter((_, k) => k !== j))}
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!disabled && naroc.length < 3 && (
        <button
          type="button"
          className="dp-addrow dp-mini-add"
          onClick={() => setNaroc([...naroc, ['', '']])}
        >
          + Řádek náročnosti
        </button>
      )}
      <textarea
        className="dp-spell-popis"
        value={String(row.popis ?? '')}
        disabled={disabled}
        placeholder="Popis účinku kouzla…"
        onChange={(e) => onPatch({ popis: e.target.value })}
      />
    </div>
  );
}

export function SpellList({ cda, disabled }: { cda: CdAccess; disabled?: boolean }) {
  const rows = cda.parseJsonArr<Row>('wiz_kouzla');
  return (
    <div>
      {rows.map((row, i) => (
        <SpellCard
          key={i}
          row={row}
          disabled={disabled}
          onPatch={(p) => cda.updateArr('wiz_kouzla', i, p)}
          onDel={() => cda.removeArr('wiz_kouzla', i)}
        />
      ))}
      {!disabled && (
        <button
          type="button"
          className="dp-addrow"
          onClick={() => cda.addArr('wiz_kouzla', { name: '', direct: false, naroc: [['', '']] })}
        >
          + Zapsat kouzlo
        </button>
      )}
    </div>
  );
}

/* ════════════════ FORMULE (theurg) ════════════════ */
function FormuleCard({
  row,
  onPatch,
  onDel,
  disabled,
}: {
  row: Row;
  onPatch: (p: Row) => void;
  onDel: () => void;
  disabled?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const profiles = arr(row.profiles).length ? arr(row.profiles) : [['', '♀']];
  const params = arr(row.params).length ? arr(row.params) : [['', '', '', '']];
  const rysy = strArr(row.rysy).length ? strArr(row.rysy) : [''];
  const mods = arr(row.mods).length ? arr(row.mods) : [['', '', '♂', '', '', '', '']];
  const setA = (key: string, a: unknown) => onPatch({ [key]: a });

  const nar = pnum(row.narocnost) + mods.reduce((a, m) => a + pnum(m[3]), 0);
  const nakl = pnum(row.naklonnost) + mods.reduce((a, m) => a + pnum(m[4]), 0);
  const vyv = pnum(row.vyvolani) + mods.reduce((a, m) => a + pnum(m[5]), 0);

  return (
    <div className={'dp-card' + (collapsed ? ' is-collapsed' : '')}>
      <div className="dp-card-head" onClick={() => setCollapsed((c) => !c)}>
        <button type="button" className="dp-toggle" aria-label="Sbalit / rozbalit">
          {collapsed ? '▸' : '▾'}
        </button>
        <input
          className="dp-card-name"
          value={String(row.name ?? '')}
          disabled={disabled}
          placeholder="Jméno formule"
          aria-label="Jméno formule"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
        {!disabled && (
          <button
            type="button"
            className="dp-del"
            onClick={(e) => {
              e.stopPropagation();
              onDel();
            }}
            aria-label="Smazat formuli"
          >
            ✕
          </button>
        )}
      </div>
      {!collapsed && (
        <>
          <div className="dp-card-base">
            {([
              ['sfera', 'Sféra'],
              ['naklonnost', 'Náklonnost'],
              ['vyvolani', 'Vyvolání'],
              ['narocnost', 'Náročnost'],
            ] as [string, string][]).map(([k, l]) => (
              <div className="dp-sp" key={k}>
                <span className="dp-k">{l}</span>
                <input
                  value={String(row[k] ?? '')}
                  disabled={disabled}
                  aria-label={l}
                  onChange={(e) => onPatch({ [k]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <span className="dp-sub-lbl">Profily (napojení modifikátorů · ♀/♂)</span>
          <div className="dp-profiles">
            {profiles.map((pr, j) => (
              <span className="dp-prof-chip" key={j}>
                <input
                  value={String(pr[0] ?? '')}
                  disabled={disabled}
                  placeholder="Profil"
                  onChange={(e) =>
                    setA('profiles', profiles.map((x, k) => (k === j ? [e.target.value, x[1]] : x)))
                  }
                />
                <button
                  type="button"
                  className="dp-gender"
                  disabled={disabled}
                  onClick={() =>
                    setA(
                      'profiles',
                      profiles.map((x, k) => (k === j ? [x[0], x[1] === '♀' ? '♂' : '♀'] : x)),
                    )
                  }
                >
                  {String(pr[1] ?? '♀')}
                </button>
              </span>
            ))}
            {!disabled && (
              <button
                type="button"
                className="dp-addrow dp-mini-add dp-prof-add"
                onClick={() => setA('profiles', [...profiles, ['', '♀']])}
              >
                + profil
              </button>
            )}
          </div>

          <span className="dp-sub-lbl">Forma kouzla</span>
          <div className="dp-forma-axes">
            {FORMA_AXES.map((ax) => (
              <div className="dp-forma-axis" key={ax.key}>
                <span className="dp-axk">{ax.label}</span>
                <span className="dp-seg">
                  {ax.options.map((o) => (
                    <button
                      type="button"
                      key={o}
                      className={row[`f_${ax.key}`] === o ? 'is-on' : undefined}
                      disabled={disabled}
                      onClick={() => onPatch({ [`f_${ax.key}`]: o })}
                    >
                      {o}
                    </button>
                  ))}
                </span>
              </div>
            ))}
          </div>

          <span className="dp-sub-lbl">Parametry — Základ · Krok · za Náročnost</span>
          <table className="dp-tbl">
            <thead>
              <tr>
                <th>Parametr</th>
                <th className="dp-num">Základ</th>
                <th className="dp-num">Krok</th>
                <th className="dp-num">/ Nár</th>
                {!disabled && <th />}
              </tr>
            </thead>
            <tbody>
              {params.map((p, j) => (
                <tr key={j}>
                  {[0, 1, 2, 3].map((col) => (
                    <td key={col}>
                      <input
                        className={col === 0 ? undefined : 'dp-num'}
                        value={String(p[col] ?? '')}
                        disabled={disabled}
                        placeholder={col === 0 ? 'Parametr' : '+0'}
                        onChange={(e) =>
                          setA(
                            'params',
                            params.map((x, k) =>
                              k === j ? Object.assign([...x], { [col]: e.target.value }) : x,
                            ),
                          )
                        }
                      />
                    </td>
                  ))}
                  {!disabled && (
                    <td>
                      <button
                        type="button"
                        className="dp-del"
                        aria-label="Smazat parametr"
                        onClick={() => setA('params', params.filter((_, k) => k !== j))}
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
              className="dp-addrow dp-mini-add"
              onClick={() => setA('params', [...params, ['', '', '', '']])}
            >
              + Parametr
            </button>
          )}

          <span className="dp-sub-lbl">Rysy (volitelné)</span>
          <table className="dp-tbl">
            <tbody>
              {rysy.map((r, j) => (
                <tr key={j}>
                  <td>
                    <input
                      value={r}
                      disabled={disabled}
                      placeholder="Rys (např. Jednosměrná)"
                      onChange={(e) =>
                        setA('rysy', rysy.map((x, k) => (k === j ? e.target.value : x)))
                      }
                    />
                  </td>
                  {!disabled && (
                    <td>
                      <button
                        type="button"
                        className="dp-del"
                        aria-label="Smazat rys"
                        onClick={() => setA('rysy', rysy.filter((_, k) => k !== j))}
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
              className="dp-addrow dp-mini-add"
              onClick={() => setA('rysy', [...rysy, ''])}
            >
              + Rys
            </button>
          )}

          <span className="dp-sub-lbl">Modifikátory (vkládáš vlastní — žádný předvyplněný seznam)</span>
          <table className="dp-tbl dp-mods">
            <thead>
              <tr>
                <th>Modifikátor</th>
                <th>Profil</th>
                <th className="dp-num">Nár</th>
                <th className="dp-num">Nákl</th>
                <th className="dp-num">Vyv</th>
                <th>Nastavení / pozn.</th>
                {!disabled && <th />}
              </tr>
            </thead>
            <tbody>
              {mods.map((m, j) => {
                const patch = (col: number, val: string) =>
                  setA('mods', mods.map((x, k) => (k === j ? Object.assign([...x], { [col]: val }) : x)));
                return (
                  <tr key={j}>
                    <td>
                      <input value={String(m[0] ?? '')} disabled={disabled} placeholder="Modifikátor" onChange={(e) => patch(0, e.target.value)} />
                    </td>
                    <td>
                      <span className="dp-prof-chip">
                        <input value={String(m[1] ?? '')} disabled={disabled} placeholder="Profil" onChange={(e) => patch(1, e.target.value)} />
                        <button type="button" className="dp-gender" disabled={disabled} onClick={() => patch(2, m[2] === '♀' ? '♂' : '♀')}>
                          {String(m[2] ?? '♂')}
                        </button>
                      </span>
                    </td>
                    <td><input className="dp-num" value={String(m[3] ?? '')} disabled={disabled} placeholder="+0" onChange={(e) => patch(3, e.target.value)} /></td>
                    <td><input className="dp-num" value={String(m[4] ?? '')} disabled={disabled} placeholder="±0" onChange={(e) => patch(4, e.target.value)} /></td>
                    <td><input className="dp-num" value={String(m[5] ?? '')} disabled={disabled} placeholder="+0" onChange={(e) => patch(5, e.target.value)} /></td>
                    <td><input value={String(m[6] ?? '')} disabled={disabled} placeholder="Poloměr +4 …" onChange={(e) => patch(6, e.target.value)} /></td>
                    {!disabled && (
                      <td>
                        <button type="button" className="dp-del" aria-label="Smazat modifikátor" onClick={() => setA('mods', mods.filter((_, k) => k !== j))}>✕</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!disabled && (
            <button type="button" className="dp-addrow dp-mini-add" onClick={() => setA('mods', [...mods, ['', '', '♂', '', '', '', '']])}>
              + Modifikátor
            </button>
          )}

          <div className="dp-card-sum">
            Celkem s modifikátory — Náročnost <b>{fmt(nar)}</b> · Náklonnost <b>{fmt(nakl)}</b> · Vyvolání <b>{fmt(vyv)}</b>
          </div>
          <textarea
            className="dp-spell-popis"
            value={String(row.popis ?? '')}
            disabled={disabled}
            placeholder="Popis formule / projevu kouzla…"
            onChange={(e) => onPatch({ popis: e.target.value })}
          />
        </>
      )}
    </div>
  );
}

export function FormuleList({ cda, disabled }: { cda: CdAccess; disabled?: boolean }) {
  const rows = cda.parseJsonArr<Row>('formule');
  return (
    <div>
      {rows.map((row, i) => (
        <FormuleCard
          key={i}
          row={row}
          disabled={disabled}
          onPatch={(p) => cda.updateArr('formule', i, p)}
          onDel={() => cda.removeArr('formule', i)}
        />
      ))}
      {!disabled && (
        <button type="button" className="dp-addrow" onClick={() => cda.addArr('formule', { name: '' })}>
          + Nová formule
        </button>
      )}
    </div>
  );
}

/* ════════════════ DÉMONI (theurg) ════════════════ */
function DemonCard({
  row,
  onPatch,
  onDel,
  disabled,
}: {
  row: Row;
  onPatch: (p: Row) => void;
  onDel: () => void;
  disabled?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const druh = String(row.druh ?? 'Nižší');
  const params = arr(row.params).length ? arr(row.params) : [['Výdrž', '', '', '']];
  const rysy = arr(row.rysy).length ? arr(row.rysy) : [['', '', '']];
  const setA = (key: string, a: unknown) => onPatch({ [key]: a });

  return (
    <div className={'dp-card' + (collapsed ? ' is-collapsed' : '')}>
      <div className="dp-card-head" onClick={() => setCollapsed((c) => !c)}>
        <button type="button" className="dp-toggle" aria-label="Sbalit / rozbalit">
          {collapsed ? '▸' : '▾'}
        </button>
        <input
          className="dp-card-name"
          value={String(row.name ?? '')}
          disabled={disabled}
          placeholder="Jméno démona"
          aria-label="Jméno démona"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
        <span className="dp-seg" onClick={(e) => e.stopPropagation()}>
          {DEMON_KINDS.map((o) => (
            <button
              type="button"
              key={o}
              className={druh === o ? 'is-on' : undefined}
              disabled={disabled}
              onClick={() => onPatch({ druh: o })}
            >
              {o}
            </button>
          ))}
        </span>
        {!disabled && (
          <button
            type="button"
            className="dp-del"
            onClick={(e) => {
              e.stopPropagation();
              onDel();
            }}
            aria-label="Smazat démona"
          >
            ✕
          </button>
        )}
      </div>
      {!collapsed && (
        <>
          <div className="dp-card-base">
            {([
              ['sfera', 'Sféra'],
              ['vyvolani', 'Vyvolání'],
              ['narocnost', 'Náročnost'],
              ['naklonnost', 'Náklonnost'],
              ['telo', 'Tělo'],
            ] as [string, string][]).map(([k, l]) => (
              <div className="dp-sp" key={k}>
                <span className="dp-k">{l}</span>
                <input
                  value={String(row[k] ?? '')}
                  disabled={disabled}
                  aria-label={l}
                  placeholder={k === 'telo' ? 'předmět / vlastní' : ''}
                  onChange={(e) => onPatch({ [k]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <span className="dp-sub-lbl">Parametry — Základ · Krok · za Náročnost</span>
          <table className="dp-tbl">
            <thead>
              <tr>
                <th>Parametr</th>
                <th className="dp-num">Základ</th>
                <th className="dp-num">Krok</th>
                <th className="dp-num">/ Nár</th>
                {!disabled && <th />}
              </tr>
            </thead>
            <tbody>
              {params.map((p, j) => (
                <tr key={j}>
                  {[0, 1, 2, 3].map((col) => (
                    <td key={col}>
                      <input
                        className={col === 0 ? undefined : 'dp-num'}
                        value={String(p[col] ?? '')}
                        disabled={disabled}
                        placeholder={col === 0 ? 'Parametr' : '+0'}
                        onChange={(e) =>
                          setA('params', params.map((x, k) => (k === j ? Object.assign([...x], { [col]: e.target.value }) : x)))
                        }
                      />
                    </td>
                  ))}
                  {!disabled && (
                    <td>
                      <button type="button" className="dp-del" aria-label="Smazat parametr" onClick={() => setA('params', params.filter((_, k) => k !== j))}>✕</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!disabled && (
            <button type="button" className="dp-addrow dp-mini-add" onClick={() => setA('params', [...params, ['', '', '', '']])}>
              + Parametr
            </button>
          )}

          <span className="dp-sub-lbl">Rysy démona — Sféra · Náklonnost (ne Náročnost)</span>
          <table className="dp-tbl">
            <thead>
              <tr>
                <th>Rys</th>
                <th className="dp-num">Sféra</th>
                <th className="dp-num">Náklonnost</th>
                {!disabled && <th />}
              </tr>
            </thead>
            <tbody>
              {rysy.map((r, j) => {
                const patch = (col: number, val: string) =>
                  setA('rysy', rysy.map((x, k) => (k === j ? Object.assign([...x], { [col]: val }) : x)));
                return (
                  <tr key={j}>
                    <td><input value={String(r[0] ?? '')} disabled={disabled} placeholder="Rys (např. Neomezená výdrž)" onChange={(e) => patch(0, e.target.value)} /></td>
                    <td><input className="dp-num" value={String(r[1] ?? '')} disabled={disabled} placeholder="+0" onChange={(e) => patch(1, e.target.value)} /></td>
                    <td><input className="dp-num" value={String(r[2] ?? '')} disabled={disabled} placeholder="±0" onChange={(e) => patch(2, e.target.value)} /></td>
                    {!disabled && (
                      <td>
                        <button type="button" className="dp-del" aria-label="Smazat rys" onClick={() => setA('rysy', rysy.filter((_, k) => k !== j))}>✕</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!disabled && (
            <button type="button" className="dp-addrow dp-mini-add" onClick={() => setA('rysy', [...rysy, ['', '', '']])}>
              + Rys
            </button>
          )}

          <textarea
            className="dp-spell-popis"
            value={String(row.popis ?? '')}
            disabled={disabled}
            placeholder="Funkce démona, podmínky odchodu, popis…"
            onChange={(e) => onPatch({ popis: e.target.value })}
          />
        </>
      )}
    </div>
  );
}

export function DemonList({ cda, disabled }: { cda: CdAccess; disabled?: boolean }) {
  const rows = cda.parseJsonArr<Row>('demoni');
  return (
    <div>
      {rows.map((row, i) => (
        <DemonCard
          key={i}
          row={row}
          disabled={disabled}
          onPatch={(p) => cda.updateArr('demoni', i, p)}
          onDel={() => cda.removeArr('demoni', i)}
        />
      ))}
      {!disabled && (
        <button type="button" className="dp-addrow" onClick={() => cda.addArr('demoni', { name: '', druh: 'Nižší' })}>
          + Nový démon
        </button>
      )}
    </div>
  );
}
