/**
 * 16.2b-2 — Komunitní (globální) bestiář ve Společné tvorbě.
 * FE-1: funkční kostra (2 knihovny + list). Vzhled/filtry/skiny → FE-2 + SK-*.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useKomunitniBestiar } from './hooks/useKomunitniBestiar';
import type { BestieStatus } from './types';

export default function KomunitniBestiarPage() {
  const [library, setLibrary] = useState<BestieStatus>('approved');
  const { data: beasts = [], isLoading } = useKomunitniBestiar({
    status: library,
  });

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 22px' }}>
      <header style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1>Globální bestiář</h1>
        <p>
          Dvě oddělené knihovny bytostí. Prohlížej, diskutuj, tvoř — a vkládej
          si je do vlastního bestiáře.
        </p>
      </header>

      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <button
          role="tab"
          aria-selected={library === 'approved'}
          onClick={() => setLibrary('approved')}
        >
          📖 Schválená knihovna
        </button>
        <button
          role="tab"
          aria-selected={library === 'draft'}
          onClick={() => setLibrary('draft')}
        >
          ✎ Knihovna návrhů
        </button>
      </div>

      {isLoading ? (
        <p>Načítám…</p>
      ) : beasts.length === 0 ? (
        <p style={{ textAlign: 'center', opacity: 0.7 }}>
          {library === 'approved'
            ? 'Ve schválené knihovně zatím nic není.'
            : 'Žádné návrhy.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {beasts.map((b) => (
            <li
              key={b.id}
              style={{ padding: '10px 0', borderBottom: '1px solid #ccc' }}
            >
              <Link to={`/ikaros/bestiar/${b.id}`}>{b.name}</Link>
              {b.latin ? <em> · {b.latin}</em> : null}
              {b.kind ? <span> · {b.kind}</span> : null}
              {b.statblocks ? (
                <span style={{ opacity: 0.7 }}>
                  {' '}
                  · {Object.keys(b.statblocks).join(', ')}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
