import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>403</h1>
      <p>Nedostatečná oprávnění</p>
      <Link to="/">Zpět domů</Link>
    </div>
  );
}
