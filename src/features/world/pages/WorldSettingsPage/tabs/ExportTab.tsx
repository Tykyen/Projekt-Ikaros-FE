import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';
import { apiClient } from '@/shared/api';
import { useWorldContext } from '@/features/world/context/WorldContext';

/**
 * 14.7c — Export / záloha celého světa do ZIP (pilíř B spec-14.7).
 *
 * Stáhne `GET /worlds/:id/export` jako blob (auth přes apiClient interceptor) a
 * uloží jako soubor. Jen PJ/Admin (BE vrací 403 ostatním). Import zatím není.
 */
export default function ExportTab() {
  const { worldId, world } = useWorldContext();
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const res = await apiClient.get(`/worlds/${worldId}/export`, {
        responseType: 'blob',
      });
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `svet-${world?.slug ?? 'export'}-${date}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Záloha světa stažena.');
    } catch {
      toast.error('Export se nezdařil. Zkus to prosím znovu.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ maxWidth: '40rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ margin: 0 }}>Export / Záloha světa</h2>
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        Stáhne <strong>kompletní data tohoto světa</strong> do jednoho souboru
        (ZIP se strukturou JSON): stránky, postavy včetně deníků, kalendáře,
        taktické scény, atlas map, hvězdná mapa, časová osa, události, bestiář
        světa a celá kampaň (pavučina, scénáře, obchod). Tvoje vlastní záložní
        kopie — nezávislá na platformě.
      </p>
      <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.9rem', opacity: 0.8 }}>
        Obrázky zůstávají odkazem (URL) v datech. Stahování obrázků přímo do ZIP
        a import zpět ze zálohy se připravují.
      </p>
      <div>
        <Button onClick={() => void handleExport()} loading={busy}>
          <Download size={16} aria-hidden /> Exportovat / Zálohovat vše
        </Button>
      </div>
    </section>
  );
}
