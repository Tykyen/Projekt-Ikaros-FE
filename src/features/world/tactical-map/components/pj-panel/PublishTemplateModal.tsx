import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import type {
  PublishSceneTemplateInput,
  SceneLicenseMode,
  SceneAiOrigin,
} from '@/features/ikaros/sceny/api/sceneCatalogApi';
import styles from './PublishTemplateModal.module.css';

interface Props {
  templateName: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (input: PublishSceneTemplateInput) => void;
}

const LICENSE_OPTIONS: { value: SceneLicenseMode; label: string }[] = [
  { value: 'clone', label: 'Ke klonování (kdokoli si scénu zkopíruje do světa)' },
  { value: 'read', label: 'Jen k prohlížení (nelze klonovat)' },
];

const AI_OPTIONS: { value: SceneAiOrigin; label: string }[] = [
  { value: 'A0', label: 'Bez AI (čistě moje práce)' },
  { value: 'A1', label: 'AI asistováno (drobná výpomoc)' },
  { value: 'A3', label: 'AI generováno, mnou upraveno' },
  { value: 'A6', label: 'Neuvedeno' },
];

/**
 * 22.5 — formulář publikace šablony scény do veřejného katalogu. Autor volí
 * licenční režim (klon/čtení), uvedení autora a AI původ. Po odeslání šablona
 * čeká na schválení kurátorem.
 */
export function PublishTemplateModal({
  templateName,
  isPending,
  onClose,
  onConfirm,
}: Props): React.ReactElement {
  const [licenseMode, setLicenseMode] = useState<SceneLicenseMode>('clone');
  const [attributionRequired, setAttributionRequired] = useState(true);
  const [aiOrigin, setAiOrigin] = useState<SceneAiOrigin>('A6');

  return (
    <Modal
      open
      onClose={onClose}
      title="Publikovat scénu do katalogu"
      size="md"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button
            variant="primary"
            loading={isPending}
            onClick={() =>
              onConfirm({ licenseMode, attributionRequired, aiOrigin })
            }
          >
            Publikovat
          </Button>
        </div>
      }
    >
      <div className={styles.body}>
        <p className={styles.intro}>
          Scéna <strong>{templateName}</strong> se objeví ve veřejném katalogu
          Společné tvorby, jakmile ji schválí kurátor. Ostatní PJ si ji pak
          naklonují na svou taktickou mapu. Zvuky se do sdílené scény nepřenášejí.
        </p>

        <label className={styles.field}>
          <span className={styles.label}>Co s ní ostatní smí</span>
          <select
            className={styles.select}
            value={licenseMode}
            onChange={(e) => setLicenseMode(e.target.value as SceneLicenseMode)}
          >
            {LICENSE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={attributionRequired}
            onChange={(e) => setAttributionRequired(e.target.checked)}
          />
          Vyžadovat uvedení autora
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Původ vůči AI</span>
          <select
            className={styles.select}
            value={aiOrigin}
            onChange={(e) => setAiOrigin(e.target.value as SceneAiOrigin)}
          >
            {AI_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  );
}
