import { Link } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import s from './WorldDetailTopBar.module.css';

interface Props {
  worldId: string;
}

/**
 * Spec 2.4 — lehký top bar pro Detail (žádný WorldLayout chrome).
 * Back link vlevo + Sdílet vpravo. Sdílet kopíruje `/info` URL (ne current
 * URL — to drží share-link public-friendly).
 */
export function WorldDetailTopBar({ worldId }: Props) {
  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/svet/${worldId}/info`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Odkaz zkopírován do schránky.');
    } catch {
      toast.error('Nepodařilo se zkopírovat odkaz.');
    }
  };

  return (
    <header className={s.bar}>
      <Link to="/ikaros/vesmiry" className={s.back} aria-label="Zpět na Vesmíry">
        <ArrowLeft size={18} aria-hidden />
        <span>Vesmíry</span>
      </Link>
      <button
        type="button"
        className={s.shareBtn}
        onClick={handleShare}
        aria-label="Sdílet odkaz na svět"
      >
        <Share2 size={16} aria-hidden />
        <span>Sdílet</span>
      </button>
    </header>
  );
}
