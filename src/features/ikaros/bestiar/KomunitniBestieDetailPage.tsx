/**
 * 16.2b-2 — detail komunitní bytosti („kniha"). FE-1: placeholder (lore).
 * FE-3 dodělá pravidlové záložky + statblok render + dvouúrovňovou diskusi.
 */
import { useParams, Link } from 'react-router-dom';
import { useKomunitniBestie } from './hooks/useKomunitniBestiar';

export default function KomunitniBestieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: bestie, isLoading } = useKomunitniBestie(id ?? null);

  if (isLoading) return <p style={{ padding: 32 }}>Načítám…</p>;
  if (!bestie)
    return (
      <p style={{ padding: 32 }}>
        Bytost nenalezena. <Link to="/ikaros/bestiar">Zpět na knihovnu</Link>
      </p>
    );

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 22px' }}>
      <Link to="/ikaros/bestiar">← Zpět na knihovnu</Link>
      <h1>{bestie.name}</h1>
      {bestie.latin ? (
        <p>
          <em>{bestie.latin}</em>
        </p>
      ) : null}
      {bestie.kind ? <p>{bestie.kind}</p> : null}
      <p>{bestie.description}</p>
      {bestie.statblocks ? (
        <p style={{ opacity: 0.7 }}>
          Pravidlové verze: {Object.keys(bestie.statblocks).join(', ')}
        </p>
      ) : null}
    </div>
  );
}
