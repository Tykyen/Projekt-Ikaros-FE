/**
 * 15.6 — prázdný (datový) stav. Vše OK, jen není co ukázat.
 * Tón: pozvání k akci. Předej `illustration` jen pro hero/panel; CTA jen tomu,
 * kdo akci smí provést.
 */
import { StatePlaceholder, type StatePlaceholderProps } from './StatePlaceholder';

export type EmptyStateProps = Omit<StatePlaceholderProps, 'variant'>;

export function EmptyState(props: EmptyStateProps): React.ReactElement {
  return <StatePlaceholder {...props} variant="empty" />;
}
