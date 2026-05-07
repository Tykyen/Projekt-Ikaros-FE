import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

async function fetchHealth() {
  const res = await apiClient.get("/health");
  return res.data;
}

export default function HomePage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    enabled: false,
  });

  return (
    <section>
      <h2>Vítej v Projektu Ikaros (FE)</h2>
      <p>
        Tento frontend komunikuje s backendem na{" "}
        <code>{import.meta.env.VITE_API_URL ?? "http://localhost:3000"}</code>.
      </p>
      <button type="button" onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? "Pingám BE..." : "Ping BE /health"}
      </button>
      {isLoading && <p>Načítám…</p>}
      {isError && <p style={{ color: "crimson" }}>Chyba: {String(error)}</p>}
      {data !== undefined && (
        <pre style={{ background: "#f4f4f4", padding: "0.5rem" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </section>
  );
}
