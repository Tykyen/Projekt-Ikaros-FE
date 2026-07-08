import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getTheme } from '@/themes/registry';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import {
  NABOR_MOTIVY,
  NABOR_MOTIV_LABELS,
  type NaborStrana,
  type NaborMotiv,
  type NaborMode,
} from '@/shared/types';
import { useCreateNabor } from '../api/useNabory';
import s from './NaborNovaPage.module.css';

/**
 * 19.3 — tvorba náboru. „Hledám hráče" (PJ) → výběr světa dědí motiv
 * (`world.themeId`) + systém; motiv smí PJ přepsat. „Hledám hru" (hráč) →
 * motiv si vybírá z 12.
 */
export default function NaborNovaPage() {
  const nav = useNavigate();
  const create = useCreateNabor();
  const { data: myWorlds = [] } = useMyWorlds();

  const [strana, setStrana] = useState<NaborStrana>('hledam-hrace');
  const [worldId, setWorldId] = useState('');
  const [motiv, setMotiv] = useState<NaborMotiv>('ikaros');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [system, setSystem] = useState('');
  const [mode, setMode] = useState<NaborMode>('online');
  const [place, setPlace] = useState('');
  const [seatsTotal, setSeatsTotal] = useState('');

  function pickWorld(id: string) {
    setWorldId(id);
    const entry = myWorlds.find((w) => w.world.id === id);
    if (entry) {
      const t = entry.world.themeId as NaborMotiv | undefined;
      if (t && (NABOR_MOTIVY as readonly string[]).includes(t)) setMotiv(t);
      if (entry.world.system) setSystem(entry.world.system);
    }
  }

  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (strana === 'hledam-hru' || worldId.length > 0);

  async function submit() {
    const entry = myWorlds.find((w) => w.world.id === worldId);
    try {
      await create.mutateAsync({
        strana,
        motiv,
        worldId: strana === 'hledam-hrace' ? worldId : undefined,
        title: title.trim(),
        body: body.trim(),
        system: system.trim() || entry?.world.system || undefined,
        mode,
        place: mode === 'zivo' ? place.trim() || undefined : undefined,
        seatsTotal:
          strana === 'hledam-hrace' && seatsTotal
            ? Number(seatsTotal)
            : undefined,
      });
      toast.success('Nábor přidán.');
      nav('/ikaros/nabory');
    } catch {
      toast.error('Přidání náboru selhalo.');
    }
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Nový nábor</h1>
        <Link to="/ikaros/nabory" className={s.back}>
          ← Zpět na nástěnku
        </Link>
      </header>

      {/* strana */}
      <div className={s.field}>
        <span className={s.label}>Co hledáš?</span>
        <div className={s.toggle}>
          <button
            type="button"
            className={strana === 'hledam-hrace' ? s.segOn : s.seg}
            onClick={() => setStrana('hledam-hrace')}
          >
            Hledám hráče (jsem PJ)
          </button>
          <button
            type="button"
            className={strana === 'hledam-hru' ? s.segOn : s.seg}
            onClick={() => setStrana('hledam-hru')}
          >
            Hledám hru
          </button>
        </div>
      </div>

      {/* svět (jen PJ) */}
      {strana === 'hledam-hrace' && (
        <div className={s.field}>
          <span className={s.label}>Svět, do kterého nabíráš</span>
          <select
            className={s.select}
            value={worldId}
            onChange={(e) => pickWorld(e.target.value)}
          >
            <option value="">— vyber svět —</option>
            {myWorlds.map((e) => (
              <option key={e.world.id} value={e.world.id}>
                {e.world.name}
              </option>
            ))}
          </select>
          <span className={s.hint}>
            Lístek převezme motiv a systém světa (motiv můžeš níže přepsat).
          </span>
        </div>
      )}

      {/* motiv picker */}
      <div className={s.field}>
        <span className={s.label}>
          Motiv lístku
          {strana === 'hledam-hrace' && ' (výchozí z motivu světa)'}
        </span>
        <div className={s.motivGrid}>
          {NABOR_MOTIVY.map((m) => {
            const vars = getTheme(m).vars as Record<string, string>;
            return (
              <button
                key={m}
                type="button"
                className={m === motiv ? s.motivOn : s.motiv}
                onClick={() => setMotiv(m)}
                style={{
                  background: vars['--theme-surface'],
                  color: vars['--theme-text'],
                  borderColor:
                    m === motiv ? vars['--theme-accent'] : vars['--theme-border-soft'],
                }}
              >
                <span
                  className={s.swatch}
                  style={{ background: vars['--theme-accent'] }}
                />
                {NABOR_MOTIV_LABELS[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* text */}
      <div className={s.field}>
        <span className={s.label}>Nadpis</span>
        <input
          className={s.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            strana === 'hledam-hrace'
              ? 'Např. Hledám 2 hráče do dlouhé kampaně'
              : 'Např. Zkušený hráč hledá stůl'
          }
          maxLength={80}
        />
      </div>
      <div className={s.field}>
        <span className={s.label}>Popis</span>
        <textarea
          className={s.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Napiš, koho/co hledáš, jak a kdy hrajete…"
          maxLength={600}
        />
      </div>

      {/* systém + režim */}
      <div className={s.row}>
        <div className={s.field}>
          <span className={s.label}>Systém</span>
          <input
            className={s.input}
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            placeholder="DrD, JaD, D&D 5e…"
          />
        </div>
        <div className={s.field}>
          <span className={s.label}>Režim</span>
          <div className={s.toggle}>
            <button
              type="button"
              className={mode === 'online' ? s.segOn : s.seg}
              onClick={() => setMode('online')}
            >
              Online
            </button>
            <button
              type="button"
              className={mode === 'zivo' ? s.segOn : s.seg}
              onClick={() => setMode('zivo')}
            >
              Naživo
            </button>
          </div>
        </div>
      </div>

      {/* místo (jen naživo) + počet míst (jen PJ) */}
      <div className={s.row}>
        {mode === 'zivo' && (
          <div className={s.field}>
            <span className={s.label}>Město</span>
            <input
              className={s.input}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Praha, Brno…"
            />
          </div>
        )}
        {strana === 'hledam-hrace' && (
          <div className={s.field}>
            <span className={s.label}>Počet volných míst</span>
            <input
              className={s.input}
              type="number"
              min={1}
              max={20}
              value={seatsTotal}
              onChange={(e) => setSeatsTotal(e.target.value)}
              placeholder="5"
            />
          </div>
        )}
      </div>

      <div className={s.actions}>
        <Link to="/ikaros/nabory" className={s.ghostBtn}>
          Zrušit
        </Link>
        <button
          type="button"
          className={s.primaryBtn}
          disabled={!canSubmit || create.isPending}
          onClick={submit}
        >
          Připnout nábor
        </button>
      </div>
    </div>
  );
}
