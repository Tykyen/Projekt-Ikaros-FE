/**
 * Shadowrun 6e bestie statblok — JEDNO sdílené UI (vzor `FateCombatBody`).
 *
 * Renderuje se identicky na taktické mapě (`ShadowrunBestiePanel`) i v chat
 * railu (`ShadowrunChatBestiePanel`) — liší se jen šířka sloupce (skill `system`
 * fáze 5: chat = týž panel, NE osekaná karta). Čistě presentational: data z
 * `shadowrunBestieView`, perzistenci/roll řeší volající přes callbacky.
 *
 * Klik na atribut/útok/dovednost = SR6 pool hod (`onRoll(label, pool)`).
 * Klik na box záznamníku = zranění/léčení (`onTogglePhys/Stun`), jen když canEdit.
 */
import type { ShadowrunBestieView } from './shadowrunBestieView';
import s from './ShadowrunBestieBody.module.css';

interface Props {
  view: ShadowrunBestieView;
  name: string;
  canEdit: boolean;
  /** Volitelné poznámky (katalog/chat je má; na mapě token ne). */
  notes?: string;
  /** SR6 pool hod (label + počet kostek po odečtení postihu). */
  onRoll: (label: string, pool: number) => void;
  /** Iniciativa = základ (REA+INT) + 1k6 (součet). */
  onInit: () => void;
  onTogglePhys: (i: number) => void;
  onToggleStun: (i: number) => void;
}

export function ShadowrunBestieBody({
  view,
  name,
  canEdit,
  notes,
  onRoll,
  onInit,
  onTogglePhys,
  onToggleStun,
}: Props): React.ReactElement {
  const eff = (pool: number): number => Math.max(0, pool - view.woundPen);

  return (
    <div className={s.root}>
      {/* hlavička */}
      <div className={s.head}>
        <div>
          <h2 className={s.name}>{name}</h2>
          {view.profile && <div className={s.sub}>{view.profile}</div>}
        </div>
        <button
          type="button"
          className={s.initBtn}
          onClick={onInit}
          title="Iniciativa = Reakce + Intuice + 1k6 (součet, pořadí v kole)"
        >
          ⚡ Inic. {view.initBase}+1k6
        </button>
      </div>

      {/* STAV */}
      <section className={`${s.sec} ${s.secFirst}`}>
        <h3 className={s.stitle}>Stav</h3>

        <div className={`${s.cond} ${s.condPhys}`}>
          <div className={s.chead}>
            <span className={s.clab}>⬡ Fyzický</span>
            <span className={s.cpen}>−{Math.floor((view.physMax - view.physCur) / 3)}</span>
          </div>
          <div className={s.track}>
            {view.physBoxes.map((b) => (
              <button
                key={b.idx}
                type="button"
                className={`${s.box} ${b.on ? s.boxOn : ''}`}
                disabled={!canEdit}
                onClick={() => onTogglePhys(b.idx)}
                aria-label={`Fyzický box ${b.idx + 1}`}
              >
                {(b.idx + 1) % 3 === 0 && <span className={s.mk}>−{(b.idx + 1) / 3}</span>}
              </button>
            ))}
          </div>
        </div>

        {view.stunMax > 0 && (
          <div className={`${s.cond} ${s.condStun}`} style={{ marginTop: 5 }}>
            <div className={s.chead}>
              <span className={s.clab}>◐ Omráčení</span>
              <span className={s.cpen}>−{Math.floor(view.stunCur / 3)}</span>
            </div>
            <div className={s.track}>
              {view.stunBoxes.map((b) => (
                <button
                  key={b.idx}
                  type="button"
                  className={`${s.box} ${b.on ? s.boxOn : ''}`}
                  disabled={!canEdit}
                  onClick={() => onToggleStun(b.idx)}
                  aria-label={`Box omráčení ${b.idx + 1}`}
                >
                  {(b.idx + 1) % 3 === 0 && <span className={s.mk}>−{(b.idx + 1) / 3}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={s.totpen}>
          Postih do poolů: <b>−{view.woundPen}</b>
        </div>

        <div className={s.chips}>
          <div className={`${s.chip} ${s.chipDef}`}>
            <span className={s.chipL}>Obrana</span>
            <span className={s.chipV}>{view.defense}</span>
          </div>
          <div className={`${s.chip} ${s.chipArm}`}>
            <span className={s.chipL}>Zbroj / HO</span>
            <span className={s.chipV}>{view.armor}</span>
          </div>
          <div className={`${s.chip} ${s.chipMov}`}>
            <span className={s.chipL}>Pohyb</span>
            <span className={s.chipV}>{view.movement}</span>
          </div>
          <div className={`${s.chip} ${s.chipIni}`}>
            <span className={s.chipL}>Iniciativa</span>
            <span className={s.chipV}>
              {view.initBase}
              <small>+1k6</small>
            </span>
          </div>
        </div>
      </section>

      {/* ATRIBUTY */}
      <section className={s.sec}>
        <h3 className={s.stitle}>
          Atributy <span className={s.stitleHint}>· klik = test atributu</span>
        </h3>
        <div className={s.attrs}>
          {view.attrs.map((a) => (
            <button
              key={a.key}
              type="button"
              className={`${s.attr} ${a.group === 'mental' ? s.attrMental : ''}`}
              onClick={() => onRoll(`Test ${a.label}`, eff(a.value))}
              title={`Test ${a.label} (${eff(a.value)}k6)`}
            >
              <div className={s.attrCode}>{a.code}</div>
              <div className={s.attrVal}>{a.value}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ÚTOKY */}
      {view.weapons.length > 0 && (
        <section className={s.sec}>
          <h3 className={`${s.stitle} ${s.stitleAtk}`}>Útoky</h3>
          <div className={s.rows}>
            {view.weapons.map((w, i) => {
              const pool = eff(w.pool);
              return (
                <button
                  key={i}
                  type="button"
                  className={`${s.rowbtn} ${s.rowbtnAtk}`}
                  onClick={() => onRoll(`Útok: ${w.name}`, pool)}
                >
                  <span className={s.rn}>
                    {w.name}
                    {w.type && <small>{w.type}</small>}
                  </span>
                  <span className={`${s.rchip} ${s.rchipDmg}`}>{w.dmg || '—'}</span>
                  <span className={s.rpool}>
                    <b>{pool}</b>
                    <small>k6</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* DOVEDNOSTI */}
      {view.skills.length > 0 && (
        <section className={s.sec}>
          <h3 className={s.stitle}>Dovednosti</h3>
          <div className={s.rows}>
            {view.skills.map((sk, i) => {
              const pool = eff(sk.pool);
              return (
                <button
                  key={i}
                  type="button"
                  className={s.rowbtn}
                  onClick={() => onRoll(sk.name, pool)}
                >
                  <span className={s.rn}>{sk.name}</span>
                  {sk.attr && <span className={s.rchip}>{sk.attr}</span>}
                  <span className={s.rpool}>
                    <b>{pool}</b>
                    <small>k6</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* SCHOPNOSTI */}
      {view.powers.length > 0 && (
        <section className={s.sec}>
          <h3 className={s.stitle}>Schopnosti</h3>
          <div className={s.rows}>
            {view.powers.map((p, i) => (
              <div key={i} className={s.power}>
                <div className={s.powerName}>{p.name}</div>
                {p.desc && <div className={s.powerDesc}>{p.desc}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* POZNÁMKY */}
      {notes?.trim() && (
        <section className={s.sec}>
          <h3 className={s.stitle}>Poznámky</h3>
          <div className={s.notes}>{notes}</div>
        </section>
      )}
    </div>
  );
}

export default ShadowrunBestieBody;
