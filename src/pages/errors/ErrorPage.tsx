import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Neznámá chyba';

  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h1>Chyba</h1>
      <p>{message}</p>
      <Link to="/">Zpět domů</Link>
    </div>
  );
}
