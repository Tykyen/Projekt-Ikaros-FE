/**
 * 8.7k — Shadowrun deník postavy.
 *
 * Adaptace z `c:/Matrix/Matrix/frontend/src/components/diary/ShadowrunCharacterSheet.tsx`
 * (502 ř). Cyberpunk neon magenta + cyan tema. 2 taby (Postava+Vlastnosti
 * / Matrix+Magie+Boj). Custom renderery:
 *   - Condition Track (Phys + Stun) s -1 penalty per 3 boxy
 *   - Matrix panel (Device + 4 attrs + programs + 12-box damage track)
 *   - Quick Combat block (3 sekce: Pancíř / Ranged / Melee)
 *
 * Data v `diary.customData` s prefixem `sr_*` (1:1 vůči legacy).
 */
import { useState } from 'react';
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import { SR_CORE_ATTRS, SR_SPECIAL_ATTRS } from './constants';

type Tab = 'core' | 'gear';

export function ShadowrunSheet({
  diary,
  mode,
  onChange,
}: SystemSheetProps) {
  const disabled = mode === 'view';
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'sr_', onChange);
  const { g, set } = cda;

  const [tab, setTab] = useState<Tab>('core');

  return (
    <div className="sr-dashboard">
      {/* ═══ HEADER ═══ */}
      <div className="sr-header">
        <div className="id-col" style={{ flex: 2 }}>
          <div className="form-group">
            <label htmlFor="sr_name">Hlavní Alias / Jméno</label>
            <input
              id="sr_name"
              className="h1-style"
              value={g('name')}
              disabled={disabled}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Neon..."
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="sr_player">Hráč</label>
              <input
                id="sr_player"
                value={g('player')}
                disabled={disabled}
                onChange={(e) => set('player', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="sr_role_note">Poznámka (Role)</label>
              <input
                id="sr_role_note"
                value={g('role_note')}
                disabled={disabled}
                onChange={(e) => set('role_note', e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="id-col">
          <div className="form-group">
            <label htmlFor="sr_race">Metarasa</label>
            <input
              id="sr_race"
              value={g('race')}
              disabled={disabled}
              onChange={(e) => set('race', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="sr_ethnicity">Etnicita</label>
            <input
              id="sr_ethnicity"
              value={g('ethnicity')}
              disabled={disabled}
              onChange={(e) => set('ethnicity', e.target.value)}
            />
          </div>
        </div>
        <div className="id-col">
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="form-group">
              <label htmlFor="sr_notoriety">Hledanost</label>
              <input
                id="sr_notoriety"
                value={g('notoriety')}
                disabled={disabled}
                onChange={(e) => set('notoriety', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sr_rep">Pověst</label>
              <input
                id="sr_rep"
                value={g('rep')}
                disabled={disabled}
                onChange={(e) => set('rep', e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="form-group">
              <label htmlFor="sr_karma">Zbývá Karma</label>
              <input
                id="sr_karma"
                value={g('karma')}
                disabled={disabled}
                onChange={(e) => set('karma', e.target.value)}
                style={{ color: '#ec4899', fontWeight: 'bold' }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sr_karma_total">Celkem K.</label>
              <input
                id="sr_karma_total"
                value={g('karma_total')}
                disabled={disabled}
                onChange={(e) => set('karma_total', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="sr-tabs">
        <button
          type="button"
          className={tab === 'core' ? 'active' : ''}
          onClick={() => setTab('core')}
        >
          1. Postava a Vlastnosti
        </button>
        <button
          type="button"
          className={tab === 'gear' ? 'active' : ''}
          onClick={() => setTab('gear')}
        >
          2. Matrix, Magie a Boj
        </button>
      </div>

      {tab === 'core' && <CoreTab cda={cda} disabled={disabled} />}
      {tab === 'gear' && <GearTab cda={cda} disabled={disabled} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab: Core (Postava a Vlastnosti)
// ════════════════════════════════════════════════════════════════

interface SubProps {
  cda: CdAccess;
  disabled: boolean;
}

function CoreTab({ cda, disabled }: SubProps) {
  const { g, set } = cda;
  const physMax = parseInt(g('cond_phys_max', '10'), 10) || 10;
  const stunMax = parseInt(g('cond_stun_max', '10'), 10) || 10;

  return (
    <div className="sr-tab-content sr-grid">
      {/* Quick combat (panel-12) */}
      <div className="panel-12">
        <div className="quick-combat">
          <QcBox cda={cda} disabled={disabled} variant="armor" />
          <QcBox cda={cda} disabled={disabled} variant="ranged" />
          <QcBox cda={cda} disabled={disabled} variant="melee" />
        </div>
      </div>

      {/* Atributy (panel-4) */}
      <div className="panel-4">
        <h3>Atributy (Základní)</h3>
        <div className="attrs-box">
          {SR_CORE_ATTRS.map((a) => (
            <div className="attr-row" key={a.key}>
              <div className="attr-name">{a.label}</div>
              <div className="attr-vals">
                <input
                  value={g(`attr_${a.key}`)}
                  disabled={disabled}
                  onChange={(e) => set(`attr_${a.key}`, e.target.value)}
                  aria-label={a.label}
                />
              </div>
            </div>
          ))}
        </div>

        <h3>Speciální &amp; Odvozené</h3>
        <div className="attrs-box sec-attrs">
          {SR_SPECIAL_ATTRS.map((a) => (
            <div className="attr-row" key={a.key}>
              <div className="attr-name">{a.label}</div>
              <div className="attr-vals">
                <input
                  value={g(`attr_${a.key}`)}
                  disabled={disabled}
                  onChange={(e) => set(`attr_${a.key}`, e.target.value)}
                  aria-label={a.label}
                />
              </div>
            </div>
          ))}
          <div className="attr-row" style={{ gridColumn: 'span 2' }}>
            <div className="attr-name">Hodnocení Obrany (HO)</div>
            <div className="attr-vals">
              <input
                value={g('attr_def')}
                disabled={disabled}
                onChange={(e) => set('attr_def', e.target.value)}
                aria-label="Hodnocení Obrany"
              />
            </div>
          </div>
        </div>

        <textarea
          className="sr-textarea"
          style={{ marginTop: 16 }}
          value={g('notes')}
          disabled={disabled}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Obecné poznámky postavy..."
          aria-label="Poznámky"
        />
      </div>

      {/* Condition + Eco (panel-4) */}
      <div className="panel-4">
        <ConditionTrack
          fieldKey="cond_phys"
          maxBoxes={physMax}
          title="Fyzický záznamník zranění"
          stunVariant={false}
          cda={cda}
          disabled={disabled}
        />
        <ConditionTrack
          fieldKey="cond_stun"
          maxBoxes={stunMax}
          title="Záznamník omráčení (Stun)"
          stunVariant
          cda={cda}
          disabled={disabled}
        />

        <div
          className="eco-panel"
          style={{
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: 4,
            padding: 16,
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderLeft: '4px solid #10b981',
          }}
        >
          <h3 style={{ color: '#10b981' }}>Finance &amp; Životní styl</h3>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 10,
                color: '#9ca3af',
                display: 'block',
                marginBottom: 4,
              }}
              htmlFor="sr_eco_nuyen"
            >
              Nuyeny (Hotovost / Účty)
            </label>
            <input
              id="sr_eco_nuyen"
              value={g('eco_nuyen')}
              disabled={disabled}
              onChange={(e) => set('eco_nuyen', e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10b981',
                padding: 8,
                fontSize: 18,
                fontWeight: 'bold',
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 10,
                color: '#9ca3af',
                display: 'block',
                marginBottom: 4,
              }}
              htmlFor="sr_eco_lifestyle"
            >
              Primární životní styl
            </label>
            <input
              id="sr_eco_lifestyle"
              value={g('eco_lifestyle')}
              disabled={disabled}
              onChange={(e) => set('eco_lifestyle', e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: 4,
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontSize: 10,
                color: '#9ca3af',
                display: 'block',
                marginBottom: 4,
              }}
              htmlFor="sr_eco_sins"
            >
              Falešné SIN a Licence (Přehled)
            </label>
            <textarea
              id="sr_eco_sins"
              value={g('eco_sins')}
              disabled={disabled}
              onChange={(e) => set('eco_sins', e.target.value)}
              style={{
                width: '100%',
                minHeight: 100,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#d1d5db',
                padding: 8,
                fontSize: 12,
                resize: 'vertical',
              }}
            />
          </div>
        </div>
      </div>

      {/* Skills/Qualities/Contacts (panel-4) */}
      <div className="panel-4">
        <h3>Dovednosti</h3>
        <SrTable
          cda={cda}
          disabled={disabled}
          arrKey="skills"
          cols={[
            ['name', 'Dovednost'],
            ['val', 'Hodn.', 'td-s'],
            ['attr', 'Atr', 'td-s'],
            ['type', 'Typ (A/Z/K)', 'td-m'],
          ]}
          addLabel="+ Přidat dovednost"
          template={{ name: '', val: '', attr: '', type: '' }}
        />

        <h3 style={{ marginTop: 24 }}>Kvality</h3>
        <SrTable
          cda={cda}
          disabled={disabled}
          arrKey="qualities"
          cols={[
            ['name', 'Kvalita'],
            ['type', 'Typ', 'td-s'],
            ['note', 'Poznámka', 'td-m'],
          ]}
          addLabel="+ Přidat kvalitu"
          template={{ name: '', type: '', note: '' }}
        />

        <h3 style={{ marginTop: 24 }}>Kontakty</h3>
        <SrTable
          cda={cda}
          disabled={disabled}
          arrKey="contacts"
          cols={[
            ['name', 'Jméno / Spojka'],
            ['loy', 'Loaj', 'td-s'],
            ['con', 'Konx', 'td-s'],
          ]}
          addLabel="+ Přidat kontakt"
          template={{ name: '', loy: '', con: '' }}
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Tab: Gear (Matrix, Magie, Boj)
// ════════════════════════════════════════════════════════════════

function GearTab({ cda, disabled }: SubProps) {
  const { g, set } = cda;
  const matDmg = parseInt(g('mat_dmg'), 10) || 0;

  return (
    <div className="sr-tab-content sr-grid">
      {/* Matrix + Magic (panel-7) */}
      <div className="panel-7">
        <div
          className="matrix-panel"
          style={{ padding: 20, borderRadius: 4, marginBottom: 24 }}
        >
          <h3>Matrix a Zařízení (Cyberdeck / Komlink)</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 2 }}>
              <label
                style={{ fontSize: 10, color: '#06b6d4' }}
                htmlFor="sr_mat_device"
              >
                Komlink / Cyberdeck Název
              </label>
              <input
                id="sr_mat_device"
                value={g('mat_device')}
                disabled={disabled}
                onChange={(e) => set('mat_device', e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1px solid rgba(6,182,212,0.5)',
                  background: 'transparent',
                  color: '#fff',
                  padding: 4,
                  outline: 'none',
                  fontSize: 16,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{ fontSize: 10, color: '#06b6d4' }}
                htmlFor="sr_mat_dev_rating"
              >
                Hodnocení
              </label>
              <input
                id="sr_mat_dev_rating"
                value={g('mat_dev_rating')}
                disabled={disabled}
                onChange={(e) => set('mat_dev_rating', e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1px solid rgba(6,182,212,0.5)',
                  background: 'transparent',
                  color: '#fff',
                  padding: 4,
                  outline: 'none',
                  fontSize: 16,
                }}
              />
            </div>
          </div>

          <div className="m-stats">
            {(
              [
                ['mat_atk', 'Útok (A)'],
                ['mat_slz', 'Maskování (S)'],
                ['mat_dp', 'Zprac. (D)'],
                ['mat_fw', 'Firewall (F)'],
              ] as const
            ).map(([key, label]) => (
              <div className="m-stat" key={key}>
                <label htmlFor={`sr_${key}`}>{label}</label>
                <input
                  id={`sr_${key}`}
                  value={g(key)}
                  disabled={disabled}
                  onChange={(e) => set(key, e.target.value)}
                  aria-label={label}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 2 }}>
              <label
                style={{
                  fontSize: 10,
                  color: '#06b6d4',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Nainstalované Programy
              </label>
              <SrTable
                cda={cda}
                disabled={disabled}
                arrKey="mat_progs"
                cols={[['name', 'Program']]}
                addLabel="+ Program"
                template={{ name: '' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: 10,
                  color: '#06b6d4',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Matrix Záznamník (12 boxů)
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  flexWrap: 'wrap',
                  background: 'rgba(0,0,0,0.4)',
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid rgba(6,182,212,0.3)',
                }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() =>
                      set('mat_dmg', matDmg === i + 1 ? String(i) : String(i + 1))
                    }
                    disabled={disabled}
                    style={{
                      width: 20,
                      height: 20,
                      cursor: disabled ? 'default' : 'pointer',
                      border: '1px solid #06b6d4',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      background: i < matDmg ? '#06b6d4' : 'transparent',
                      color: i < matDmg ? '#fff' : 'transparent',
                      fontSize: 10,
                      padding: 0,
                    }}
                    aria-label={`Matrix damage box ${i + 1}`}
                  >
                    X
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <h3 style={{ marginTop: 24 }}>
          Magie: Kouzla / Výtvory / Rituály / KF
        </h3>
        <SrTable
          cda={cda}
          disabled={disabled}
          arrKey="spells"
          cols={[
            ['name', 'Jméno (K/V/R/KF)'],
            ['type', 'Typ/Cíl', 'td-s'],
            ['rng', 'Dosah', 'td-s'],
            ['dur', 'Trvání', 'td-s'],
            ['drain', 'Odliv', 'td-s'],
          ]}
          addLabel="+ Přidat formu / kouzlo"
          template={{ name: '', type: '', rng: '', dur: '', drain: '' }}
        />

        <h3 style={{ marginTop: 24 }}>Adeptské síly a další schopnosti</h3>
        <SrTable
          cda={cda}
          disabled={disabled}
          arrKey="powers"
          cols={[
            ['name', 'Název schopnosti'],
            ['lvl', 'Úroveň', 'td-s'],
            ['note', 'Poznámky', 'td-m'],
          ]}
          addLabel="+ Přidat sílu"
          template={{ name: '', lvl: '', note: '' }}
        />
      </div>

      {/* Weapons + Armor + Aug + Vehicles (panel-5) */}
      <div className="panel-5">
        <h3>Střelné zbraně</h3>
        <SrTable
          cda={cda}
          disabled={disabled}
          arrKey="ranged"
          cols={[
            ['name', 'Zbraň'],
            ['dmg', 'HP', 'td-s'],
            ['ar', 'HÚ', 'td-s'],
            ['ammo', 'Munice', 'td-s'],
          ]}
          addLabel="+ Střelná zbraň"
          template={{ name: '', dmg: '', ar: '', ammo: '' }}
        />

        <h3 style={{ marginTop: 24 }}>Zbraně na blízko</h3>
        <SrTable
          cda={cda}
          disabled={disabled}
          arrKey="melee"
          cols={[
            ['name', 'Zbraň'],
            ['dmg', 'HP', 'td-s'],
            ['reach', 'Dosah', 'td-s'],
          ]}
          addLabel="+ Kontaktní zbraň"
          template={{ name: '', dmg: '', reach: '' }}
        />

        <h3 style={{ marginTop: 24 }}>Hlavní Pancíř / Zbroj</h3>
        <SrTable
          cda={cda}
          disabled={disabled}
          arrKey="armor"
          cols={[
            ['name', 'Pancíř'],
            ['val', 'Hodn.', 'td-s'],
            ['note', 'Poznámka', 'td-m'],
          ]}
          addLabel="+ Část zbroje"
          template={{ name: '', val: '', note: '' }}
        />

        <h3 style={{ marginTop: 24 }}>Augmentace (Cyber/Bioware)</h3>
        <SrTable
          cda={cda}
          disabled={disabled}
          arrKey="aug"
          cols={[
            ['name', 'Zlepšení'],
            ['val', 'Hodn.', 'td-s'],
            ['ess', 'Esence', 'td-s'],
          ]}
          addLabel="+ Přidat augmentaci"
          template={{ name: '', val: '', ess: '' }}
        />

        <h3 style={{ marginTop: 24 }}>Dopravní prostředky / Droni</h3>
        <SrTable
          cda={cda}
          disabled={disabled}
          arrKey="vehicle"
          cols={[
            ['name', 'Model'],
            ['speed', 'Max Y.', 'td-s'],
            ['bod', 'Tělo/Pan', 'td-s'],
          ]}
          addLabel="+ Vůz / Dron"
          template={{ name: '', speed: '', bod: '' }}
        />
      </div>
    </div>
  );
}

// ── Condition track ─────────────────────────────────────────────

interface ConditionTrackProps {
  fieldKey: string;
  maxBoxes: number;
  title: string;
  stunVariant: boolean;
  cda: CdAccess;
  disabled: boolean;
}

function ConditionTrack({
  fieldKey,
  maxBoxes,
  title,
  stunVariant,
  cda,
  disabled,
}: ConditionTrackProps) {
  const { g, set } = cda;
  const currentNum = parseInt(g(fieldKey), 10) || 0;

  const toggleBox = (index: number) => {
    if (disabled) return;
    set(fieldKey, currentNum === index + 1 ? String(index) : String(index + 1));
  };

  return (
    <div
      className="condition-panel"
      style={
        stunVariant
          ? {
              borderColor: 'rgba(236,72,153,0.3)',
              borderTopColor: '#ec4899',
              boxShadow: 'inset 0 0 20px rgba(236,72,153,0.05)',
            }
          : undefined
      }
    >
      <h4 style={stunVariant ? { color: '#ec4899' } : undefined}>{title}</h4>
      <div className="track-wrapper">
        <div className="track-row">
          {Array.from({ length: maxBoxes }).map((_, i) => {
            const isPenaltyBox = (i + 1) % 3 === 0;
            const penalty = Math.floor((i + 1) / 3);
            return (
              <div key={i} style={{ display: 'flex' }}>
                <button
                  type="button"
                  className={`c-box ${i < currentNum ? 'checked' : ''}`}
                  onClick={() => toggleBox(i)}
                  disabled={disabled}
                  style={{
                    borderColor:
                      stunVariant && i < currentNum ? '#ec4899' : undefined,
                  }}
                  aria-label={`${title} box ${i + 1}`}
                  aria-pressed={i < currentNum}
                >
                  {i < currentNum ? 'X' : ''}
                </button>
                {isPenaltyBox && i < maxBoxes - 1 && (
                  <div className="c-penalty">-{penalty}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}
        >
          Max Políček:
        </span>
        <input
          type="number"
          style={{
            width: 50,
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            padding: 4,
            textAlign: 'center',
          }}
          value={g(`${fieldKey}_max`, '10')}
          disabled={disabled}
          onChange={(e) => set(`${fieldKey}_max`, e.target.value)}
          aria-label={`${title} max boxes`}
        />
      </div>
    </div>
  );
}

// ── Quick combat box ────────────────────────────────────────────

interface QcBoxProps extends SubProps {
  variant: 'armor' | 'ranged' | 'melee';
}

function QcBox({ cda, disabled, variant }: QcBoxProps) {
  const { g, set } = cda;
  if (variant === 'armor') {
    return (
      <div className="qc-box">
        <div className="qc-title">Hlavní Pancíř</div>
        <div className="qc-inputs">
          <div className="qi">
            <label htmlFor="sr_qc_armor">Název</label>
            <input
              id="sr_qc_armor"
              value={g('qc_armor')}
              disabled={disabled}
              onChange={(e) => set('qc_armor', e.target.value)}
            />
          </div>
          <div className="qi" style={{ maxWidth: 80 }}>
            <label htmlFor="sr_qc_armor_val">Hodnocení</label>
            <input
              id="sr_qc_armor_val"
              value={g('qc_armor_val')}
              disabled={disabled}
              onChange={(e) => set('qc_armor_val', e.target.value)}
              style={{ color: '#ec4899', fontSize: 18, fontWeight: 'bold' }}
            />
          </div>
        </div>
      </div>
    );
  }
  if (variant === 'ranged') {
    return (
      <div className="qc-box" style={{ flex: 2 }}>
        <div className="qc-title">Rychlá Zbraň na dálku</div>
        <div className="qc-inputs">
          <div className="qi">
            <label htmlFor="sr_qc_ranged">Zbraň</label>
            <input
              id="sr_qc_ranged"
              value={g('qc_ranged')}
              disabled={disabled}
              onChange={(e) => set('qc_ranged', e.target.value)}
            />
          </div>
          <div className="qi" style={{ maxWidth: 60 }}>
            <label htmlFor="sr_qc_r_dmg">HP</label>
            <input
              id="sr_qc_r_dmg"
              value={g('qc_r_dmg')}
              disabled={disabled}
              onChange={(e) => set('qc_r_dmg', e.target.value)}
            />
          </div>
          <div className="qi" style={{ maxWidth: 50 }}>
            <label htmlFor="sr_qc_r_mod">Mód</label>
            <input
              id="sr_qc_r_mod"
              value={g('qc_r_mod')}
              disabled={disabled}
              onChange={(e) => set('qc_r_mod', e.target.value)}
            />
          </div>
          <div className="qi" style={{ maxWidth: 60 }}>
            <label htmlFor="sr_qc_r_ammo">Záchyt</label>
            <input
              id="sr_qc_r_ammo"
              value={g('qc_r_ammo')}
              disabled={disabled}
              onChange={(e) => set('qc_r_ammo', e.target.value)}
            />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="qc-box">
      <div className="qc-title">Rychlá Zbraň na blízko</div>
      <div className="qc-inputs">
        <div className="qi">
          <label htmlFor="sr_qc_melee">Zbraň</label>
          <input
            id="sr_qc_melee"
            value={g('qc_melee')}
            disabled={disabled}
            onChange={(e) => set('qc_melee', e.target.value)}
          />
        </div>
        <div className="qi" style={{ maxWidth: 60 }}>
          <label htmlFor="sr_qc_m_dmg">HP</label>
          <input
            id="sr_qc_m_dmg"
            value={g('qc_m_dmg')}
            disabled={disabled}
            onChange={(e) => set('qc_m_dmg', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// ── Generic table helper ────────────────────────────────────────

interface SrTableProps {
  cda: CdAccess;
  disabled: boolean;
  arrKey: string;
  /** Tuples [field, label, optional class `td-s`/`td-m`]. */
  cols: [string, string, string?][];
  addLabel: string;
  template: Record<string, string>;
}

function SrTable({
  cda,
  disabled,
  arrKey,
  cols,
  addLabel,
  template,
}: SrTableProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<Record<string, string>>(arrKey);

  return (
    <div className="sr-table">
      <table>
        <thead>
          <tr>
            {cols.map(([k, label, cls]) => (
              <th key={k} className={cls}>
                {label}
              </th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {cols.map(([k, label, cls]) => (
                <td key={k} className={cls}>
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
          className="add-btn"
          onClick={() => addArr(arrKey, template)}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}
