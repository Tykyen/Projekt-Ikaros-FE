import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
      <p>Stránka nenalezena</p>
      <Link to="/">Zpět domů</Link>
    </div>
  );
}
