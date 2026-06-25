/**
 * 16.2b-mapa — sdílená karta kouzla DrD 1.6 (spellbook).
 *
 * Jedna komponenta pro VIEW i EDIT, reuse v listu (`Drd16Sheet` sekce
 * „Kouzla / Spellbook") i v okně „Kouzla" combat panelu na taktické mapě.
 * Jediný zdroj dat = `customData.spells` (JSON pole `Drd16Spell[]`); zápis
 * řeší volající přes `onChange` (delta patch) — list cdAccess.updateArr,
 * panel debounced writeField.
 *
 * Self-contained fantasy pergamen (vlastní `.module.css`), ať vypadá stejně
 * v listu i v portálovaném modálu (mimo `[data-diary-system]` scope). Skin
 * tokenizace = 16.2c-drd16.
 */
import {
  DRD16_SPELL_FIELDS,
  type Drd16Spell,
} from './constants';
import styles from './Drd16SpellCard.module.css';

interface Props {
  spell: Drd16Spell;
  editable: boolean;
  onChange?: (patch: Partial<Drd16Spell>) => void;
  onRemove?: () => void;
}

export function Drd16SpellCard({
  spell,
  editable,
  onChange,
  onRemove,
}: Props): React.ReactElement {
  const set =
    (key: keyof Drd16Spell) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void =>
      onChange?.({ [key]: e.target.value });

  if (editable) {
    return (
      <div className={styles.card}>
        <div className={styles.topEdit}>
          <input
            className={styles.nameInput}
            value={spell.name}
            placeholder="Název kouzla"
            onChange={set('name')}
            aria-label="Název kouzla"
          />
          <input
            className={styles.incantInput}
            value={spell.incantation}
            placeholder="Zaklínadlo"
            onChange={set('incantation')}
            aria-label="Zaklínadlo"
          />
          <input
            className={styles.domainInput}
            value={spell.domain}
            placeholder="Obor"
            onChange={set('domain')}
            aria-label="Obor magie"
          />
          {onRemove && (
            <button
              type="button"
              className={styles.remove}
              onClick={onRemove}
              aria-label="Smazat kouzlo"
            >
              ✕
            </button>
          )}
        </div>
        <div className={styles.grid}>
          {DRD16_SPELL_FIELDS.map((f) => (
            <label key={f.key} className={styles.fieldEdit}>
              <span className={styles.k}>{f.label}</span>
              <input
                value={spell[f.key]}
                onChange={set(f.key)}
                aria-label={f.label}
              />
            </label>
          ))}
        </div>
        <textarea
          className={styles.descInput}
          value={spell.description}
          placeholder="Popis účinku kouzla…"
          onChange={set('description')}
          aria-label="Popis kouzla"
        />
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.name}>{spell.name || '(bez názvu)'}</span>
        {spell.incantation && (
          <span className={styles.incant}>{spell.incantation}</span>
        )}
        {spell.domain && <span className={styles.domain}>{spell.domain}</span>}
      </div>
      <div className={styles.grid}>
        {DRD16_SPELL_FIELDS.filter((f) => spell[f.key]).map((f) => (
          <div key={f.key} className={styles.field}>
            <span className={styles.k}>{f.label}</span>
            <span
              className={`${styles.v} ${f.key === 'mana' ? styles.mana : ''}`.trim()}
            >
              {spell[f.key]}
            </span>
          </div>
        ))}
      </div>
      {spell.description && (
        <div className={styles.desc}>{spell.description}</div>
      )}
    </div>
  );
}
