/**
 * Shadowrun 6e — kompaktní combat panel (taktická mapa + chat rail).
 *
 * Bojové jádro vždy nahoře (stav · atributy · odvozené · útoky · dovednosti),
 * detaily (Kouzla/Matrix/Augmentace/Kvality/Kontakty/Identita) v centrovaném
 * `Modal`u, který **reusuje deníkové sekce** (`ShadowrunSheet` exporty) v edit
 * módu → jeden zdroj pravdy s listem (vzor DrD+ `DrdPlusCombatPanel`).
 *
 * Hody: klik na atribut/dovednost/útok = SR6 **pool** (`kind:'pool-d6'` + `pool`)
 * → úspěchy (5–6) + glitch v dicelogu. Iniciativa = Reakce+Intuice + 1k6
 * (součet, `kind:'d6'`). Matematika ze sdíleného `shared.ts` (0 drift s deníkem).
 *
 * Data flow vzorem `DrdPlusCombatPanel`: `useCharacterDiary` → debounced
 * (~500 ms) `useUpdateCharacterDiary({customDataPatch})`. `canEdit === false`
 * → jen Stav (readonly), zbytek skrytý (privátní).
 */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import type { SystemSheetProps } from '@/features/world/pages/CharacterDetailPage/diary-systems/types';
import {
  makeCdAccess,
  type CdAccess,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/_shared/cdAccess';
import {
  SR_CORE_ATTRS,
  SR_ATTR_BY_KEY,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/shadowrun/constants';
import {
  readAttrs,
  poolOf,
  woundPenalty,
  armorTotalOf,
  srDerived,
  int,
  type SrSkill,
  type SrWeapon,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/shadowrun/shared';
import {
  MagicPanel,
  MatrixPanel,
  AugPanel,
  QualitiesPanel,
  ContactsPanel,
  IdentityPanel,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/shadowrun/ShadowrunSheet';
import { Modal } from '@/shared/ui/Modal/Modal';
import type { MapToken } from '../../../types';
// Detail okna reusují deníkové sekce (.sr-* třídy scoped na [data-diary-system='shadowrun']).
import '@/features/world/pages/CharacterDetailPage/diary-systems/styles/shadowrun.css';
import s from './ShadowrunCombatPanel.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  canEdit: boolean;
  onRoll?: SystemSheetProps['onRoll'];
}

const DEBOUNCE_MS = 500;

type DetailKey = 'kouzla' | 'matrix' | 'aug' | 'kvality' | 'kontakty' | 'identita';
const DETAILS: { key: DetailKey; icon: string; label: string; arr?: string }[] = [
  { key: 'kouzla', icon: '✦', label: 'Kouzla', arr: 'spells' },
  { key: 'matrix', icon: '▣', label: 'Matrix' },
  { key: 'aug', icon: '⚙', label: 'Augmentace', arr: 'aug' },
  { key: 'kvality', icon: '◆', label: 'Kvality', arr: 'qualities' },
  { key: 'kontakty', icon: '☎', label: 'Kontakty', arr: 'contacts' },
  { key: 'identita', icon: '🪪', label: 'Identita' },
];

export function ShadowrunCombatPanel({
  token,
  worldId,
  canEdit,
  onRoll,
}: Props): React.ReactElement {
  const { data: diary, isLoading } = useCharacterDiary(worldId, token.characterSlug);
  const updateMut = useUpdateCharacterDiary(worldId, token.characterSlug);

  const [pending, setPending] = useState<Record<string, unknown>>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [win, setWin] = useState<DetailKey | null>(null);

  useEffect(
    () => () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
    },
    [],
  );

  function scheduleFlush(next: Record<string, unknown>): void {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      if (Object.keys(next).length === 0) return;
      updateMut.mutate(
        { customDataPatch: next },
        {
          onSuccess: () => setPending({}),
          onError: (e) =>
            toast.error(
              `Uložení selhalo: ${e instanceof Error ? e.message : 'neznámá chyba'}`,
            ),
        },
      );
    }, DEBOUNCE_MS);
  }

  if (isLoading) {
    return (
      <div className={s.root}>
        <div className={s.loading}>Načítám deník…</div>
      </div>
    );
  }
  if (!diary) {
    return (
      <div className={s.root}>
        <div className={s.empty}>Deník postavy nedostupný.</div>
      </div>
    );
  }

  const cd: Record<string, unknown> = { ...(diary.customData ?? {}), ...pending };
  const handleChange: SystemSheetProps['onChange'] = (nextChange) => {
    if (!('customDataPatch' in nextChange)) return;
    setPending((prev) => {
      const merged = { ...prev, ...nextChange.customDataPatch };
      scheduleFlush(merged);
      return merged;
    });
  };
  const cda: CdAccess = makeCdAccess(cd, 'sr_', canEdit ? handleChange : undefined);
  const { g, set } = cda;

  const attrs = readAttrs(cda);
  const physFilled = int(g('cond_phys', '0'));
  const stunFilled = int(g('cond_stun', '0'));
  const woundPen = woundPenalty(physFilled, stunFilled);
  const armorTotal = armorTotalOf(cda);
  const d = srDerived(attrs, armorTotal);
  const edgeMax = int(g('attr_edg', '0'));
  const edgeCur = int(g('edge_cur', '0'));

  const rollPool = (label: string, pool: number): void => {
    onRoll?.({ label, kind: 'pool-d6', pool: Math.max(0, pool) });
  };
  const rollInit = (): void => {
    onRoll?.({ label: 'Iniciativa', modifier: d.init, kind: 'd6', initiative: true });
  };
  const toggleBox = (field: string, filled: number, i: number): void => {
    if (!canEdit) return;
    set(field, String(i + 1 === filled ? i : i + 1));
  };

  const skills = cda.parseJsonArr<SrSkill>('skills');
  const weapons = cda.parseJsonArr<SrWeapon>('weapons');
  const active = win
    ? DETAILS.find((x) => x.key === win) ?? null
    : null;

  return (
    <div className={s.root}>
      {onRoll && (
        <div className={s.phead}>
          <button
            type="button"
            className={s.initBtn}
            onClick={rollInit}
            title="Iniciativa = Reakce + Intuice + 1k6 (součet, pořadí v kole)"
          >
            ⚡ Iniciativa {d.init}+1k6
          </button>
        </div>
      )}

      {/* ───── STAV (vidí i cizí hráč) ───── */}
      <section className={`${s.sec} ${s.first}`}>
        <h3 className={s.stitle}>Stav</h3>
        <CondTrack
          kind="phys"
          label="⬡ Fyzický"
          filled={physFilled}
          size={d.physMax}
          penalty={Math.floor(physFilled / 3)}
          canEdit={canEdit}
          onToggle={(i) => toggleBox('cond_phys', physFilled, i)}
        />
        <CondTrack
          kind="stun"
          label="◐ Omráčení"
          filled={stunFilled}
          size={d.stunMax}
          penalty={Math.floor(stunFilled / 3)}
          canEdit={canEdit}
          onToggle={(i) => toggleBox('cond_stun', stunFilled, i)}
        />
        <div className={s.penTotal}>
          Postih do poolů: <b>−{woundPen}</b>
        </div>
        <div className={s.chips}>
          <div className={`${s.chip} ${s.edge}`}>
            <span className={s.l}>Hrana</span>
            <span className={s.v}>
              {canEdit ? (
                <input
                  value={g('edge_cur')}
                  onChange={(e) => set('edge_cur', e.target.value)}
                  aria-label="Hrana aktuální"
                />
              ) : (
                edgeCur
              )}
              <small style={{ color: 'var(--mx-dim, #444b63)' }}>/{edgeMax || '—'}</small>
            </span>
          </div>
          <div className={`${s.chip} ${s.def}`}>
            <span className={s.l}>Obrana</span>
            <span className={s.v}>{d.dr}</span>
          </div>
          <div className={`${s.chip} ${s.arm}`}>
            <span className={s.l}>Zbroj</span>
            <span className={s.v}>+{armorTotal}</span>
          </div>
          <div className={`${s.chip} ${s.ess}`}>
            <span className={s.l}>Esence</span>
            <span className={s.v}>{g('attr_ess') || '0'}</span>
          </div>
        </div>
      </section>

      {/* cizí hráč → konec (Stav je vše co vidí) */}
      {canEdit && (
        <>
          {/* ───── ATRIBUTY (klik = test) ───── */}
          <section className={s.sec}>
            <h3 className={s.stitle}>
              Atributy <span className={s.hint}>klik = test</span>
            </h3>
            <div className={s.attrs}>
              {SR_CORE_ATTRS.map((a) => {
                const v = attrs[a.key] ?? 0;
                return (
                  <button
                    key={a.key}
                    type="button"
                    className={`${s.attr} ${a.group === 'mental' ? s.mental : ''} ${onRoll ? s.click : ''}`}
                    disabled={!onRoll}
                    onClick={() => rollPool(`Test ${a.code}`, v - woundPen)}
                    title={onRoll ? `Test ${a.label} (${Math.max(0, v - woundPen)}k6)` : a.label}
                  >
                    <div className={s.c}>{a.code}</div>
                    <div className={s.v}>{v}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ───── ODVOZENÉ ───── */}
          <section className={s.sec}>
            <h3 className={s.stitle}>Odvozené</h3>
            <div className={s.derv}>
              <Derv label="Iniciativa" value={`${d.init}`} sub="+1k6" />
              <Derv label="Obrana" value={`${d.dr}`} />
              <Derv label="Composure" value={`${d.composure}`} />
              <Derv label="Odhad lidí" value={`${d.judge}`} />
              <Derv label="Paměť" value={`${d.memory}`} />
              <Derv label="Zvedání" value={`${d.lift}`} />
            </div>
          </section>

          {/* ───── ÚTOKY ───── */}
          {weapons.length > 0 && (
            <section className={s.sec}>
              <h3 className={`${s.stitle} ${s.atk}`}>Útoky</h3>
              {weapons.map((w, i) => {
                const pool = poolOf(attrs, w.attr, w.val, w.spec, woundPen);
                return (
                  <button
                    key={i}
                    type="button"
                    className={`${s.rowbtn} ${s.atk}`}
                    disabled={!onRoll}
                    onClick={() => rollPool(`Útok: ${w.name || 'Zbraň'}`, pool)}
                  >
                    <span className={s.rn}>
                      {w.name || '—'}
                      <small>
                        {[w.type, w.ar && `HÚ ${w.ar}`].filter(Boolean).join(' · ')}
                      </small>
                    </span>
                    <span className={`${s.rchip} ${s.dmg}`}>{w.dmg || '—'}</span>
                    <span className={s.rpool}>
                      <b>{pool}</b>
                      <small>k6</small>
                      <span className={s.die}>🎲</span>
                    </span>
                  </button>
                );
              })}
            </section>
          )}

          {/* ───── DOVEDNOSTI ───── */}
          {skills.length > 0 && (
            <section className={s.sec}>
              <h3 className={s.stitle}>Dovednosti</h3>
              {skills.map((sk, i) => {
                const pool = poolOf(attrs, sk.attr, sk.val, sk.spec, woundPen);
                return (
                  <button
                    key={i}
                    type="button"
                    className={s.rowbtn}
                    disabled={!onRoll}
                    onClick={() => rollPool(sk.name || 'Dovednost', pool)}
                  >
                    <span className={s.rn}>
                      {sk.name || '—'}
                      {sk.spec && <small>spec.: {sk.spec} (+2)</small>}
                    </span>
                    <span className={s.rchip}>{SR_ATTR_BY_KEY[sk.attr]?.code ?? '?'}</span>
                    <span className={s.rpool}>
                      <b>{pool}</b>
                      <small>k6</small>
                      <span className={s.die}>🎲</span>
                    </span>
                  </button>
                );
              })}
            </section>
          )}

          {/* ───── DETAILY → centrovaný modal ───── */}
          <section className={s.sec}>
            <h3 className={s.stitle}>Detaily</h3>
            <div className={s.openbtns}>
              {DETAILS.map((it) => {
                const cnt = it.arr ? cda.parseJsonArr(it.arr).length : 0;
                return (
                  <button
                    key={it.key}
                    type="button"
                    className={s.openbtn}
                    onClick={() => setWin(it.key)}
                  >
                    <span>{it.icon}</span>
                    {it.label}
                    {it.arr && cnt > 0 && <span className={s.cnt}>{cnt}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

      <Modal
        open={!!win}
        onClose={() => setWin(null)}
        title={active?.label ?? ''}
        size="lg"
        ariaLabel="Detail postavy"
      >
        <div className={s.modalScope} data-diary-system="shadowrun">
          {win === 'kouzla' && <MagicPanel cda={cda} editing={canEdit} />}
          {win === 'matrix' && <MatrixPanel cda={cda} editing={canEdit} />}
          {win === 'aug' && <AugPanel cda={cda} editing={canEdit} />}
          {win === 'kvality' && <QualitiesPanel cda={cda} editing={canEdit} />}
          {win === 'kontakty' && <ContactsPanel cda={cda} editing={canEdit} />}
          {win === 'identita' && <IdentityPanel cda={cda} editing={canEdit} />}
        </div>
      </Modal>
    </div>
  );
}

// ── Sub-komponenty ──────────────────────────────────────────────
function Derv({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}): React.ReactElement {
  return (
    <div className={s.d}>
      <span className={s.l}>{label}</span>
      <span className={s.v}>
        {value} {sub && <small>{sub}</small>}
      </span>
    </div>
  );
}

function CondTrack({
  kind,
  label,
  filled,
  size,
  penalty,
  canEdit,
  onToggle,
}: {
  kind: 'phys' | 'stun';
  label: string;
  filled: number;
  size: number;
  penalty: number;
  canEdit: boolean;
  onToggle: (i: number) => void;
}): React.ReactElement {
  return (
    <div className={s.cond}>
      <div className={s.chead}>
        <span className={`${s.clab} ${kind === 'phys' ? s.phys : s.stun}`}>{label}</span>
        <span className={s.cpen}>−{penalty}</span>
      </div>
      <div className={s.track}>
        {Array.from({ length: Math.max(size, filled) }, (_, i) => (
          <button
            type="button"
            key={i}
            className={`${s.box} ${canEdit ? s.click : ''} ${
              i < filled ? (kind === 'phys' ? s.onPhys : s.onStun) : ''
            }`}
            disabled={!canEdit}
            onClick={() => onToggle(i)}
            aria-label={`${label} box ${i + 1}`}
            aria-pressed={i < filled}
          />
        ))}
      </div>
    </div>
  );
}

export default ShadowrunCombatPanel;
