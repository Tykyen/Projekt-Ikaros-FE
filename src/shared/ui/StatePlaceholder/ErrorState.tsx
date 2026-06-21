/**
 * 15.6 — chybový stav. Něco se pokazilo / nemáš právo.
 * Tón: omluva + cesta ven. `status` předvyplní ilustraci/titulek/popis.
 *
 * R6 (leak policy): 404 text musí sednout i na „nemáš přístup" — BE schválně
 * vrací 404 i pro skrytí existence ([project_friendly_messaging]). Proto popis
 * 404 vyjmenovává možnosti a NEtvrdí natvrdo „smazáno".
 */
import { StatePlaceholder, type StatePlaceholderProps } from './StatePlaceholder';
import type { StateIllustration } from './stateIllustrations';

export interface ErrorStateProps extends Omit<StatePlaceholderProps, 'variant' | 'title'> {
  /** Volitelný — když chybí, odvodí se z `status` (nebo generický fallback). */
  title?: string;
  status?: 401 | 403 | 404 | 500;
  /** Když je předáno, vyrenderuje CTA „Zkusit znovu" (pokud `action` neudán). */
  onRetry?: () => void;
}

const STATUS_DEFAULTS: Record<
  number,
  { illustration: StateIllustration; title: string; description: string }
> = {
  401: {
    illustration: 'forbidden',
    title: 'Nejdřív se přihlas',
    description:
      'Tahle stránka je jen pro přihlášené. Přihlas se a vrátíme tě přesně sem, kde jsi skončil.',
  },
  403: {
    illustration: 'forbidden',
    title: 'Sem nevidíš',
    description:
      'Na tuhle stránku nemáš oprávnění. Pokud myslíš, že jde o omyl, ozvi se vypravěči nebo správci.',
  },
  404: {
    illustration: 'notfound',
    title: 'Nic tu není',
    description:
      'Tohle místo se nepodařilo najít — možná bylo přesunuto, už neexistuje, nebo sem prostě nevidíš.',
  },
  500: {
    illustration: 'crash',
    title: 'Něco se rozbilo',
    description: 'Na naší straně nastala chyba. Zkus to prosím za chvíli znovu.',
  },
};

export function ErrorState({
  status,
  onRetry,
  illustration,
  title,
  description,
  action,
  ...rest
}: ErrorStateProps): React.ReactElement {
  const def = status ? STATUS_DEFAULTS[status] : undefined;
  const retryAction = onRetry ? { label: 'Zkusit znovu', onClick: onRetry } : undefined;

  return (
    <StatePlaceholder
      {...rest}
      variant="error"
      illustration={illustration ?? def?.illustration ?? 'load-error'}
      title={title ?? def?.title ?? 'Něco se nepovedlo'}
      description={
        description ??
        def?.description ??
        'Aplikace narazila na neočekávanou chybu. Zkus to prosím znovu.'
      }
      action={action ?? retryAction}
    />
  );
}
