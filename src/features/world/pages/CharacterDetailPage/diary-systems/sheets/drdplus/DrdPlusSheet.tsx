/**
 * 8.7f — Dračí doupě Plus (DrdPlus) deník postavy.
 *
 * Adaptováno z `c:/Matrix/Matrix/frontend/src/components/diary/DrdPlusCharacterSheet.tsx`
 * (526 ř). 4 taby (Postava / Boj / Cesty / Profese) — poslední tab je
 * dynamický dle `drdp_profession` (6 inline rendererů).
 */
import { useState } from 'react';
import { usePrintMode } from '@/features/world/export/print';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  DRDPLUS_DERIVED,
  DRDPLUS_PROFESSIONS,
  DRDPLUS_STATS,
  DRDPLUS_TABS,
  PRIEST_BASIC_ABILITIES,
  THEURG_INCLINATIONS,
  WARRIOR_ARCHETYPES,
  type DrdPlusProfessionId,
  type DrdPlusTab,
} from './constants';
import { SheetInitiativeButton } from '../../_shared/SheetInitiativeButton';

export function DrdPlusSheet({ diary, mode, onChange, onRoll }: SystemSheetProps) {
  const disabled = mode === 'view';
  const printMode = usePrintMode();
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'drdp_', onChange);
  const { g, set } = cda;

  const [tab, setTab] = useState<DrdPlusTab>('postava');
  const prof = (g('profession') || 'bojovnik') as DrdPlusProfessionId;

  // Tisk: sheet má 4 taby (jen aktivní je v DOM) + inputy v tabulkách —
  // netisknutelné. V printMode renderujeme oddělený statický dokument se
  // VŠEMI taby pod sebou (čte stejná `drdp_*` data).
  if (printMode) return <DrdPlusPrintView cda={cda} prof={prof} />;

  return (
    <div className="drdplus-dashboard">
      {onRoll && <SheetInitiativeButton onRoll={onRoll} kind="d20" />}
      {/* ═══ GLOBAL HEADER ═══ */}
      <div className="drdp-header">
        <div className="identity-block">
          <label htmlFor="drdp_name">Jméno</label>
          <input
            id="drdp_name"
            value={g('name')}
            disabled={disabled}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Zadej jméno..."
          />
        </div>
        <div
          className="identity-block"
          style={{ minWidth: 120, flex: '0.5' }}
        >
          <label htmlFor="drdp_race">Rasa</label>
          <input
            id="drdp_race"
            value={g('race')}
            disabled={disabled}
            onChange={(e) => set('race', e.target.value)}
          />
        </div>
        <div
          className="identity-block"
          style={{ minWidth: 80, flex: '0.3' }}
        >
          <label htmlFor="drdp_age">Věk</label>
          <input
            id="drdp_age"
            value={g('age')}
            disabled={disabled}
            onChange={(e) => set('age', e.target.value)}
          />
        </div>
        <div
          className="identity-block"
          style={{ minWidth: 120, flex: '0.5' }}
        >
          <label htmlFor="drdp_profession">Povolání</label>
          <select
            id="drdp_profession"
            value={prof}
            disabled={disabled}
            onChange={(e) => set('profession', e.target.value)}
            className="active-prof"
          >
            {DRDPLUS_PROFESSIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="drdp-tabs">
        {DRDPLUS_TABS.map((t) => (
          <button
            type="button"
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ POSTAVA ═══ */}
      {tab === 'postava' && (
        <PostavaTab cda={cda} disabled={disabled} />
      )}

      {/* ═══ BOJ ═══ */}
      {tab === 'boj' && <BojTab cda={cda} disabled={disabled} />}

      {/* ═══ CESTY ═══ */}
      {tab === 'cesty' && <CestyTab cda={cda} disabled={disabled} />}

      {/* ═══ PROFESE (dynamic) ═══ */}
      {tab === 'profese' && (
        <div style={{ marginBottom: 40 }}>
          {prof === 'bojovnik' && (
            <WarriorTab cda={cda} disabled={disabled} />
          )}
          {prof === 'carodej' && (
            <WizardTab cda={cda} disabled={disabled} />
          )}
          {prof === 'hranicar' && (
            <RangerTab cda={cda} disabled={disabled} />
          )}
          {prof === 'knez' && <PriestTab cda={cda} disabled={disabled} />}
          {prof === 'theurg' && (
            <TheurgTab cda={cda} disabled={disabled} />
          )}
          {prof === 'zlodej' && <ThiefTab cda={cda} disabled={disabled} />}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab: Postava
// ════════════════════════════════════════════════════════════════

interface TabProps {
  cda: CdAccess;
  disabled: boolean;
}

function PostavaTab({ cda, disabled }: TabProps) {
  const { g, set } = cda;
  return (
    <div className="drdp-tab-content drdp-grid">
      <div className="drdp-panel" style={{ gridColumn: '1 / -1' }}>
        <h3>Hlavní Vlastnosti</h3>
        <div
          className="stats-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}
        >
          {DRDPLUS_STATS.map((stat) => (
            <div className="stat-box" key={stat}>
              <label htmlFor={`drdp_stat_${stat}`}>{stat}</label>
              <input
                id={`drdp_stat_${stat}`}
                value={g(`stat_${stat}`)}
                disabled={disabled}
                onChange={(e) => set(`stat_${stat}`, e.target.value)}
              />
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 24 }}>Odvozené Vlastnosti</h3>
        <div
          className="stats-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}
        >
          {DRDPLUS_DERIVED.map((stat) => (
            <div className="stat-box" key={stat}>
              <label htmlFor={`drdp_odv_${stat}`}>{stat}</label>
              <input
                id={`drdp_odv_${stat}`}
                value={g(`odv_${stat}`)}
                disabled={disabled}
                onChange={(e) => set(`odv_${stat}`, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="drdp-panel" style={{ gridColumn: 'span 2' }}>
        <h3>Popis Postavy</h3>
        <textarea
          className="drdp-textarea"
          value={g('postava_popis')}
          disabled={disabled}
          onChange={(e) => set('postava_popis', e.target.value)}
          placeholder="Jak postava vypadá, pocity, historie..."
          aria-label="Popis postavy"
        />
      </div>
      <div className="drdp-panel">
        <h3>Úroveň &amp; Cesta</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <label htmlFor="drdp_uroven">Úroveň</label>
            <input
              id="drdp_uroven"
              value={g('uroven')}
              disabled={disabled}
              onChange={(e) => set('uroven', e.target.value)}
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drdp_xp">Zkušenosti</label>
            <input
              id="drdp_xp"
              value={g('xp')}
              disabled={disabled}
              onChange={(e) => set('xp', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab: Boj
// ════════════════════════════════════════════════════════════════

function BojTab({ cda, disabled }: TabProps) {
  const { g, set } = cda;
  return (
    <div className="drdp-tab-content">
      <div className="combat-top-grid">
        <div
          className="combat-card"
          style={{ border: '1px solid rgba(255,200,100,0.3)' }}
        >
          <h4>Boj</h4>
          <input
            value={g('boj_b')}
            disabled={disabled}
            onChange={(e) => set('boj_b', e.target.value)}
            aria-label="Boj"
          />
        </div>
        <div className="combat-card">
          <h4>Útok</h4>
          <input
            value={g('boj_u')}
            disabled={disabled}
            onChange={(e) => set('boj_u', e.target.value)}
            aria-label="Útok"
          />
        </div>
        <div className="combat-card">
          <h4>Střelba</h4>
          <input
            value={g('boj_s')}
            disabled={disabled}
            onChange={(e) => set('boj_s', e.target.value)}
            aria-label="Střelba"
          />
        </div>
        <div
          className="combat-card"
          style={{ border: '1px solid rgba(100,255,100,0.3)' }}
        >
          <h4>Obrana</h4>
          <input
            value={g('boj_o')}
            disabled={disabled}
            onChange={(e) => set('boj_o', e.target.value)}
            aria-label="Obrana"
          />
        </div>
      </div>

      <div className="drdp-grid">
        <div className="drdp-panel" style={{ gridColumn: 'span 2' }}>
          <h3>Kombinace Zbraní</h3>
          <JsonTable
            cda={cda}
            disabled={disabled}
            arrKey="zbrane"
            cols={[
              ['zbran', 'Kombinace / Zbraně'],
              ['bc', 'BČ'],
              ['uc', 'ÚČ / ZZ'],
              ['oc', 'OČ (Kryt)'],
            ]}
            addLabel="+ Přidat kombinaci"
          />
        </div>

        <div className="drdp-panel">
          <h3>Tracker Zranění</h3>
          <div className="stats-grid">
            <div className="stat-box">
              <label htmlFor="drdp_zraneni_hlavni">Hlavní zranění</label>
              <input
                id="drdp_zraneni_hlavni"
                style={{ color: '#ff6b6b' }}
                value={g('zraneni_hlavni')}
                disabled={disabled}
                onChange={(e) => set('zraneni_hlavni', e.target.value)}
              />
            </div>
            <div className="stat-box">
              <label htmlFor="drdp_zraneni_mez">Mez zranění</label>
              <input
                id="drdp_zraneni_mez"
                value={g('zraneni_mez')}
                disabled={disabled}
                onChange={(e) => set('zraneni_mez', e.target.value)}
              />
            </div>
            <div className="stat-box" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="drdp_zraneni_postih">Postih ze zranění</label>
              <input
                id="drdp_zraneni_postih"
                value={g('zraneni_postih')}
                disabled={disabled}
                onChange={(e) => set('zraneni_postih', e.target.value)}
              />
            </div>
          </div>
          <textarea
            className="drdp-textarea"
            style={{ marginTop: 16, minHeight: 60 }}
            value={g('zraneni_n')}
            disabled={disabled}
            onChange={(e) => set('zraneni_n', e.target.value)}
            placeholder="Následky, smrt, velká zranění..."
            aria-label="Následky zranění"
          />
        </div>

        <div className="drdp-panel" style={{ gridColumn: 'span 3' }}>
          <h3>Zbroj a Ochrana</h3>
          <JsonTable
            cda={cda}
            disabled={disabled}
            arrKey="zbroje"
            cols={[
              ['typ', 'Typ Zbroje'],
              ['kvalita', 'Kvalita'],
              ['zbrojhn', 'Zbroj H / N'],
              ['ochrana', 'Ochrana H / T / N'],
            ]}
            addLabel="+ Přidat zbroj"
          />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab: Cesty
// ════════════════════════════════════════════════════════════════

function CestyTab({ cda, disabled }: TabProps) {
  const { g, set } = cda;
  return (
    <div className="drdp-tab-content drdp-grid">
      <div className="drdp-panel">
        <h3>Pohyb &amp; Rychlost</h3>
        <div className="stats-grid">
          <div className="stat-box" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="drdp_rychlost_base">Pohybová rychlost</label>
            <input
              id="drdp_rychlost_base"
              value={g('rychlost_base')}
              disabled={disabled}
              onChange={(e) => set('rychlost_base', e.target.value)}
            />
          </div>
          {[
            ['chuze', 'Chůze'],
            ['spech', 'Spěch'],
            ['beh', 'Běh'],
            ['sprint', 'Sprint'],
          ].map(([key, label]) => (
            <div className="stat-box" key={key}>
              <label htmlFor={`drdp_spd_${key}`}>{label}</label>
              <input
                id={`drdp_spd_${key}`}
                value={g(`spd_${key}`)}
                disabled={disabled}
                onChange={(e) => set(`spd_${key}`, e.target.value)}
              />
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 24 }}>Tracker Únavy</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <label htmlFor="drdp_unava_val">Únava / Body</label>
            <input
              id="drdp_unava_val"
              style={{ color: '#7289da' }}
              value={g('unava_val')}
              disabled={disabled}
              onChange={(e) => set('unava_val', e.target.value)}
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drdp_unava_mez">Mez Únavy</label>
            <input
              id="drdp_unava_mez"
              value={g('unava_mez')}
              disabled={disabled}
              onChange={(e) => set('unava_mez', e.target.value)}
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drdp_unava_postih">Postih z únavy</label>
            <input
              id="drdp_unava_postih"
              value={g('unava_postih')}
              disabled={disabled}
              onChange={(e) => set('unava_postih', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="drdp-panel" style={{ gridColumn: 'span 2' }}>
        <h3>Dovednosti na cestách</h3>
        <JsonTable
          cda={cda}
          disabled={disabled}
          arrKey="dovednosti"
          cols={[
            ['dovednost', 'Dovednost'],
            ['vlastnost', 'Vlastnost'],
            ['bonus', 'Bonus'],
            ['note', 'Poznámka'],
          ]}
          addLabel="+ Naučit se dovednost"
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Profession tabs (6 inline renderers)
// ════════════════════════════════════════════════════════════════

function WarriorTab({ cda, disabled }: TabProps) {
  const { g, set } = cda;
  return (
    <div className="drdp-tab-content">
      <div className="drdp-grid">
        <div className="drdp-panel">
          <h3>Archetypy</h3>
          <div
            className="stats-grid"
            style={{ gridTemplateColumns: 'repeat(1, 1fr)', gap: 8 }}
          >
            {WARRIOR_ARCHETYPES.map((arc) => (
              <div
                key={arc}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{ color: '#8b949e', fontSize: 12, minWidth: 80 }}
                >
                  {arc}
                </span>
                <input
                  style={{
                    width: 60,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: 4,
                    textAlign: 'center',
                    borderRadius: 4,
                  }}
                  value={g(`w_arc_${arc}`)}
                  disabled={disabled}
                  onChange={(e) => set(`w_arc_${arc}`, e.target.value)}
                  placeholder="1-10"
                  aria-label={`Archetyp ${arc}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="drdp-panel" style={{ gridColumn: 'span 2' }}>
          <h3>Bojové Finty</h3>
          <JsonTable
            cda={cda}
            disabled={disabled}
            arrKey="w_finty"
            cols={[
              ['name', 'Název'],
              ['weapon', 'Zbraň'],
              ['prevaha', 'Převaha'],
              ['note', 'Poznámka'],
            ]}
            addLabel="+ Přidat fintu"
          />
          <h3 style={{ marginTop: 24 }}>Bojové Schopnosti</h3>
          <JsonTable
            cda={cda}
            disabled={disabled}
            arrKey="w_schopnosti"
            cols={[
              ['name', 'Schopnost'],
              ['note', 'Poznámka / Stupeň'],
            ]}
            addLabel="+ Přidat schopnost"
          />
        </div>
      </div>
    </div>
  );
}

function WizardTab({ cda, disabled }: TabProps) {
  const { g, set } = cda;
  return (
    <div className="drdp-tab-content drdp-grid">
      <div className="drdp-panel">
        <h3>Magenergie</h3>
        <div className="stats-grid">
          {[
            ['kapacita', 'Kapacita'],
            ['aktualni', 'Aktuální'],
            ['unava', 'Únava'],
          ].map(([key, label]) => (
            <div className="stat-box" key={key}>
              <label htmlFor={`drdp_wiz_${key}`}>{label}</label>
              <input
                id={`drdp_wiz_${key}`}
                value={g(`wiz_${key}`)}
                disabled={disabled}
                onChange={(e) => set(`wiz_${key}`, e.target.value)}
              />
            </div>
          ))}
        </div>
        <h3 style={{ marginTop: 20 }}>Projevy</h3>
        <textarea
          className="drdp-textarea"
          style={{ minHeight: 80 }}
          value={g('wiz_projevy')}
          disabled={disabled}
          onChange={(e) => set('wiz_projevy', e.target.value)}
          placeholder="Zapište nabyté projevy čaroděje..."
          aria-label="Projevy čaroděje"
        />
      </div>
      <div className="drdp-panel" style={{ gridColumn: 'span 2' }}>
        <h3>Kouzla</h3>
        <JsonTable
          cda={cda}
          disabled={disabled}
          arrKey="wiz_kouzla"
          cols={[
            ['name', 'Kouzlo'],
            ['obor', 'Obor'],
            ['mg', 'Mg'],
            ['note', 'Poznámka'],
          ]}
          addLabel="+ Zapsat kouzlo"
        />
      </div>
    </div>
  );
}

function RangerTab({ cda, disabled }: TabProps) {
  const { g, set } = cda;
  return (
    <div className="drdp-tab-content drdp-grid">
      <div className="drdp-panel" style={{ gridColumn: 'span 2' }}>
        <h3>Zaměření a Mechanismy</h3>
        <JsonTable
          cda={cda}
          disabled={disabled}
          arrKey="ran_zam"
          cols={[
            ['znalost', 'Znalost'],
            ['praxe', 'Praxe'],
            ['name', 'Mechanismus / Název'],
          ]}
          addLabel="+ Další"
        />
      </div>
      <div className="drdp-panel">
        <h3>Totem a Zvířata</h3>
        <input
          className="drdp-textarea"
          style={{ minHeight: 40, marginBottom: 8 }}
          value={g('ran_totem')}
          disabled={disabled}
          onChange={(e) => set('ran_totem', e.target.value)}
          placeholder="Zvíře Totemu..."
          aria-label="Zvíře Totemu"
        />
        <textarea
          className="drdp-textarea"
          value={g('ran_zvirata')}
          disabled={disabled}
          onChange={(e) => set('ran_zvirata', e.target.value)}
          placeholder="Zvířecí společníci, BČ, ÚČ a statistiky..."
          aria-label="Zvířecí společníci"
        />
      </div>
    </div>
  );
}

function PriestTab({ cda, disabled }: TabProps) {
  const { g, set } = cda;
  return (
    <div className="drdp-tab-content drdp-grid">
      <div className="drdp-panel">
        <h3>Principy a Aspekty</h3>
        <div className="stats-grid">
          <div className="stat-box">
            <label htmlFor="drdp_pri_domena">Doména</label>
            <input
              id="drdp_pri_domena"
              value={g('pri_domena')}
              disabled={disabled}
              onChange={(e) => set('pri_domena', e.target.value)}
              placeholder="Život/Smrt"
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drdp_pri_silaas">Síla as.</label>
            <input
              id="drdp_pri_silaas"
              value={g('pri_silaas')}
              disabled={disabled}
              onChange={(e) => set('pri_silaas', e.target.value)}
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drdp_pri_neovliv">Neovliv.</label>
            <input
              id="drdp_pri_neovliv"
              value={g('pri_neovliv')}
              disabled={disabled}
              onChange={(e) => set('pri_neovliv', e.target.value)}
            />
          </div>
        </div>
        <h3 style={{ marginTop: 20 }}>Základní schopnosti</h3>
        <div className="stats-grid">
          {PRIEST_BASIC_ABILITIES.map((s) => (
            <div className="stat-box" key={s}>
              <label htmlFor={`drdp_pri_${s}`}>{s}</label>
              <input
                id={`drdp_pri_${s}`}
                value={g(`pri_${s}`)}
                disabled={disabled}
                onChange={(e) => set(`pri_${s}`, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="drdp-panel" style={{ gridColumn: 'span 2' }}>
        <h3>Zázračné Schopnosti</h3>
        <JsonTable
          cda={cda}
          disabled={disabled}
          arrKey="pri_zazraky"
          cols={[
            ['name', 'Zázrak'],
            ['uroven', 'Úroven I/II/III'],
            ['stupen', 'Stupeň / Hloubka'],
            ['note', 'Poznámka'],
          ]}
          addLabel="+ Nový zázrak"
        />
      </div>
    </div>
  );
}

function TheurgTab({ cda, disabled }: TabProps) {
  const { g, set } = cda;
  return (
    <div className="drdp-tab-content drdp-grid">
      <div className="drdp-panel">
        <h3>Nakloněnost</h3>
        <div className="stats-grid">
          {THEURG_INCLINATIONS.map((s) => (
            <div className="stat-box" key={s}>
              <label htmlFor={`drdp_the_nakl_${s}`}>{s}</label>
              <input
                id={`drdp_the_nakl_${s}`}
                value={g(`the_nakl_${s}`)}
                disabled={disabled}
                onChange={(e) => set(`the_nakl_${s}`, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="drdp-panel" style={{ gridColumn: 'span 2' }}>
        <h3>Vazby, Démoni, Formule</h3>
        <JsonTable
          cda={cda}
          disabled={disabled}
          arrKey="the_vazby"
          cols={[
            ['name', 'Název (Démon / Vazba)'],
            ['type', 'Sféra / Typ'],
            ['detail', 'Detaily'],
          ]}
          addLabel="+ Vytvořit"
        />
      </div>
    </div>
  );
}

function ThiefTab({ cda, disabled }: TabProps) {
  const { g, set } = cda;
  return (
    <div className="drdp-tab-content drdp-grid">
      <div className="drdp-panel">
        <h3>Zlodějský Cech</h3>
        <div className="stats-grid">
          <div className="stat-box" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="drdp_thi_cech">Cech</label>
            <input
              id="drdp_thi_cech"
              value={g('thi_cech')}
              disabled={disabled}
              onChange={(e) => set('thi_cech', e.target.value)}
            />
          </div>
          <div className="stat-box" style={{ gridColumn: 'span 2' }}>
            <label htmlFor="drdp_thi_mentor">Mentor</label>
            <input
              id="drdp_thi_mentor"
              value={g('thi_mentor')}
              disabled={disabled}
              onChange={(e) => set('thi_mentor', e.target.value)}
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drdp_thi_postaveni">Postavení</label>
            <input
              id="drdp_thi_postaveni"
              value={g('thi_postaveni')}
              disabled={disabled}
              onChange={(e) => set('thi_postaveni', e.target.value)}
            />
          </div>
          <div className="stat-box">
            <label htmlFor="drdp_thi_profibody">Profibody</label>
            <input
              id="drdp_thi_profibody"
              value={g('thi_profibody')}
              disabled={disabled}
              onChange={(e) => set('thi_profibody', e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="drdp-panel" style={{ gridColumn: 'span 2' }}>
        <h3>Schopnosti a Finty</h3>
        <JsonTable
          cda={cda}
          disabled={disabled}
          arrKey="thi_schopnosti"
          cols={[
            ['name', 'Pomůcka / Finta'],
            ['bonus', 'Bonus / Hod'],
            ['note', 'Poznámka'],
          ]}
          addLabel="+ Zapsat položku"
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Generic JSON Table helper (sdílený napříč všemi taby)
// ════════════════════════════════════════════════════════════════

interface JsonTableProps {
  cda: CdAccess;
  disabled: boolean;
  arrKey: string;
  /** Tuples [field, headerLabel]. */
  cols: [string, string][];
  addLabel: string;
}

function JsonTable({
  cda,
  disabled,
  arrKey,
  cols,
  addLabel,
}: JsonTableProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<Record<string, string>>(arrKey);
  const template: Record<string, string> = cols.reduce(
    (acc, [k]) => ({ ...acc, [k]: '' }),
    {},
  );

  return (
    <div className="drdp-table-container">
      <table>
        <thead>
          <tr>
            {cols.map(([k, label]) => (
              <th key={k}>{label}</th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {cols.map(([k, label]) => (
                <td key={k}>
                  <input
                    value={row[k] || ''}
                    disabled={disabled}
                    onChange={(e) =>
                      updateArr<Record<string, string>>(arrKey, i, {
                        [k]: e.target.value,
                      })
                    }
                    aria-label={`${label} ${i + 1}`}
                  />
                </td>
              ))}
              <td>
                {!disabled && (
                  <button
                    type="button"
                    className="del-btn"
                    onClick={() => removeArr(arrKey, i)}
                    aria-label="Smazat řádek"
                  >
                    ✕
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!disabled && (
        <button
          type="button"
          className="add-row-btn"
          onClick={() => addArr(arrKey, template)}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PRINT — statický čitelný dokument (čte stejná `drdp_*` data)
// ════════════════════════════════════════════════════════════════

/** Tiskové vykreslení JSON pole jako semantická tabulka se statickým textem. */
function DrdPlusPrintTable({
  cda,
  arrKey,
  cols,
}: {
  cda: CdAccess;
  arrKey: string;
  cols: [string, string][];
}) {
  const rows = cda.parseJsonArr<Record<string, string>>(arrKey);
  if (rows.length === 0) return null;
  return (
    <table>
      <thead>
        <tr>
          {cols.map(([k, label]) => (
            <th key={k}>{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {cols.map(([k]) => (
              <td key={k}>{row[k] || '—'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DrdPlusPrintView({
  cda,
  prof,
}: {
  cda: CdAccess;
  prof: DrdPlusProfessionId;
}) {
  const { g } = cda;
  const profLabel =
    DRDPLUS_PROFESSIONS.find((p) => p.id === prof)?.label || prof;
  const popis = g('postava_popis').trim();
  const zraneniN = g('zraneni_n').trim();

  return (
    <div className="drdplus-print">
      <dl>
        <div>
          <dt>Jméno</dt>
          <dd>{g('name') || '—'}</dd>
        </div>
        <div>
          <dt>Rasa</dt>
          <dd>{g('race') || '—'}</dd>
        </div>
        <div>
          <dt>Věk</dt>
          <dd>{g('age') || '—'}</dd>
        </div>
        <div>
          <dt>Povolání</dt>
          <dd>{profLabel}</dd>
        </div>
        <div>
          <dt>Úroveň</dt>
          <dd>{g('uroven') || '—'}</dd>
        </div>
        <div>
          <dt>Zkušenosti</dt>
          <dd>{g('xp') || '—'}</dd>
        </div>
      </dl>

      {/* ═══ POSTAVA ═══ */}
      <h2>Hlavní vlastnosti</h2>
      <dl className="print-cols">
        {DRDPLUS_STATS.map((stat) => (
          <div key={stat}>
            <dt>{stat}</dt>
            <dd>{g(`stat_${stat}`) || '—'}</dd>
          </div>
        ))}
      </dl>

      <h2>Odvozené vlastnosti</h2>
      <dl className="print-cols">
        {DRDPLUS_DERIVED.map((stat) => (
          <div key={stat}>
            <dt>{stat}</dt>
            <dd>{g(`odv_${stat}`) || '—'}</dd>
          </div>
        ))}
      </dl>

      {popis && (
        <>
          <h3>Popis postavy</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{popis}</p>
        </>
      )}

      {/* ═══ BOJ ═══ */}
      <h2>Boj</h2>
      <dl className="print-cols">
        <div>
          <dt>Boj</dt>
          <dd>{g('boj_b') || '—'}</dd>
        </div>
        <div>
          <dt>Útok</dt>
          <dd>{g('boj_u') || '—'}</dd>
        </div>
        <div>
          <dt>Střelba</dt>
          <dd>{g('boj_s') || '—'}</dd>
        </div>
        <div>
          <dt>Obrana</dt>
          <dd>{g('boj_o') || '—'}</dd>
        </div>
      </dl>

      <h3>Kombinace zbraní</h3>
      <DrdPlusPrintTable
        cda={cda}
        arrKey="zbrane"
        cols={[
          ['zbran', 'Kombinace / Zbraně'],
          ['bc', 'BČ'],
          ['uc', 'ÚČ / ZZ'],
          ['oc', 'OČ (Kryt)'],
        ]}
      />

      <h3>Tracker zranění</h3>
      <dl>
        <div>
          <dt>Hlavní zranění</dt>
          <dd>{g('zraneni_hlavni') || '—'}</dd>
        </div>
        <div>
          <dt>Mez zranění</dt>
          <dd>{g('zraneni_mez') || '—'}</dd>
        </div>
        <div>
          <dt>Postih ze zranění</dt>
          <dd>{g('zraneni_postih') || '—'}</dd>
        </div>
      </dl>
      {zraneniN && <p style={{ whiteSpace: 'pre-wrap' }}>{zraneniN}</p>}

      <h3>Zbroj a ochrana</h3>
      <DrdPlusPrintTable
        cda={cda}
        arrKey="zbroje"
        cols={[
          ['typ', 'Typ Zbroje'],
          ['kvalita', 'Kvalita'],
          ['zbrojhn', 'Zbroj H / N'],
          ['ochrana', 'Ochrana H / T / N'],
        ]}
      />

      {/* ═══ CESTY ═══ */}
      <h2>Pohyb &amp; rychlost</h2>
      <dl className="print-cols">
        <div>
          <dt>Pohybová rychlost</dt>
          <dd>{g('rychlost_base') || '—'}</dd>
        </div>
        {[
          ['chuze', 'Chůze'],
          ['spech', 'Spěch'],
          ['beh', 'Běh'],
          ['sprint', 'Sprint'],
        ].map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{g(`spd_${key}`) || '—'}</dd>
          </div>
        ))}
      </dl>

      <h3>Tracker únavy</h3>
      <dl className="print-cols">
        <div>
          <dt>Únava / Body</dt>
          <dd>{g('unava_val') || '—'}</dd>
        </div>
        <div>
          <dt>Mez únavy</dt>
          <dd>{g('unava_mez') || '—'}</dd>
        </div>
        <div>
          <dt>Postih z únavy</dt>
          <dd>{g('unava_postih') || '—'}</dd>
        </div>
      </dl>

      <h3>Dovednosti na cestách</h3>
      <DrdPlusPrintTable
        cda={cda}
        arrKey="dovednosti"
        cols={[
          ['dovednost', 'Dovednost'],
          ['vlastnost', 'Vlastnost'],
          ['bonus', 'Bonus'],
          ['note', 'Poznámka'],
        ]}
      />

      {/* ═══ PROFESE (dle aktivního povolání) ═══ */}
      <h2>Profese: {profLabel}</h2>
      <DrdPlusProfessionPrint cda={cda} prof={prof} />
    </div>
  );
}

/** Tiskové vykreslení profesního tabu dle aktivního povolání. */
function DrdPlusProfessionPrint({
  cda,
  prof,
}: {
  cda: CdAccess;
  prof: DrdPlusProfessionId;
}) {
  const { g } = cda;

  if (prof === 'bojovnik') {
    return (
      <>
        <h3>Archetypy</h3>
        <dl className="print-cols">
          {WARRIOR_ARCHETYPES.map((arc) => (
            <div key={arc}>
              <dt>{arc}</dt>
              <dd>{g(`w_arc_${arc}`) || '—'}</dd>
            </div>
          ))}
        </dl>
        <h3>Bojové finty</h3>
        <DrdPlusPrintTable
          cda={cda}
          arrKey="w_finty"
          cols={[
            ['name', 'Název'],
            ['weapon', 'Zbraň'],
            ['prevaha', 'Převaha'],
            ['note', 'Poznámka'],
          ]}
        />
        <h3>Bojové schopnosti</h3>
        <DrdPlusPrintTable
          cda={cda}
          arrKey="w_schopnosti"
          cols={[
            ['name', 'Schopnost'],
            ['note', 'Poznámka / Stupeň'],
          ]}
        />
      </>
    );
  }

  if (prof === 'carodej') {
    const projevy = g('wiz_projevy').trim();
    return (
      <>
        <h3>Magenergie</h3>
        <dl className="print-cols">
          <div>
            <dt>Kapacita</dt>
            <dd>{g('wiz_kapacita') || '—'}</dd>
          </div>
          <div>
            <dt>Aktuální</dt>
            <dd>{g('wiz_aktualni') || '—'}</dd>
          </div>
          <div>
            <dt>Únava</dt>
            <dd>{g('wiz_unava') || '—'}</dd>
          </div>
        </dl>
        {projevy && (
          <>
            <h3>Projevy</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{projevy}</p>
          </>
        )}
        <h3>Kouzla</h3>
        <DrdPlusPrintTable
          cda={cda}
          arrKey="wiz_kouzla"
          cols={[
            ['name', 'Kouzlo'],
            ['obor', 'Obor'],
            ['mg', 'Mg'],
            ['note', 'Poznámka'],
          ]}
        />
      </>
    );
  }

  if (prof === 'hranicar') {
    const totem = g('ran_totem').trim();
    const zvirata = g('ran_zvirata').trim();
    return (
      <>
        <h3>Zaměření a mechanismy</h3>
        <DrdPlusPrintTable
          cda={cda}
          arrKey="ran_zam"
          cols={[
            ['znalost', 'Znalost'],
            ['praxe', 'Praxe'],
            ['name', 'Mechanismus / Název'],
          ]}
        />
        <h3>Totem a zvířata</h3>
        <dl>
          <div>
            <dt>Zvíře totemu</dt>
            <dd>{totem || '—'}</dd>
          </div>
        </dl>
        {zvirata && <p style={{ whiteSpace: 'pre-wrap' }}>{zvirata}</p>}
      </>
    );
  }

  if (prof === 'knez') {
    return (
      <>
        <h3>Principy a aspekty</h3>
        <dl className="print-cols">
          <div>
            <dt>Doména</dt>
            <dd>{g('pri_domena') || '—'}</dd>
          </div>
          <div>
            <dt>Síla as.</dt>
            <dd>{g('pri_silaas') || '—'}</dd>
          </div>
          <div>
            <dt>Neovliv.</dt>
            <dd>{g('pri_neovliv') || '—'}</dd>
          </div>
        </dl>
        <h3>Základní schopnosti</h3>
        <dl className="print-cols">
          {PRIEST_BASIC_ABILITIES.map((s) => (
            <div key={s}>
              <dt>{s}</dt>
              <dd>{g(`pri_${s}`) || '—'}</dd>
            </div>
          ))}
        </dl>
        <h3>Zázračné schopnosti</h3>
        <DrdPlusPrintTable
          cda={cda}
          arrKey="pri_zazraky"
          cols={[
            ['name', 'Zázrak'],
            ['uroven', 'Úroven I/II/III'],
            ['stupen', 'Stupeň / Hloubka'],
            ['note', 'Poznámka'],
          ]}
        />
      </>
    );
  }

  if (prof === 'theurg') {
    return (
      <>
        <h3>Nakloněnost</h3>
        <dl className="print-cols">
          {THEURG_INCLINATIONS.map((s) => (
            <div key={s}>
              <dt>{s}</dt>
              <dd>{g(`the_nakl_${s}`) || '—'}</dd>
            </div>
          ))}
        </dl>
        <h3>Vazby, démoni, formule</h3>
        <DrdPlusPrintTable
          cda={cda}
          arrKey="the_vazby"
          cols={[
            ['name', 'Název (Démon / Vazba)'],
            ['type', 'Sféra / Typ'],
            ['detail', 'Detaily'],
          ]}
        />
      </>
    );
  }

  // zlodej
  return (
    <>
      <h3>Zlodějský cech</h3>
      <dl className="print-cols">
        <div>
          <dt>Cech</dt>
          <dd>{g('thi_cech') || '—'}</dd>
        </div>
        <div>
          <dt>Mentor</dt>
          <dd>{g('thi_mentor') || '—'}</dd>
        </div>
        <div>
          <dt>Postavení</dt>
          <dd>{g('thi_postaveni') || '—'}</dd>
        </div>
        <div>
          <dt>Profibody</dt>
          <dd>{g('thi_profibody') || '—'}</dd>
        </div>
      </dl>
      <h3>Schopnosti a finty</h3>
      <DrdPlusPrintTable
        cda={cda}
        arrKey="thi_schopnosti"
        cols={[
          ['name', 'Pomůcka / Finta'],
          ['bonus', 'Bonus / Hod'],
          ['note', 'Poznámka'],
        ]}
      />
    </>
  );
}
