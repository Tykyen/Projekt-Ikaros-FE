import { toast } from 'sonner';

/**
 * Spec 1.8 — friendship socket-driven toasts.
 *
 * `friend:request:incoming` → akční toast s navigation do Zpracovat tabu
 * `friend:request:accepted` → success notification
 * `declined`/`canceled`/`removed` → bez toastu (diskrétní, viz spec §7)
 */
export function toastIncomingFriendRequest(
  from: { username: string },
  navigate: (to: string) => void,
): void {
  toast(`${from.username} ti poslal/a žádost o přátelství`, {
    description: 'Otevři Zpracovat tab pro odpověď.',
    action: {
      label: 'Zobrazit',
      onClick: () => navigate('/ikaros/uzivatele?tab=zpracovat'),
    },
    duration: 8000,
  });
}

export function toastFriendRequestAccepted(by: { username: string }): void {
  toast.success(`${by.username} přijal/a tvou žádost o přátelství`, {
    duration: 5000,
  });
}
