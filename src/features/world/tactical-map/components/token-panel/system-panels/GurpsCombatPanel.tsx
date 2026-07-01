/**
 * GURPS 4E — kompaktní bojový panel (taktická mapa + chat rail).
 *
 * Ořez deníku na bojové minimum: stav (HP/FP ± + auto podmínky), iniciativa
 * (= Základní rychlost, GURPS nehází), modifikátor příštího hodu, útoky
 * (zásah 3k6 + škody), obrana (Úhyb/Kryt zbraní/Kryt štítem = 3k6, DR pasivní),
 * rychlé hody atributů (ST/DX/IQ/HT + Vůle/Vnímání) a dovednosti. Detaily =
 * celý `GurpsSheet` v modalu (jeden zdroj pravdy s deníkem).
 *
 * Data `diary.customData.gurps_*` (single source s `GurpsSheet`). Odvozené
 * hodnoty z `sheets/gurps/formulas` (0 drift). Hody přes `onRoll`:
 * `kind:'3d6'` + `target` = roll-under, `kind:'mixed'` {d6} = škody, `kind:'flat'`
 * = iniciativa. `canEdit === false` → jen Stav (privátní zbytek skrytý).
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
  GURPS_ARMOR_LOCS,
  GURPS_CORE_ATTRS,
  GURPS_SECONDARY,
  type GurpsMelee,
  type GurpsRanged,
  type GurpsSkill,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/gurps/constants';
import {
  basicSpeed,
  dodge as calcDodge,
  int,
  num,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/gurps/formulas';
import { GurpsSheet } from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/gurps/GurpsSheet';
import { Modal } from '@/shared/ui/Modal/Modal';
import type { MapToken } from '../../../types';
// Detaily modal reusuje deníkový sheet (.gurps-* scoped na [data-diary-system]).
import '@/features/world/pages/CharacterDetailPage/diary-systems/styles/gurps.css';
import s from './GurpsCombatPanel.module.css';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  canEdit: boolean;
  onRoll?: SystemSheetProps['onRoll'];
}

const DEBOUNCE_MS = 500;

/** Rozparsuje GURPS škody „NkM" (jen d6) → {count, mod} pro `mixed` hod. */
function parseDamage(dmg: string): { count: number; mod: number } | null {
  const m = dmg.match(/(\d+)\s*k\s*([+-]\s*\d+)?/i);
  if (!m) return null;
  const count = parseInt(m[1], 10);
  if (!Number.isFinite(count) || count <= 0) return null;
  const mod = m[2] ? parseInt(m[2].replace(/\s+/g, ''), 10) : 0;
  return { count, mod };
}

export function GurpsCombatPanel({
  token,
  worldId,
  canEdit,
  onRoll,
}: Props): React.ReactElement {
  const { data: diary, isLoading } = useCharacterDiary(
    worldId,
    token.characterSlug,
  );
  const updateMut = useUpdateCharacterDiary(worldId, token.characterSlug);

  const [pending, setPending] = useState<Record<string, unknown>>({});
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mod, setMod] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
  const cda: CdAccess = makeCdAccess(cd, 'gurps_', canEdit ? handleChange : undefined);
  const { g } = cda;

  // ── efektivní hodnoty (reuse formulas s deníkem) ──
  const st = int(g('st', '10'), 10);
  const dx = int(g('dx', '10'), 10);
  const iq = int(g('iq', '10'), 10);
  const ht = int(g('ht', '10'), 10);
  const willEff = g('will') ? int(g('will'), iq) : iq;
  const perEff = g('per') ? int(g('per'), iq) : iq;
  const speedComputed = basicSpeed(dx, ht);
  const speedEff = g('basic_speed') ? num(g('basic_speed'), speedComputed) : speedComputed;
  const dodgeComputed = calcDodge(speedEff);
  const dodgeEff = g('dodge') ? int(g('dodge'), dodgeComputed) : dodgeComputed;
  const hpMax = g('hp_max') ? int(g('hp_max'), st) : st;
  const hpCur = g('hp') ? int(g('hp'), hpMax) : hpMax;
  const fpMax = g('fp_max') ? int(g('fp_max'), ht) : ht;
  const fpCur = g('fp') ? int(g('fp'), fpMax) : fpMax;

  const reeling = hpMax > 0 && hpCur <= hpMax / 3 && hpCur > 0;
  const tired = fpMax > 0 && fpCur <= fpMax / 3 && fpCur > 0;
  const down = hpCur <= 0;
  const healthy = !reeling && !tired && !down;

  const skills = cda.parseJsonArr<GurpsSkill>('skills');
  const melee = cda.parseJsonArr<GurpsMelee>('melee');
  const ranged = cda.parseJsonArr<GurpsRanged>('ranged');
  const parry = g('parry');
  const block = g('block');

  // ── roll helpery ──
  const rollUnder = (label: string, target: number): void => {
    onRoll?.({ label, kind: '3d6', target: target + mod });
    if (mod !== 0) setMod(0);
  };
  const rollDamage = (label: string, dmg: string): void => {
    const d = parseDamage(dmg);
    if (!d) return;
    onRoll?.({ label, kind: 'mixed', mixed: { d6: d.count }, modifier: d.mod });
  };
  const rollInit = (): void => {
    onRoll?.({
      label: 'Iniciativa',
      kind: 'flat',
      modifier: Math.round(speedEff * 100) / 100,
      initiative: true,
    });
  };

  // ── HP/FP ± ──
  const setVital = (curKey: string, value: number, max: number): void => {
    if (!canEdit) return;
    const v = Math.min(max, value);
    cda.set(curKey, String(v));
  };

  const hpPct = hpMax > 0 ? Math.max(0, Math.min(100, (hpCur / hpMax) * 100)) : 0;
  const fpPct = fpMax > 0 ? Math.max(0, Math.min(100, (fpCur / fpMax) * 100)) : 0;

  const skillLevel = (weaponName: string): number | null => {
    const nm = weaponName.trim().toLowerCase();
    if (!nm) return null;
    const sk = skills.find((x) => (x.name || '').trim().toLowerCase() === nm);
    return sk && sk.lvl ? int(sk.lvl) : null;
  };

  const canRoll = !!onRoll;

  return (
    <div className={s.root} data-down={down || undefined}>
      {/* HEAD */}
      <div className={s.head}>
        <div className={s.ava}>{(g('name') || 'G').slice(0, 1).toUpperCase()}</div>
        <div className={s.hcol}>
          <div className={s.nm}>{g('name') || 'Postava'}</div>
          <div className={s.sub}>GURPS · TL {g('tl') || '—'}</div>
        </div>
        <div className={s.spd}>
          <div className={s.spdK}>Rychlost</div>
          <div className={s.spdN}>{String(speedEff).replace('.', ',')}</div>
        </div>
      </div>

      {/* VITALS (vidí i cizí) */}
      <section className={s.sec}>
        <div className={s.bar}>
          <div className={s.barTop}>
            <span className={s.barLab}>HP — Životy</span>
            <span className={s.barVal}>
              {hpCur} / {hpMax}
            </span>
          </div>
          <div className={s.track}>
            <div className={`${s.fill} ${s.fillHp}`} style={{ width: `${hpPct}%` }} />
          </div>
          {canEdit && (
            <div className={s.steppers}>
              <button type="button" className={s.dmg} onClick={() => setVital('hp', hpCur - 5, hpMax)}>−5</button>
              <button type="button" className={s.dmg} onClick={() => setVital('hp', hpCur - 1, hpMax)}>−1</button>
              <button type="button" className={s.heal} onClick={() => setVital('hp', hpCur + 1, hpMax)}>+1</button>
              <button type="button" className={s.heal} onClick={() => setVital('hp', hpCur + 5, hpMax)}>+5</button>
            </div>
          )}
        </div>
        <div className={s.bar}>
          <div className={s.barTop}>
            <span className={s.barLab}>FP — Únava</span>
            <span className={s.barVal}>
              {fpCur} / {fpMax}
            </span>
          </div>
          <div className={s.track}>
            <div className={`${s.fill} ${s.fillFp}`} style={{ width: `${fpPct}%` }} />
          </div>
          {canEdit && (
            <div className={s.steppers}>
              <button type="button" className={s.dmg} onClick={() => setVital('fp', fpCur - 1, fpMax)}>−1</button>
              <button type="button" className={s.heal} onClick={() => setVital('fp', fpCur + 1, fpMax)}>+1</button>
            </div>
          )}
        </div>
        <div className={s.conds}>
          {healthy && <span className={`${s.pill} ${s.ok}`}>✓ V pořádku</span>}
          {reeling && <span className={`${s.pill} ${s.warn}`}>Zmožen (Pohyb/Úhyb ½)</span>}
          {tired && <span className={`${s.pill} ${s.warn}`}>Vyčerpán (½ Pohyb/ST)</span>}
          {down && <span className={`${s.pill} ${s.crit}`}>Bezvědomí — hoď HT</span>}
        </div>
      </section>

      {canEdit && (
        <>
          {/* INIT + MODIFIER */}
          <section className={s.sec}>
            <button
              type="button"
              className={s.initBtn}
              onClick={rollInit}
              disabled={!canRoll}
              title="Iniciativa = Základní rychlost (GURPS nehází, pořadí dle rychlosti)"
            >
              ⚑ Do iniciativy = {String(speedEff).replace('.', ',')}
            </button>
            <div className={s.modRow}>
              <span className={s.modLab}>Modifikátor příštího hodu</span>
              <div className={s.mod}>
                <button type="button" onClick={() => setMod((m) => m - 1)} aria-label="Snížit modifikátor">−</button>
                <span className={s.modNum}>{mod > 0 ? `+${mod}` : mod}</span>
                <button type="button" onClick={() => setMod((m) => m + 1)} aria-label="Zvýšit modifikátor">+</button>
              </div>
            </div>
            <div className={s.chips}>
              <button type="button" className={s.chip} onClick={() => setMod(4)}>Útok naplno +4</button>
              <button type="button" className={s.chip} onClick={() => setMod(0)}>Nulovat</button>
            </div>
          </section>

          {/* ÚTOK */}
          {(melee.length > 0 || ranged.length > 0) && (
            <section className={s.sec}>
              <h4 className={s.secH}>
                Útok <span className={s.hint}>klik = hod / škody</span>
              </h4>
              {melee.map((w, i) => {
                const hit = skillLevel(w.name || '');
                return (
                  <div className={s.roll} key={`m${i}`}>
                    <span className={s.rollNm}>
                      {w.name || '—'}
                      <small>{[w.reach && `dosah ${w.reach}`, w.parry && `kryt ${w.parry}`].filter(Boolean).join(' · ')}</small>
                    </span>
                    {hit !== null && (
                      <button type="button" className={s.tgt} disabled={!canRoll} aria-label={`${w.name} zásah`} onClick={() => rollUnder(`Útok: ${w.name}`, hit)}>
                        zásah <b>{hit + mod}</b>
                      </button>
                    )}
                    {parseDamage(w.dmg || '') && (
                      <button type="button" className={`${s.tgt} ${s.dmgBtn}`} disabled={!canRoll} aria-label={`${w.name} škody`} onClick={() => rollDamage(`${w.name} (škody)`, w.dmg || '')}>
                        {w.dmg}
                      </button>
                    )}
                  </div>
                );
              })}
              {ranged.map((w, i) => {
                const hit = skillLevel(w.name || '');
                return (
                  <div className={s.roll} key={`r${i}`}>
                    <span className={s.rollNm}>
                      {w.name || '—'}
                      <small>{[w.acc && `přs ${w.acc}`, w.range && `dostřel ${w.range}`].filter(Boolean).join(' · ')}</small>
                    </span>
                    {hit !== null && (
                      <button type="button" className={s.tgt} disabled={!canRoll} onClick={() => rollUnder(`Střelba: ${w.name}`, hit)}>
                        zásah <b>{hit + mod}</b>
                      </button>
                    )}
                    {parseDamage(w.dmg || '') && (
                      <button type="button" className={`${s.tgt} ${s.dmgBtn}`} disabled={!canRoll} onClick={() => rollDamage(`${w.name} (škody)`, w.dmg || '')}>
                        {w.dmg}
                      </button>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* OBRANA */}
          <section className={s.sec}>
            <h4 className={s.secH}>
              Obrana <span className={s.hint}>klik = 3k6</span>
            </h4>
            <div className={s.def3}>
              <button type="button" className={s.def} disabled={!canRoll} onClick={() => rollUnder('Úhyb', dodgeEff)}>
                <div className={s.defN}>{dodgeEff}</div>
                <div className={s.defK}>Úhyb</div>
              </button>
              <button
                type="button"
                className={`${s.def} ${parry ? '' : s.defOff}`}
                disabled={!canRoll || !parry}
                onClick={() => parry && rollUnder('Kryt zbraní', int(parry))}
              >
                <div className={s.defN}>{parry || '—'}</div>
                <div className={s.defK}>Kryt zbraní</div>
              </button>
              <button
                type="button"
                className={`${s.def} ${block ? '' : s.defOff}`}
                disabled={!canRoll || !block}
                onClick={() => block && rollUnder('Kryt štítem', int(block))}
              >
                <div className={s.defN}>{block || '—'}</div>
                <div className={s.defK}>Kryt štítem</div>
              </button>
            </div>
            <div className={s.drline}>
              Zbroj <b>DR</b>:{' '}
              {GURPS_ARMOR_LOCS.map((l) => `${l.label} ${g(`dr_${l.key}`, '0')}`).join(' · ')}
            </div>
          </section>

          {/* RYCHLÉ HODY */}
          <section className={s.sec}>
            <h4 className={s.secH}>
              Rychlé hody <span className={s.hint}>3k6 ≤ atribut</span>
            </h4>
            <div className={s.attrs}>
              {GURPS_CORE_ATTRS.map((a) => {
                const v = int(g(a.key, '10'), 10);
                return (
                  <button key={a.key} type="button" className={s.qa} disabled={!canRoll} aria-label={`Hod na ${a.label}`} onClick={() => rollUnder(a.label, v)}>
                    <div className={s.qaK}>{a.abbr}</div>
                    <div className={s.qaN}>{v}</div>
                  </button>
                );
              })}
              {GURPS_SECONDARY.map((sec) => {
                const v = sec.key === 'will' ? willEff : perEff;
                return (
                  <button key={sec.key} type="button" className={`${s.qa} ${s.qaHot}`} disabled={!canRoll} aria-label={`Hod na ${sec.label}`} onClick={() => rollUnder(sec.label, v)}>
                    <div className={s.qaK}>{sec.abbr}</div>
                    <div className={s.qaN}>{v}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* DOVEDNOSTI */}
          {skills.length > 0 && (
            <section className={s.sec}>
              <h4 className={s.secH}>
                Dovednosti <span className={s.hint}>klik = hod</span>
              </h4>
              <div className={s.skills}>
                {skills.map((sk, i) => (
                  <button key={i} type="button" className={s.skl} disabled={!canRoll || !sk.lvl} onClick={() => rollUnder(sk.name || 'Dovednost', int(sk.lvl))}>
                    <span className={s.sklNm}>{sk.name || '—'}</span>
                    <span className={s.sklLv}>{sk.lvl || '—'}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <button type="button" className={s.detailsBtn} onClick={() => setDetailsOpen(true)}>
            ☰ Detaily / celý deník
          </button>
        </>
      )}

      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Deník postavy"
        size="lg"
        ariaLabel="Detail postavy"
      >
        <div className={s.modalScope} data-diary-system="gurps">
          <GurpsSheet
            diary={{ ...diary, customData: cd }}
            mode={canEdit ? 'edit' : 'view'}
            onChange={canEdit ? handleChange : undefined}
            worldId={worldId}
            worldSlug=""
            characterSlug={token.characterSlug}
          />
        </div>
      </Modal>
    </div>
  );
}

export default GurpsCombatPanel;
