/**
 * 16.2d — proměnlivá sekce Profese: 6 povolání DrD+.
 * Vybírá se erbem (DrdPlusSheet). Každá sekce čte/zapisuje přes cda.
 */
import type { CSSProperties } from 'react';
import type { CdAccess } from '../../_shared/cdAccess';
import { Scale, Tri, SignedScale, PrincipHex, JsonTable } from './DrdPlusShared';
import { SpellList, FormuleList, DemonList } from './DrdPlusCards';
import {
  WARRIOR_ARCHETYPES,
  WIZARD_PROJEVY,
  PRIEST_BASIC_ABILITIES,
} from './constants';

type Row = Record<string, unknown>;
interface SecProps {
  cda: CdAccess;
  disabled?: boolean;
}

/** Stupnice napojená přímo na cda klíč (číslo). */
function CdaScale({
  cda,
  k,
  max,
  label,
  box,
  disabled,
}: SecProps & { k: string; max: number; label: string; box?: boolean }) {
  return (
    <Scale
      label={label}
      max={max}
      box={box}
      value={parseInt(cda.g(k, '0'), 10) || 0}
      disabled={disabled}
      onChange={(n) => cda.set(k, n)}
    />
  );
}

/** Malé stat-políčko (statrow). */
function Stat({ cda, k, label, disabled }: SecProps & { k: string; label: string }) {
  return (
    <div className="dp-stat">
      <span className="dp-k">{label}</span>
      <input
        className="dp-v"
        value={cda.g(k)}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => cda.set(k, e.target.value)}
      />
    </div>
  );
}

/* ════════════ BOJOVNÍK ════════════ */
export function WarriorSection({ cda, disabled }: SecProps) {
  return (
    <div className="dp-grid dp-g3">
      <div className="dp-panel">
        <h3>Archetyp</h3>
        <p className="dp-hint">Stupeň zvládnutí (1–10).</p>
        {WARRIOR_ARCHETYPES.map((a) => (
          <CdaScale key={a} cda={cda} k={`w_arc_${a}`} max={10} label={a} disabled={disabled} />
        ))}
      </div>
      <div className="dp-panel dp-span2">
        <h3>Bojové finty</h3>
        <JsonTable
          cda={cda}
          arrKey="w_finty"
          disabled={disabled}
          addLabel="+ Přidat fintu"
          cols={[
            { key: 'name', label: 'Název' },
            { key: 'weapon', label: 'Zbraň' },
            { key: 'prevaha', label: 'Převaha' },
            { key: 'note', label: 'Poznámka' },
          ]}
        />
        <h4>Bojové schopnosti</h4>
        <JsonTable
          cda={cda}
          arrKey="w_schopnosti"
          disabled={disabled}
          addLabel="+ Přidat schopnost"
          cols={[
            { key: 'name', label: 'Schopnost' },
            { key: 'stupen', label: 'Stupeň (1–3)', type: 'tri' },
            { key: 'note', label: 'Poznámka' },
          ]}
        />
      </div>
    </div>
  );
}

/* ════════════ ČARODĚJ ════════════ */
export function WizardSection({ cda, disabled }: SecProps) {
  return (
    <div className="dp-grid dp-g2">
      <div className="dp-panel">
        <h3>Magenergie</h3>
        <div className="dp-statrow">
          <Stat cda={cda} k="wiz_kapacita" label="Kapacita" disabled={disabled} />
          <Stat cda={cda} k="wiz_aktualni" label="Aktuální" disabled={disabled} />
          <Stat cda={cda} k="wiz_kvalita" label="Kvalita" disabled={disabled} />
        </div>
        <h4>Pomocníček</h4>
        <div className="dp-statrow">
          {[
            ['wiz_pom_sil', 'Síl'],
            ['wiz_pom_obr', 'Obr'],
            ['wiz_pom_zrc', 'Zrč'],
            ['wiz_pom_int', 'Int'],
            ['wiz_pom_vul', 'Vůle'],
            ['wiz_pom_chr', 'Chr'],
            ['wiz_pom_ur', 'Úr.'],
            ['wiz_pom_zr', 'Zr.'],
          ].map(([k, l]) => (
            <Stat key={k} cda={cda} k={k} label={l} disabled={disabled} />
          ))}
        </div>
      </div>
      <div className="dp-panel">
        <h3>Obory</h3>
        <p className="dp-hint">Zvládnutí sfér magie (1–10).</p>
        {WIZARD_PROJEVY.map((p) => (
          <CdaScale key={p} cda={cda} k={`wiz_proj_${p}`} max={10} label={p} disabled={disabled} />
        ))}
      </div>
      <div className="dp-panel dp-span2">
        <h3>Kouzla</h3>
        <p className="dp-hint">✦ přímá magie · ✧ nepřímá · v magenergii je v závorce sféra.</p>
        <div className="dp-statrow" style={{ maxWidth: 440, marginBottom: 14 }}>
          <Stat cda={cda} k="wiz_postih" label="Postih k hodu" disabled={disabled} />
          <Stat cda={cda} k="wiz_pocet" label="Počet kouzel" disabled={disabled} />
          <Stat cda={cda} k="wiz_max" label="Max kouzel" disabled={disabled} />
        </div>
        <SpellList cda={cda} disabled={disabled} />
      </div>
    </div>
  );
}

/* ════════════ HRANIČÁŘ ════════════ */
function RangerZamereni({ cda, disabled }: SecProps) {
  const rows = cda.parseJsonArr<Row>('ran_zam');
  const inp: CSSProperties = {
    border: 0,
    borderBottom: '1px solid var(--dp-line-soft)',
    background: 'rgba(255,252,244,.5)',
    fontFamily: 'inherit',
    fontSize: 14,
    color: 'var(--dp-ink)',
    padding: 5,
  };
  return (
    <div>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr 1.3fr 1fr 1fr auto',
            gap: 10,
            alignItems: 'center',
            marginBottom: 8,
            paddingBottom: 8,
            borderBottom: '1px solid var(--dp-line-soft)',
          }}
        >
          <input
            value={String(row.name ?? '')}
            placeholder="Zaměření"
            disabled={disabled}
            style={inp}
            onChange={(e) => cda.updateArr('ran_zam', i, { name: e.target.value })}
          />
          <input
            value={String(row.mech ?? '')}
            placeholder="Mechanismus"
            disabled={disabled}
            style={inp}
            onChange={(e) => cda.updateArr('ran_zam', i, { mech: e.target.value })}
          />
          <Scale
            label="Znalost"
            max={5}
            box
            value={Number(row.znalost) || 0}
            disabled={disabled}
            onChange={(n) => cda.updateArr('ran_zam', i, { znalost: n })}
          />
          <Scale
            label="Praxe"
            max={5}
            box
            value={Number(row.praxe) || 0}
            disabled={disabled}
            onChange={(n) => cda.updateArr('ran_zam', i, { praxe: n })}
          />
          {!disabled && (
            <button type="button" className="dp-del" aria-label="Smazat zaměstnání" onClick={() => cda.removeArr('ran_zam', i)}>
              ✕
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          className="dp-addrow"
          onClick={() => cda.addArr('ran_zam', { name: '', mech: '', znalost: 0, praxe: 0 })}
        >
          + Přidat zaměření
        </button>
      )}
    </div>
  );
}

export function RangerSection({ cda, disabled }: SecProps) {
  return (
    <div className="dp-grid dp-g2">
      <div className="dp-panel dp-span2">
        <h3>Zaměření</h3>
        <p className="dp-hint">Znalost a praxe zvlášť (1–5).</p>
        <RangerZamereni cda={cda} disabled={disabled} />
      </div>
      <div className="dp-panel">
        <h3>Totem</h3>
        <div className="dp-field">
          <label>Zvíře totemu</label>
          <input value={cda.g('ran_totem')} disabled={disabled} onChange={(e) => cda.set('ran_totem', e.target.value)} />
        </div>
        <div className="dp-field">
          <label>Mechanismy</label>
          <textarea rows={2} value={cda.g('ran_totem_mech')} disabled={disabled} onChange={(e) => cda.set('ran_totem_mech', e.target.value)} />
        </div>
        <h4>Amulety, bylinky, lékárnička</h4>
        <JsonTable
          cda={cda}
          arrKey="ran_amulety"
          disabled={disabled}
          addLabel="+ Přidat"
          cols={[
            { key: 'name', label: 'Položka' },
            { key: 'vydrz', label: 'Výdrž' },
            { key: 'pocet', label: 'Počet', type: 'num' },
          ]}
        />
      </div>
      <div className="dp-panel">
        <h3>Zvířecí společníci</h3>
        <JsonTable
          cda={cda}
          arrKey="ran_zvirata"
          disabled={disabled}
          addLabel="+ Přidat společníka"
          cols={[
            { key: 'jmeno', label: 'Jméno' },
            { key: 'bc', label: 'BČ', type: 'num' },
            { key: 'uc', label: 'ÚČ', type: 'num' },
            { key: 'oc', label: 'OČ', type: 'num' },
            { key: 'mez', label: 'Mez', type: 'num' },
            { key: 'zr', label: 'Zr.', type: 'num' },
          ]}
        />
      </div>
    </div>
  );
}

/* ════════════ KNĚZ ════════════ */
export function PriestSection({ cda, disabled }: SecProps) {
  return (
    <div className="dp-grid dp-g3">
      <div className="dp-panel dp-span2">
        <h3>Princip</h3>
        <p className="dp-hint">Rozděl 1–6 bodů mezi principy — na jednom můžeš mít 1, klidně i všech 6.</p>
        <PrincipHex cda={cda} disabled={disabled} />
        <h4>Aspekt</h4>
        <div className="dp-statrow" style={{ maxWidth: 360 }}>
          <Stat cda={cda} k="pri_silaas" label="Síla asp." disabled={disabled} />
          <Stat cda={cda} k="pri_neovliv" label="Neovliv." disabled={disabled} />
          <Stat cda={cda} k="pri_vliv" label="Vliv" disabled={disabled} />
        </div>
      </div>
      <div className="dp-panel">
        <h3>Základní schopnosti</h3>
        <p className="dp-hint">Stupeň (1–10).</p>
        {PRIEST_BASIC_ABILITIES.map((s) => (
          <CdaScale key={s} cda={cda} k={`pri_zakl_${s}`} max={10} label={s} disabled={disabled} />
        ))}
        <h4>Vliv</h4>
        <JsonTable
          cda={cda}
          arrKey="pri_vlivosoby"
          disabled={disabled}
          addLabel="+ Přidat osobu"
          cols={[
            { key: 'osoba', label: 'Osoba' },
            { key: 'body', label: 'Body vlivu', type: 'num' },
          ]}
        />
      </div>
      <div className="dp-panel dp-span3">
        <h3>Zázračné schopnosti</h3>
        <JsonTable
          cda={cda}
          arrKey="pri_zazraky"
          disabled={disabled}
          addLabel="+ Nový zázrak"
          cols={[
            { key: 'name', label: 'Schopnost' },
            { key: 'stupen', label: 'Stupeň (1–3)', type: 'tri' },
            { key: 'hloubka', label: 'Hloubka (1–3)', type: 'tri' },
            { key: 'note', label: 'Poznámky' },
          ]}
        />
      </div>
    </div>
  );
}

/* ════════════ THEURG ════════════ */
export function TheurgSection({ cda, disabled }: SecProps) {
  return (
    <div className="dp-grid dp-g3">
      <div className="dp-panel dp-span3">
        <h3>Nakloněnost</h3>
        <p className="dp-hint">
          0 a doprava = přízeň · vlevo záporné = nepřízeň · rozsah nastavitelný · Životní jen kladné.
        </p>
        <SignedScale cda={cda} kVal="nakl_denni" kMax="nakl_denni_max" label="Denní" defMax={10} negMax={7} disabled={disabled} />
        <SignedScale cda={cda} kVal="nakl_mesicni" kMax="nakl_mesicni_max" label="Měsíční" defMax={10} negMax={7} disabled={disabled} />
        <SignedScale cda={cda} kVal="nakl_rocni" kMax="nakl_rocni_max" label="Roční" defMax={10} negMax={7} disabled={disabled} />
        <SignedScale cda={cda} kVal="nakl_zivotni" kMax="nakl_zivotni_max" label="Životní" defMax={21} negMax={0} disabled={disabled} />
      </div>
      <div className="dp-panel dp-span3">
        <h3>Theurgické schopnosti</h3>
        <JsonTable
          cda={cda}
          arrKey="the_schopnosti"
          disabled={disabled}
          addLabel="+ Přidat schopnost"
          cols={[
            { key: 'name', label: 'Schopnost' },
            { key: 'znalost', label: 'Znalost', type: 'tri' },
            { key: 'bonus', label: 'Bonusy' },
            { key: 'note', label: 'Poznámky' },
          ]}
        />
      </div>
      <div className="dp-panel dp-span3">
        <h3>Formule</h3>
        <p className="dp-hint">
          Zápis dle Grimoáru — z formule se sesílá kouzlo. Profily ♀/♂ určují napojení modifikátorů.
        </p>
        <FormuleList cda={cda} disabled={disabled} />
      </div>
      <div className="dp-panel dp-span3">
        <h3>Démoni</h3>
        <p className="dp-hint">
          Dle Pandemonikonu. Druh = vazbochyt / nižší / vyšší. Rysy démona mění Sféru a Náklonnost (ne Náročnost).
        </p>
        <DemonList cda={cda} disabled={disabled} />
      </div>
      <div className="dp-panel dp-span3">
        <h3>Vazby</h3>
        <p className="dp-hint">Osoba / entita a síla vazby (vazba k démonovi má sílu +3).</p>
        <JsonTable
          cda={cda}
          arrKey="the_vazby"
          disabled={disabled}
          addLabel="+ Vazba"
          cols={[
            { key: 'osoba', label: 'Osoba / entita' },
            { key: 'sila', label: 'Síla vazby', type: 'num' },
          ]}
        />
      </div>
    </div>
  );
}

/* ════════════ ZLODĚJ ════════════ */
function ThiefSchopnosti({ cda, disabled }: SecProps) {
  const rows = cda.parseJsonArr<Row>('thi_schopnosti');
  return (
    <div>
      <table className="dp-tbl">
        <thead>
          <tr>
            <th>Schopnost</th>
            <th>Znalost</th>
            <th className="dp-num">Bonus</th>
            <th>Hod</th>
            <th style={{ width: '42%' }}>Poznámka (efekt dle stupně)</th>
            <th className="dp-num">Mistr</th>
            {!disabled && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const znalost = Number(row.znalost) || 0;
            const master = znalost >= 3;
            return (
              <tr key={i}>
                <td>
                  <input value={String(row.name ?? '')} disabled={disabled} onChange={(e) => cda.updateArr('thi_schopnosti', i, { name: e.target.value })} />
                </td>
                <td>
                  <Tri
                    value={znalost}
                    disabled={disabled}
                    onChange={(n) =>
                      cda.updateArr<Record<string, unknown>>(
                        'thi_schopnosti',
                        i,
                        n < 3 ? { znalost: n, mistr: false } : { znalost: n },
                      )
                    }
                  />
                </td>
                <td>
                  <input className="dp-num" value={String(row.bonus ?? '')} disabled={disabled} onChange={(e) => cda.updateArr('thi_schopnosti', i, { bonus: e.target.value })} />
                </td>
                <td>
                  <input value={String(row.hod ?? '')} disabled={disabled} onChange={(e) => cda.updateArr('thi_schopnosti', i, { hod: e.target.value })} />
                </td>
                <td>
                  <textarea rows={2} value={String(row.note ?? '')} disabled={disabled} onChange={(e) => cda.updateArr('thi_schopnosti', i, { note: e.target.value })} />
                </td>
                <td className="dp-chk">
                  <input
                    type="checkbox"
                    checked={!!row.mistr}
                    disabled={disabled || !master}
                    title={master ? '' : 'Mistr lze zaškrtnout až při 3. stupni znalosti'}
                    onChange={(e) => cda.updateArr('thi_schopnosti', i, { mistr: e.target.checked })}
                  />
                </td>
                {!disabled && (
                  <td>
                    <button type="button" className="dp-del" aria-label="Smazat schopnost" onClick={() => cda.removeArr('thi_schopnosti', i)}>✕</button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {!disabled && (
        <button
          type="button"
          className="dp-addrow"
          onClick={() => cda.addArr('thi_schopnosti', { name: '', znalost: 0, bonus: '', hod: '', note: '', mistr: false })}
        >
          + Přidat schopnost
        </button>
      )}
    </div>
  );
}

export function ThiefSection({ cda, disabled }: SecProps) {
  return (
    <div className="dp-grid dp-g3">
      <div className="dp-panel dp-span2">
        <h3>Schopnosti</h3>
        <ThiefSchopnosti cda={cda} disabled={disabled} />
      </div>
      <div className="dp-panel">
        <h3>Zlodějské pomůcky</h3>
        <JsonTable
          cda={cda}
          arrKey="thi_pomucky"
          disabled={disabled}
          addLabel="+ Přidat pomůcku"
          cols={[
            { key: 'name', label: 'Pomůcka' },
            { key: 'bonus', label: 'Bonus', type: 'num' },
          ]}
        />
        <h4>Finty</h4>
        <JsonTable
          cda={cda}
          arrKey="thi_finty"
          disabled={disabled}
          addLabel="+ Přidat fintu"
          cols={[
            { key: 'name', label: 'Název' },
            { key: 'weapon', label: 'Zbraň' },
            { key: 'prevaha', label: 'Převaha' },
            { key: 'note', label: 'Poznámka' },
          ]}
        />
      </div>
    </div>
  );
}
