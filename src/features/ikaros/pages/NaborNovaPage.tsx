import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getTheme } from '@/themes/registry';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import { resolveSystemId } from '@/features/world/systemId';
import { PLATFORM_SYSTEMS } from '@/shared/rpg/systems';
import { GENRES, isKnownGenre } from '@/shared/rpg/genres';
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
 * (`world.themeId`), systém i žánr; motiv smí PJ přepsat. „Hledám hru" (hráč) →
 * motiv si vybírá z 12.
 *
 * 19.3b — systém i žánr jsou **selecty z registru**, ne volný text: dřív sem
 * `pickWorld` sypal `world.system` id (`dnd5e`) do textového pole, kam člověk
 * psal „D&D 5e" → jeden systém se ve filtru rozpadl na několik. Proto
 * `resolveSystemId` (world drží „dlouhá" id, katalog canonical).
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
  const [genre, setGenre] = useState('');
  const [mode, setMode] = useState<NaborMode>('online');
  const [place, setPlace] = useState('');
  const [seatsTotal, setSeatsTotal] = useState('');

  function pickWorld(id: string) {
    setWorldId(id);
    const entry = myWorlds.find((w) => w.world.id === id);
    if (entry) {
      const t = entry.world.themeId as NaborMotiv | undefined;
      if (t && (NABOR_MOTIVY as readonly string[]).includes(t)) setMotiv(t);
      if (entry.world.system) setSystem(resolveSystemId(entry.world.system));
      // Svět s vlastním žánrem („Vlastní" ve wizardu) se do 11 nevejde → PJ
      // vybere ručně; nábor custom žánry nemá (spec 19.3 R15).
      if (isKnownGenre(entry.world.genre)) setGenre(entry.world.genre ?? '');
      else setGenre('');
    }
  }

  const canSubmit =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (strana === 'hledam-hru' || (worldId.length > 0 && genre.length > 0));

  // Disabled tlačítko musí říct proč (vzor `CreateWorldPage`).
  const missing: string[] = [];
  if (!title.trim()) missing.push('Nadpis');
  if (!body.trim()) missing.push('Popis');
  if (strana === 'hledam-hrace') {
    if (!worldId) missing.push('Svět');
    if (!genre) missing.push('Žánr');
  }

  async function submit() {
    try {
      await create.mutateAsync({
        strana,
        motiv,
        worldId: strana === 'hledam-hrace' ? worldId : undefined,
        title: title.trim(),
        body: body.trim(),
        system: system || undefined,
        genre: genre || undefined,
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
            Lístek převezme motiv, systém i žánr světa (dole můžeš přepsat).
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

      {/* systém + žánr — datové osy pro filtr nástěnky (19.3b) */}
      <div className={s.row}>
        <label className={s.field}>
          <span className={s.label}>Systém</span>
          <select
            className={s.select}
            value={system}
            onChange={(e) => setSystem(e.target.value)}
          >
            <option value="">— nezáleží —</option>
            {PLATFORM_SYSTEMS.map((sys) => (
              <option key={sys.id} value={sys.id}>
                {sys.label}
              </option>
            ))}
          </select>
        </label>
        <label className={s.field}>
          <span className={s.label}>
            Žánr{strana === 'hledam-hru' && ' (nepovinné)'}
          </span>
          <select
            className={s.select}
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">
              {strana === 'hledam-hru' ? '— nezáleží —' : '— vyber žánr —'}
            </option>
            {GENRES.map((g) => (
              <option key={g.label} value={g.label}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* režim */}
      <div className={s.row}>
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
          title={canSubmit ? undefined : `Doplň: ${missing.join(', ')}`}
          onClick={submit}
        >
          Připnout nábor
        </button>
      </div>
    </div>
  );
}
