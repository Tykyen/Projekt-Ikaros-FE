import { Link } from 'react-router-dom';
import {
  MessageSquare,
  BookOpen,
  Map as MapIcon,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import s from './WorldDashboardPage.module.css';

/**
 * Spec 2.4 — úvodní stránka světa pro člena (welcome view).
 *
 * Minimální obsah úmyslně — fáze 4+ ho přepracuje na reálný dashboard
 * (calendar widget, recent events, online members). Pro 2.4: pozdrav +
 * 4 dlaždice + placeholder.
 *
 * Čerpá data z `WorldContext` (poskytuje WorldLayout) → žádný extra fetch.
 */
export default function WorldDashboardPage() {
  const { worldId, world, loading } = useWorldContext();

  return (
    <div className={s.welcome}>
      <header className={s.hero}>
        <p className={s.indicia}>Vítej zpět</p>
        <h1 className={s.title}>{loading || !world ? '...' : world.name}</h1>
        <hr className={s.divider} />
        <p className={s.subtitle}>Vyber, kam se chceš vrátit.</p>
      </header>

      <nav className={s.tiles} aria-label="Hlavní sekce světa">
        <Tile
          to={`/svet/${worldId}/chat`}
          icon={MessageSquare}
          label="Chat"
          hint="Pokračovat v rozhovoru"
        />
        <Tile
          to={`/svet/${worldId}/stranky`}
          icon={BookOpen}
          label="Stránky"
          hint="Číst svět a pravidla"
        />
        <Tile
          to={`/svet/${worldId}/mapa`}
          icon={MapIcon}
          label="Mapa"
          hint="Otevřít atlas"
        />
        <Tile
          to={`/svet/${worldId}/postavy`}
          icon={Users}
          label="Postavy"
          hint="Tvá družina"
        />
      </nav>

      <footer className={s.placeholder}>
        <p>Aktivita ve světě a kalendář událostí přibyde brzy.</p>
      </footer>
    </div>
  );
}

interface TileProps {
  to: string;
  icon: LucideIcon;
  label: string;
  hint: string;
}

function Tile({ to, icon: Icon, label, hint }: TileProps) {
  return (
    <Link to={to} className={s.tile} aria-label={label}>
      <Icon size={28} aria-hidden className={s.tileIcon} />
      <div className={s.tileText}>
        <p className={s.tileLabel}>{label}</p>
        <p className={s.tileHint}>{hint}</p>
      </div>
    </Link>
  );
}
