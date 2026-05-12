import { Link } from 'react-router-dom';
import s from './PublicProfile.module.css';

export function SelfProfileBanner() {
  return (
    <div className={s.selfBanner} role="note">
      Toto je tvůj veřejný profil — jak ho vidí ostatní. Úpravy najdeš v{' '}
      <Link to="/ikaros/profil">Nastavení profilu</Link>.
    </div>
  );
}
