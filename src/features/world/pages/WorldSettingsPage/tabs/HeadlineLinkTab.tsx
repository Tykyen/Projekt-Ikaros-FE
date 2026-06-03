import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { SettingsPanel } from '../components/SettingsPanel';
import s from './HeadlineLinkTab.module.css';

/**
 * 12.2 — správa navigace se přesunula na dedikovanou stránku „Hlavní lišta
 * světa" (`/admin/headline`) s živým náhledem. Tento tab je rozcestník, aby
 * PJ hledající navigaci v Nastavení našel cestu (konsolidace dvojkolejnosti).
 */
export default function HeadlineLinkTab() {
  const { worldSlug } = useWorldContext();
  return (
    <SettingsPanel
      title="Hlavní lišta světa"
      description={
        'Viditelnost modulů, vlastní navigace, šablony menu a „Last info" box mají vlastní stránku s živým náhledem.'
      }
    >
      <Link to={`/svet/${worldSlug}/admin/headline`} className={s.cta}>
        <ExternalLink size={16} />
        Otevřít editor hlavní lišty
      </Link>
    </SettingsPanel>
  );
}
