import { worldStubMap, type WorldStubArea } from '../worldStubMap';
import s from './WorldStubPage.module.css';

interface Props {
  /** Klíč sekce — metadata (název, krok) se čtou z `worldStubMap`. */
  area: WorldStubArea;
}

/**
 * Spec 5.1 — jednotný placeholder nehotové sekce světa. Nahrazuje 22 holých
 * `[stub]` stránek. Sděluje uživateli, co kde čekat a v jakém kroku roadmapy
 * sekce přijde. Reuse skin tokenů — žádné hardcoded barvy.
 */
export function WorldStubPage({ area }: Props) {
  const meta = worldStubMap[area];

  return (
    <section className={s.card} data-elev="panel">
      <div className={s.icon} aria-hidden="true">
        🚧
      </div>
      <h2 className={s.title}>{meta.title}</h2>
      <p className={s.lead}>
        Tato sekce bude dostupná s krokem <strong>{meta.step}</strong>.
      </p>
      {meta.note && <p className={s.note}>{meta.note}</p>}
    </section>
  );
}
