/**
 * 8.7n — Matrix RPG deník postavy (vlastní systém projektu Matrix/Ikaros).
 *
 * Adaptace z `c:/Matrix/Matrix/frontend/src/pages/CharacterSheet.tsx`
 * (řádky 356–948, default layout pro `world.system === 'matrix'`).
 *
 * Data v `diary.customData` s prefixem `matrix_*` (mapping z přímých
 * polí Character entity legacy projektu — pro Ikaros konsistentní s
 * ostatními systémovými presety).
 *
 * Sekce:
 *   A) Overview (jméno, stát, magický gen, datum, body schopností,
 *      body osudu)
 *   B) Vitals (Životy + Runa + Vesta + penalty strip / Únava + penalty)
 *   C) Přetlaky (4 typy × 5 segmentů) + Jazyky (TagValue list)
 *   D) Schopnosti (TagValue + magic ★) + Aspekty (TagValue + chip)
 *   E) Výbava (textarea / RichText prozatím plain)
 */
import type { SystemSheetProps } from '../../types';
import { makeCdAccess, type CdAccess } from '../../_shared/cdAccess';
import {
  MATRIX_HEALTH_PENALTY,
  MATRIX_MAGIC,
  MATRIX_PRESSURE_TYPES,
  MATRIX_TIREDNESS_PENALTY,
  type MatrixTagValue,
} from './constants';

export function MatrixSheet({ diary, mode, onChange, onRoll }: SystemSheetProps) {
  const disabled = mode === 'view';
  const cd = diary.customData ?? {};
  const cda = makeCdAccess(cd, 'matrix_', onChange);

  return (
    <div className="matrix-sheet">
      <OverviewCard cda={cda} disabled={disabled} onRoll={onRoll} />
      <VitalsCard cda={cda} disabled={disabled} />
      <div className="mx-grid-2col">
        <PressureCard cda={cda} disabled={disabled} />
        <DataListCard
          cda={cda}
          disabled={disabled}
          arrKey="languages"
          title="Jazyky"
          template={{ label: '', value: 'C' }}
          addLabel="+ Přidat jazyk"
          variant="language"
        />
      </div>
      <div className="mx-grid-2col">
        <DataListCard
          cda={cda}
          disabled={disabled}
          arrKey="abilities"
          title="Schopnosti"
          template={{ label: '', value: '1' }}
          addLabel="+ Přidat schopnost"
          variant="ability"
          onRoll={onRoll}
        />
        <DataListCard
          cda={cda}
          disabled={disabled}
          arrKey="aspects"
          title="Aspekty"
          template={{ label: '', value: 'Vybitý' }}
          addLabel="+ Přidat aspekt"
          variant="aspect"
        />
      </div>
      <InventoryCard cda={cda} disabled={disabled} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// A) Overview card
// ════════════════════════════════════════════════════════════════

interface SubProps {
  cda: CdAccess;
  disabled: boolean;
}

/** 10.2c-edit-9g — optional roll callback (tactical-map embed). */
type OnRoll = NonNullable<SystemSheetProps['onRoll']>;

interface OverviewProps extends SubProps {
  onRoll?: OnRoll;
}

function OverviewCard({ cda, disabled, onRoll }: OverviewProps) {
  const { g, set } = cda;
  const abilityPoints = parseInt(g('abilityPoints', '0'), 10) || 0;
  // Auto-compute used points from `matrix_abilities` array
  const abilities = cda.parseJsonArr<MatrixTagValue>('abilities');
  const usedPoints = abilities.reduce((sum, ab) => {
    const v = parseInt(ab.value, 10) || 0;
    // sum 1..v (triangle number) — z entities.ts `sum(n)` helper
    let s = 0;
    for (let i = 1; i <= v; i++) s += i;
    return sum + s;
  }, 0);
  const aspectsCount =
    cda.parseJsonArr<MatrixTagValue>('aspects').length;
  // +6 bodů za každý aspekt nad 3
  const extraAspectsCost = Math.max(0, (aspectsCount - 3) * 6);
  const totalUsed = usedPoints + extraAspectsCost;
  const remaining = abilityPoints - totalUsed;

  return (
    <div className="mx-card mx-overview-card">
      <SimpleField label="Jméno:" cda={cda} fieldKey="name" disabled={disabled} />
      <SimpleField label="Stát:" cda={cda} fieldKey="bornWhere" disabled={disabled} />
      <SimpleField
        label="Magický gen:"
        cda={cda}
        fieldKey="magicGene"
        disabled={disabled}
      />
      <div className="mx-field">
        <label className="mx-field__label" htmlFor="matrix_lastFatePointModification">
          Poslední úprava:
        </label>
        <input
          id="matrix_lastFatePointModification"
          type="date"
          className="mx-input"
          value={g('lastFatePointModification')}
          disabled={disabled}
          onChange={(e) => set('lastFatePointModification', e.target.value)}
        />
      </div>
      <div className="mx-field">
        <span className="mx-field__label">Body schopností:</span>
        <div className="mx-stat-capsule">
          <input
            className={`mx-input ${remaining < 0 ? 'is-negative' : ''}`}
            type="number"
            value={remaining}
            readOnly
            aria-label="Zbývající body schopností"
            style={{ background: 'transparent', border: 'none' }}
          />
          <p>/</p>
          <input
            type="number"
            value={abilityPoints}
            disabled={disabled}
            onChange={(e) => set('abilityPoints', e.target.value)}
            aria-label="Celkové body schopností"
            style={{ background: 'transparent', border: 'none' }}
          />
        </div>
      </div>
      <div className="mx-field">
        <label className="mx-field__label" htmlFor="matrix_fatePoints">
          Body osudu:
        </label>
        <div className="mx-stat-capsule">
          <input
            id="matrix_fatePoints"
            type="number"
            min={0}
            max={3}
            value={g('fatePoints', '0')}
            disabled={disabled}
            onChange={(e) => set('fatePoints', e.target.value)}
            aria-label="Body osudu"
            style={{ background: 'transparent', border: 'none' }}
          />
        </div>
      </div>
      {/* 10.2c-edit-9g — quick roll Iniciativa (tactical-map only) */}
      {onRoll && (
        <button
          type="button"
          onClick={() =>
            onRoll({
              label: 'Iniciativa',
              modifier: 0,
              kind: 'fate',
            })
          }
          style={{
            marginTop: 10,
            padding: '8px 14px',
            background: 'rgba(120, 100, 255, 0.22)',
            color: 'rgba(220, 235, 255, 0.95)',
            border: '1px solid rgba(120, 100, 255, 0.6)',
            borderRadius: 6,
            font: 'inherit',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            cursor: 'pointer',
            width: '100%',
          }}
          title="Hodit iniciativu (4dF)"
        >
          ⚡ + Iniciativa
        </button>
      )}
    </div>
  );
}

interface SimpleFieldProps extends SubProps {
  label: string;
  fieldKey: string;
}

function SimpleField({ label, fieldKey, cda, disabled }: SimpleFieldProps) {
  const { g, set } = cda;
  return (
    <div className="mx-field">
      <label className="mx-field__label" htmlFor={`matrix_${fieldKey}`}>
        {label}
      </label>
      <input
        id={`matrix_${fieldKey}`}
        type="text"
        className="mx-input"
        value={g(fieldKey)}
        disabled={disabled}
        onChange={(e) => set(fieldKey, e.target.value)}
        aria-label={label.replace(':', '')}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// B) Vitals card (Životy + Runa + Vesta + Únava)
// ════════════════════════════════════════════════════════════════

function VitalsCard({ cda, disabled }: SubProps) {
  const { g } = cda;
  const health = parseInt(g('health', '5'), 10);
  const tiredness = parseInt(g('tiredness', '0'), 10);

  return (
    <div className="mx-card mx-vitals-card">
      <h2 className="mx-section-title">Fyzický stav</h2>
      <div className="mx-vitals-grid">
        {/* Životy + Runa + Vesta */}
        <div className="mx-stat-block">
          <div className="mx-stat-tiles">
            <StatTile
              label="Životy"
              fieldKey="health"
              cda={cda}
              disabled={disabled}
              max={5}
            />
            <StatTile
              label="Runa"
              fieldKey="magicHealth"
              cda={cda}
              disabled={disabled}
            />
            <StatTile
              label="Vesta"
              fieldKey="armor"
              cda={cda}
              disabled={disabled}
            />
          </div>
          <HealthPenaltyStrip health={health} />
        </div>

        {/* Únava */}
        <div className="mx-stat-block">
          <div className="mx-stat-tiles">
            <StatTile
              label="Únava"
              fieldKey="tiredness"
              cda={cda}
              disabled={disabled}
              max={25}
            />
          </div>
          <TirednessPenaltyStrip tiredness={tiredness} />
        </div>
      </div>
    </div>
  );
}

interface StatTileProps extends SubProps {
  label: string;
  fieldKey: string;
  max?: number;
}

function StatTile({ label, fieldKey, max, cda, disabled }: StatTileProps) {
  const { g, set } = cda;
  return (
    <div className="mx-stat-tile">
      <span className="mx-stat-tile__label">{label}</span>
      <div className="mx-stat-tile__value">
        <input
          type="number"
          min={0}
          max={max}
          value={g(fieldKey, '0')}
          disabled={disabled}
          onChange={(e) => set(fieldKey, e.target.value)}
          aria-label={label}
        />
      </div>
    </div>
  );
}

function HealthPenaltyStrip({ health }: { health: number }) {
  return (
    <div className="mx-penalty-strip">
      {MATRIX_HEALTH_PENALTY.map((penalty, i) => {
        let isActive = false;
        let mod = '';
        if (i === 0) {
          isActive = health >= 4;
        } else if (i === 1) {
          isActive = health === 2 || health === 3;
          mod = 'mx-penalty-segment--amber';
        } else if (i === 2) {
          isActive = health === 1;
          mod = 'mx-penalty-segment--orange';
        } else if (i === 3) {
          isActive = health === 0;
          mod = 'mx-penalty-segment--danger';
        }
        return (
          <div
            key={`he${i}`}
            className={`mx-penalty-segment ${isActive ? `is-active ${mod}` : ''}`}
            aria-label={`Penalty ${penalty}${isActive ? ' (aktivní)' : ''}`}
          >
            {penalty}
          </div>
        );
      })}
    </div>
  );
}

function TirednessPenaltyStrip({ tiredness }: { tiredness: number }) {
  return (
    <div className="mx-penalty-strip">
      {MATRIX_TIREDNESS_PENALTY.map((penalty, i) => {
        let displayVal = String(penalty);
        let isActive = false;
        let mod = '';
        if (i === 0) {
          isActive = tiredness >= 0 && tiredness <= 5;
        } else if (i === 1) {
          isActive = tiredness >= 6 && tiredness <= 10;
          mod = 'mx-penalty-segment--amber';
        } else if (i === 2) {
          isActive = tiredness >= 11 && tiredness <= 15;
          mod = 'mx-penalty-segment--orange';
        } else if (i === 3) {
          displayVal = 'Bez';
          isActive = tiredness >= 16 && tiredness <= 20;
          mod = 'mx-penalty-segment--purple';
        } else if (i === 4) {
          displayVal = 'Smrt';
          isActive = tiredness >= 21;
          mod = 'mx-penalty-segment--danger';
        }
        return (
          <div
            key={`ti${i}`}
            className={`mx-penalty-segment ${isActive ? `is-active ${mod}` : ''}`}
            title={String(penalty)}
            aria-label={`Únava ${displayVal}${isActive ? ' (aktivní)' : ''}`}
          >
            {displayVal}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// C) Pressure card
// ════════════════════════════════════════════════════════════════

function PressureCard({ cda, disabled }: SubProps) {
  const { g, set } = cda;
  return (
    <div className="mx-card">
      <h2 className="mx-section-title">Přetlaky</h2>
      <div className="mx-pressure-list">
        {MATRIX_PRESSURE_TYPES.map((p) => {
          const current = parseInt(g(`pressure_${p.key}`, '-1'), 10);
          return (
            <div className="mx-pressure-row" key={p.key}>
              <span className="mx-pressure-row__label">{p.label}</span>
              <div
                className="mx-pressure-row__rail"
                role="group"
                aria-label={`Přetlak ${p.label}`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    className={`mx-pressure-segment ${current >= i ? 'is-active' : ''} ${i === 4 ? 'is-danger' : ''}`}
                    disabled={disabled}
                    onClick={() => {
                      if (current === i) {
                        set(`pressure_${p.key}`, '-1');
                      } else {
                        set(`pressure_${p.key}`, String(i));
                      }
                    }}
                    aria-label={`${p.label} přetlak ${i + 1} z 5`}
                    aria-pressed={current >= i}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// D) Generic data list (Languages / Abilities / Aspects)
// ════════════════════════════════════════════════════════════════

type DataListVariant = 'language' | 'ability' | 'aspect';

interface DataListCardProps extends SubProps {
  arrKey: string;
  title: string;
  template: MatrixTagValue;
  addLabel: string;
  variant: DataListVariant;
  /** 10.2c-edit-9g — onRoll callback (jen ability variant + tactical-map). */
  onRoll?: OnRoll;
}

function DataListCard({
  cda,
  disabled,
  arrKey,
  title,
  template,
  addLabel,
  variant,
  onRoll,
}: DataListCardProps) {
  const { parseJsonArr, updateArr, addArr, removeArr } = cda;
  const rows = parseJsonArr<MatrixTagValue>(arrKey);

  return (
    <div className="mx-card">
      <h3 className="mx-section-title mx-section-title--chip">{title}</h3>
      <div className="mx-data-list">
        {rows.map((row, i) => (
          <DataRow
            key={i}
            row={row}
            index={i}
            arrKey={arrKey}
            variant={variant}
            updateArr={updateArr}
            removeArr={removeArr}
            disabled={disabled}
            onRoll={onRoll}
          />
        ))}
      </div>
      {!disabled && (
        <button
          type="button"
          className="mx-btn mx-btn--ghost"
          onClick={() => addArr<MatrixTagValue>(arrKey, template)}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}

interface DataRowProps {
  row: MatrixTagValue;
  index: number;
  arrKey: string;
  variant: DataListVariant;
  updateArr: CdAccess['updateArr'];
  removeArr: CdAccess['removeArr'];
  disabled: boolean;
  onRoll?: OnRoll;
}

function DataRow({
  row,
  index,
  arrKey,
  variant,
  updateArr,
  removeArr,
  disabled,
  onRoll,
}: DataRowProps) {
  const isMagic =
    variant === 'ability' && MATRIX_MAGIC.includes(row.label);
  const isAspect = variant === 'aspect';
  const charged = row.value === 'Nabitý';

  const updateField = (field: 'label' | 'value', val: string) =>
    updateArr<MatrixTagValue>(arrKey, index, { [field]: val } as Partial<MatrixTagValue>);

  return (
    <div className="mx-data-row">
      {variant === 'language' && (
        <div className="mx-data-row__level">
          <input
            type="text"
            value={row.value}
            disabled={disabled}
            onChange={(e) => updateField('value', e.target.value)}
            placeholder="C"
            aria-label={`Úroveň jazyka ${index + 1}`}
          />
        </div>
      )}
      <div className="mx-data-row__value">
        <input
          type="text"
          className={isMagic ? 'is-magic' : ''}
          value={row.label}
          disabled={disabled}
          onChange={(e) => updateField('label', e.target.value)}
          aria-label={`${arrKey} ${index + 1} název`}
        />
      </div>
      {isMagic && (
        <span
          className="mx-magic-link"
          aria-label="Magická schopnost"
          title={`Magická: ${row.label}`}
        >
          📘
        </span>
      )}
      {variant === 'ability' && (
        <div className="mx-data-row__level">
          <input
            type="number"
            min={1}
            value={row.value}
            disabled={disabled}
            onChange={(e) => updateField('value', e.target.value)}
            aria-label={`Schopnost ${index + 1} úroveň`}
          />
        </div>
      )}
      {/* 10.2c-edit-9g — roll button (jen ability + tactical-map embed) */}
      {variant === 'ability' && onRoll && row.label && (
        <button
          type="button"
          onClick={() =>
            onRoll({
              label: row.label,
              modifier: parseInt(row.value, 10) || 0,
              kind: 'fate',
            })
          }
          style={{
            padding: '4px 10px',
            background: 'rgba(120, 200, 120, 0.18)',
            color: '#9ddf9d',
            border: '1px solid rgba(120, 200, 120, 0.5)',
            borderRadius: 4,
            font: 'inherit',
            fontSize: 13,
            cursor: 'pointer',
            minHeight: 30,
          }}
          title={`Hodit ${row.label} (4dF + ${row.value})`}
          aria-label={`Hodit ${row.label}`}
        >
          🎲
        </button>
      )}
      {isAspect && (
        <button
          type="button"
          className={`mx-state-chip ${charged ? 'mx-state-chip--charged' : 'mx-state-chip--depleted'} ${disabled ? 'is-disabled' : ''}`}
          disabled={disabled}
          onClick={() => updateField('value', charged ? 'Vybitý' : 'Nabitý')}
          aria-label={`Aspekt ${index + 1}: ${row.value}`}
          aria-pressed={charged}
        >
          {row.value || 'Vybitý'}
        </button>
      )}
      {!disabled && (
        <button
          type="button"
          className="mx-icon-btn"
          onClick={() => removeArr(arrKey, index)}
          aria-label={`Smazat ${arrKey} ${index + 1}`}
          title={`Smazat ${arrKey}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// E) Inventory editor
// ════════════════════════════════════════════════════════════════

function InventoryCard({ cda, disabled }: SubProps) {
  const { g, set } = cda;
  return (
    <div className="mx-card">
      <h2 className="mx-section-title">Výbava a poznámky</h2>
      <textarea
        className="mx-inventory-textarea"
        value={g('inventory')}
        disabled={disabled}
        onChange={(e) => set('inventory', e.target.value)}
        placeholder="Výbava postavy, poznámky, vztahy, RP detaily..."
        aria-label="Výbava a poznámky"
      />
    </div>
  );
}
