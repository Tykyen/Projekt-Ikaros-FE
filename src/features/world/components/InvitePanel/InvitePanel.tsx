import { useState } from 'react';
import { toast } from 'sonner';
import { Link2, Trash2 } from 'lucide-react';
import { Modal, Button } from '@/shared/ui';
import { RecipientPicker } from '@/features/ikaros/components/RecipientPicker';
import type { UserLookupItem } from '@/features/ikaros/api/useUserLookup';
import {
  useWorldInvites,
  useCreateInvite,
  useRevokeInvite,
} from '@/features/world/api/useWorldInvites';
import s from './InvitePanel.module.css';

interface Props {
  worldId: string;
  onClose: () => void;
}

const EXPIRY_OPTIONS = [
  { value: 1, label: '1 den' },
  { value: 7, label: '7 dní' },
  { value: 30, label: '30 dní' },
];

/**
 * 15.10 fáze B — „Přidat hráče". Dvě cesty: pozvat konkrétního uživatele
 * (přijde mu pozvánka ke zpracování) nebo vygenerovat pozvací odkaz. Dole
 * přehled aktivních pozvánek + zrušení (revoke).
 */
export function InvitePanel({ worldId, onClose }: Props) {
  const invites = useWorldInvites(worldId);
  const createInvite = useCreateInvite(worldId);
  const revokeInvite = useRevokeInvite(worldId);
  const [picked, setPicked] = useState<UserLookupItem | null>(null);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [oneTime, setOneTime] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const busy = createInvite.isPending;

  const inviteUser = () => {
    if (!picked) return;
    createInvite.mutate(
      { kind: 'user', invitedUserId: picked.id },
      {
        onSuccess: () => {
          toast.success(`Pozvánka odeslána uživateli ${picked.username}.`);
          setPicked(null);
        },
        onError: () =>
          toast.error(
            'Pozvánku nelze odeslat — uživatel už je členem nebo má čekající pozvánku.',
          ),
      },
    );
  };

  const createLink = () => {
    createInvite.mutate(
      { kind: 'link', expiresInDays, maxUses: oneTime ? 1 : undefined },
      {
        onSuccess: (inv) => {
          if (!inv.token) return;
          const url = `${window.location.origin}/invite/${inv.token}`;
          setCreatedLink(url);
          if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(
              () => toast.success('Odkaz vytvořen a zkopírován do schránky.'),
              () => toast.success('Odkaz vytvořen.'),
            );
          } else {
            toast.success('Odkaz vytvořen.');
          }
        },
        onError: () => toast.error('Odkaz se nepodařilo vytvořit.'),
      },
    );
  };

  const copyLink = (url: string) => {
    if (!navigator.clipboard) return;
    void navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Odkaz zkopírován.'));
  };

  const activeInvites = invites.data ?? [];

  return (
    <Modal open onClose={onClose} title="Přidat hráče" size="md">
      <div className={s.body}>
        <section className={s.section}>
          <h3 className={s.sectionTitle}>Pozvat uživatele</h3>
          <p className={s.hint}>
            Vyber člověka na platformě — dostane pozvánku ke zpracování a
            připojí se, jakmile ji přijme.
          </p>
          <div className={s.row}>
            <RecipientPicker value={picked} onChange={setPicked} />
            <Button
              variant="primary"
              disabled={!picked || busy}
              onClick={inviteUser}
            >
              Pozvat
            </Button>
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>Pozvací odkaz</h3>
          <p className={s.hint}>
            Vytvoř odkaz a pošli ho kamkoli (Discord, zpráva). Kdo klikne a
            přihlásí se, přidá se do světa.
          </p>
          <div className={s.linkControls}>
            <label className={s.controlLabel}>
              Platnost
              <select
                className={s.select}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
              >
                {EXPIRY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={s.checkLabel}>
              <input
                type="checkbox"
                checked={oneTime}
                onChange={(e) => setOneTime(e.target.checked)}
              />
              Jen jedno použití
            </label>
            <Button variant="secondary" disabled={busy} onClick={createLink}>
              <Link2 size={14} aria-hidden="true" /> Vytvořit odkaz
            </Button>
          </div>
          {createdLink && (
            <div className={s.linkRow}>
              <code className={s.linkCode}>{createdLink}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyLink(createdLink)}
              >
                Kopírovat
              </Button>
            </div>
          )}
        </section>

        <section className={s.section}>
          <h3 className={s.sectionTitle}>Aktivní pozvánky</h3>
          {invites.isError ? (
            // `invites.data` je undefined i při chybě → bez téhle větve by se
            // aktivní pozvánky tvářily jako prázdné → PJ nevidí co zrušit a může
            // vytvořit duplicitní.
            <p className={s.hint} role="alert">
              Aktivní pozvánky se teď nepodařilo načíst — nemusíš vidět všechny.{' '}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void invites.refetch()}
              >
                Zkusit znovu
              </Button>
            </p>
          ) : activeInvites.length === 0 ? (
            <p className={s.hint}>Žádné aktivní pozvánky.</p>
          ) : (
            <ul className={s.inviteList}>
              {activeInvites.map((inv) => (
                <li key={inv.id} className={s.inviteItem}>
                  <span className={s.inviteInfo}>
                    {inv.kind === 'user'
                      ? `👤 ${inv.invitedUser?.username ?? 'uživatel'}`
                      : inv.maxUses
                        ? `🔗 Odkaz (${inv.usedCount}/${inv.maxUses} použití)`
                        : `🔗 Odkaz (${inv.usedCount}× použito)`}
                  </span>
                  <button
                    type="button"
                    className={s.revokeBtn}
                    disabled={revokeInvite.isPending}
                    onClick={() =>
                      revokeInvite.mutate(inv.id, {
                        onSuccess: () => toast.info('Pozvánka zrušena.'),
                      })
                    }
                    aria-label="Zrušit pozvánku"
                    title="Zrušit"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}
