/**
 * 16.2b-chat (dluh D-NEW-CHAT-BESTIE-MATRIX-UNIFY) — Matrix bestie panel v railu
 * chatu, drd16-style (sjednocení dle přání uživatele).
 *
 * Stejný princip jako `Drd16ChatBestiePanel`: **klik přímo na schopnost = hod**
 * (4dF + stupeň, ŽÁDNÁ ikona kostky), **Životy klik ±**, detailní edit statů
 * přes „✏ Upravit" modal (ne inline). Vizuál = mapový `MatrixBestiePanel`
 * (reuse `--mx-*` HUD CSS) + skin viewera přes `DiarySkinScope` (obal rodič).
 *
 * Liší se od mapy:
 *   - Hody přes `useChatDiaryRoll` (overlay + zpráva), NE `onMapRoll`.
 *   - **Životy = jedno číslo `health.current`** + ± (clamp 0..max) — chat tracker
 *     (mapa drží odvozené HP max+zbroj−zranění; zde zjednodušeno jako u drd16).
 *   - Iniciativa → `onResult(total)` → `onPatch({initiative})` (souboj lišta).
 *   - Edit → patch combatanta (`onPatch`), ne token.
 */
import { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  MATRIX_SKILL_MAX_NPC,
  matrixLevelName,
} from '@/features/world/pages/CharacterDetailPage/diary-systems/sheets/matrix/constants';
import mx from '@/features/world/tactical-map/components/token-panel/system-panels/MatrixBestiePanel.module.css';
import { useChatDiaryRoll } from './useChatDiaryRoll';
import { MatrixChatBestieEditModal } from './MatrixChatBestieEditModal';
import type { MatrixChatBestiePatch } from './MatrixChatBestieEditModal';
import styles from './MatrixChatBestiePanel.module.css';

interface Props {
  worldId: string;
  channelId: string | null;
  systemId: string;
  rollerName: string;
  avatarUrl?: string;
  systemStats: Record<string, unknown>;
  abilities: { name: string; description: string }[];
  notes?: string;
  /** Instance PJ — smí HP ± + „✏ Upravit". Katalog = false. */
  canEdit: boolean;
  /** Persist patch na combatanta (instance). Bez něj = read-only katalog. */
  onPatch?: (patch: MatrixChatBestiePatch) => void;
}

const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

const lvlVar = (lvl: number): string =>
  `var(--lvl-${Math.min(Math.max(lvl, 1), 10)})`;

export function MatrixChatBestiePanel({
  worldId,
  channelId,
  systemId,
  rollerName,
  avatarUrl,
  systemStats,
  abilities,
  notes,
  canEdit,
  onPatch,
}: Props): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const makeOnRoll = useChatDiaryRoll(worldId, channelId);
  const onRoll = makeOnRoll({ kind: 'bestie', rollerName, avatarUrl });

  const ss = systemStats ?? {};
  const num = (key: string, fb = 0): number => {
    const v = ss[key];
    const n = typeof v === 'number' ? v : parseInt(String(v ?? fb), 10);
    return Number.isFinite(n) ? n : fb;
  };

  const maxHp = num('health.max', 10);
  const current = clamp(num('health.current', maxHp), 0, maxHp);
  const initBase = num('initiative.base', 0);
  const interactive = !!channelId;
  const editable = canEdit && !!onPatch;

  const hpMod =
    current >= Math.ceil(maxHp * 0.6)
      ? ''
      : current >= Math.ceil(maxHp * 0.3)
        ? 'warn'
        : 'crit';

  const doRoll = (label: string, modifier: number): void => {
    onRoll({ label, modifier, kind: 'fate' });
  };

  const rollInitiative = (): void => {
    onRoll({ label: 'Iniciativa', modifier: initBase, kind: 'fate' }, (total) =>
      onPatch?.({ initiative: total }),
    );
  };

  const adjustHp = (delta: number): void => {
    if (!editable) return;
    const next = clamp(current + delta, 0, maxHp);
    onPatch?.({ systemStats: { ...ss, 'health.current': next } });
  };

  return (
    <div className={mx.panel}>
      {interactive && (
        <button
          type="button"
          className={styles.initBtn}
          onClick={rollInitiative}
          title={`Hodit iniciativu (4dF + ${initBase})`}
        >
          ⚡ Iniciativa
        </button>
      )}

      {editable && (
        <button
          type="button"
          className={styles.editBtn}
          onClick={() => setEditing(true)}
          title="Upravit tuto bestii (jméno, staty, schopnosti, popis)"
        >
          ✏ Upravit bestii
        </button>
      )}

      <section className={mx.section}>
        <div className={mx.hpHead}>
          <span className={mx.hpLab}>❤ Životy</span>
          <span className={mx.hpNum}>
            {current}
            <small>/{maxHp}</small>
          </span>
        </div>
        <div className={mx.track}>
          {Array.from({ length: Math.max(0, maxHp) }).map((_, i) => (
            <i
              key={i}
              className={mx.seg}
              data-on={i < current}
              data-mod={i < current ? hpMod : ''}
            />
          ))}
        </div>
        {editable && (
          <div className={styles.steps}>
            {[-5, -1, 1, 5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => adjustHp(d)}
                aria-label={`Životy ${d > 0 ? '+' : ''}${d}`}
              >
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={mx.section}>
        <h3 className={mx.title}>
          Schopnosti <small className={styles.hint}>klik = hod (4dF)</small>
        </h3>
        {abilities.length === 0 && (
          <p className={styles.empty}>Žádné schopnosti.</p>
        )}
        <div className={mx.list}>
          {abilities.map((a, i) => {
            const lvl = parseInt(a.description, 10) || 0;
            const total = Math.max(MATRIX_SKILL_MAX_NPC, lvl);
            return (
              <button
                key={i}
                type="button"
                className={`${mx.skill} ${styles.skillBtn}`}
                disabled={!interactive}
                style={{ ['--lvlc' as string]: lvlVar(lvl) } as CSSProperties}
                onClick={() => doRoll(a.name || 'schopnost', lvl)}
                title={`Hodit ${a.name || '?'} (4dF + ${lvl})`}
                aria-label={`Hodit ${a.name || 'schopnost'}`}
              >
                <span className={mx.skillName}>{a.name || '(bez názvu)'}</span>
                <span className={mx.pips}>
                  {Array.from({ length: total }).map((_, p) => (
                    <i
                      key={p}
                      className={mx.pip}
                      data-on={p < lvl}
                      style={
                        p < lvl
                          ? ({ ['--lvlc' as string]: lvlVar(lvl) } as CSSProperties)
                          : undefined
                      }
                    />
                  ))}
                </span>
                <span
                  className={mx.lvl}
                  title={`${lvl} — ${matrixLevelName(lvl)}`}
                >
                  {lvl}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {notes && notes.trim() && (
        <section className={mx.section}>
          <h3 className={mx.title}>Popis</h3>
          <div className={styles.desc}>{notes}</div>
        </section>
      )}

      {editing && onPatch && (
        <MatrixChatBestieEditModal
          worldId={worldId}
          systemId={systemId}
          name={rollerName}
          systemStats={ss}
          abilities={abilities}
          notes={notes ?? ''}
          onSave={(patch) => {
            onPatch(patch);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

export default MatrixChatBestiePanel;
