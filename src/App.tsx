import { Route, Routes, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import "./App.css";

function App() {
  return (
    <>
      <header style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
        <h1 style={{ margin: 0 }}>Projekt Ikaros</h1>
        <nav style={{ marginTop: "0.5rem" }}>
          <Link to="/">Domů</Link>
        </nav>
      </header>
      <main style={{ padding: "1rem" }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<p>404 — stránka nenalezena</p>} />
        </Routes>
      </main>
    </>
  );
}

export default App;
