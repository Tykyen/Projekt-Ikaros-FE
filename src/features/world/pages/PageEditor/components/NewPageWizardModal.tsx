import { useEffect, useRef } from 'react';
import { FileText, User, Skull, Library, MapPin, Image, Network, X } from 'lucide-react';
import s from './NewPageWizardModal.module.css';

export type NewPageChoice =
  | 'wiki'
  | 'pc'
  | 'npc'
  | 'npc-bestiary'
  | 'lokace'
  | 'galerie'
  | 'rodokmen';

interface Props {
  open: boolean;
  onClose: () => void;
  onChoose: (choice: NewPageChoice) => void;
  /** 9.1 D — PJ+ má 4. volbu „NPC z bestiáře" (import šablony). */
  canUseBestiary?: boolean;
  /**
   * 15.11 — režim „hráč navrhuje". Ukáže jen whitelist typy (NPC, Lokace,
   * Stránka, Galerie, Rodokmen) → vzniknou jako pending ke schválení PJ.
   */
  proposeMode?: boolean;
}

/**
 * 9.1 — Wizard pro tvorbu nového obsahu světa. Jedno vstupní místo
 * (+ Nová stránka) → uživatel vybere mezi 3 cestami:
 *
 *   • Wiki stránka → klasický PageEditor (type=Ostatní, lze přepnout)
 *   • Postava hráče (PC) → PageEditor s type=PostavaHrace
 *   • NPC → PageEditor s type=NPC
 *
 * Modal sám nenavádí URL; volá `onChoose`, parent rozhodne kam navigovat
 * (typicky `/svet/<w>/nova-stranka?type=<X>`).
 */
export function NewPageWizardModal({
  open,
  onClose,
  onChoose,
  canUseBestiary = false,
  proposeMode = false,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={s.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={s.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-page-wizard-title"
        tabIndex={-1}
      >
        <header className={s.header}>
          <h2 id="new-page-wizard-title">
            {proposeMode ? 'Co chceš navrhnout?' : 'Co chceš vytvořit?'}
          </h2>
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label="Zavřít"
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className={s.choices}>
          {proposeMode ? (
            <>
              <ChoiceCard
                icon={<Skull size={28} aria-hidden />}
                title="NPC"
                subtitle="Nehratelná postava"
                onClick={() => onChoose('npc')}
              />
              <ChoiceCard
                icon={<MapPin size={28} aria-hidden />}
                title="Lokace"
                subtitle="Místo ve světě"
                onClick={() => onChoose('lokace')}
              />
              <ChoiceCard
                icon={<FileText size={28} aria-hidden />}
                title="Stránka"
                subtitle="Wiki text / poznámka"
                onClick={() => onChoose('wiki')}
              />
              <ChoiceCard
                icon={<Image size={28} aria-hidden />}
                title="Galerie"
                subtitle="Sada obrázků"
                onClick={() => onChoose('galerie')}
              />
              <ChoiceCard
                icon={<Network size={28} aria-hidden />}
                title="Rodokmen"
                subtitle="Strom rodiny"
                onClick={() => onChoose('rodokmen')}
              />
            </>
          ) : (
            <>
              <ChoiceCard
                icon={<FileText size={28} aria-hidden />}
                title="Wiki stránka"
                subtitle="Lokace, Noviny, Galerie, Zoom, Rodokmen, …"
                onClick={() => onChoose('wiki')}
              />
              <ChoiceCard
                icon={<User size={28} aria-hidden />}
                title="Postava hráče (PC)"
                subtitle="Hratelná postava přiřazená hráči"
                onClick={() => onChoose('pc')}
              />
              <ChoiceCard
                icon={<Skull size={28} aria-hidden />}
                title="NPC"
                subtitle="Nehratelná postava — spravuje PJ"
                onClick={() => onChoose('npc')}
              />
              {canUseBestiary && (
                <ChoiceCard
                  icon={<Library size={28} aria-hidden />}
                  title="Bestiář"
                  subtitle="Otevři Bestiář světa — vytvoř a spravuj bestie pro mapu"
                  onClick={() => onChoose('npc-bestiary')}
                />
              )}
            </>
          )}
        </div>

        <p className={s.hint}>
          {proposeMode
            ? 'Návrh se odešle PJ ke schválení. Než ho schválí, uvidíš ho jen ty a PJ.'
            : 'U postav uvidíš stejný editor + záložky Bio, Inventář, Finance, Kalendář a Deník — sjednoceno s wiki stránkami (spec 9.1).'}
        </p>
      </div>
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className={s.card} onClick={onClick}>
      <span className={s.cardIcon}>{icon}</span>
      <span className={s.cardBody}>
        <span className={s.cardTitle}>{title}</span>
        <span className={s.cardSubtitle}>{subtitle}</span>
      </span>
    </button>
  );
}
