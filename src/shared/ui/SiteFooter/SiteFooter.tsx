import { Link } from 'react-router-dom';
import { BETA_STAGE_SHORT } from '@/shared/config/betaStage';
import s from './SiteFooter.module.css';

/**
 * Sdílená patička s legal odkazy (20A — Příloha C). Zviditelňuje pravidla,
 * soukromí a kontakt na každé content stránce. Renderuje se uvnitř `<main>`
 * (jediný scrollovaný sloupec) za `<Outlet/>`, v `IkarosLayout`; v chat/admin
 * focus módu se nezobrazuje (gate `showRightPanel`).
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={s.footer}>
      <nav className={s.links} aria-label="Právní odkazy">
        <Link to="/podminky">Podmínky použití</Link>
        <Link to="/soukromi">Ochrana údajů</Link>
        <Link to="/kodex">Pravidla komunity</Link>
        <Link to="/kontakt">Kontakt</Link>
        <Link to="/ikaros/napoveda">Nápověda</Link>
      </nav>
      <p className={s.meta}>
        © {year} Projekt Ikaros — komunitní RPG platforma ({BETA_STAGE_SHORT})
      </p>
    </footer>
  );
}
