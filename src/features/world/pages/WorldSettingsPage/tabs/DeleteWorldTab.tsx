import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button, ConfirmDialog } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useDeleteWorld } from '@/features/world/api/useWorldLifecycle';
import s from './DeleteWorldTab.module.css';

/**
 * Smazání světa (soft-delete). Mazat smí jen PJ vlastník světa (R-20 —
 * platform Admin nemá governance uvnitř světa). Data zůstávají — obnovit
 * do 30 dní může jen administrátor. Po 30 dnech trvalé smazání.
 */
export default function DeleteWorldTab() {
  const { world, worldId } = useWorldContext();
  const navigate = useNavigate();
  const deleteWorld = useDeleteWorld();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!world) return null;

  return (
    <section className={s.wrap}>
      <div className={s.danger}>
        <h2 className={s.title}>
          <Trash2 size={18} aria-hidden /> Smazat svět
        </h2>
        <p className={s.text}>
          Smazání svět odebere z provozu — zmizí ze seznamů i hráčům. Veškerá
          data (stránky, postavy, chat, mapy…) <strong>zůstanou uložená</strong>.
        </p>
        <p className={s.text}>
          Obnovit svět může <strong>do 30 dní jen administrátor</strong> — pokud
          ho budeš chtít zpět, napiš mu. <strong>Po 30 dnech</strong> se svět i
          se všemi daty <strong>trvale smaže</strong>.
        </p>
        <Button
          variant="danger"
          onClick={() => setConfirmOpen(true)}
          disabled={deleteWorld.isPending}
        >
          <Trash2 size={16} aria-hidden /> Smazat svět „{world.name}"
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={`Smazat svět „${world.name}"?`}
        message="Svět zmizí z provozu. Obnovit do 30 dní může jen administrátor — pak se smaže natrvalo i s daty. Pokračovat?"
        confirmLabel="Smazat svět"
        confirmVariant="danger"
        isPending={deleteWorld.isPending}
        onConfirm={async () => {
          try {
            await deleteWorld.mutateAsync(worldId);
            toast.success('Svět smazán. Obnovit do 30 dní může administrátor.');
            navigate('/');
          } catch {
            toast.error('Smazání se nezdařilo.');
          }
          setConfirmOpen(false);
        }}
      />
    </section>
  );
}
