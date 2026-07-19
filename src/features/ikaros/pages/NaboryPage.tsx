import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import { Spinner, EmptyState, ErrorState } from '@/shared/ui';
import { PLATFORM_SYSTEMS } from '@/shared/rpg/systems';
import { GENRES } from '@/shared/rpg/genres';
import type { Nabor, NaborStrana, NaborMode } from '@/shared/types';
import { useNabory, useOzvatSe } from '../api/useNabory';
import { filterNabory } from '../lib/nabory';
import { NaborListek } from '../components/NaborListek';
import s from './NaboryPage.module.css';

/**
 * 19.3 — nástěnka náborů (LFG). Deska (pozadí) = globální skin diváka
 * (`:root` `--theme-*`); lístky nesou motiv svého světa (viz NaborListek).
 *
 * 19.3b — filtry systém/žánr se plní z REGISTRU, ne z načtených dat. Dřív se
 * nabídka systémů odvozovala z `nabory` → na prázdné desce filtr úplně zmizel
 * a nikdo o něm nevěděl. Prázdný výsledek je platná odpověď („teď nikdo nehraje
 * CoC"); zmizelá volba je matoucí.
 */
export default function NaboryPage() {
  const { data: nabory = [], isLoading, isError, refetch } = useNabory();

  const [strana, setStrana] = useState<NaborStrana | 'vse'>('vse');
  const [system, setSystem] = useState('');
  const [genre, setGenre] = useState('');
  const [mode, setMode] = useState<NaborMode | ''>('');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [ozvat, setOzvat] = useState<Nabor | null>(null);

  // Volby bez jediného lístku zůstávají v nabídce, jen zešednou (`disabled`
  // by je udělal nevybratelnými → uživatel nepozná „nic tu není" od „chyba").
  const present = useMemo(() => {
    const sys = new Set<string>();
    const gen = new Set<string>();
    for (const n of nabory) {
      if (n.status === 'expired') continue;
      if (n.system) sys.add(n.system);
      if (n.genre) gen.add(n.genre);
    }
    return { sys, gen };
  }, [nabory]);

  const filtered = useMemo(
    () =>
      filterNabory(nabory, {
        strana,
        system: system || undefined,
        genre: genre || undefined,
        mode: mode || undefined,
        query: debouncedQuery,
      }),
    [nabory, strana, system, genre, mode, debouncedQuery],
  );

  const anyFilter =
    strana !== 'vse' || !!system || !!genre || !!mode || !!debouncedQuery.trim();

  function resetFilters() {
    setStrana('vse');
    setSystem('');
    setGenre('');
    setMode('');
    setQuery('');
  }

  return (
    <div className={s.board}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Nástěnka náborů</h1>
          <p className={s.subtitle}>
            Hledáš hru, nebo ti chybí hráči? Připni si lístek.
          </p>
        </div>
        <Link to="/ikaros/nabory/nova" className={s.newBtn}>
          <Plus size={16} /> Přidat nábor
        </Link>
      </header>

      <div className={s.bar}>
        <div className={s.grp}>
          <span className={s.lbl}>Strana</span>
          <Chip on={strana === 'vse'} onClick={() => setStrana('vse')}>
            Vše
          </Chip>
          <Chip
            on={strana === 'hledam-hrace'}
            onClick={() => setStrana('hledam-hrace')}
          >
            Hledám hráče
          </Chip>
          <Chip
            on={strana === 'hledam-hru'}
            onClick={() => setStrana('hledam-hru')}
          >
            Hledám hru
          </Chip>
        </div>

        <label className={s.grp}>
          <span className={s.lbl}>Systém</span>
          <select
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            className={s.select}
            aria-label="Filtr systému"
          >
            <option value="">Vše</option>
            {PLATFORM_SYSTEMS.map((sys) => (
              <option
                key={sys.id}
                value={sys.id}
                className={present.sys.has(sys.id) ? undefined : s.optEmpty}
              >
                {sys.label}
              </option>
            ))}
          </select>
        </label>

        <label className={s.grp}>
          <span className={s.lbl}>Žánr</span>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className={s.select}
            aria-label="Filtr žánru"
          >
            <option value="">Vše</option>
            {GENRES.map((g) => (
              <option
                key={g.label}
                value={g.label}
                className={present.gen.has(g.label) ? undefined : s.optEmpty}
              >
                {g.label}
              </option>
            ))}
          </select>
        </label>

        <div className={s.grp}>
          <span className={s.lbl}>Režim</span>
          <Chip on={mode === ''} onClick={() => setMode('')}>
            Vše
          </Chip>
          <Chip on={mode === 'online'} onClick={() => setMode('online')}>
            Online
          </Chip>
          <Chip on={mode === 'zivo'} onClick={() => setMode('zivo')}>
            Naživo
          </Chip>
        </div>

        <div className={s.spacer} />

        <label className={s.searchWrap}>
          <Search size={14} className={s.searchIcon} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hledat…"
            className={s.searchInput}
            aria-label="Hledat nábor"
          />
        </label>
      </div>

      {isLoading ? (
        <Spinner center />
      ) : isError ? (
        <ErrorState
          size="hero"
          title="Nástěnku se nepodařilo načíst"
          description="Neznamená to, že tu nikdo nehledá. Zkus to prosím znovu."
          onRetry={() => void refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          size="hero"
          illustration="messages"
          title={anyFilter ? 'Nic neodpovídá filtru' : 'Zatím tu nikdo nehledá'}
          description={
            anyFilter
              ? 'Zkus jiný systém, žánr nebo klíčové slovo.'
              : 'Buď první a připni svůj nábor.'
          }
          action={
            anyFilter
              ? { label: 'Zrušit filtry', onClick: resetFilters }
              : { label: 'Přidat nábor', to: '/ikaros/nabory/nova' }
          }
        />
      ) : (
        <div className={s.pin}>
          {filtered.map((n) => (
            <NaborListek key={n.id} nabor={n} onOzvatSe={setOzvat} />
          ))}
        </div>
      )}

      {ozvat && <OzvatModal nabor={ozvat} onClose={() => setOzvat(null)} />}
    </div>
  );
}

// ─── Filtr chip ──────────────────────────────────────────────────────────────

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={on ? `${s.chip} ${s.chipOn}` : s.chip}
      aria-pressed={on}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ─── „Ozvat se" modal — přímá zpráva autorovi ───────────────────────────────

function OzvatModal({ nabor, onClose }: { nabor: Nabor; onClose: () => void }) {
  const [msg, setMsg] = useState('');
  const ozvatSe = useOzvatSe();

  async function send() {
    try {
      await ozvatSe.mutateAsync({ id: nabor.id, message: msg });
      toast.success('Zpráva odeslána autorovi.');
      onClose();
    } catch {
      toast.error('Odeslání selhalo.');
    }
  }

  return (
    // Klik na scrim (mimo modal) zavírá dialog; klávesová cesta existuje
    // (tlačítko „Zrušit"), overlay nemusí být fokusovatelný.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className={s.scrim}
      role="dialog"
      aria-modal="true"
      aria-label={`Ozvat se na nábor ${nabor.title}`}
      onClick={onClose}
    >
      {/* onClick jen zastavuje probublání (klik uvnitř modalu nezavírá); není to interaktivní prvek. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={s.modalTitle}>Ozvat se — {nabor.title}</h2>
        <p className={s.modalHint}>
          Zpráva půjde přímo autorovi ({nabor.authorName}).
        </p>
        {/* eslint-disable jsx-a11y/no-autofocus -- autofocus na první pole je záměr: modal trapuje fokus, uživatel čeká kurzor v poli zprávy */}
        <textarea
          className={s.textarea}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Napiš pár slov o sobě…"
          rows={4}
          autoFocus
        />
        {/* eslint-enable jsx-a11y/no-autofocus */}
        <div className={s.modalFoot}>
          <button type="button" className={s.ghostBtn} onClick={onClose}>
            Zrušit
          </button>
          <button
            type="button"
            className={s.primaryBtn}
            disabled={!msg.trim() || ozvatSe.isPending}
            onClick={send}
          >
            Odeslat
          </button>
        </div>
      </div>
    </div>
  );
}
